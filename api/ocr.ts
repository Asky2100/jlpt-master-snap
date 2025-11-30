type VercelRequest = {
  method?: string;
  body?: any;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (payload: Record<string, unknown>) => void;
};

const respond = (res: VercelResponse, status: number, payload: Record<string, unknown>) => {
  res.status(status).json(payload);
};

const cleanBase64 = (data: string) => data.replace(/^data:image\/\w+;base64,/, '');

const normalizeUrl = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return respond(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const imageBase64: string = body?.imageBase64;
    const preferredModel: string | undefined = body?.model;

    if (!imageBase64) {
      return respond(res, 400, { error: '缺少图像数据' });
    }

    const baseUrl = (process.env.OCR_BASE_URL || '').trim();
    const apiKey = (process.env.OCR_API_KEY || '').trim();
    const fallbackModel = (process.env.OCR_MODEL || 'deepseek-ocr-chat').trim();
    const model = (preferredModel || fallbackModel).trim();

    if (!baseUrl || !apiKey) {
      return respond(res, 500, { error: '服务器未配置 OCR API Key 或 Base URL' });
    }

    const payload = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                '请严格按原文顺序转录图片中的所有日语/中文文字，保留换行与标点。',
                '输出要求：',
                '1. 只返回纯文本内容，不要添加描述、翻译或额外前缀；',
                '2. 行首行尾不要补充空格，连续空行最多保留一行；',
                '3. 若出现无法辨认的字，用「□」占位并继续原句。'
              ].join('\n')
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${cleanBase64(imageBase64)}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    };

    const response = await fetch(`${normalizeUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return respond(res, response.status, { error: errText || 'OCR请求失败' });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      return respond(res, 502, { error: 'OCR服务未返回有效内容' });
    }

    content = content.replace(/^```(json|markdown|text)?\n/i, '').replace(/\n```$/, '');

    return respond(res, 200, { text: content.trim() });
  } catch (error: any) {
    console.error('OCR proxy error', error);
    return respond(res, 500, { error: error?.message || 'OCR 代理出现异常' });
  }
}

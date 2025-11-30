import { JLPT_SYSTEM_PROMPT } from '../constants';

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

const normalizeUrl = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return respond(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const ocrText: string = body?.ocrText;
    const preferredModel: string | undefined = body?.model;

    if (!ocrText) {
      return respond(res, 400, { error: '缺少OCR识别文本' });
    }

    const baseUrl = (process.env.ANALYSIS_BASE_URL || '').trim();
    const apiKey = (process.env.ANALYSIS_API_KEY || '').trim();
    const fallbackModel = (process.env.ANALYSIS_MODEL || 'deepseek-ai/DeepSeek-V3').trim();
    const model = (preferredModel || fallbackModel).trim();

    if (!baseUrl || !apiKey) {
      return respond(res, 500, { error: '服务器未配置分析模型的 API Key 或 Base URL' });
    }

    const payload = {
      model,
      messages: [
        {
          role: 'system',
          content: JLPT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `请解析以下OCR识别出的日语题目内容（请忽略可能存在的少量OCR识别错误）：\n\n${ocrText}`
        }
      ],
      temperature: 0.3,
      stream: false
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
      return respond(res, response.status, { error: errText || '分析请求失败' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return respond(res, 502, { error: '分析模型未返回内容' });
    }

    return respond(res, 200, { analysis: content });
  } catch (error: any) {
    console.error('Analysis proxy error', error);
    return respond(res, 500, { error: error?.message || '分析代理出现异常' });
  }
}

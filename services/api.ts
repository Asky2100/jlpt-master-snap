import { AppSettings, ModelOption } from "../types";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || '';

// Helper to ensure headers are safe and formatted correctly
const getSafeAuthHeader = (apiKey: string): string => {
  if (!apiKey) return '';
  
  // 1. Trim whitespace (spaces, newlines, tabs)
  const cleanKey = apiKey.trim();
  
  // 2. Check for non-ASCII characters which cause "String contains non ISO-8859-1 code point" error
  if (/[^\x00-\x7F]/.test(cleanKey)) {
    throw new Error("API Key 格式错误：包含非 ASCII 字符（如中文或特殊符号）。请检查配置是否误复制了多余内容。");
  }
  
  return `Bearer ${cleanKey}`;
};

// Generic function to fetch models from an OpenAI-compatible endpoint
export const fetchModels = async (baseUrl: string, apiKey: string): Promise<string[]> => {
  if (!apiKey) return [];
  try {
    // Remove trailing slash if present
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const authHeader = getSafeAuthHeader(apiKey);

    const response = await fetch(`${cleanUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch models', response.statusText);
      return [];
    }

    const data = await response.json();
    // Some providers wrap list in 'data', others might differ, assuming OpenAI standard here
    if (Array.isArray(data.data)) {
        return data.data.map((m: ModelOption) => m.id).sort();
    }
    return [];
  } catch (error) {
    console.error("Error fetching models:", error);
    // We return empty array to prevent UI crash, but error is logged
    return [];
  }
};

const callBackend = async (path: string, payload: Record<string, unknown>) => {
  const url = `${BACKEND_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || '服务器代理请求失败');
  }

  return response.json();
};

// 1. OCR Step: Send image to Vision Model (e.g. DeepSeek OCR)
export const performOCR = async (
  imageBase64: string,
  settings: AppSettings
): Promise<string> => {
  if (settings.useServerKeys) {
    const data = await callBackend('/api/ocr', {
      imageBase64,
      model: settings.ocrModel,
    });
    return data?.text ?? '';
  }

  const { ocrBaseUrl, ocrApiKey, ocrModel } = settings;
  const cleanUrl = ocrBaseUrl.endsWith('/') ? ocrBaseUrl.slice(0, -1) : ocrBaseUrl;
  const authHeader = getSafeAuthHeader(ocrApiKey);
  
  if (!cleanUrl || !authHeader) {
    throw new Error('请在设置中填写 OCR 服务的 Base URL 与 API Key');
  }

  // Clean base64 string if it contains data URI prefix
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const payload = {
    model: ocrModel,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "请严格按原文顺序转录图片中的所有日语/中文文字，保留换行与标点。",
              "输出要求：",
              "1. 只返回纯文本内容，不要添加描述、翻译或额外前缀；",
              "2. 行首行尾不要补充空格，连续空行最多保留一行；",
              "3. 若出现无法辨认的字，用「□」占位并继续原句。"
            ].join("\n")
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Data}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 4096 
  };

  const response = await fetch(`${cleanUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OCR Request Failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  // Handle content which might be a string or complex object depending on provider quirks
  let content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content received from OCR model");
  }

  // Post-processing to clean up common LLM chat artifacts (e.g. ```text ... ```)
  content = content.replace(/^```(json|markdown|text)?\n/i, '').replace(/\n```$/, '');

  return content.trim();
};

// 2. Analysis Step: Send extracted text to LLM
export const analyzeQuestion = async (
  ocrText: string,
  settings: AppSettings
): Promise<string> => {
  if (settings.useServerKeys) {
    const data = await callBackend('/api/analyze', {
      ocrText,
      model: settings.analysisModel,
    });
    return data?.analysis ?? '';
  }

  const { analysisBaseUrl, analysisApiKey, analysisModel } = settings;
  const cleanUrl = analysisBaseUrl.endsWith('/') ? analysisBaseUrl.slice(0, -1) : analysisBaseUrl;
  const authHeader = getSafeAuthHeader(analysisApiKey);

  if (!cleanUrl || !authHeader) {
    throw new Error('请在设置中填写 LLM 服务的 Base URL 与 API Key');
  }

  const payload = {
    model: analysisModel,
    messages: [
      {
        role: "system",
        content: `请作为JLPT专业老师解析题目。`
      },
      {
        role: "user",
        content: `请解析以下OCR识别出的日语题目内容（请忽略可能存在的少量OCR识别错误）：\n\n${ocrText}`
      }
    ],
    temperature: 0.3, // Lower temperature for more factual analysis
    stream: false
  };

  const response = await fetch(`${cleanUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Analysis Request Failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No analysis received from LLM");
  }

  return content;
};

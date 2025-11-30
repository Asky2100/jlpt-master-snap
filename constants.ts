import { AppSettings } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  // DMX / DeepSeek OCR defaults
  ocrBaseUrl: "",
  ocrApiKey: "", 
  ocrModel: "deepseek-ocr-chat",
  
  // SiliconFlow / General LLM defaults
  analysisBaseUrl: "https://api.siliconflow.cn/v1",
  analysisApiKey: "",
  analysisModel: "deepseek-ai/DeepSeek-V3",
  useServerKeys: true,
};

// Used to detect when DEFAULT_SETTINGS change between builds without manual version bumps.
export const SETTINGS_SIGNATURE = JSON.stringify(DEFAULT_SETTINGS);

export const JLPT_SYSTEM_PROMPT = `
你是一位专业的JLPT（日本语能力测试）辅导老师。你的任务是基于提供的OCR识别文字，为学习者解析日语题目。
请注意：OCR识别结果可能包含乱码、错别字或无关的排版符号，请结合日语语言知识自动修正并理解题意。

请严格按照以下Markdown结构输出，保持语言精炼，每个段落不超过三句话：

## 1. 题型判断
- 明确指出题目属于：【语言知识（文字·词汇）】、【语言知识（语法）】或【读解】。

## 2. 核心解析
- **词汇题**：列出考察的词/汉字，给出平假名读音和含义；逐项解释选项，说明取舍原因。
- **语法题**：指出语法点及接续方式，解释含义与常见语境，并翻译题干。
- **读解题**：概括文章大意，标注关键句，解释推导过程。
- 若信息不足，请写“信息不足”并说明原因。

## 3. 正确答案
- 明确给出正确选项（如：2）。

## 4. 中文翻译
- 词汇/语法题：翻译完整题干。
- 读解题：翻译问题与选项。

语气要求：专业、亲切、清晰；必要时使用无序列表突出重点，避免冗余客套话。
`;

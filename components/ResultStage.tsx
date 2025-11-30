import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult } from '../types';
import { BookOpen, AlertCircle, FileText, Sparkles, RefreshCcw } from 'lucide-react';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultStage: React.FC<Props> = ({ result, onReset }) => {
  const structuredSections = useMemo(() => {
    if (!result.analysis) return [];

    const lines = result.analysis.split(/\r?\n/);
    const sections: { title: string; body: string }[] = [];
    let currentTitle: string | null = null;
    let buffer: string[] = [];

    const pushSection = () => {
      const text = buffer.join('\n').trim();
      if (!text) return;
      sections.push({ title: currentTitle || '解析详情', body: text });
      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,6}\s+(.+)/);
      if (headingMatch) {
        pushSection();
        currentTitle = headingMatch[1].trim();
      } else {
        buffer.push(line);
      }
    }

    pushSection();

    if (!sections.length && result.analysis.trim()) {
      return [{ title: 'AI 解析', body: result.analysis.trim() }];
    }

    return sections;
  }, [result.analysis]);

  const keyInsights = useMemo(() => {
    const bullets = result.analysis.match(/^\s*[-*+]\s+.+/gm);
    if (bullets && bullets.length) {
      return bullets
        .map((item) => item.replace(/^\s*[-*+]\s+/, '').trim())
        .filter(Boolean)
        .slice(0, 4);
    }

    const paragraphs = result.analysis
      .split(/\n+/)
      .map((block) => block.replace(/^#+\s*/, '').trim())
      .filter(Boolean);

    return paragraphs.slice(0, 3);
  }, [result.analysis]);

  const typeLabel =
    result.type === 'vocab'
      ? '文字・词汇'
      : result.type === 'grammar'
        ? '文法'
        : result.type === 'reading'
          ? '读解'
          : 'AI分析结果';

  const typeBadgeColor =
    result.type === 'vocab'
      ? 'bg-green-100 text-green-700'
      : result.type === 'grammar'
        ? 'bg-blue-100 text-blue-700'
        : result.type === 'reading'
          ? 'bg-orange-100 text-orange-700'
          : 'bg-gray-100 text-gray-700';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24 relative">
      <div className="absolute -top-8 -right-6 w-48 h-48 bg-sakura-200/40 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-6 w-44 h-44 bg-indigo-950/20 blur-3xl rounded-full pointer-events-none" />

      {/* Top Bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur border border-white/60 shadow-lg shadow-slate-200/60 rounded-3xl px-6 py-5">
        <div className="flex flex-col gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${typeBadgeColor}`}>
            <Sparkles className="w-4 h-4" />
            {typeLabel}
          </div>
          <p className="text-sm text-slate-500">视觉识别与智能解析结果可随时重置重新拍题。</p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCcw className="w-4 h-4" />
          拍下一题
        </button>
      </div>

      {/* Vision: Original + OCR */}
      <section className="relative rounded-3xl bg-white/90 border border-white/60 shadow-xl shadow-slate-200/70 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-2 text-slate-600 text-sm tracking-wide uppercase">
          <AlertCircle className="w-4 h-4" />
          视觉识别结果
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] p-6">
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase">
              <FileText className="w-4 h-4" />
              题目原文截图
            </div>
            <div className="flex items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-4 min-h-[280px]">
              <img src={result.originalImage} alt="Cropped Question" className="max-h-72 object-contain rounded-xl shadow-md" />
            </div>
          </div>
          <div className="bg-slate-900 text-slate-50 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <BookOpen className="w-4 h-4" />
              OCR 文字识别
            </div>
            <div className="mt-4 flex-1 overflow-y-auto text-base leading-relaxed font-medium whitespace-pre-wrap">
              {result.ocrText || '未获取到文字内容'}
            </div>
          </div>
        </div>
      </section>

      {/* Analysis */}
      <section className="relative rounded-3xl bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-white/60 shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="w-5 h-5 text-sakura-500" />
            <h3 className="text-xl font-bold tracking-tight">AI 深度解析</h3>
          </div>
          <p className="text-sm text-slate-500">重点摘要 + 结构化解析，帮助更快理解解题思路。</p>
        </div>

        <div className="p-6 space-y-6">
          {keyInsights.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">重点摘要</p>
              <div className="flex flex-wrap gap-3">
                {keyInsights.map((insight, index) => (
                  <span
                    key={`${insight}-${index}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sakura-100 text-sakura-600 text-xs font-bold">
                      {index + 1}
                    </span>
                    {insight}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {structuredSections.length === 0 && (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                尚未生成结构化解析内容。
              </div>
            )}

            {structuredSections.map((section, index) => (
              <article
                key={`${section.title}-${index}`}
                className="rounded-2xl bg-white border border-slate-100 p-5 shadow-md shadow-slate-200/50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sakura-50 text-sakura-600 font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">解析模块</p>
                      <h4 className="text-lg font-bold text-slate-800">{section.title}</h4>
                    </div>
                  </div>
                </div>
                <div className="mt-4 prose prose-slate max-w-none prose-p:text-slate-600 prose-li:text-slate-600">
                  <ReactMarkdown>{section.body}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-dashed border-slate-200 pt-4">
            <AlertCircle className="w-4 h-4" />
            由 AI 生成，仅供参考。
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResultStage;

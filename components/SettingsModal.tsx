import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { fetchModels } from '../services/api';
import { X, RefreshCw, Check, Settings as SettingsIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [ocrModels, setOcrModels] = useState<string[]>([]);
  const [analysisModels, setAnalysisModels] = useState<string[]>([]);
  const [loadingOcrModels, setLoadingOcrModels] = useState(false);
  const [loadingAnalysisModels, setLoadingAnalysisModels] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFetchModels = async (type: 'ocr' | 'analysis') => {
    if (type === 'ocr') {
      setLoadingOcrModels(true);
      const models = await fetchModels(localSettings.ocrBaseUrl, localSettings.ocrApiKey);
      setOcrModels(models);
      setLoadingOcrModels(false);
    } else {
      setLoadingAnalysisModels(true);
      const models = await fetchModels(localSettings.analysisBaseUrl, localSettings.analysisApiKey);
      setAnalysisModels(models);
      setLoadingAnalysisModels(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-sakura-600" />
            <h2 className="text-xl font-bold text-gray-800">模型配置</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">使用托管 API Key</p>
                <p className="text-xs text-slate-500">默认走服务器代理，免配置直接使用；如需自定义模型，可手动切换。</p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, useServerKeys: !prev.useServerKeys }))}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${localSettings.useServerKeys ? 'bg-sakura-500' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={localSettings.useServerKeys}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${localSettings.useServerKeys ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {localSettings.useServerKeys
                ? '当前由部署者在 Vercel 上配置的密钥提供服务。'
                : '当前使用你提供的专属 API Key，所有请求直接发送到对应模型服务。'}
            </p>
          </div>
          
          {/* Visual Model Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">步骤 1</span>
              <h3 className="text-lg font-semibold text-gray-700">视觉解析模型 (OCR)</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">用于识别图片中的文字。推荐使用 deepseek-ocr-chat 或兼容的多模态模型。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={localSettings.ocrBaseUrl}
                  onChange={(e) => handleChange('ocrBaseUrl', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="https://api.siliconflow.cn/v1"
                  disabled={localSettings.useServerKeys}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.ocrApiKey}
                  onChange={(e) => handleChange('ocrApiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="sk-..."
                  disabled={localSettings.useServerKeys}
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.ocrModel}
                    onChange={(e) => handleChange('ocrModel', e.target.value)}
                    list="ocr-models-list"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="deepseek-ocr-chat"
                    disabled={localSettings.useServerKeys}
                  />
                  <datalist id="ocr-models-list">
                    {ocrModels.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <button
                  onClick={() => handleFetchModels('ocr')}
                  disabled={localSettings.useServerKeys || !localSettings.ocrApiKey || loadingOcrModels}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition flex items-center"
                  title="验证并获取模型列表"
                >
                  {loadingOcrModels ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Analysis Model Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
              <span className="bg-sakura-100 text-sakura-800 text-xs font-semibold px-2.5 py-0.5 rounded">步骤 2</span>
              <h3 className="text-lg font-semibold text-gray-700">日语分析模型 (LLM)</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">用于分析识别出的文字并给出解答。推荐使用 DeepSeek-V3, Qwen-Max 等。</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={localSettings.analysisBaseUrl}
                  onChange={(e) => handleChange('analysisBaseUrl', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="https://api.siliconflow.cn/v1"
                  disabled={localSettings.useServerKeys}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.analysisApiKey}
                  onChange={(e) => handleChange('analysisApiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="sk-..."
                  disabled={localSettings.useServerKeys}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.analysisModel}
                    onChange={(e) => handleChange('analysisModel', e.target.value)}
                    list="analysis-models-list"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-400 focus:border-sakura-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="deepseek-ai/DeepSeek-V3"
                    disabled={localSettings.useServerKeys}
                  />
                  <datalist id="analysis-models-list">
                    {analysisModels.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <button
                  onClick={() => handleFetchModels('analysis')}
                  disabled={localSettings.useServerKeys || !localSettings.analysisApiKey || loadingAnalysisModels}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition flex items-center"
                  title="验证并获取模型列表"
                >
                  {loadingAnalysisModels ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="px-6 py-2 bg-sakura-500 hover:bg-sakura-600 text-white font-semibold rounded-lg shadow-md shadow-sakura-200 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

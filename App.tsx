import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Settings as SettingsIcon, Loader2, Sparkles } from 'lucide-react';
import SettingsModal from './components/SettingsModal';
import CropStage from './components/CropStage';
import ResultStage from './components/ResultStage';
import { AppState, AppSettings, AnalysisResult } from './types';
import { DEFAULT_SETTINGS, SETTINGS_SIGNATURE } from './constants';
import { performOCR, analyzeQuestion } from './services/api';

const SETTINGS_STORAGE_KEY = 'jlpt-app-settings';

const loadSettings = (): AppSettings => {
  const computedDefaults: AppSettings = {
    ...DEFAULT_SETTINGS,
    useServerKeys:
      typeof window !== 'undefined' && import.meta.env.DEV
        ? false
        : DEFAULT_SETTINGS.useServerKeys,
  };

  if (typeof window === 'undefined') return computedDefaults;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return computedDefaults;

    const parsed = JSON.parse(raw);
    const storedSignature = parsed?.signature ?? parsed?.version;
    const storedSettings: Partial<AppSettings> | undefined =
      parsed?.settings && typeof parsed.settings === 'object'
        ? parsed.settings
        : parsed;

    if (!storedSignature || storedSignature !== SETTINGS_SIGNATURE) {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      return computedDefaults;
    }

    if (storedSettings) {
      return { ...computedDefaults, ...storedSettings };
    }
  } catch (error) {
    console.warn('Failed to load JLPT settings, using defaults instead.', error);
  }

  return computedDefaults;
};

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>('upload');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    return loadSettings();
  });
  
  const [uploadedImg, setUploadedImg] = useState<string | null>(null);
  const [croppedImg, setCroppedImg] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ signature: SETTINGS_SIGNATURE, settings })
    );
  }, [settings]);

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setUploadedImg(reader.result as string);
        setAppState('crop');
        setError(null);
      });
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (base64Img: string) => {
    setCroppedImg(base64Img);
    setAppState('analyzing');
    setError(null);

    try {
      // Step 1: OCR
      setProgress('正在进行视觉识别 (OCR)...');
      const text = await performOCR(base64Img, settings);
      setOcrText(text);

      // Step 2: Analysis
      setProgress('正在进行智能解析...');
      const analysis = await analyzeQuestion(text, settings);

      // Determine type crudely based on analysis content
      let type: AnalysisResult['type'] = 'unknown';
      if (text.includes('読み方') || analysis.includes('词汇') || analysis.includes('文字')) type = 'vocab';
      else if (text.includes('文法') || analysis.includes('语法')) type = 'grammar';
      else if (analysis.includes('读解') || analysis.includes('文章')) type = 'reading';

      setAnalysisResult({
        originalImage: base64Img,
        ocrText: text,
        analysis: analysis,
        type
      });

      setAppState('result');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setAppState('crop'); // Go back to crop on error
    }
  };

  const handleReset = () => {
    setUploadedImg(null);
    setCroppedImg(null);
    setOcrText('');
    setAnalysisResult(null);
    setAppState('upload');
    setError(null);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sakura-200">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-sakura-500 p-1.5 rounded-lg text-white">
                <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-sakura-600 to-indigo-600 bg-clip-text text-transparent">
              JLPT Master Snap
            </h1>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-sakura-600 hover:bg-sakura-50 rounded-full transition duration-200"
            title="设置"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        
        {/* Error Display */}
        {error && (
            <div className="w-full max-w-2xl mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>错误: {error} (请检查设置中的API Key和模型名称)</span>
            </div>
        )}

        {/* State: Upload */}
        {appState === 'upload' && (
          <div className="text-center space-y-8 animate-fade-in-up w-full max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold text-slate-800 leading-tight">
                拍题 · 识别 · <span className="text-sakura-500">秒懂</span>
              </h2>
              <p className="text-lg text-slate-500">
                专为 JLPT 备考设计。上传真题照片，AI 助教为您深度解析词汇、语法与读解。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-2xl hover:border-sakura-400 hover:bg-sakura-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform text-blue-600">
                    <ImageIcon className="w-8 h-8" />
                </div>
                <span className="text-lg font-semibold text-slate-700">选择图片</span>
                <span className="text-sm text-slate-400 mt-2">支持 JPG, PNG</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()} 
                className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-2xl hover:border-sakura-400 hover:bg-sakura-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="bg-sakura-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform text-sakura-600">
                    <Camera className="w-8 h-8" />
                </div>
                <span className="text-lg font-semibold text-slate-700">拍照上传</span>
                <span className="text-sm text-slate-400 mt-2">直接拍摄题目</span>
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              onClick={handleInputClick}
            />

            <div className="text-xs text-gray-400 mt-10">
                初次使用请先点击右上角设置图标配置 API Key
            </div>
          </div>
        )}

        {/* State: Crop */}
        {appState === 'crop' && uploadedImg && (
          <CropStage
            imgSrc={uploadedImg}
            onConfirm={startAnalysis}
            onCancel={handleReset}
          />
        )}

        {/* State: Analyzing */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center space-y-6 animate-pulse">
            <div className="relative">
                <div className="absolute inset-0 bg-sakura-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="bg-white p-6 rounded-2xl shadow-xl relative z-10">
                    <Loader2 className="w-12 h-12 text-sakura-600 animate-spin" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">AI 思考中</h3>
                <p className="text-gray-500">{progress}</p>
            </div>
          </div>
        )}

        {/* State: Result */}
        {appState === 'result' && analysisResult && (
          <ResultStage result={analysisResult} onReset={handleReset} />
        )}

      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
};

export default App;

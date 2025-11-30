export interface AppSettings {
  ocrBaseUrl: string;
  ocrApiKey: string;
  ocrModel: string;
  analysisBaseUrl: string;
  analysisApiKey: string;
  analysisModel: string;
  useServerKeys: boolean;
}

export interface ModelOption {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface AnalysisResult {
  originalImage: string; // Base64
  ocrText: string;
  analysis: string; // Markdown
  type: 'vocab' | 'grammar' | 'reading' | 'unknown';
}

export type AppState = 'upload' | 'crop' | 'analyzing' | 'result';

export interface Crop {
  unit: 'px' | '%';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px';
}

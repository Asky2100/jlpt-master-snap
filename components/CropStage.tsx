import React, { useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { canvasPreview, toBase64 } from '../utils/canvasUtils';
import { Crop as CropIcon, RotateCw } from 'lucide-react';

interface Props {
  imgSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect?: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect || 16 / 9,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const CropStage: React.FC<Props> = ({ imgSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [rotate, setRotate] = useState(0);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 0)); // 0 aspect for free crop
  }

  const handleConfirm = async () => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      await canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        1,
        rotate
      );
      
      previewCanvasRef.current.toBlob(
        async (blob) => {
          if (!blob) {
              console.error('Canvas is empty');
              return;
          }
          const base64 = await toBase64(blob);
          onConfirm(base64);
        },
        'image/png',
        1
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-auto p-4 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center min-h-[400px] relative">
         <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="shadow-2xl"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ transform: `rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
              className="max-h-[70vh] object-contain"
            />
          </ReactCrop>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setRotate(r => r + 90)}
                className="p-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 transition"
                title="Rotate Image"
            >
                <RotateCw className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500">
                拖动边框选择题目区域
            </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-none px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            重选图片
          </button>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop?.width || !completedCrop?.height}
            className="flex-1 sm:flex-none px-8 py-3 bg-sakura-600 hover:bg-sakura-700 text-white rounded-lg shadow-lg shadow-sakura-200 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CropIcon className="w-5 h-5" />
            确认裁剪并分析
          </button>
        </div>
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas
        ref={previewCanvasRef}
        className="hidden"
      />
    </div>
  );
};

export default CropStage;

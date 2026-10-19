import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ExternalLink, Download } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface ImageViewerModalProps {
  url: string | null;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  url,
  title,
  subtitle,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!url) return null;
  const imageInfo = getOptimizedImageUrl(url);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 text-white shrink-0">
          <div>
            <h3 className="font-semibold text-base text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* External Google Drive or Web Link */}
            {imageInfo.driveViewerUrl ? (
              <a
                href={imageInfo.driveViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดใน Google Drive</span>
              </a>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดลิงก์เดิม</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 min-h-[400px] overflow-hidden bg-slate-950/60 flex items-center justify-center p-4">
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={imageInfo.displayUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-h-[65vh] max-w-full object-contain rounded-md shadow-lg"
              onError={(e) => {
                // Fallback to direct url if thumbnail endpoint fails
                const target = e.target as HTMLImageElement;
                if (target.src !== imageInfo.fallbackUrl) {
                  target.src = imageInfo.fallbackUrl;
                }
              }}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 text-slate-300 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-800 rounded-md hover:text-white transition-colors"
              title="ซูมเข้า"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-800 rounded-md hover:text-white transition-colors"
              title="ซูมออก"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 hover:bg-slate-800 rounded-md hover:text-white transition-colors"
              title="หมุนรูปภาพ 90 องศา"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-xs hover:bg-slate-800 rounded-md hover:text-white transition-colors"
            >
              รีเซ็ต ({Math.round(scale * 100)}%)
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
            {url}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { Image as ImageIcon, ZoomIn, UploadCloud } from 'lucide-react';

interface TempleImageProps {
  url?: string | null;
  alt: string;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const TempleImage: React.FC<TempleImageProps> = ({
  url,
  alt,
  className = '',
  onClick,
  size = 'md',
}) => {
  const [loadError, setLoadError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imageInfo = getOptimizedImageUrl(url);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg text-xs',
    md: 'w-14 h-14 rounded-xl text-sm',
    lg: 'w-24 h-24 rounded-2xl text-base',
  }[size];

  // If no URL or failed to load
  if (!url || !imageInfo.displayUrl || loadError) {
    return (
      <div
        className={`${sizeClasses} ${className} bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 border border-slate-200/90 flex flex-col items-center justify-center text-slate-400 select-none overflow-hidden shrink-0 shadow-xs relative`}
        title={alt || 'ไม่มีรูปภาพ'}
      >
        <ImageIcon className="w-4 h-4 opacity-40 mb-0.5" />
        <span className="text-[10px] font-medium text-slate-400/90 leading-none truncate max-w-[90%] px-1 text-center">
          {alt ? alt.substring(0, 5) : 'ไม่มีรูป'}
        </span>
      </div>
    );
  }

  const currentSrc = useFallback ? imageInfo.fallbackUrl : imageInfo.displayUrl;

  return (
    <div
      onClick={onClick}
      className={`group relative ${sizeClasses} ${className} overflow-hidden border border-slate-200/80 bg-slate-900 shrink-0 cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-sky-500/60 hover:shadow-md hover:-translate-y-0.5`}
      title={`${alt} (คลิกเพื่อดูรูปขนาดเต็ม)`}
    >
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => {
          if (!useFallback && imageInfo.fallbackUrl && imageInfo.fallbackUrl !== imageInfo.displayUrl) {
            setUseFallback(true);
          } else {
            setLoadError(true);
          }
        }}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      
      {/* Specular glass sheen highlight */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-white/10 pointer-events-none opacity-60 group-hover:opacity-30 transition-opacity" />

      {/* Hover Zoom Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-white backdrop-blur-[1px]">
        <ZoomIn className="w-4 h-4 drop-shadow-sm" />
      </div>

      {/* Indicator tag */}
      {imageInfo.isUploadedBase64 ? (
        <span className="absolute bottom-0 right-0 bg-emerald-700/85 text-emerald-100 text-[8px] font-mono px-1 rounded-tl backdrop-blur-xs flex items-center gap-0.5">
          <UploadCloud className="w-2 h-2" />
          <span>Upload</span>
        </span>
      ) : imageInfo.isGoogleDrive ? (
        <span className="absolute bottom-0 right-0 bg-sky-900/85 text-sky-100 text-[8px] font-mono px-1 rounded-tl backdrop-blur-xs">
          Drive
        </span>
      ) : null}
    </div>
  );
};

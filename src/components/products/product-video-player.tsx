'use client';

import { useState, useRef } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductVideoPlayerProps {
  videoUrl: string;
  posterUrl: string;
  productName: string;
  className?: string;
}

export function ProductVideoPlayer({
  videoUrl,
  posterUrl,
  productName,
  className,
}: ProductVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className={cn('relative aspect-square rounded-lg overflow-hidden bg-black', className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        controls={isPlaying}
        preload="metadata"
        className="w-full h-full object-contain"
        onPlay={handlePlay}
        onPause={handlePause}
        aria-label={`Vidéo du produit ${productName}`}
      >
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>

      {/* Play Overlay - shown before first play */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer transition-all hover:bg-black/50"
          onClick={handlePlayClick}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-graphite-900 ml-1" fill="currentColor" />
            </div>
            <span className="text-white font-medium text-sm drop-shadow-md">
              Regarder la vidéo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

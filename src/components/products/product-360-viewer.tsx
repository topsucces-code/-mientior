'use client';

import { useState, useRef, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product360ViewerProps {
  images: string[];
  productName: string;
  className?: string;
}

export function Product360Viewer({
  images,
  productName,
  className,
}: Product360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensitivity = 2; // pixels per frame

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const frameDelta = Math.floor(deltaX / sensitivity);

    if (frameDelta !== 0) {
      setCurrentFrame((prev) => {
        let newFrame = prev + frameDelta;
        // Wrap around
        while (newFrame < 0) newFrame += images.length;
        while (newFrame >= images.length) newFrame -= images.length;
        return newFrame;
      });
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startX;
    const frameDelta = Math.floor(deltaX / sensitivity);

    if (frameDelta !== 0) {
      setCurrentFrame((prev) => {
        let newFrame = prev + frameDelta;
        // Wrap around
        while (newFrame < 0) newFrame += images.length;
        while (newFrame >= images.length) newFrame -= images.length;
        return newFrame;
      });
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const progressPercentage = ((currentFrame + 1) / images.length) * 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-square rounded-lg bg-platinum-100 overflow-hidden select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Current Frame Image */}
      <img
        src={images[currentFrame]}
        alt={`${productName} - Vue 360° frame ${currentFrame + 1}`}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Rotation Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
        <RotateCw className="h-4 w-4 rotating" />
        <span>Glissez pour faire pivoter</span>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] max-w-xs">
        <div className="h-1 bg-white/30 backdrop-blur-sm rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-xs text-white drop-shadow-md">
          {currentFrame + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

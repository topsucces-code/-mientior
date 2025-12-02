'use client';

/**
 * 360° Product Viewer Component
 * 
 * Features:
 * - Drag-to-rotate functionality with proportional frame selection
 * - Touch gesture support for mobile devices
 * - Frame preloading and caching
 * - Rotation angle and frame number display
 * - Auto-rotation with play/pause controls
 * - Rotation speed controls
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Play, Pause, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Product360ViewerProps {
  images: string[];
  productName: string;
  className?: string;
  autoRotate?: boolean;
  rotationSpeed?: number; // frames per second
  onExit?: () => void;
}

export function Product360Viewer({
  images,
  productName,
  className,
  autoRotate = false,
  rotationSpeed = 10,
  onExit,
}: Product360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Calculate frame from drag distance (proportional to container width)
  // Formula: frame = Math.floor((dragDistance / containerWidth) * frameCount) % frameCount
  const calculateFrameFromDrag = useCallback((dragDistance: number): number => {
    if (!containerRef.current) return currentFrame;
    
    const containerWidth = containerRef.current.offsetWidth;
    const normalizedDistance = dragDistance / containerWidth;
    const frameDelta = Math.floor(normalizedDistance * images.length);
    
    let newFrame = currentFrame + frameDelta;
    // Wrap around
    while (newFrame < 0) newFrame += images.length;
    while (newFrame >= images.length) newFrame -= images.length;
    
    return newFrame;
  }, [currentFrame, images.length]);

  // Calculate rotation angle from current frame
  // Formula: angle = (currentFrame / totalFrames) * 360
  const rotationAngle = Math.round((currentFrame / images.length) * 360);

  // Enhanced frame preloading strategy (15.2)
  // Preload first and last frames immediately, then lazy load intermediate frames
  useEffect(() => {
    const framesToPreload = new Set<number>();
    
    // Priority 1: Always preload first and last frames immediately
    framesToPreload.add(0);
    framesToPreload.add(images.length - 1);
    
    // Priority 2: Preload current frame and adjacent frames
    framesToPreload.add(currentFrame);
    framesToPreload.add((currentFrame + 1) % images.length);
    framesToPreload.add((currentFrame - 1 + images.length) % images.length);
    
    // Priority 3: Preload frames ahead in rotation direction
    for (let i = 2; i <= 5; i++) {
      framesToPreload.add((currentFrame + i) % images.length);
    }
    
    // Preload frames in batches with caching
    framesToPreload.forEach((frameIndex) => {
      if (!loadedFrames.has(frameIndex)) {
        const img = new window.Image();
        img.src = images[frameIndex];
        img.onload = () => {
          setLoadedFrames((prev) => new Set(prev).add(frameIndex));
        };
        img.onerror = () => {
          console.warn(`Failed to load frame ${frameIndex}`);
        };
      }
    });

    // Lazy load remaining frames in background
    if (loadedFrames.size >= 3) {
      const lazyLoadTimer = setTimeout(() => {
        images.forEach((src, index) => {
          if (!loadedFrames.has(index) && !framesToPreload.has(index)) {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
              setLoadedFrames((prev) => new Set(prev).add(index));
            };
          }
        });
      }, 1000);

      return () => clearTimeout(lazyLoadTimer);
    }
  }, [currentFrame, images, loadedFrames]);

  // Auto-rotation animation using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const frameInterval = 1000 / rotationSpeed; // milliseconds per frame

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        setCurrentFrame((prev) => (prev + 1) % images.length);
        lastFrameTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, rotationSpeed, images.length]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsPlaying(false); // Pause auto-rotation when dragging
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dragDistance = e.clientX - startX;
    const newFrame = calculateFrameFromDrag(dragDistance);
    
    if (newFrame !== currentFrame) {
      setCurrentFrame(newFrame);
      setStartX(e.clientX);
    }
  }, [isDragging, startX, currentFrame, calculateFrameFromDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsPlaying(false); // Pause auto-rotation when dragging
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const dragDistance = e.touches[0].clientX - startX;
    const newFrame = calculateFrameFromDrag(dragDistance);
    
    if (newFrame !== currentFrame) {
      setCurrentFrame(newFrame);
      setStartX(e.touches[0].clientX);
    }
  }, [isDragging, startX, currentFrame, calculateFrameFromDrag]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Keyboard navigation support (Requirements 15.1, 15.4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when the viewer is focused or active
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentFrame((prev) => (prev - 1 + images.length) % images.length);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentFrame((prev) => (prev + 1) % images.length);
          break;
        case 'Home':
          e.preventDefault();
          setCurrentFrame(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentFrame(images.length - 1);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          if (onExit) {
            e.preventDefault();
            onExit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, togglePlayPause, onExit]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
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
      role="img"
      aria-label={`Vue 360° de ${productName}. Utilisez les flèches gauche/droite pour faire pivoter, Espace pour lire/pause, Échap pour quitter.`}
      tabIndex={0}
    >
      {/* Current Frame Image */}
      <div className="relative w-full h-full">
        <Image
          src={images[currentFrame]}
          alt={`${productName} - Vue 360° frame ${currentFrame + 1}`}
          fill
          className="object-contain pointer-events-none"
          draggable={false}
          sizes="(max-width: 768px) 100vw, 60vw"
          priority={currentFrame === 0}
          loading={currentFrame === 0 ? 'eager' : 'lazy'}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4="
          quality={80}
        />
      </div>

      {/* Rotation Indicator with Angle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
        <RotateCw className={cn('h-4 w-4', isPlaying && 'animate-spin')} />
        <span className="hidden sm:inline">Glissez pour faire pivoter</span>
        <span className="sm:hidden">Glissez</span>
        <span className="mx-1">•</span>
        <span>{rotationAngle}°</span>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Exit Button */}
        {onExit && (
          <button
            onClick={onExit}
            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Exit 360° view"
            title="Exit 360° view"
          >
            <X className="w-5 h-5 text-nuanced-900" />
          </button>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
          aria-label={isPlaying ? 'Pause rotation' : 'Play rotation'}
          title={isPlaying ? 'Pause rotation' : 'Play rotation'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-nuanced-900" />
          ) : (
            <Play className="w-5 h-5 text-nuanced-900" />
          )}
        </button>

        {/* Rotation Speed Indicator (when playing) */}
        {isPlaying && (
          <div className="bg-white/90 px-2 py-1 rounded-full shadow-lg text-xs font-medium text-nuanced-900">
            {rotationSpeed} fps
          </div>
        )}
      </div>

      {/* Progress Bar and Frame Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] max-w-xs">
        <div className="h-1 bg-white/30 backdrop-blur-sm rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-xs text-white drop-shadow-md font-medium">
          Frame {currentFrame + 1} / {images.length}
        </div>
      </div>

      {/* Loading Indicator */}
      {loadedFrames.size < images.length && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs">
          Loading frames... {loadedFrames.size}/{images.length}
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Frame {currentFrame + 1} sur {images.length}, rotation de {rotationAngle} degrés
      </div>
    </div>
  );
}

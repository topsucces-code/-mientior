'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, AlertCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RelatedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  slug: string;
}

interface ProductVideoPlayerProps {
  videoUrl: string;
  posterUrl: string;
  productName: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  onEnded?: () => void;
  relatedProducts?: RelatedProduct[];
  videoIndex?: number;
  totalVideos?: number;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
}

export function ProductVideoPlayer({
  videoUrl,
  posterUrl,
  productName,
  className,
  autoplay = false,
  controls = true,
  onEnded,
  relatedProducts = [],
  videoIndex,
  totalVideos,
  onNextVideo,
  onPrevVideo,
}: ProductVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRelatedProducts, setShowRelatedProducts] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoplay && videoRef.current) {
      // Check for reduced motion preference (WCAG 2.2.2)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (!prefersReducedMotion) {
        videoRef.current.play().catch(() => {
          // Autoplay failed, user interaction required
          setIsPlaying(false);
        });
      }
    }
  }, [autoplay]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Video playback failed:', error);
        setHasError(true);
      });
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setHasError(false);
    
    // Track video play event for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'video_play', {
        video_title: productName,
        video_url: videoUrl,
      });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (relatedProducts.length > 0) {
      setShowRelatedProducts(true);
    }
    
    // Track video completion for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'video_complete', {
        video_title: productName,
        video_url: videoUrl,
      });
    }
    
    if (onEnded) {
      onEnded();
    }
  };

  const handleReplay = () => {
    setShowRelatedProducts(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  return (
    <div className={cn('relative aspect-square rounded-lg overflow-hidden bg-black', className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        controls={isPlaying && controls}
        preload="metadata"
        muted={autoplay}
        className="w-full h-full object-contain"
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        aria-label={`Vidéo de démonstration du produit ${productName}`}
        aria-describedby="video-description"
        playsInline
      >
        <track kind="captions" label="Français" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
      <span id="video-description" className="sr-only">
        Vidéo présentant les caractéristiques et l'utilisation du produit {productName}
      </span>

      {/* Loading State */}
      {isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
          role="status"
          aria-live="polite"
        >
          <div className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-b-2 border-white"></div>
          <span className="mt-3 text-white text-sm">Chargement de la vidéo...</span>
          <span className="sr-only">Chargement de la vidéo en cours</span>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white px-4 max-w-sm">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" aria-hidden="true" />
            <p className="font-medium mb-2">Erreur de chargement</p>
            <p className="text-sm text-white/80 mb-4">
              La vidéo n'a pas pu être chargée. Vérifiez votre connexion internet ou réessayez plus tard.
            </p>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Réessayer le chargement de la vidéo"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Play Overlay - shown before first play */}
      {!isPlaying && !hasError && !isLoading && !showRelatedProducts && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer transition-all hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
          onClick={handlePlayClick}
          aria-label={`Lire la vidéo du produit ${productName}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 focus:scale-110 transition-transform">
              <Play className="h-10 w-10 md:h-8 md:w-8 text-graphite-900 ml-1" fill="currentColor" aria-hidden="true" />
            </div>
            <span className="text-white font-medium text-sm drop-shadow-md">
              Regarder la vidéo
            </span>
          </div>
        </button>
      )}

      {/* Video Navigation Controls */}
      {totalVideos && totalVideos > 1 && videoIndex !== undefined && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevVideo?.();
            }}
            disabled={videoIndex === 0}
            className="text-white hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded p-1"
            aria-label="Vidéo précédente"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <span className="text-white text-sm font-medium" aria-live="polite">
            {videoIndex + 1} / {totalVideos}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNextVideo?.();
            }}
            disabled={videoIndex === totalVideos - 1}
            className="text-white hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded p-1"
            aria-label="Vidéo suivante"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Related Products Overlay - shown after video ends */}
      {showRelatedProducts && relatedProducts.length > 0 && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <h3 className="text-white text-xl font-semibold mb-4 text-center">
              Produits similaires
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {relatedProducts.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all group"
                >
                  <div className="relative aspect-square mb-2 rounded overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <h4 className="text-white text-sm font-medium line-clamp-2 mb-1">
                    {product.name}
                  </h4>
                  <p className="text-orange-400 font-semibold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(product.price / 100)}
                  </p>
                </Link>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReplay}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Revoir la vidéo
              </button>
              <button
                onClick={() => setShowRelatedProducts(false)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

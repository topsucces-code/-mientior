'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ARPreviewButtonProps {
  modelUrl: string;
  productName: string;
  className?: string;
}

export function ARPreviewButton({
  modelUrl,
  productName,
  className,
}: ARPreviewButtonProps) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check for AR support
    const checkARSupport = () => {
      const userAgent = navigator.userAgent;
      
      // Check for iOS AR Quick Look support
      const iosCheck = /iPad|iPhone|iPod/.test(userAgent);
      setIsIOS(iosCheck);
      
      // Check for Android
      const androidCheck = /Android/.test(userAgent);
      setIsAndroid(androidCheck);

      // Check for WebXR support (modern browsers)
      if ('xr' in navigator) {
        return true;
      }

      // iOS or Android devices support AR
      return iosCheck || androidCheck;
    };

    setIsARSupported(checkARSupport());
  }, []);

  const handleAndroidAR = () => {
    // Android Scene Viewer intent URL
    // This opens the model in Google's Scene Viewer app
    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
      modelUrl
    )}&mode=ar_preferred&title=${encodeURIComponent(
      productName
    )}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
      window.location.href
    )};end;`;

    try {
      window.location.href = intentUrl;
    } catch (error) {
      console.error('Failed to launch AR viewer:', error);
      // Fallback: Try opening model directly
      window.open(modelUrl, '_blank');
    }
  };

  if (!isARSupported) {
    return null;
  }

  // iOS AR Quick Look (USDZ format)
  if (isIOS) {
    return (
      <a
        href={modelUrl}
        rel="ar"
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-gradient-to-r from-orange-500 to-orange-600',
          'text-white font-medium text-sm',
          'hover:from-orange-600 hover:to-orange-700',
          'transition-all duration-200 shadow-elevation-1 hover:shadow-elevation-2',
          className
        )}
        aria-label={`Ouvrir ${productName} en réalité augmentée (iOS AR Quick Look)`}
      >
        <Smartphone className="h-4 w-4" />
        Voir en réalité augmentée
      </a>
    );
  }

  // Android Scene Viewer (GLB format)
  if (isAndroid) {
    return (
      <button
        type="button"
        onClick={handleAndroidAR}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-gradient-to-r from-orange-500 to-orange-600',
          'text-white font-medium text-sm',
          'hover:from-orange-600 hover:to-orange-700',
          'transition-all duration-200 shadow-elevation-1 hover:shadow-elevation-2',
          className
        )}
        aria-label={`Ouvrir ${productName} en réalité augmentée (Android Scene Viewer)`}
      >
        <Smartphone className="h-4 w-4" />
        Voir en réalité augmentée
      </button>
    );
  }

  // Desktop fallback - show model viewer or indicate unsupported
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-platinum-200 text-platinum-600 text-sm cursor-not-allowed',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Smartphone className="h-4 w-4" />
      AR non disponible sur cet appareil
    </div>
  );
}

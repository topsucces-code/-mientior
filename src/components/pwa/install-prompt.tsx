'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function InstallPrompt() {
  const t = useTranslations('pwa');
  const { isInstallable, isInstalled, isOnline, isUpdateAvailable, installApp, updateApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show install prompt after delay
  useEffect(() => {
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInstallable, isInstalled, dismissed]);

  // Show offline notice
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      return undefined;
    } else {
      const timer = setTimeout(() => {
        setShowOfflineNotice(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if previously dismissed
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDays) {
        setDismissed(true);
      }
    }
  }, []);

  return (
    <>
      {/* Offline notice */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-transform duration-300',
          showOfflineNotice ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className={cn(
          'flex items-center justify-center py-2 px-4 text-sm font-medium',
          isOnline ? 'bg-turquoise-500 text-white' : 'bg-amber-500 text-white'
        )}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              {t('online')}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              {t('offline.title')} - {t('offline.description')}
            </>
          )}
        </div>
      </div>

      {/* Update available banner */}
      {isUpdateAvailable && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50">
          <div className="bg-turquoise-600 text-white rounded-lg shadow-lg p-4">
            <div className="flex items-start">
              <RefreshCw className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{t('update.title')}</p>
                <p className="text-sm text-turquoise-100 mt-1">
                  {t('update.description')}
                </p>
                <button
                  onClick={updateApp}
                  className="mt-3 w-full bg-white text-turquoise-600 py-2 px-4 rounded-md text-sm font-medium hover:bg-turquoise-50 transition-colors"
                >
                  {t('update.button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install prompt */}
      {showPrompt && !isUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="relative p-4">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-turquoise-100 rounded-lg">
                  <Smartphone className="h-6 w-6 text-turquoise-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t('install.title')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('install.description')}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('install.later')}
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2 px-4 bg-turquoise-600 text-white rounded-md text-sm font-medium hover:bg-turquoise-700 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('install.button')}
                </button>
              </div>
            </div>

            {/* Features list */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-turquoise-500 rounded-full mr-2" />
                  {t('install.features.quickAccess')}
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-turquoise-500 rounded-full mr-2" />
                  {t('install.features.notifications')}
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-turquoise-500 rounded-full mr-2" />
                  {t('install.features.offline')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// iOS Install Instructions component
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if iOS and not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    
    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <button
        onClick={() => {
          setShow(false);
          localStorage.setItem('ios-install-dismissed', 'true');
        }}
        className="absolute top-2 right-2 p-1 text-gray-400"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="text-center">
        <p className="font-medium text-gray-900">Installer Mientior</p>
        <p className="text-sm text-gray-500 mt-1">
          Appuyez sur{' '}
          <span className="inline-flex items-center px-1">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
          </span>
          puis "Sur l'écran d'accueil"
        </p>
      </div>
    </div>
  );
}

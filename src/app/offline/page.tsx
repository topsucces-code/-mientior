import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function OfflinePage() {
  const t = await getTranslations('pwa.offline');
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="h-12 w-12 text-amber-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          {t('description')}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            {t('retry')}
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Home className="h-5 w-5 mr-2" />
            {t('home')}
          </Link>
        </div>

        {/* Cached content notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>💡</strong> {t('tip')}
          </p>
        </div>
      </div>

      {/* Mientior branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-400">
          Mientior - Marketplace Africain
        </p>
      </div>
    </div>
  );
}

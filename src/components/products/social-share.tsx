'use client';

import { useState } from 'react';
import { Share2, MessageSquare, Mail, Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  productName: string;
  productUrl: string;
  description?: string;
}

export function SocialShare({
  productName,
  productUrl,
  description,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const handleWhatsApp = () => {
    const text = `${productName}\n${productUrl}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Découvrez: ${productName}`);
    const body = encodeURIComponent(
      `${description || productName}\n\nVoir le produit: ${productUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: description,
          url: productUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="border-t border-platinum-300 pt-5">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-4 h-4 text-nuanced-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-nuanced-600">
          Partager ce produit
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          onClick={handleWhatsApp}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-platinum-300 rounded-lg',
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#25d366]',
            'text-sm font-medium text-anthracite-500'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleEmail}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-platinum-300 rounded-lg',
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-600',
            'text-sm font-medium text-anthracite-500'
          )}
        >
          <Mail className="w-4 h-4" />
          <span>Email</span>
        </button>

        <button
          onClick={handleCopyLink}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg',
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
            'text-sm font-medium',
            copied
              ? 'border-success text-success'
              : 'border-platinum-300 text-anthracite-500 hover:border-orange-500'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          <span>{copied ? 'Copié!' : 'Copier'}</span>
        </button>
      </div>

      {/* Native share button for mobile */}
      {typeof window !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleNativeShare}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 border-2 border-orange-200 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager via...</span>
        </button>
      )}
    </div>
  );
}

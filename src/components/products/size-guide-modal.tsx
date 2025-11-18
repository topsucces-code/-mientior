'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SIZE_GUIDES } from '@/lib/constants';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

interface SizeGuideData {
  title: string;
  illustration: string | null;
  instructions: string[];
  sizes: Record<string, unknown>[];
}

// Extend size guides with additional metadata
const EXTENDED_SIZE_GUIDES: Record<string, SizeGuideData> = {
  shoes: {
    title: 'Guide des Tailles - Chaussures',
    illustration: '/images/size-guide-shoes.svg',
    instructions: [
      'Mesurez votre pied du talon à l\'extrémité de votre orteil le plus long',
      'Mesurez les deux pieds et utilisez la mesure la plus grande',
      'Mesurez en fin de journée lorsque vos pieds sont légèrement gonflés',
      'Portez les chaussettes que vous prévoyez de porter avec les chaussures',
    ],
    sizes: SIZE_GUIDES.shoes,
  },
  clothing: {
    title: 'Guide des Tailles - Vêtements',
    illustration: '/images/size-guide-clothing.svg',
    instructions: [
      'Tour de poitrine : Mesurez autour de la partie la plus large de votre poitrine',
      'Tour de taille : Mesurez autour de votre taille naturelle',
      'Tour de hanches : Mesurez autour de la partie la plus large de vos hanches',
      'Utilisez un mètre ruban et gardez-le parallèle au sol',
    ],
    sizes: SIZE_GUIDES.clothing,
  },
  default: {
    title: 'Guide des Tailles',
    illustration: null,
    instructions: [
      'Consultez le tableau ci-dessous pour trouver votre taille',
      'En cas de doute entre deux tailles, choisissez la plus grande',
      'Contactez notre service client pour plus d\'assistance',
    ],
    sizes: [
      { size: 'S', description: 'Small' },
      { size: 'M', description: 'Medium' },
      { size: 'L', description: 'Large' },
      { size: 'XL', description: 'Extra Large' },
    ],
  },
};

export function SizeGuideModal({ isOpen, onClose, category }: SizeGuideModalProps) {
  // Determine which guide to show based on category
  const categoryLower = category.toLowerCase();
  let guideKey = 'default';

  if (categoryLower.includes('chaussure') || categoryLower.includes('shoe') || categoryLower.includes('running')) {
    guideKey = 'shoes';
  } else if (
    categoryLower.includes('vêtement') ||
    categoryLower.includes('clothing') ||
    categoryLower.includes('shirt') ||
    categoryLower.includes('pant') ||
    categoryLower.includes('t-shirt')
  ) {
    guideKey = 'clothing';
  }

  const guide: SizeGuideData = EXTENDED_SIZE_GUIDES[guideKey] ?? EXTENDED_SIZE_GUIDES.default!;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-graphite-900">
            {guide.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Illustration */}
          {guide.illustration && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={guide.illustration}
                alt="Guide de mesure"
                className="max-w-xs w-full"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold text-graphite-900 mb-3">
              Comment mesurer
            </h3>
            <ul className="space-y-2">
              {guide.instructions.map((instruction: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-graphite-700">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Size Table */}
          <div>
            <h3 className="text-lg font-semibold text-graphite-900 mb-3">
              Tableau des tailles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-platinum-100">
                    {guide.sizes.length > 0 && Object.keys(guide.sizes[0]!).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-sm font-semibold text-graphite-900 border border-platinum-300"
                      >
                        {key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.sizes.map((row: Record<string, unknown>, index: number) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? 'bg-white border border-platinum-300' : 'bg-platinum-50 border border-platinum-300'
                      }
                    >
                      {Object.values(row).map((value: unknown, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-sm text-graphite-700"
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-graphite-700">
              <strong>Besoin d'aide ?</strong> Notre équipe de service client est là pour vous aider à trouver la taille parfaite.
              Contactez-nous par chat ou par email.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

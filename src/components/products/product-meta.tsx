'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ProductMetaProps {
  sku?: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: { name: string; slug: string };
  };
  vendor?: {
    id: string;
    businessName?: string;
    slug?: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function ProductMeta({ sku, category, vendor, tags }: ProductMetaProps) {
  return (
    <div className="border-t border-platinum-300 pt-4 space-y-3">
      {/* SKU */}
      {sku && (
        <div className="flex items-start gap-2 text-sm">
          <span className="font-bold text-nuanced-600 min-w-[100px]">SKU:</span>
          <span className="text-nuanced-700">{sku}</span>
        </div>
      )}

      {/* Category */}
      <div className="flex items-start gap-2 text-sm">
        <span className="font-bold text-nuanced-600 min-w-[100px]">
          Catégorie:
        </span>
        <div className="text-nuanced-700">
          {category.parent && (
            <>
              <Link
                href={`/categories/${category.parent.slug}`}
                className="hover:text-orange-500 transition-colors"
              >
                {category.parent.name}
              </Link>
              <span className="mx-1.5">{'>'}</span>
            </>
          )}
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-orange-500 transition-colors"
          >
            {category.name}
          </Link>
        </div>
      </div>

      {/* Brand/Vendor */}
      {vendor && vendor.businessName && vendor.slug && (
        <div className="flex items-start gap-2 text-sm">
          <span className="font-bold text-nuanced-600 min-w-[100px]">
            Marque:
          </span>
          <Link
            href={`/vendors/${vendor.slug}`}
            className="text-nuanced-700 hover:text-orange-500 transition-colors"
          >
            {vendor.businessName}
          </Link>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <span className="font-bold text-nuanced-600 min-w-[100px]">Tags:</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className={cn(
                  'inline-block px-2.5 py-1 bg-platinum-50 rounded-full text-xs font-medium text-nuanced-700',
                  'transition-all duration-200 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

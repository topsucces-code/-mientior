import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mientior.com';
const SITE_NAME = 'Mientior';
const DEFAULT_DESCRIPTION = 'La marketplace premium pour l\'Afrique - Mode, Beauté, Maison et plus. Livraison dans 28 pays africains.';

// Default metadata
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} - Marketplace Africain Premium`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'marketplace africain',
    'e-commerce afrique',
    'shopping en ligne',
    'mode africaine',
    'beauté africaine',
    'livraison afrique',
    'paiement mobile money',
    'orange money',
    'mtn momo',
    'wave',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'ar_MA'],
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Marketplace Africain Premium`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Marketplace Africain Premium`,
    description: DEFAULT_DESCRIPTION,
    images: [`${BASE_URL}/twitter-image.jpg`],
    creator: '@mientior',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#047857' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
    languages: {
      'fr-FR': `${BASE_URL}/fr`,
      'en-US': `${BASE_URL}/en`,
      'ar-MA': `${BASE_URL}/ar`,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  category: 'shopping',
};

// Generate product metadata
export function generateProductMetadata(product: {
  name: string;
  description?: string | null;
  slug: string;
  images?: { url: string }[];
  price: number;
  currency?: string;
  brand?: string | null;
  category?: { name: string } | null;
}): Metadata {
  const title = product.name;
  const description = product.description?.slice(0, 160) || `Achetez ${product.name} sur ${SITE_NAME}`;
  const url = `${BASE_URL}/products/${product.slug}`;
  const image = product.images?.[0]?.url || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': product.currency || 'XOF',
      'product:brand': product.brand || SITE_NAME,
      'product:category': product.category?.name || 'Produits',
    },
  };
}

// Generate category metadata
export function generateCategoryMetadata(category: {
  name: string;
  description?: string | null;
  slug: string;
  image?: string | null;
}): Metadata {
  const title = `${category.name} - Acheter en ligne`;
  const description = category.description?.slice(0, 160) || 
    `Découvrez notre sélection de ${category.name} sur ${SITE_NAME}. Livraison en Afrique.`;
  const url = `${BASE_URL}/categories/${category.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: category.image ? [{ url: category.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate vendor metadata
export function generateVendorMetadata(vendor: {
  name: string;
  description?: string | null;
  slug: string;
  logo?: string | null;
}): Metadata {
  const title = `${vendor.name} - Boutique officielle`;
  const description = vendor.description?.slice(0, 160) || 
    `Découvrez les produits de ${vendor.name} sur ${SITE_NAME}`;
  const url = `${BASE_URL}/vendors/${vendor.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      images: vendor.logo ? [{ url: vendor.logo }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate blog post metadata
export function generateBlogMetadata(post: {
  title: string;
  excerpt?: string | null;
  slug: string;
  featuredImage?: string | null;
  author?: { name: string } | null;
  publishedAt?: Date | null;
}): Metadata {
  const description = post.excerpt?.slice(0, 160) || `Lisez "${post.title}" sur le blog ${SITE_NAME}`;
  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author ? [post.author.name] : undefined,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate search page metadata
export function generateSearchMetadata(query: string): Metadata {
  const title = query ? `Résultats pour "${query}"` : 'Recherche';
  const description = query 
    ? `Trouvez ${query} et plus sur ${SITE_NAME}` 
    : `Recherchez parmi des milliers de produits sur ${SITE_NAME}`;

  return {
    title,
    description,
    robots: {
      index: false, // Don't index search pages
      follow: true,
    },
  };
}

// JSON-LD structured data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      'https://facebook.com/mientior',
      'https://twitter.com/mientior',
      'https://instagram.com/mientior',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+221-XX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: ['French', 'English', 'Arabic'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SN',
      addressLocality: 'Dakar',
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description?: string | null;
  slug: string;
  images?: { url: string }[];
  price: number;
  currency?: string;
  brand?: string | null;
  sku?: string | null;
  inStock?: boolean;
  rating?: number | null;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map(img => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/products/${product.slug}`,
      priceCurrency: product.currency || 'XOF',
      price: product.price,
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

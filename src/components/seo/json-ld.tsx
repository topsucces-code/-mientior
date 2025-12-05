import { 
  generateOrganizationSchema, 
  generateProductSchema, 
  generateBreadcrumbSchema,
  generateFAQSchema 
} from '@/lib/seo-utils';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization schema component
export function OrganizationJsonLd() {
  return <JsonLd data={generateOrganizationSchema()} />;
}

// Product schema component
interface ProductJsonLdProps {
  product: {
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
  };
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  return <JsonLd data={generateProductSchema(product)} />;
}

// Breadcrumb schema component
interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return <JsonLd data={generateBreadcrumbSchema(items)} />;
}

// FAQ schema component
interface FAQJsonLdProps {
  faqs: { question: string; answer: string }[];
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  return <JsonLd data={generateFAQSchema(faqs)} />;
}

// Website search action schema
export function WebsiteSearchJsonLd() {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mientior.com';
  
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Mientior',
        url: BASE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

// Local business schema for physical stores
interface LocalBusinessJsonLdProps {
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  phone?: string;
  openingHours?: string[];
  geo?: { lat: number; lng: number };
}

export function LocalBusinessJsonLd({ 
  name, 
  address, 
  phone, 
  openingHours,
  geo 
}: LocalBusinessJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Store',
        name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: address.street,
          addressLocality: address.city,
          addressCountry: address.country,
          postalCode: address.postalCode,
        },
        telephone: phone,
        openingHoursSpecification: openingHours?.map(hours => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: hours,
        })),
        geo: geo ? {
          '@type': 'GeoCoordinates',
          latitude: geo.lat,
          longitude: geo.lng,
        } : undefined,
      }}
    />
  );
}

// Review schema
interface ReviewJsonLdProps {
  itemReviewed: {
    type: 'Product' | 'Organization';
    name: string;
  };
  author: string;
  reviewRating: number;
  reviewBody: string;
  datePublished: string;
}

export function ReviewJsonLd({ 
  itemReviewed, 
  author, 
  reviewRating, 
  reviewBody,
  datePublished 
}: ReviewJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
          '@type': itemReviewed.type,
          name: itemReviewed.name,
        },
        author: {
          '@type': 'Person',
          name: author,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: reviewRating,
          bestRating: 5,
        },
        reviewBody,
        datePublished,
      }}
    />
  );
}

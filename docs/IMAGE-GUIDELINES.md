# Image Guidelines for Mientior

## Overview

This document outlines the image strategy for Mientior, an African-focused e-commerce platform. All imagery should reflect the diversity, vibrancy, and context of African markets.

## Core Principles

### 1. Representation
- **Use African models** for all fashion, clothing, and lifestyle imagery
- Feature diverse skin tones, body types, and ages
- Include both urban and traditional African contexts

### 2. Context Appropriateness
- Images should reflect African urban and rural lifestyles
- Product photography should show items in relevant African settings
- Avoid generic Western-centric imagery

### 3. Visual Consistency
- Maintain warm, vibrant color palettes
- Use consistent lighting and styling across product categories
- Align with the "Frais & Confiant" (turquoise/orange) brand palette

## Image Categories

### Fashion & Clothing

| Category | Guidelines |
|----------|------------|
| Women's Dresses | African models, colorful prints, Ankara/Kente styles |
| Men's Casual | African models, modern urban style |
| Traditional Wear | Authentic African fabrics and designs |
| Accessories | Styled with African context |

**Recommended Sources:**
- Professional African fashion photographers
- African fashion brands' lookbooks
- Curated Unsplash collections featuring African models

### Electronics & Tech

| Category | Guidelines |
|----------|------------|
| Smartphones | Show in African hands/contexts |
| Laptops | African professionals using devices |
| Accessories | Lifestyle shots in African settings |

### Home & Lifestyle

| Category | Guidelines |
|----------|------------|
| Home Decor | African-inspired interiors |
| Kitchen | African family/cooking contexts |
| Beauty | African beauty standards and products |

## Image Specifications

### Product Images
- **Size:** 800x800px minimum
- **Format:** WebP preferred, JPEG fallback
- **Quality:** 80-90%
- **Background:** White or contextual lifestyle

### Banner Images
- **Size:** 1600x600px (desktop), 800x400px (mobile)
- **Format:** WebP preferred
- **Quality:** 85%

### Avatar/Profile Images
- **Size:** 150x150px
- **Format:** WebP or JPEG
- **Quality:** 80%

## Implementation

### Using the African Images Library

```typescript
import { 
  fashionImages, 
  electronicsImages, 
  getProductImage,
  getTestimonialAvatar 
} from '@/lib/african-images'

// Get a fashion image
const dressImage = fashionImages.womensDresses[0]

// Get product image by category
const productImg = getProductImage('women', 0)

// Get testimonial avatar
const avatar = getTestimonialAvatar(index)
```

### Fallback Strategy

1. **Primary:** Use curated African-context images from `/lib/african-images.ts`
2. **Secondary:** Use Unsplash with African-specific search terms
3. **Fallback:** Use placeholder SVG with brand colors

### Unsplash Search Terms

When sourcing new images, use these search terms:
- "African fashion model"
- "African woman portrait"
- "African man professional"
- "Ankara fashion"
- "African urban lifestyle"
- "West African market"
- "African beauty"

## Quality Checklist

Before adding new images, verify:

- [ ] Features African models (for people shots)
- [ ] Reflects African context/setting
- [ ] High resolution (min 800px width)
- [ ] Proper licensing (Unsplash, Pexels, or licensed)
- [ ] Consistent with brand aesthetic
- [ ] Optimized for web (WebP format, compressed)

## File Organization

```
/public/images/
├── products/
│   ├── fashion/
│   ├── electronics/
│   └── home/
├── banners/
│   ├── hero/
│   └── category/
├── avatars/
└── placeholders/
```

## Updating Images

### Seed Data
Update product images in:
- `src/app/api/admin/seed-products/route.ts`
- `src/app/api/admin/seed-categories/route.ts`

### Mock Data
Update mock images in:
- `src/app/(app)/page.tsx` (homepage products)
- `src/lib/instagram.ts` (social feed)
- `src/components/home/testimonials-enhanced.tsx`

### Configuration
Central image configuration:
- `src/lib/african-images.ts`

## Resources

### Recommended Unsplash Collections
- African Portraits
- African Fashion
- African Lifestyle
- African Business

### Stock Photo Sources
- Unsplash (free, attribution appreciated)
- Pexels (free)
- Nappy.co (African-focused, free)
- TONL (diverse stock photos)
- CreateHER Stock (Black women focused)

## Maintenance

- Review and update images quarterly
- Replace generic images as African-context alternatives become available
- Monitor user feedback on imagery representation
- Track image performance in analytics

---

*Last updated: December 2024*

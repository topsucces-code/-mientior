# Immersive Media: Quick Start Guide

## What Changed?

The `ProductImage` model now supports:
- **Videos** via `videoUrl` field
- **360° views** via `frames` JSON array
- **Image dimensions** via `width` and `height` fields

## Marketplace Impact

### 1. Storage Costs
Videos and 360° views consume significantly more storage:
- Standard image: ~200KB
- 360° view: ~7MB
- Product video: ~15-50MB

### 2. Vendor Tiers (Recommended)

| Tier | Storage | Video | 360° | Price (FCFA/month) | Commission |
|------|---------|-------|------|-------------------|------------|
| Basic | 1GB | ❌ | ❌ | Free | 15% |
| Standard | 5GB | ✅ | ❌ | 25,000 (~€38) | 12% |
| Premium | 20GB | ✅ | ✅ | 75,000 (~€114) | 10% |
| Enterprise | 100GB | ✅ | ✅ | 200,000 (~€305) | 8% |

### 3. Required Schema Changes

```prisma
model Vendor {
  // Add these fields:
  storageUsedBytes  BigInt   @default(0)
  storageQuotaBytes BigInt   @default(1073741824) // 1GB
  videoEnabled      Boolean  @default(false)
  threeSixtyEnabled Boolean  @default(false)
  mediaUploadCount  Int      @default(0)
}

// New table for tracking media assets
model MediaAsset {
  id               String   @id @default(cuid())
  vendorId         String
  productId        String?
  type             String   // IMAGE, VIDEO, THREE_SIXTY_FRAME
  url              String
  sizeBytes        BigInt
  moderationStatus String   @default("PENDING")
  // ... more fields
}
```

## Quick Implementation

### Step 1: Run Migration
```bash
npx prisma migrate dev --name add_immersive_media_support
```

### Step 2: Check Storage Quota
```typescript
import { checkVendorStorageQuota } from '@/lib/vendor-storage'

const quota = await checkVendorStorageQuota(vendorId, fileSizeBytes)
if (!quota.allowed) {
  return { error: 'Storage quota exceeded' }
}
```

### Step 3: Upload with Quota Enforcement
```typescript
// POST /api/vendors/[vendorId]/media/upload
// Automatically checks quota and vendor tier permissions
```

### Step 4: Track Storage Usage
```typescript
import { incrementVendorStorage } from '@/lib/vendor-storage'

await incrementVendorStorage(vendorId, fileSizeBytes)
```

## Key Features

✅ **Vendor Storage Quotas**: Prevent unlimited uploads
✅ **Tier-Based Permissions**: Control who can upload videos/360° views
✅ **Content Moderation**: Review media before it goes live
✅ **CDN Optimization**: Adaptive quality for mobile networks
✅ **Mobile Money Integration**: Tier upgrades via Orange Money, MTN, etc.
✅ **French Language**: Full i18n support for Côte d'Ivoire market

## Cost Breakdown

**Infrastructure** (~$392/month for 100 vendors):
- Storage (S3): $36.50
- CDN (CloudFront): $95
- Video Transcoding: $150
- Content Moderation: $110

**Revenue** (per vendor/month):
- Standard tier: €38 - €4 cost = **€34 profit**
- Premium tier: €114 - €4 cost = **€110 profit**

**Break-even**: 10 Standard tier vendors

## Next Steps

1. Review full guide: `IMMERSIVE_MEDIA_MARKETPLACE_GUIDE.md`
2. Run database migration
3. Implement storage quota system
4. Build vendor dashboard
5. Set up content moderation
6. Launch beta with premium vendors

## Support

For questions or issues:
- Full documentation: `IMMERSIVE_MEDIA_MARKETPLACE_GUIDE.md`
- Marketplace architecture: `MARKETPLACE_ARCHITECTURE_GUIDE.md`
- Quick reference: `MARKETPLACE_QUICK_REFERENCE.md`

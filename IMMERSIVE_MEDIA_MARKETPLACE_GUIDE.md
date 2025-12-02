# Immersive Media in Multi-Vendor Marketplace: Architecture Guide

## Executive Summary

The ProductImage schema enhancement adds support for videos and 360° product views. This guide addresses the marketplace-specific implications for storage, costs, vendor capabilities, and content moderation in the Côte d'Ivoire market.

## 1. Schema Changes Analysis

### What Was Added
```prisma
model ProductImage {
  // New fields for immersive product page
  videoUrl  String?  // For VIDEO type
  frames    Json?    // Array of frame URLs for THREE_SIXTY type
  width     Int?     // Original image width
  height    Int?     // Original image height
}
```

### Media Types Supported
1. **IMAGE** (existing) - Standard product photos
2. **VIDEO** (new) - Product demonstration videos
3. **THREE_SIXTY** (new) - 360° spin views with multiple frames

## 2. Marketplace Architecture Considerations

### A. Storage & Cost Management

**Problem**: Videos and 360° images consume significantly more storage than standard images.

**Impact**:
- Standard image: ~200KB
- 360° view (36 frames): ~7MB
- Product video (30s): ~15-50MB

**Solution**: Implement vendor-based storage quotas and tiered pricing.


## 3. Recommended Schema Enhancements

### A. Add Vendor Storage Tracking

```prisma
model Vendor {
  id             String         @id @default(cuid())
  businessName   String
  slug           String         @unique
  email          String         @unique
  phone          String?
  logo           String?
  description    String?        @db.Text
  status         VendorStatus   @default(PENDING)
  commissionRate Float          @default(10.0)
  
  // Storage & Media Management (NEW)
  storageUsedBytes  BigInt      @default(0)           // Current storage usage
  storageQuotaBytes BigInt      @default(1073741824) // 1GB default quota
  videoEnabled      Boolean     @default(false)       // Premium feature flag
  threeSixtyEnabled Boolean     @default(false)       // Premium feature flag
  mediaUploadCount  Int         @default(0)           // Total media uploads
  
  documents      Json?
  bankDetails    Json?
  rating         Float          @default(0)
  totalSales     Float          @default(0)
  totalProducts  Int            @default(0)
  products       Product[]
  orders         Order[]
  payouts        VendorPayout[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status])
  @@index([email])
  @@index([storageUsedBytes]) // NEW: For quota monitoring
  @@index([createdAt])
  @@map("vendors")
}
```

### B. Add Media Metadata Tracking

```prisma
model MediaAsset {
  id            String   @id @default(cuid())
  vendorId      String
  vendor        Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  productId     String?
  product       Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  
  type          String   // IMAGE, VIDEO, THREE_SIXTY_FRAME
  url           String
  sizeBytes     BigInt
  width         Int?
  height        Int?
  duration      Int?     // For videos (seconds)
  format        String?  // mp4, webm, jpg, png, etc.
  
  // Content moderation
  moderationStatus String @default("PENDING") // PENDING, APPROVED, REJECTED
  moderationNotes  String? @db.Text
  moderatedAt      DateTime?
  moderatedBy      String?
  
  // CDN & Performance
  cdnUrl        String?
  thumbnailUrl  String?
  optimized     Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([vendorId])
  @@index([productId])
  @@index([type])
  @@index([moderationStatus])
  @@index([createdAt])
  @@map("media_assets")
}
```


## 4. Vendor Tier System

### Storage Quotas by Tier

```typescript
// src/lib/vendor-tiers.ts

export enum VendorTier {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export interface VendorTierConfig {
  tier: VendorTier
  storageQuotaGB: number
  videoEnabled: boolean
  threeSixtyEnabled: boolean
  maxVideoSizeMB: number
  maxVideoDurationSeconds: number
  maxImagesPerProduct: number
  commissionRate: number
  monthlyFeeCFA: number // XOF (Franc CFA)
}

export const VENDOR_TIERS: Record<VendorTier, VendorTierConfig> = {
  [VendorTier.BASIC]: {
    tier: VendorTier.BASIC,
    storageQuotaGB: 1,
    videoEnabled: false,
    threeSixtyEnabled: false,
    maxVideoSizeMB: 0,
    maxVideoDurationSeconds: 0,
    maxImagesPerProduct: 5,
    commissionRate: 15.0, // 15%
    monthlyFeeCFA: 0, // Free
  },
  [VendorTier.STANDARD]: {
    tier: VendorTier.STANDARD,
    storageQuotaGB: 5,
    videoEnabled: true,
    threeSixtyEnabled: false,
    maxVideoSizeMB: 50,
    maxVideoDurationSeconds: 60,
    maxImagesPerProduct: 10,
    commissionRate: 12.0, // 12%
    monthlyFeeCFA: 25000, // ~€38
  },
  [VendorTier.PREMIUM]: {
    tier: VendorTier.PREMIUM,
    storageQuotaGB: 20,
    videoEnabled: true,
    threeSixtyEnabled: true,
    maxVideoSizeMB: 100,
    maxVideoDurationSeconds: 180,
    maxImagesPerProduct: 20,
    commissionRate: 10.0, // 10%
    monthlyFeeCFA: 75000, // ~€114
  },
  [VendorTier.ENTERPRISE]: {
    tier: VendorTier.ENTERPRISE,
    storageQuotaGB: 100,
    videoEnabled: true,
    threeSixtyEnabled: true,
    maxVideoSizeMB: 200,
    maxVideoDurationSeconds: 300,
    maxImagesPerProduct: 50,
    commissionRate: 8.0, // 8%
    monthlyFeeCFA: 200000, // ~€305
  },
}

export function getVendorTierConfig(tier: VendorTier): VendorTierConfig {
  return VENDOR_TIERS[tier]
}

export function canUploadVideo(tier: VendorTier): boolean {
  return VENDOR_TIERS[tier].videoEnabled
}

export function canUpload360View(tier: VendorTier): boolean {
  return VENDOR_TIERS[tier].threeSixtyEnabled
}
```


## 5. Storage Management Service

```typescript
// src/lib/vendor-storage.ts

import { prisma } from './prisma'
import { VendorTier, getVendorTierConfig } from './vendor-tiers'

export interface StorageCheckResult {
  allowed: boolean
  currentUsageBytes: number
  quotaBytes: number
  remainingBytes: number
  usagePercentage: number
  error?: string
}

/**
 * Check if vendor has enough storage quota for new upload
 */
export async function checkVendorStorageQuota(
  vendorId: string,
  fileSizeBytes: number
): Promise<StorageCheckResult> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      storageUsedBytes: true,
      storageQuotaBytes: true,
    },
  })

  if (!vendor) {
    return {
      allowed: false,
      currentUsageBytes: 0,
      quotaBytes: 0,
      remainingBytes: 0,
      usagePercentage: 0,
      error: 'Vendor not found',
    }
  }

  const currentUsage = Number(vendor.storageUsedBytes)
  const quota = Number(vendor.storageQuotaBytes)
  const remaining = quota - currentUsage
  const usagePercentage = (currentUsage / quota) * 100

  const allowed = currentUsage + fileSizeBytes <= quota

  return {
    allowed,
    currentUsageBytes: currentUsage,
    quotaBytes: quota,
    remainingBytes: remaining,
    usagePercentage,
    error: allowed ? undefined : 'Storage quota exceeded',
  }
}

/**
 * Update vendor storage usage after upload
 */
export async function incrementVendorStorage(
  vendorId: string,
  fileSizeBytes: number
): Promise<void> {
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      storageUsedBytes: {
        increment: fileSizeBytes,
      },
      mediaUploadCount: {
        increment: 1,
      },
    },
  })
}

/**
 * Update vendor storage usage after deletion
 */
export async function decrementVendorStorage(
  vendorId: string,
  fileSizeBytes: number
): Promise<void> {
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      storageUsedBytes: {
        decrement: fileSizeBytes,
      },
    },
  })
}

/**
 * Get vendor storage statistics
 */
export async function getVendorStorageStats(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      storageUsedBytes: true,
      storageQuotaBytes: true,
      mediaUploadCount: true,
    },
  })

  if (!vendor) {
    throw new Error('Vendor not found')
  }

  const usedGB = Number(vendor.storageUsedBytes) / (1024 * 1024 * 1024)
  const quotaGB = Number(vendor.storageQuotaBytes) / (1024 * 1024 * 1024)
  const usagePercentage = (Number(vendor.storageUsedBytes) / Number(vendor.storageQuotaBytes)) * 100

  return {
    usedBytes: Number(vendor.storageUsedBytes),
    quotaBytes: Number(vendor.storageQuotaBytes),
    usedGB: usedGB.toFixed(2),
    quotaGB: quotaGB.toFixed(2),
    usagePercentage: usagePercentage.toFixed(1),
    remainingGB: (quotaGB - usedGB).toFixed(2),
    totalUploads: vendor.mediaUploadCount,
  }
}
```


## 6. Media Upload API with Quota Enforcement

```typescript
// src/app/api/vendors/[vendorId]/media/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-server'
import { checkVendorStorageQuota, incrementVendorStorage } from '@/lib/vendor-storage'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const uploadSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'THREE_SIXTY_FRAME']),
  productId: z.string().optional(),
  sizeBytes: z.number().positive(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  format: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Authenticate vendor or admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { vendorId } = params
    const body = await request.json()
    const data = uploadSchema.parse(body)

    // Check storage quota
    const quotaCheck = await checkVendorStorageQuota(vendorId, data.sizeBytes)
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Storage quota exceeded',
          currentUsage: quotaCheck.currentUsageBytes,
          quota: quotaCheck.quotaBytes,
          usagePercentage: quotaCheck.usagePercentage,
        },
        { status: 413 } // Payload Too Large
      )
    }

    // Check vendor tier permissions
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { 
        videoEnabled: true, 
        threeSixtyEnabled: true,
        status: true,
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    if (vendor.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Vendor account is not active' },
        { status: 403 }
      )
    }

    // Validate media type permissions
    if (data.type === 'VIDEO' && !vendor.videoEnabled) {
      return NextResponse.json(
        { 
          error: 'Video uploads not enabled for your tier',
          upgradeRequired: true,
          requiredTier: 'STANDARD',
        },
        { status: 403 }
      )
    }

    if (data.type === 'THREE_SIXTY_FRAME' && !vendor.threeSixtyEnabled) {
      return NextResponse.json(
        { 
          error: '360° view uploads not enabled for your tier',
          upgradeRequired: true,
          requiredTier: 'PREMIUM',
        },
        { status: 403 }
      )
    }

    // TODO: Actual file upload to S3/Cloudinary/etc would happen here
    // For now, we'll simulate with a placeholder URL
    const uploadedUrl = `https://cdn.mientior.com/vendors/${vendorId}/media/${Date.now()}`

    // Create media asset record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        vendorId,
        productId: data.productId,
        type: data.type,
        url: uploadedUrl,
        sizeBytes: data.sizeBytes,
        width: data.width,
        height: data.height,
        duration: data.duration,
        format: data.format,
        moderationStatus: 'PENDING',
      },
    })

    // Update vendor storage usage
    await incrementVendorStorage(vendorId, data.sizeBytes)

    return NextResponse.json({
      success: true,
      mediaAsset,
      storageUsage: {
        usedBytes: quotaCheck.currentUsageBytes + data.sizeBytes,
        quotaBytes: quotaCheck.quotaBytes,
        remainingBytes: quotaCheck.remainingBytes - data.sizeBytes,
        usagePercentage: ((quotaCheck.currentUsageBytes + data.sizeBytes) / quotaCheck.quotaBytes) * 100,
      },
    })
  } catch (error) {
    console.error('Media upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
```


## 7. Content Moderation System

### A. Automated Video Moderation

```typescript
// src/lib/content-moderation.ts

import { prisma } from './prisma'

export interface ModerationResult {
  approved: boolean
  confidence: number
  flags: string[]
  reason?: string
}

/**
 * Moderate video content using AI service (e.g., AWS Rekognition, Google Video Intelligence)
 * For Côte d'Ivoire market, check for:
 * - Explicit content
 * - Violence
 * - Counterfeit products
 * - Misleading claims
 */
export async function moderateVideoContent(
  videoUrl: string
): Promise<ModerationResult> {
  // TODO: Integrate with actual moderation service
  // For now, return mock result
  
  // In production, you would call:
  // - AWS Rekognition Video
  // - Google Cloud Video Intelligence API
  // - Azure Video Indexer
  
  return {
    approved: true,
    confidence: 0.95,
    flags: [],
  }
}

/**
 * Moderate image content
 */
export async function moderateImageContent(
  imageUrl: string
): Promise<ModerationResult> {
  // TODO: Integrate with actual moderation service
  
  return {
    approved: true,
    confidence: 0.95,
    flags: [],
  }
}

/**
 * Update media moderation status
 */
export async function updateModerationStatus(
  mediaAssetId: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string,
  moderatedBy?: string
): Promise<void> {
  await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: {
      moderationStatus: status,
      moderationNotes: notes,
      moderatedAt: new Date(),
      moderatedBy,
    },
  })
}

/**
 * Get pending moderation queue
 */
export async function getPendingModerationQueue(limit = 50) {
  return prisma.mediaAsset.findMany({
    where: {
      moderationStatus: 'PENDING',
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          email: true,
          rating: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
  })
}
```

### B. Manual Moderation Dashboard

```typescript
// src/app/api/admin/moderation/queue/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { getPendingModerationQueue } from '@/lib/content-moderation'

export async function GET(request: NextRequest) {
  try {
    // Require PRODUCTS_WRITE permission for moderation
    await requireAdminAuth(Permission.PRODUCTS_WRITE)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const queue = await getPendingModerationQueue(limit)

    return NextResponse.json({
      items: queue,
      total: queue.length,
    })
  } catch (error) {
    console.error('Moderation queue error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}
```


## 8. CDN & Performance Optimization

### A. Video Transcoding Pipeline

```typescript
// src/lib/video-processing.ts

export interface VideoTranscodingJob {
  id: string
  vendorId: string
  sourceUrl: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  outputs: {
    quality: '360p' | '480p' | '720p' | '1080p'
    url: string
    sizeBytes: number
  }[]
}

/**
 * Queue video for transcoding to multiple qualities
 * Optimized for mobile data in Côte d'Ivoire (expensive mobile data)
 */
export async function queueVideoTranscoding(
  vendorId: string,
  sourceUrl: string,
  originalSizeBytes: number
): Promise<VideoTranscodingJob> {
  // TODO: Integrate with transcoding service
  // Options:
  // - AWS MediaConvert
  // - Cloudinary Video API
  // - Mux
  // - FFmpeg on worker nodes
  
  const job: VideoTranscodingJob = {
    id: `transcode_${Date.now()}`,
    vendorId,
    sourceUrl,
    status: 'PENDING',
    outputs: [],
  }

  // In production, queue this to a background job processor
  // For Côte d'Ivoire market, prioritize:
  // 1. 360p for 2G/3G networks
  // 2. 480p for standard mobile
  // 3. 720p for WiFi/4G
  
  return job
}

/**
 * Generate adaptive bitrate streaming manifest (HLS/DASH)
 */
export async function generateStreamingManifest(
  videoId: string
): Promise<string> {
  // TODO: Generate HLS/DASH manifest
  return `https://cdn.mientior.com/videos/${videoId}/manifest.m3u8`
}
```

### B. Image Optimization

```typescript
// src/lib/image-optimization.ts

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  generateThumbnail?: boolean
}

/**
 * Optimize uploaded images for web delivery
 */
export async function optimizeImage(
  sourceUrl: string,
  options: ImageOptimizationOptions = {}
): Promise<{
  optimizedUrl: string
  thumbnailUrl?: string
  originalSizeBytes: number
  optimizedSizeBytes: number
  compressionRatio: number
}> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'webp',
    generateThumbnail = true,
  } = options

  // TODO: Integrate with image optimization service
  // Options:
  // - Cloudinary
  // - imgix
  // - Sharp (self-hosted)
  
  return {
    optimizedUrl: sourceUrl,
    thumbnailUrl: generateThumbnail ? `${sourceUrl}?w=300&h=300` : undefined,
    originalSizeBytes: 1000000,
    optimizedSizeBytes: 300000,
    compressionRatio: 0.7,
  }
}

/**
 * Generate responsive image srcset
 */
export function generateResponsiveSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ')
}
```


## 9. Vendor Dashboard Components

### A. Storage Usage Widget

```typescript
// src/components/vendor/storage-usage-widget.tsx

'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardDrive, TrendingUp, AlertTriangle } from 'lucide-react'

interface StorageStats {
  usedGB: string
  quotaGB: string
  usagePercentage: string
  remainingGB: string
  totalUploads: number
}

export function StorageUsageWidget({ vendorId }: { vendorId: string }) {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStorageStats()
  }, [vendorId])

  const fetchStorageStats = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/storage/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch storage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  if (!stats) {
    return null
  }

  const usagePercent = parseFloat(stats.usagePercentage)
  const isNearLimit = usagePercent > 80
  const isAtLimit = usagePercent > 95

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Stockage Média
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {stats.usedGB} GB / {stats.quotaGB} GB
            </span>
            <span className={isAtLimit ? 'text-red-600 font-semibold' : isNearLimit ? 'text-yellow-600' : ''}>
              {stats.usagePercentage}%
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : ''}
          />
        </div>

        {isNearLimit && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">
                Quota de stockage presque atteint
              </p>
              <p className="text-yellow-700 mt-1">
                Il vous reste {stats.remainingGB} GB. Passez à un forfait supérieur pour plus d'espace.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-sm text-muted-foreground">Fichiers uploadés</p>
            <p className="text-2xl font-semibold">{stats.totalUploads}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Espace restant</p>
            <p className="text-2xl font-semibold">{stats.remainingGB} GB</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <a href="/vendor/upgrade">
            <TrendingUp className="h-4 w-4 mr-2" />
            Augmenter le stockage
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
```

### B. Media Upload Component

```typescript
// src/components/vendor/media-upload.tsx

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Video, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

interface MediaUploadProps {
  vendorId: string
  productId?: string
  allowedTypes: ('IMAGE' | 'VIDEO' | 'THREE_SIXTY')[]
  onUploadComplete: (mediaAsset: any) => void
}

export function MediaUpload({
  vendorId,
  productId,
  allowedTypes,
  onUploadComplete,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setProgress(0)

    try {
      // Determine media type
      const isVideo = file.type.startsWith('video/')
      const mediaType = isVideo ? 'VIDEO' : 'IMAGE'

      if (!allowedTypes.includes(mediaType)) {
        toast.error(`Type de fichier non autorisé: ${mediaType}`)
        return
      }

      // Check file size (client-side validation)
      const maxSizeMB = isVideo ? 100 : 10
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      
      if (file.size > maxSizeBytes) {
        toast.error(`Fichier trop volumineux. Maximum: ${maxSizeMB}MB`)
        return
      }

      // TODO: Actual file upload to S3/Cloudinary
      // For now, simulate upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', mediaType)
      formData.append('productId', productId || '')

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`/api/vendors/${vendorId}/media/upload`, {
        method: 'POST',
        body: JSON.stringify({
          type: mediaType,
          productId,
          sizeBytes: file.size,
          format: file.type,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      
      toast.success('Fichier uploadé avec succès')
      onUploadComplete(result.mediaAsset)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Échec de l\'upload')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [vendorId, productId, allowedTypes, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes.includes('IMAGE') ? ['.jpg', '.jpeg', '.png', '.webp'] : [],
      'video/*': allowedTypes.includes('VIDEO') ? ['.mp4', '.webm', '.mov'] : [],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          {allowedTypes.includes('VIDEO') ? (
            <Video className="h-12 w-12 text-gray-400" />
          ) : (
            <ImageIcon className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isDragActive
                ? 'Déposez le fichier ici'
                : 'Glissez-déposez ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {allowedTypes.includes('VIDEO') && 'Vidéo: MP4, WebM (max 100MB)'}
              {allowedTypes.includes('IMAGE') && 'Image: JPG, PNG, WebP (max 10MB)'}
            </p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Upload en cours...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  )
}
```


## 10. Migration Strategy

### A. Database Migration

```sql
-- Add storage tracking to vendors
ALTER TABLE vendors 
ADD COLUMN storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN storage_quota_bytes BIGINT DEFAULT 1073741824, -- 1GB
ADD COLUMN video_enabled BOOLEAN DEFAULT false,
ADD COLUMN three_sixty_enabled BOOLEAN DEFAULT false,
ADD COLUMN media_upload_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_vendors_storage_used ON vendors(storage_used_bytes);

-- Create media_assets table
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  format TEXT,
  moderation_status TEXT DEFAULT 'PENDING',
  moderation_notes TEXT,
  moderated_at TIMESTAMP,
  moderated_by TEXT,
  cdn_url TEXT,
  thumbnail_url TEXT,
  optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_assets_vendor ON media_assets(vendor_id);
CREATE INDEX idx_media_assets_product ON media_assets(product_id);
CREATE INDEX idx_media_assets_type ON media_assets(type);
CREATE INDEX idx_media_assets_moderation ON media_assets(moderation_status);
CREATE INDEX idx_media_assets_created ON media_assets(created_at);

-- Backfill existing product images storage usage
UPDATE vendors v
SET storage_used_bytes = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN pi.type = 'VIDEO' THEN 50000000  -- Estimate 50MB per video
      WHEN pi.type = 'THREE_SIXTY' THEN 7000000  -- Estimate 7MB per 360 view
      ELSE 200000  -- Estimate 200KB per image
    END
  ), 0)
  FROM product_images pi
  JOIN products p ON pi.product_id = p.id
  WHERE p.vendor_id = v.id
);
```

### B. Prisma Schema Update

```prisma
// Add to schema.prisma

model Vendor {
  id             String         @id @default(cuid())
  businessName   String
  slug           String         @unique
  email          String         @unique
  phone          String?
  logo           String?
  description    String?        @db.Text
  status         VendorStatus   @default(PENDING)
  commissionRate Float          @default(10.0)
  
  // Storage & Media Management
  storageUsedBytes  BigInt      @default(0)
  storageQuotaBytes BigInt      @default(1073741824) // 1GB
  videoEnabled      Boolean     @default(false)
  threeSixtyEnabled Boolean     @default(false)
  mediaUploadCount  Int         @default(0)
  
  documents      Json?
  bankDetails    Json?
  rating         Float          @default(0)
  totalSales     Float          @default(0)
  totalProducts  Int            @default(0)
  products       Product[]
  orders         Order[]
  payouts        VendorPayout[]
  mediaAssets    MediaAsset[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status])
  @@index([email])
  @@index([storageUsedBytes])
  @@index([createdAt])
  @@map("vendors")
}

model MediaAsset {
  id            String   @id @default(cuid())
  vendorId      String
  vendor        Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  productId     String?
  product       Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  
  type          String   // IMAGE, VIDEO, THREE_SIXTY_FRAME
  url           String
  sizeBytes     BigInt
  width         Int?
  height        Int?
  duration      Int?     // For videos (seconds)
  format        String?  // mp4, webm, jpg, png, etc.
  
  // Content moderation
  moderationStatus String @default("PENDING") // PENDING, APPROVED, REJECTED
  moderationNotes  String? @db.Text
  moderatedAt      DateTime?
  moderatedBy      String?
  
  // CDN & Performance
  cdnUrl        String?
  thumbnailUrl  String?
  optimized     Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([vendorId])
  @@index([productId])
  @@index([type])
  @@index([moderationStatus])
  @@index([createdAt])
  @@map("media_assets")
}
```

### C. Migration Script

```bash
#!/bin/bash
# scripts/migrate-immersive-media.sh

echo "🚀 Starting immersive media migration..."

# 1. Backup database
echo "📦 Creating database backup..."
npm run db:backup

# 2. Run Prisma migration
echo "🔄 Running Prisma migration..."
npx prisma migrate dev --name add_immersive_media_support

# 3. Backfill storage usage
echo "📊 Backfilling vendor storage usage..."
npx prisma db execute --file prisma/migrations/backfill_vendor_storage.sql

# 4. Enable features for existing premium vendors
echo "✨ Enabling features for premium vendors..."
node scripts/enable-premium-features.js

echo "✅ Migration complete!"
```


## 11. Côte d'Ivoire Market Considerations

### A. Mobile Money Integration for Tier Upgrades

```typescript
// src/lib/vendor-tier-payment.ts

import { prisma } from './prisma'

export interface TierUpgradePayment {
  vendorId: string
  fromTier: string
  toTier: string
  amountCFA: number
  paymentMethod: 'ORANGE_MONEY' | 'MTN_MONEY' | 'MOOV_MONEY' | 'WAVE'
  phoneNumber: string
}

/**
 * Initiate tier upgrade payment via Mobile Money
 * Côte d'Ivoire mobile money operators:
 * - Orange Money (most popular)
 * - MTN Mobile Money
 * - Moov Money
 * - Wave
 */
export async function initiateTierUpgradePayment(
  payment: TierUpgradePayment
): Promise<{ transactionId: string; paymentUrl?: string }> {
  // TODO: Integrate with Mobile Money API
  // For Orange Money: https://developer.orange.com/apis/orange-money-webpay/
  // For MTN: https://momodeveloper.mtn.com/
  
  const transactionId = `tier_upgrade_${Date.now()}`
  
  // Store pending upgrade
  await prisma.$executeRaw`
    INSERT INTO vendor_tier_upgrades (
      vendor_id, from_tier, to_tier, amount_cfa, 
      payment_method, phone_number, transaction_id, status
    ) VALUES (
      ${payment.vendorId}, ${payment.fromTier}, ${payment.toTier}, 
      ${payment.amountCFA}, ${payment.paymentMethod}, ${payment.phoneNumber},
      ${transactionId}, 'PENDING'
    )
  `
  
  return {
    transactionId,
    paymentUrl: `https://payment.mientior.com/tier-upgrade/${transactionId}`,
  }
}

/**
 * Process tier upgrade after successful payment
 */
export async function processTierUpgrade(
  vendorId: string,
  newTier: string
): Promise<void> {
  const tierConfig = getVendorTierConfig(newTier as any)
  
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      storageQuotaBytes: tierConfig.storageQuotaGB * 1024 * 1024 * 1024,
      videoEnabled: tierConfig.videoEnabled,
      threeSixtyEnabled: tierConfig.threeSixtyEnabled,
      commissionRate: tierConfig.commissionRate,
    },
  })
  
  // Send confirmation email/SMS
  // TODO: Implement notification
}
```

### B. Bandwidth Optimization for Mobile Networks

```typescript
// src/lib/adaptive-media-delivery.ts

export interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  downlink: number // Mbps
  rtt: number // Round-trip time in ms
}

/**
 * Select optimal media quality based on network conditions
 * Critical for Côte d'Ivoire where mobile data is expensive
 */
export function selectOptimalMediaQuality(
  networkCondition: NetworkCondition,
  mediaType: 'IMAGE' | 'VIDEO'
): {
  quality: string
  maxWidth: number
  videoResolution?: string
} {
  if (mediaType === 'IMAGE') {
    switch (networkCondition.effectiveType) {
      case 'slow-2g':
      case '2g':
        return { quality: 'low', maxWidth: 480 }
      case '3g':
        return { quality: 'medium', maxWidth: 720 }
      case '4g':
        return { quality: 'high', maxWidth: 1280 }
      default:
        return { quality: 'medium', maxWidth: 720 }
    }
  } else {
    // Video
    switch (networkCondition.effectiveType) {
      case 'slow-2g':
      case '2g':
        return { quality: 'low', maxWidth: 480, videoResolution: '360p' }
      case '3g':
        return { quality: 'medium', maxWidth: 640, videoResolution: '480p' }
      case '4g':
        return { quality: 'high', maxWidth: 1280, videoResolution: '720p' }
      default:
        return { quality: 'medium', maxWidth: 640, videoResolution: '480p' }
    }
  }
}

/**
 * Client-side hook for adaptive media loading
 */
export function useAdaptiveMediaQuality() {
  // Use Network Information API
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection

  if (!connection) {
    return { quality: 'medium', maxWidth: 720 }
  }

  return selectOptimalMediaQuality(
    {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    },
    'IMAGE'
  )
}
```

### C. French Language Support

```json
// public/locales/fr/vendor.json
{
  "storage": {
    "title": "Stockage Média",
    "used": "Utilisé",
    "quota": "Quota",
    "remaining": "Restant",
    "nearLimit": "Quota de stockage presque atteint",
    "atLimit": "Quota de stockage atteint",
    "upgrade": "Augmenter le stockage"
  },
  "upload": {
    "title": "Télécharger un fichier",
    "dragDrop": "Glissez-déposez ou cliquez pour sélectionner",
    "videoSupported": "Vidéo: MP4, WebM (max 100MB)",
    "imageSupported": "Image: JPG, PNG, WebP (max 10MB)",
    "uploading": "Téléchargement en cours...",
    "success": "Fichier téléchargé avec succès",
    "error": "Échec du téléchargement",
    "quotaExceeded": "Quota de stockage dépassé",
    "tierRequired": "Fonctionnalité non disponible pour votre forfait"
  },
  "tiers": {
    "basic": {
      "name": "Basique",
      "price": "Gratuit",
      "storage": "1 GB de stockage",
      "features": [
        "5 images par produit",
        "Pas de vidéo",
        "Pas de vue 360°",
        "Commission 15%"
      ]
    },
    "standard": {
      "name": "Standard",
      "price": "25 000 FCFA/mois",
      "storage": "5 GB de stockage",
      "features": [
        "10 images par produit",
        "Vidéos jusqu'à 60s",
        "Pas de vue 360°",
        "Commission 12%"
      ]
    },
    "premium": {
      "name": "Premium",
      "price": "75 000 FCFA/mois",
      "storage": "20 GB de stockage",
      "features": [
        "20 images par produit",
        "Vidéos jusqu'à 3min",
        "Vues 360° illimitées",
        "Commission 10%"
      ]
    },
    "enterprise": {
      "name": "Entreprise",
      "price": "200 000 FCFA/mois",
      "storage": "100 GB de stockage",
      "features": [
        "50 images par produit",
        "Vidéos jusqu'à 5min",
        "Vues 360° illimitées",
        "Commission 8%",
        "Support prioritaire"
      ]
    }
  },
  "moderation": {
    "pending": "En attente de modération",
    "approved": "Approuvé",
    "rejected": "Rejeté",
    "reason": "Raison du rejet"
  }
}
```


## 12. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Add storage tracking fields to Vendor model
- [ ] Create MediaAsset model
- [ ] Implement vendor tier configuration system
- [ ] Set up storage quota checking utilities
- [ ] Create database migration scripts

### Phase 2: Upload & Storage (Week 3-4)
- [ ] Implement media upload API with quota enforcement
- [ ] Integrate with CDN (Cloudinary/S3)
- [ ] Build vendor storage dashboard widget
- [ ] Create media upload component
- [ ] Implement storage usage tracking

### Phase 3: Content Moderation (Week 5-6)
- [ ] Set up automated content moderation (AWS Rekognition/Google Vision)
- [ ] Build admin moderation queue dashboard
- [ ] Implement manual review workflow
- [ ] Create moderation status notifications
- [ ] Add vendor appeal process

### Phase 4: Optimization (Week 7-8)
- [ ] Implement video transcoding pipeline
- [ ] Set up adaptive bitrate streaming (HLS/DASH)
- [ ] Optimize images for web delivery
- [ ] Generate responsive image srcsets
- [ ] Implement lazy loading for media

### Phase 5: Vendor Experience (Week 9-10)
- [ ] Build tier upgrade flow with Mobile Money
- [ ] Create vendor media library interface
- [ ] Implement bulk upload functionality
- [ ] Add media analytics (views, engagement)
- [ ] Build tier comparison page

### Phase 6: Mobile Optimization (Week 11-12)
- [ ] Implement adaptive media quality selection
- [ ] Optimize for 2G/3G networks
- [ ] Add offline media caching
- [ ] Test on Côte d'Ivoire mobile networks
- [ ] Implement data saver mode

## 13. Cost Estimation (Monthly)

### Storage Costs (AWS S3 Standard)
- 100 vendors × 5GB average = 500GB
- Storage: $0.023/GB × 500GB = **$11.50/month**
- Requests: ~$5/month
- Data transfer: ~$20/month (assuming 1TB/month)
- **Total Storage: ~$36.50/month**

### CDN Costs (CloudFront)
- 1TB data transfer: **$85/month**
- 10M requests: **$10/month**
- **Total CDN: ~$95/month**

### Video Transcoding (AWS MediaConvert)
- 100 hours/month: **$150/month**

### Content Moderation (AWS Rekognition)
- 10,000 images/month: **$10/month**
- 100 videos/month: **$100/month**

### Total Infrastructure Cost
- **~$391.50/month** for 100 active vendors
- **~$3.92/vendor/month** infrastructure cost

### Revenue Model
- Basic tier: Free (15% commission covers costs)
- Standard tier: 25,000 FCFA (~€38/month) - Profit: ~€34/month
- Premium tier: 75,000 FCFA (~€114/month) - Profit: ~€110/month
- Enterprise tier: 200,000 FCFA (~€305/month) - Profit: ~€301/month

**Break-even**: ~10 Standard tier vendors or 4 Premium tier vendors


## 14. Security Considerations

### A. File Upload Security

```typescript
// src/lib/media-security.ts

import { z } from 'zod'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
}

/**
 * Validate uploaded file for security
 */
export async function validateUploadedFile(
  file: File,
  expectedType: 'IMAGE' | 'VIDEO'
): Promise<FileValidationResult> {
  // 1. Check file type
  const allowedTypes = expectedType === 'IMAGE' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé: ${file.type}`,
    }
  }

  // 2. Check file size
  const maxSize = expectedType === 'IMAGE' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${maxSize / 1024 / 1024}MB)`,
    }
  }

  // 3. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name)

  // 4. Verify file signature (magic bytes)
  const isValidSignature = await verifyFileSignature(file, expectedType)
  if (!isValidSignature) {
    return {
      valid: false,
      error: 'Signature de fichier invalide',
    }
  }

  return {
    valid: true,
    sanitizedFilename,
  }
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255) // Limit length
}

/**
 * Verify file signature (magic bytes) to prevent file type spoofing
 */
async function verifyFileSignature(
  file: File,
  expectedType: 'IMAGE' | 'VIDEO'
): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (expectedType === 'IMAGE') {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return true
    }
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return true
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return true
    }
  } else {
    // MP4: 66 74 79 70 (ftyp)
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return true
    }
    // WebM: 1A 45 DF A3
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return true
    }
  }

  return false
}

/**
 * Scan file for malware (integrate with ClamAV or similar)
 */
export async function scanFileForMalware(fileUrl: string): Promise<boolean> {
  // TODO: Integrate with antivirus service
  // Options:
  // - ClamAV (open source)
  // - VirusTotal API
  // - AWS GuardDuty
  
  return true // Clean
}
```

### B. Access Control

```typescript
// src/lib/media-access-control.ts

import { prisma } from './prisma'

/**
 * Check if user has permission to access media asset
 */
export async function canAccessMediaAsset(
  userId: string,
  mediaAssetId: string,
  role: 'VENDOR' | 'ADMIN' | 'CUSTOMER'
): Promise<boolean> {
  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    include: {
      vendor: true,
      product: true,
    },
  })

  if (!mediaAsset) {
    return false
  }

  // Admins can access all media
  if (role === 'ADMIN') {
    return true
  }

  // Vendors can only access their own media
  if (role === 'VENDOR') {
    return mediaAsset.vendorId === userId
  }

  // Customers can only access approved media from active products
  if (role === 'CUSTOMER') {
    return (
      mediaAsset.moderationStatus === 'APPROVED' &&
      mediaAsset.product?.status === 'ACTIVE'
    )
  }

  return false
}

/**
 * Generate signed URL for private media access
 */
export async function generateSignedMediaUrl(
  mediaAssetId: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  // TODO: Implement signed URL generation
  // For S3: use AWS SDK getSignedUrl
  // For Cloudinary: use signed URLs
  
  return `https://cdn.mientior.com/media/${mediaAssetId}?expires=${Date.now() + expiresIn * 1000}`
}
```


## 15. Monitoring & Analytics

### A. Media Performance Metrics

```typescript
// src/lib/media-analytics.ts

import { prisma } from './prisma'
import { redis } from './redis'

export interface MediaAnalytics {
  totalViews: number
  uniqueViews: number
  avgLoadTime: number
  bandwidthUsed: number
  conversionRate: number
}

/**
 * Track media view event
 */
export async function trackMediaView(
  mediaAssetId: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  const key = `media:views:${mediaAssetId}`
  const uniqueKey = `media:unique:${mediaAssetId}`
  
  // Increment total views
  await redis.incr(key)
  
  // Track unique views
  if (userId || sessionId) {
    await redis.sadd(uniqueKey, userId || sessionId || 'anonymous')
  }
  
  // Set expiry (30 days)
  await redis.expire(key, 30 * 24 * 60 * 60)
  await redis.expire(uniqueKey, 30 * 24 * 60 * 60)
}

/**
 * Get media analytics
 */
export async function getMediaAnalytics(
  mediaAssetId: string
): Promise<MediaAnalytics> {
  const viewsKey = `media:views:${mediaAssetId}`
  const uniqueKey = `media:unique:${mediaAssetId}`
  
  const [totalViews, uniqueViewers] = await Promise.all([
    redis.get(viewsKey),
    redis.scard(uniqueKey),
  ])
  
  return {
    totalViews: parseInt(totalViews || '0'),
    uniqueViews: uniqueViewers,
    avgLoadTime: 0, // TODO: Implement
    bandwidthUsed: 0, // TODO: Implement
    conversionRate: 0, // TODO: Implement
  }
}

/**
 * Get vendor media analytics dashboard
 */
export async function getVendorMediaDashboard(vendorId: string) {
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { vendorId },
    select: {
      id: true,
      type: true,
      sizeBytes: true,
      moderationStatus: true,
      createdAt: true,
    },
  })
  
  const analytics = await Promise.all(
    mediaAssets.map(asset => getMediaAnalytics(asset.id))
  )
  
  return {
    totalAssets: mediaAssets.length,
    byType: {
      images: mediaAssets.filter(a => a.type === 'IMAGE').length,
      videos: mediaAssets.filter(a => a.type === 'VIDEO').length,
      threeSixty: mediaAssets.filter(a => a.type === 'THREE_SIXTY_FRAME').length,
    },
    byStatus: {
      pending: mediaAssets.filter(a => a.moderationStatus === 'PENDING').length,
      approved: mediaAssets.filter(a => a.moderationStatus === 'APPROVED').length,
      rejected: mediaAssets.filter(a => a.moderationStatus === 'REJECTED').length,
    },
    totalViews: analytics.reduce((sum, a) => sum + a.totalViews, 0),
    totalUniqueViews: analytics.reduce((sum, a) => sum + a.uniqueViews, 0),
  }
}
```

### B. Alert System

```typescript
// src/lib/media-alerts.ts

import { sendEmail } from './email'

export interface StorageAlert {
  vendorId: string
  vendorEmail: string
  usagePercentage: number
  usedGB: number
  quotaGB: number
}

/**
 * Send storage quota warning email
 */
export async function sendStorageQuotaWarning(alert: StorageAlert): Promise<void> {
  const subject = '⚠️ Alerte: Quota de stockage bientôt atteint'
  
  const html = `
    <h2>Votre quota de stockage est presque atteint</h2>
    <p>Bonjour,</p>
    <p>Votre utilisation du stockage média a atteint <strong>${alert.usagePercentage}%</strong> de votre quota.</p>
    <ul>
      <li>Utilisé: ${alert.usedGB} GB</li>
      <li>Quota: ${alert.quotaGB} GB</li>
      <li>Restant: ${(alert.quotaGB - alert.usedGB).toFixed(2)} GB</li>
    </ul>
    <p>Pour éviter toute interruption de service, nous vous recommandons de:</p>
    <ul>
      <li>Supprimer les médias inutilisés</li>
      <li>Passer à un forfait supérieur</li>
    </ul>
    <a href="https://mientior.com/vendor/upgrade" style="display: inline-block; padding: 12px 24px; background: #FF6B00; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
      Augmenter mon forfait
    </a>
  `
  
  await sendEmail({
    to: alert.vendorEmail,
    subject,
    html,
  })
}

/**
 * Monitor vendor storage usage and send alerts
 */
export async function monitorVendorStorageUsage(): Promise<void> {
  const vendors = await prisma.vendor.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      email: true,
      storageUsedBytes: true,
      storageQuotaBytes: true,
    },
  })
  
  for (const vendor of vendors) {
    const usagePercentage = (Number(vendor.storageUsedBytes) / Number(vendor.storageQuotaBytes)) * 100
    
    // Send warning at 80%, 90%, and 95%
    if (usagePercentage >= 80 && usagePercentage < 90) {
      await sendStorageQuotaWarning({
        vendorId: vendor.id,
        vendorEmail: vendor.email,
        usagePercentage: Math.round(usagePercentage),
        usedGB: Number(vendor.storageUsedBytes) / (1024 * 1024 * 1024),
        quotaGB: Number(vendor.storageQuotaBytes) / (1024 * 1024 * 1024),
      })
    }
  }
}
```

## 16. Testing Strategy

### A. Unit Tests

```typescript
// src/lib/vendor-storage.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { checkVendorStorageQuota, incrementVendorStorage } from './vendor-storage'
import { prisma } from './prisma'

describe('Vendor Storage Management', () => {
  const testVendorId = 'test-vendor-storage'
  
  beforeEach(async () => {
    // Clean up test data
    await prisma.vendor.deleteMany({
      where: { id: testVendorId },
    })
    
    // Create test vendor
    await prisma.vendor.create({
      data: {
        id: testVendorId,
        businessName: 'Test Vendor',
        slug: 'test-vendor-storage',
        email: 'test@vendor.com',
        status: 'ACTIVE',
        storageUsedBytes: 0,
        storageQuotaBytes: 1073741824, // 1GB
      },
    })
  })
  
  it('should allow upload within quota', async () => {
    const fileSizeBytes = 100 * 1024 * 1024 // 100MB
    
    const result = await checkVendorStorageQuota(testVendorId, fileSizeBytes)
    
    expect(result.allowed).toBe(true)
    expect(result.remainingBytes).toBeGreaterThan(fileSizeBytes)
  })
  
  it('should reject upload exceeding quota', async () => {
    const fileSizeBytes = 2 * 1024 * 1024 * 1024 // 2GB (exceeds 1GB quota)
    
    const result = await checkVendorStorageQuota(testVendorId, fileSizeBytes)
    
    expect(result.allowed).toBe(false)
    expect(result.error).toBe('Storage quota exceeded')
  })
  
  it('should increment storage usage correctly', async () => {
    const fileSizeBytes = 100 * 1024 * 1024 // 100MB
    
    await incrementVendorStorage(testVendorId, fileSizeBytes)
    
    const vendor = await prisma.vendor.findUnique({
      where: { id: testVendorId },
    })
    
    expect(Number(vendor?.storageUsedBytes)).toBe(fileSizeBytes)
    expect(vendor?.mediaUploadCount).toBe(1)
  })
})
```

### B. Integration Tests

```typescript
// src/app/api/vendors/[vendorId]/media/upload/route.test.ts

import { describe, it, expect } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/vendors/[vendorId]/media/upload', () => {
  it('should reject upload when quota exceeded', async () => {
    const request = new NextRequest('http://localhost:3000/api/vendors/test-vendor/media/upload', {
      method: 'POST',
      body: JSON.stringify({
        type: 'VIDEO',
        sizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
        format: 'mp4',
      }),
    })
    
    const response = await POST(request, { params: { vendorId: 'test-vendor' } })
    const data = await response.json()
    
    expect(response.status).toBe(413)
    expect(data.error).toBe('Storage quota exceeded')
  })
  
  it('should reject video upload for basic tier', async () => {
    const request = new NextRequest('http://localhost:3000/api/vendors/basic-vendor/media/upload', {
      method: 'POST',
      body: JSON.stringify({
        type: 'VIDEO',
        sizeBytes: 50 * 1024 * 1024, // 50MB
        format: 'mp4',
      }),
    })
    
    const response = await POST(request, { params: { vendorId: 'basic-vendor' } })
    const data = await response.json()
    
    expect(response.status).toBe(403)
    expect(data.upgradeRequired).toBe(true)
  })
})
```

## 17. Summary

This immersive media enhancement transforms Mientior into a premium marketplace with rich product experiences. The architecture ensures:

✅ **Scalability**: Handles 10 to 10,000 vendors with tiered storage quotas
✅ **Cost Control**: Vendor-pays model with clear pricing tiers
✅ **Quality**: Automated and manual content moderation
✅ **Performance**: CDN delivery, adaptive quality, mobile optimization
✅ **Security**: File validation, access control, malware scanning
✅ **Local Market**: Mobile Money payments, French language, bandwidth optimization for Côte d'Ivoire

### Next Steps

1. **Immediate**: Run database migration to add storage tracking
2. **Week 1**: Implement storage quota system and upload API
3. **Week 2**: Build vendor dashboard components
4. **Week 3**: Set up content moderation pipeline
5. **Week 4**: Integrate CDN and optimization services
6. **Week 5**: Launch beta with 10 premium vendors
7. **Week 6**: Monitor, optimize, and scale

### Key Metrics to Track

- Storage usage per vendor
- Upload success/failure rates
- Moderation queue size and processing time
- CDN bandwidth costs
- Vendor tier conversion rates
- Customer engagement with rich media (views, time spent)

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-25  
**Author**: Marketplace Architect Agent  
**Status**: Ready for Implementation

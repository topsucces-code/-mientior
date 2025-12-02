# Design Document - PIM Integration

## Overview

This design document outlines the architecture for a Product Information Management (PIM) system integration for the Mientior e-commerce platform. The PIM system will serve as a centralized hub for managing all product data including descriptions, attributes, media assets, variants, localization, and multi-channel publishing.

The design supports both a custom internal PIM implementation and integration with external PIM platforms like Akeneo. The system follows a flexible, extensible architecture that allows product managers to define custom attribute schemas, manage rich media assets, track data quality through completeness scoring, and publish products to multiple channels with channel-specific configurations.

Key capabilities include:
- Dynamic attribute system with custom product families
- Multi-locale content management for internationalization
- Centralized digital asset management with tagging and collections
- Data quality tracking with completeness scores and validation rules
- Multi-channel publishing with channel-specific attributes
- Bulk operations for efficient catalog management
- Version control and audit trail for all product changes
- Product variant management with inheritance
- Import/export profiles for system integration
- Enrichment workflows with approval stages

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin UI Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Product      │  │ Attribute    │  │ Asset        │         │
│  │ Management   │  │ Management   │  │ Management   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ REST API         │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/pim/products                                       │  │
│  │  /api/pim/attributes                                     │  │
│  │  /api/pim/families                                       │  │
│  │  /api/pim/assets                                         │  │
│  │  /api/pim/channels                                       │  │
│  │  /api/pim/import                                         │  │
│  │  /api/pim/export                                         │  │
│  │  /api/pim/sync (external PIM)                           │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Service Layer   │    │  External PIM    │
│  ┌────────────┐  │    │  Integration     │
│  │ Product    │  │    │  ┌────────────┐  │
│  │ Service    │  │    │  │ Akeneo     │  │
│  │            │  │    │  │ Adapter    │  │
│  │ Attribute  │  │    │  └────────────┘  │
│  │ Service    │  │    └──────────────────┘
│  │            │  │
│  │ Asset      │  │
│  │ Service    │  │
│  │            │  │
│  │ Validation │  │
│  │ Service    │  │
│  │            │  │
│  │ Workflow   │  │
│  │ Service    │  │
│  └────────────┘  │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│  Data Layer      │
│  ┌────────────┐  │
│  │ PostgreSQL │  │
│  │ - Products │  │
│  │ - Attrs    │  │
│  │ - Assets   │  │
│  │ - Versions │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ S3/Storage │  │
│  │ - Images   │  │
│  │ - Videos   │  │
│  │ - Docs     │  │
│  └────────────┘  │
└──────────────────┘
```


### Component Breakdown

1. **Admin UI Components** (Refine.dev + Ant Design)
   - Product editor with dynamic attribute forms
   - Attribute and family management interfaces
   - Asset library with upload and organization
   - Channel configuration and publishing controls
   - Import/export profile management
   - Workflow and approval interfaces
   - Completeness dashboard

2. **API Routes** (Next.js API Routes)
   - RESTful endpoints for all PIM operations
   - File upload handling for assets
   - Bulk operation endpoints
   - External PIM synchronization endpoints

3. **Service Layer** (Business Logic)
   - ProductService: CRUD and enrichment operations
   - AttributeService: Dynamic attribute management
   - AssetService: Media file management
   - ValidationService: Data quality checks
   - WorkflowService: Approval process management
   - SyncService: External PIM integration
   - ExportService: Multi-format data export
   - ImportService: Data import with validation

4. **Data Layer**
   - PostgreSQL for structured data
   - S3-compatible storage for media assets
   - Redis for caching and job queues

## Components and Interfaces

### Database Schema Extensions

The PIM system extends the existing Product model with new tables for flexible attribute management:

```prisma
// Attribute Definition
model PimAttribute {
  id                String              @id @default(cuid())
  code              String              @unique
  label             Json                // Localized labels
  type              AttributeType
  isRequired        Boolean             @default(false)
  isLocalizable     Boolean             @default(false)
  isUnique          Boolean             @default(false)
  validationRules   Json?               // JSON schema for validation
  defaultValue      Json?
  options           Json?               // For select/multiselect types
  groupId           String?
  order             Int                 @default(0)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  group             PimAttributeGroup?  @relation(fields: [groupId], references: [id])
  values            PimAttributeValue[]
  familyAttributes  PimFamilyAttribute[]
  
  @@index([code])
  @@index([groupId])
  @@map("pim_attributes")
}

// Attribute Group
model PimAttributeGroup {
  id                String              @id @default(cuid())
  code              String              @unique
  label             Json                // Localized labels
  order             Int                 @default(0)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  attributes        PimAttribute[]
  familyGroups      PimFamilyGroup[]
  
  @@index([code])
  @@map("pim_attribute_groups")
}

// Product Family
model PimFamily {
  id                String              @id @default(cuid())
  code              String              @unique
  label             Json                // Localized labels
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  groups            PimFamilyGroup[]
  attributes        PimFamilyAttribute[]
  products          Product[]
  
  @@index([code])
  @@map("pim_families")
}

// Family to Group relationship
model PimFamilyGroup {
  familyId          String
  groupId           String
  order             Int                 @default(0)
  
  family            PimFamily           @relation(fields: [familyId], references: [id], onDelete: Cascade)
  group             PimAttributeGroup   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@id([familyId, groupId])
  @@map("pim_family_groups")
}

// Family to Attribute relationship
model PimFamilyAttribute {
  familyId          String
  attributeId       String
  isRequired        Boolean             @default(false)
  
  family            PimFamily           @relation(fields: [familyId], references: [id], onDelete: Cascade)
  attribute         PimAttribute        @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  
  @@id([familyId, attributeId])
  @@map("pim_family_attributes")
}

// Attribute Values (EAV pattern)
model PimAttributeValue {
  id                String              @id @default(cuid())
  productId         String
  attributeId       String
  locale            String?             // null for non-localizable
  channel           String?             // null for non-channel-specific
  value             Json                // Flexible value storage
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  product           Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute         PimAttribute        @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  
  @@unique([productId, attributeId, locale, channel])
  @@index([productId])
  @@index([attributeId])
  @@map("pim_attribute_values")
}


// Asset Management
model PimAsset {
  id                String              @id @default(cuid())
  filename          String
  originalFilename  String
  mimeType          String
  size              Int                 // bytes
  width             Int?                // for images
  height            Int?                // for images
  duration          Int?                // for videos (seconds)
  storageKey        String              @unique
  url               String
  thumbnailUrl      String?
  tags              Json?               // Array of tag strings
  metadata          Json?               // EXIF, etc.
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  collections       PimAssetCollection[]
  productAssets     PimProductAsset[]
  
  @@index([mimeType])
  @@index([createdAt])
  @@map("pim_assets")
}

// Asset Collections
model PimAssetCollection {
  id                String              @id @default(cuid())
  code              String              @unique
  label             Json                // Localized labels
  description       Json?               // Localized descriptions
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  assets            PimAsset[]
  
  @@index([code])
  @@map("pim_asset_collections")
}

// Product to Asset relationship
model PimProductAsset {
  id                String              @id @default(cuid())
  productId         String
  assetId           String
  purpose           AssetPurpose        @default(IMAGE)
  locale            String?
  channel           String?
  order             Int                 @default(0)
  createdAt         DateTime            @default(now())
  
  product           Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  asset             PimAsset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@unique([productId, assetId, purpose, locale, channel])
  @@index([productId])
  @@index([assetId])
  @@map("pim_product_assets")
}

// Channel Configuration
model PimChannel {
  id                String              @id @default(cuid())
  code              String              @unique
  label             Json                // Localized labels
  type              ChannelType
  locales           Json                // Array of locale codes
  currencies        Json                // Array of currency codes
  requiredAttributes Json               // Array of attribute codes
  minCompleteness   Int                 @default(0) // 0-100
  isActive          Boolean             @default(true)
  config            Json?               // Channel-specific config
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([code])
  @@index([isActive])
  @@map("pim_channels")
}

// Product Version History
model PimProductVersion {
  id                String              @id @default(cuid())
  productId         String
  versionNumber     Int
  snapshot          Json                // Complete product data snapshot
  changes           Json?               // Summary of changes
  userId            String?
  createdAt         DateTime            @default(now())
  
  product           Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  user              User?               @relation(fields: [userId], references: [id])
  
  @@unique([productId, versionNumber])
  @@index([productId])
  @@index([createdAt])
  @@map("pim_product_versions")
}

// Import/Export Profiles
model PimImportProfile {
  id                String              @id @default(cuid())
  code              String              @unique
  label             String
  fileType          FileType
  delimiter         String?             // For CSV
  encoding          String              @default("UTF-8")
  fieldMappings     Json                // Source field -> PIM attribute
  transformations   Json?               // Data transformation rules
  validationRules   Json?               // Additional validation
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([code])
  @@map("pim_import_profiles")
}

model PimExportProfile {
  id                String              @id @default(cuid())
  code              String              @unique
  label             String
  fileType          FileType
  delimiter         String?             // For CSV
  encoding          String              @default("UTF-8")
  channelCode       String?
  locale            String?
  attributeCodes    Json                // Array of attributes to export
  transformations   Json?               // Data transformation rules
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([code])
  @@map("pim_export_profiles")
}

// Workflow States
model PimProductWorkflow {
  id                String              @id @default(cuid())
  productId         String              @unique
  status            WorkflowStatus      @default(DRAFT)
  stage             String?
  assignedTo        String?
  submittedAt       DateTime?
  submittedBy       String?
  reviewedAt        DateTime?
  reviewedBy        String?
  rejectionReason   String?
  comments          Json?               // Array of comment objects
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  product           Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  assignedUser      User?               @relation("assigned", fields: [assignedTo], references: [id])
  submitter         User?               @relation("submitted", fields: [submittedBy], references: [id])
  reviewer          User?               @relation("reviewed", fields: [reviewedBy], references: [id])
  
  @@index([productId])
  @@index([status])
  @@index([assignedTo])
  @@map("pim_product_workflows")
}

// External PIM Sync Configuration
model PimExternalSync {
  id                String              @id @default(cuid())
  platform          String              // "akeneo", "saleor", etc.
  apiUrl            String
  apiKey            String              // Encrypted
  syncDirection     SyncDirection
  syncFrequency     String              // Cron expression
  fieldMappings     Json                // External field -> Internal field
  lastSyncAt        DateTime?
  lastSyncStatus    String?
  isActive          Boolean             @default(true)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([platform])
  @@index([isActive])
  @@map("pim_external_syncs")
}

// Enums
enum AttributeType {
  TEXT
  TEXTAREA
  NUMBER
  BOOLEAN
  DATE
  SELECT
  MULTISELECT
  PRICE
  IMAGE
  FILE
  METRIC
}

enum AssetPurpose {
  IMAGE
  THUMBNAIL
  VIDEO
  DOCUMENT
  TECHNICAL_SHEET
  USER_MANUAL
}

enum ChannelType {
  ECOMMERCE
  MOBILE
  MARKETPLACE
  PRINT
  SOCIAL
}

enum FileType {
  CSV
  XLSX
  JSON
  XML
}

enum WorkflowStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  REJECTED
  PUBLISHED
}

enum SyncDirection {
  IMPORT
  EXPORT
  BIDIRECTIONAL
}

// Update existing Product model
model Product {
  // ... existing fields ...
  familyId          String?
  
  family            PimFamily?          @relation(fields: [familyId], references: [id])
  attributeValues   PimAttributeValue[]
  productAssets     PimProductAsset[]
  versions          PimProductVersion[]
  workflow          PimProductWorkflow?
  
  @@index([familyId])
}
```


### API Endpoints

#### Product Management

**GET /api/pim/products**
List products with filtering, sorting, and pagination.

Query Parameters:
- `family`: Filter by family code
- `completeness`: Filter by completeness score
- `channel`: Filter by channel
- `locale`: Filter by locale
- `search`: Full-text search
- `page`, `limit`: Pagination

**GET /api/pim/products/[id]**
Get a single product with all attribute values, assets, and metadata.

Query Parameters:
- `locale`: Specific locale
- `channel`: Specific channel
- `includeVersions`: Include version history

**POST /api/pim/products**
Create a new product.

Request Body:
```typescript
{
  name: string
  slug: string
  familyId: string
  categoryId: string
  attributes: Record<string, any>
  assets?: Array<{ assetId: string, purpose: string, order: number }>
}
```

**PATCH /api/pim/products/[id]**
Update product attributes.

Request Body:
```typescript
{
  attributes: Record<string, any>
  locale?: string
  channel?: string
}
```

**DELETE /api/pim/products/[id]**
Delete a product (soft delete).

#### Attribute Management

**GET /api/pim/attributes**
List all attributes with optional filtering.

**POST /api/pim/attributes**
Create a new attribute definition.

Request Body:
```typescript
{
  code: string
  label: Record<string, string> // locale -> label
  type: AttributeType
  isRequired: boolean
  isLocalizable: boolean
  validationRules?: object
  groupId?: string
}
```

**PATCH /api/pim/attributes/[id]**
Update attribute definition.

**DELETE /api/pim/attributes/[id]**
Delete attribute (only if not used).

#### Family Management

**GET /api/pim/families**
List all product families.

**POST /api/pim/families**
Create a new product family.

Request Body:
```typescript
{
  code: string
  label: Record<string, string>
  attributeGroupIds: string[]
  requiredAttributes: string[]
}
```

**PATCH /api/pim/families/[id]**
Update family configuration.

#### Asset Management

**GET /api/pim/assets**
List assets with filtering and search.

Query Parameters:
- `type`: Filter by MIME type
- `tags`: Filter by tags
- `collection`: Filter by collection
- `search`: Search filename and tags

**POST /api/pim/assets**
Upload a new asset.

Request: multipart/form-data with file and metadata

**PATCH /api/pim/assets/[id]**
Update asset metadata (tags, collections).

**DELETE /api/pim/assets/[id]**
Delete asset (only if not used by products).

**POST /api/pim/assets/collections**
Create an asset collection.

#### Channel Management

**GET /api/pim/channels**
List all channels.

**POST /api/pim/channels**
Create a new channel.

Request Body:
```typescript
{
  code: string
  label: Record<string, string>
  type: ChannelType
  locales: string[]
  currencies: string[]
  requiredAttributes: string[]
  minCompleteness: number
}
```

#### Completeness & Validation

**GET /api/pim/products/[id]/completeness**
Get completeness score for a product.

Query Parameters:
- `channel`: Calculate for specific channel
- `locale`: Calculate for specific locale

Response:
```typescript
{
  overall: number // 0-100
  byChannel: Record<string, number>
  byLocale: Record<string, number>
  missingRequired: string[]
  missingOptional: string[]
}
```

**POST /api/pim/products/[id]/validate**
Validate product data against rules.

Response:
```typescript
{
  valid: boolean
  errors: Array<{
    attributeCode: string
    message: string
    severity: 'error' | 'warning'
  }>
}
```

#### Bulk Operations

**POST /api/pim/products/bulk**
Perform bulk operations on multiple products.

Request Body:
```typescript
{
  operation: 'update' | 'delete' | 'publish' | 'unpublish'
  productIds: string[]
  data?: Record<string, any> // For update operations
  channel?: string // For publish operations
}
```

Response:
```typescript
{
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    productId: string
    error: string
  }>
}
```

#### Import/Export

**POST /api/pim/import**
Import products from file.

Request: multipart/form-data with file and profile ID

Response:
```typescript
{
  jobId: string
  status: 'queued' | 'processing'
}
```

**GET /api/pim/import/[jobId]**
Get import job status.

Response:
```typescript
{
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  processed: number
  created: number
  updated: number
  errors: Array<{
    row: number
    message: string
  }>
}
```

**POST /api/pim/export**
Export products to file.

Request Body:
```typescript
{
  profileId: string
  filters?: object
  productIds?: string[]
}
```

Response: File download or job ID for async processing

#### Workflow

**POST /api/pim/products/[id]/workflow/submit**
Submit product for review.

**POST /api/pim/products/[id]/workflow/approve**
Approve product.

**POST /api/pim/products/[id]/workflow/reject**
Reject product with reason.

Request Body:
```typescript
{
  reason: string
  comments?: string
}
```

#### External PIM Sync

**POST /api/pim/sync/trigger**
Manually trigger synchronization with external PIM.

**GET /api/pim/sync/status**
Get synchronization status.


### Service Layer

#### ProductService

```typescript
class ProductService {
  /**
   * Creates a new product with attribute values
   */
  async createProduct(data: CreateProductDto): Promise<Product>
  
  /**
   * Updates product attribute values
   */
  async updateProductAttributes(
    productId: string,
    attributes: Record<string, any>,
    locale?: string,
    channel?: string
  ): Promise<Product>
  
  /**
   * Gets product with all enriched data
   */
  async getEnrichedProduct(
    productId: string,
    locale?: string,
    channel?: string
  ): Promise<EnrichedProduct>
  
  /**
   * Calculates product completeness score
   */
  async calculateCompleteness(
    productId: string,
    channel?: string,
    locale?: string
  ): Promise<CompletenessScore>
  
  /**
   * Creates a new product version snapshot
   */
  async createVersion(
    productId: string,
    userId: string,
    changes?: object
  ): Promise<PimProductVersion>
  
  /**
   * Restores product to a previous version
   */
  async restoreVersion(
    productId: string,
    versionNumber: number,
    userId: string
  ): Promise<Product>
}
```

#### AttributeService

```typescript
class AttributeService {
  /**
   * Creates a new attribute definition
   */
  async createAttribute(data: CreateAttributeDto): Promise<PimAttribute>
  
  /**
   * Validates attribute value against rules
   */
  async validateAttributeValue(
    attributeId: string,
    value: any,
    locale?: string
  ): Promise<ValidationResult>
  
  /**
   * Gets all attributes for a product family
   */
  async getFamilyAttributes(familyId: string): Promise<PimAttribute[]>
  
  /**
   * Updates attribute definition
   */
  async updateAttribute(
    attributeId: string,
    data: UpdateAttributeDto
  ): Promise<PimAttribute>
}
```

#### AssetService

```typescript
class AssetService {
  /**
   * Uploads and processes an asset file
   */
  async uploadAsset(
    file: File,
    metadata: AssetMetadata
  ): Promise<PimAsset>
  
  /**
   * Associates asset with product
   */
  async linkAssetToProduct(
    productId: string,
    assetId: string,
    purpose: AssetPurpose,
    locale?: string,
    channel?: string,
    order?: number
  ): Promise<PimProductAsset>
  
  /**
   * Generates thumbnails for images
   */
  async generateThumbnails(assetId: string): Promise<string[]>
  
  /**
   * Searches assets by tags and metadata
   */
  async searchAssets(query: AssetSearchQuery): Promise<PimAsset[]>
  
  /**
   * Deletes asset if not in use
   */
  async deleteAsset(assetId: string): Promise<void>
}
```

#### ValidationService

```typescript
class ValidationService {
  /**
   * Validates product against all rules
   */
  async validateProduct(
    productId: string,
    channel?: string
  ): Promise<ValidationResult>
  
  /**
   * Validates attribute value against type and rules
   */
  async validateAttributeValue(
    attribute: PimAttribute,
    value: any
  ): Promise<ValidationError[]>
  
  /**
   * Checks if product meets channel requirements
   */
  async validateForChannel(
    productId: string,
    channelCode: string
  ): Promise<ChannelValidationResult>
  
  /**
   * Validates import data before processing
   */
  async validateImportData(
    data: any[],
    profileId: string
  ): Promise<ImportValidationResult>
}
```

#### WorkflowService

```typescript
class WorkflowService {
  /**
   * Submits product for review
   */
  async submitForReview(
    productId: string,
    userId: string
  ): Promise<PimProductWorkflow>
  
  /**
   * Approves product and advances workflow
   */
  async approveProduct(
    productId: string,
    reviewerId: string,
    comments?: string
  ): Promise<PimProductWorkflow>
  
  /**
   * Rejects product with reason
   */
  async rejectProduct(
    productId: string,
    reviewerId: string,
    reason: string,
    comments?: string
  ): Promise<PimProductWorkflow>
  
  /**
   * Gets products pending review
   */
  async getPendingReviews(
    assignedTo?: string
  ): Promise<PimProductWorkflow[]>
}
```

#### SyncService (External PIM Integration)

```typescript
class SyncService {
  /**
   * Synchronizes with external PIM platform
   */
  async syncWithExternal(syncConfigId: string): Promise<SyncResult>
  
  /**
   * Fetches products from external PIM
   */
  async fetchFromExternal(
    syncConfigId: string,
    since?: Date
  ): Promise<ExternalProduct[]>
  
  /**
   * Pushes products to external PIM
   */
  async pushToExternal(
    syncConfigId: string,
    productIds: string[]
  ): Promise<SyncResult>
  
  /**
   * Maps external data to internal structure
   */
  async mapExternalData(
    externalData: any,
    mappings: FieldMappings
  ): Promise<InternalProduct>
  
  /**
   * Resolves sync conflicts
   */
  async resolveConflicts(
    conflicts: SyncConflict[]
  ): Promise<ConflictResolution[]>
}
```

#### ImportService

```typescript
class ImportService {
  /**
   * Imports products from file
   */
  async importProducts(
    file: File,
    profileId: string
  ): Promise<ImportJob>
  
  /**
   * Processes import job asynchronously
   */
  async processImportJob(jobId: string): Promise<void>
  
  /**
   * Validates import file structure
   */
  async validateImportFile(
    file: File,
    profileId: string
  ): Promise<ValidationResult>
  
  /**
   * Maps import data to product structure
   */
  async mapImportData(
    row: any,
    mappings: FieldMappings
  ): Promise<ProductData>
}
```

#### ExportService

```typescript
class ExportService {
  /**
   * Exports products to file
   */
  async exportProducts(
    profileId: string,
    filters?: ProductFilters
  ): Promise<ExportJob>
  
  /**
   * Generates export file
   */
  async generateExportFile(
    products: Product[],
    profile: PimExportProfile
  ): Promise<Buffer>
  
  /**
   * Transforms product data for export
   */
  async transformForExport(
    product: Product,
    profile: PimExportProfile
  ): Promise<any>
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface EnrichedProduct {
  id: string
  name: string
  slug: string
  family: PimFamily
  category: Category
  attributes: Record<string, AttributeValue>
  assets: ProductAsset[]
  variants: ProductVariant[]
  completeness: CompletenessScore
  workflow?: PimProductWorkflow
  versions: PimProductVersion[]
  createdAt: Date
  updatedAt: Date
}

interface AttributeValue {
  attributeCode: string
  attributeLabel: string
  attributeType: AttributeType
  value: any
  locale?: string
  channel?: string
  isRequired: boolean
  isValid: boolean
  validationErrors?: string[]
}

interface ProductAsset {
  id: string
  asset: PimAsset
  purpose: AssetPurpose
  locale?: string
  channel?: string
  order: number
}

interface CompletenessScore {
  overall: number // 0-100
  byChannel: Record<string, number>
  byLocale: Record<string, number>
  missingRequired: string[]
  missingOptional: string[]
  details: {
    totalAttributes: number
    filledAttributes: number
    requiredAttributes: number
    filledRequiredAttributes: number
  }
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  attributeCode: string
  message: string
  value?: any
  rule?: string
}

interface ChannelValidationResult {
  valid: boolean
  channelCode: string
  completeness: number
  minCompleteness: number
  missingAttributes: string[]
  errors: ValidationError[]
}

interface ImportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  profileId: string
  filename: string
  progress: number
  totalRows: number
  processedRows: number
  createdProducts: number
  updatedProducts: number
  errors: ImportError[]
  startedAt?: Date
  completedAt?: Date
}

interface ImportError {
  row: number
  field?: string
  message: string
  data?: any
}

interface ExportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  profileId: string
  filename: string
  productCount: number
  fileSize?: number
  downloadUrl?: string
  expiresAt?: Date
  createdAt: Date
}

interface SyncResult {
  success: boolean
  syncedProducts: number
  createdProducts: number
  updatedProducts: number
  failedProducts: number
  conflicts: SyncConflict[]
  errors: SyncError[]
  startedAt: Date
  completedAt: Date
}

interface SyncConflict {
  productId: string
  field: string
  localValue: any
  externalValue: any
  resolution?: 'local' | 'external' | 'manual'
}

interface FieldMappings {
  [externalField: string]: {
    internalField: string
    transformation?: string
    defaultValue?: any
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified opportunities to consolidate redundant properties:

**Consolidations:**
- Properties 1.1, 1.2, 1.3 (attribute, group, and family creation) all test CRUD operations and can be combined into a single metadata persistence property
- Properties 2.1, 2.2 (locale selection and saving) both test locale isolation and can be combined
- Properties 3.1, 3.2, 3.3 (asset upload, collection, and product association) all test asset management operations and can be combined
- Properties 4.1, 4.3, 4.5, 5.4 (completeness calculation in various contexts) can be combined into a single comprehensive completeness property
- Properties 6.1, 6.4 (import and export profile creation) both test profile storage and can be combined
- Properties 7.2, 7.4, 7.5 (bulk operation execution, reporting, and error handling) can be combined into a single bulk operation property
- Properties 8.1, 8.5 (version creation and completeness) can be combined
- Properties 10.2, 10.3, 10.4 (various sync operations) can be combined into a comprehensive sync property
- Properties 11.1, 11.3 (relationship creation and retrieval) can be combined
- Properties 12.1, 12.2, 12.3 (workflow transitions) can be combined into a single workflow state machine property

This consolidation reduces redundancy while maintaining comprehensive coverage of all requirements.

### Correctness Properties

Property 1: Attribute metadata persistence
*For any* attribute, group, or family creation operation, the system should store all provided metadata (name, type, validation rules, localization settings, relationships) and retrieve it identically
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Family attribute inheritance
*For any* product assigned to a family, the product should display all attributes from all attribute groups in that family
**Validates: Requirements 1.4**

Property 3: Required attribute enforcement
*For any* product with required attributes, the system should prevent publication if any required attribute lacks a value
**Validates: Requirements 1.5**

Property 4: Locale isolation
*For any* product with content in multiple locales, saving content in one locale should not modify content in any other locale
**Validates: Requirements 2.1, 2.2**

Property 5: Per-locale completeness
*For any* product with multiple locales, the system should calculate separate completeness scores for each locale based on that locale's filled attributes
**Validates: Requirements 2.3**

Property 6: Locale content duplication
*For any* locale copy operation, the copied content should be identical to the source but independently editable
**Validates: Requirements 2.4**

Property 7: Locale availability propagation
*For any* new locale added to the system, all existing products should immediately support that locale for content entry
**Validates: Requirements 2.5**

Property 8: Asset metadata preservation
*For any* asset upload, the system should preserve all metadata (filename, type, size, dimensions, tags) and make it retrievable
**Validates: Requirements 3.1, 3.2, 3.3**

Property 9: Asset update propagation
*For any* asset that is updated, all products using that asset should reflect the updated asset data
**Validates: Requirements 3.4**

Property 10: Asset search correctness
*For any* asset search query, the results should include all assets matching the query criteria (filename, tags, type, associated products) and exclude all non-matching assets
**Validates: Requirements 3.5**

Property 11: Completeness calculation accuracy
*For any* product, the completeness score should equal (filled required attributes / total required attributes) × 100, calculated separately per channel and locale when specified
**Validates: Requirements 4.1, 4.3, 4.5, 5.4**

Property 12: Validation rule enforcement
*For any* attribute with validation rules, the system should reject values that violate the rules and accept values that satisfy them
**Validates: Requirements 4.2**

Property 13: Publication validation gate
*For any* product submission for publication, if validation errors exist or completeness is below the channel threshold, the system should prevent publication
**Validates: Requirements 4.4**

Property 14: Channel configuration persistence
*For any* channel creation, the system should store all configuration (name, type, required attributes, completeness threshold) and retrieve it identically
**Validates: Requirements 5.1**

Property 15: Channel-specific attribute overrides
*For any* product enabled for a channel, channel-specific attribute values should override default values only for that channel
**Validates: Requirements 5.2**

Property 16: Channel export filtering
*For any* product export to a channel, the output should contain only attributes configured for that channel
**Validates: Requirements 5.3**

Property 17: Channel unpublish isolation
*For any* product unpublished from a channel, the product should be removed from only that channel while remaining published to other channels
**Validates: Requirements 5.5**

Property 18: Import/export profile persistence
*For any* import or export profile creation, the system should store all mappings, transformations, and format specifications and retrieve them identically
**Validates: Requirements 6.1, 6.4**

Property 19: Import processing with validation
*For any* import operation, the system should validate each row, create or update products for valid rows, and log errors for invalid rows without stopping processing
**Validates: Requirements 6.2, 6.3**

Property 20: Export format compliance
*For any* export operation, the generated file should conform to the profile's format specification and contain only the specified attributes with applied transformations
**Validates: Requirements 6.5**

Property 21: Bulk operation atomicity per product
*For any* bulk operation on multiple products, each product operation should succeed or fail independently, with all results reported in the summary
**Validates: Requirements 7.2, 7.4, 7.5**

Property 22: Bulk operation cancellation
*For any* bulk operation in progress, when cancelled, the system should stop processing new products while completing the current product operation
**Validates: Requirements 7.3**

Property 23: Version snapshot completeness
*For any* product modification, the system should create a version containing the complete previous state (all attributes, assets, relationships) with timestamp and user ID
**Validates: Requirements 8.1, 8.5**

Property 24: Version history ordering
*For any* product, version history should be ordered chronologically by creation timestamp
**Validates: Requirements 8.2**

Property 25: Version comparison accuracy
*For any* two product versions, the comparison should identify all fields that differ between the versions
**Validates: Requirements 8.3**

Property 26: Version restoration round-trip
*For any* product version restoration, the product data should match the restored version's snapshot, and a new version should be created recording the restoration
**Validates: Requirements 8.4**

Property 27: Variant attribute inheritance
*For any* variant created from a parent product, the variant should inherit all shared attributes from the parent unless explicitly overridden
**Validates: Requirements 9.1, 9.2**

Property 28: Parent attribute propagation with overrides
*For any* shared attribute update on a parent product, the change should propagate to all variants that have not overridden that attribute
**Validates: Requirements 9.3**

Property 29: Variant matrix completeness
*For any* product with variants, the variant matrix should display all possible combinations of variation axes with their specific attribute values
**Validates: Requirements 9.4**

Property 30: Variant deletion isolation
*For any* variant deletion, only that specific variant should be removed while the parent and all other variants remain unchanged
**Validates: Requirements 9.5**

Property 31: External PIM configuration storage
*For any* external PIM connection configuration, the system should store all credentials, endpoints, and sync settings securely and retrieve them identically
**Validates: Requirements 10.1**

Property 32: Bidirectional sync consistency
*For any* synchronization operation, products modified in either system should be updated in the other system according to field mappings, with conflicts logged
**Validates: Requirements 10.2, 10.3, 10.4**

Property 33: Sync error isolation
*For any* synchronization error on a specific product, the system should log the error and continue processing remaining products
**Validates: Requirements 10.5**

Property 34: Product relationship persistence
*For any* product relationship creation, the system should store the relationship type and linked products, making both incoming and outgoing relationships retrievable
**Validates: Requirements 11.1, 11.3**

Property 35: Relationship cascade deletion
*For any* product deletion, all relationships where that product is either source or target should be automatically removed
**Validates: Requirements 11.2**

Property 36: Relationship type validation
*For any* relationship creation, the system should validate that the relationship type is appropriate for the product categories involved
**Validates: Requirements 11.4**

Property 37: Channel relationship export
*For any* product export to a channel, relationship data should be included if and only if the channel is configured to include relationships
**Validates: Requirements 11.5**

Property 38: Workflow state transitions
*For any* workflow action (submit, approve, reject), the system should transition the product to the correct next state and record the action with timestamp, user, and comments
**Validates: Requirements 12.1, 12.2, 12.3, 12.5**

Property 39: Workflow rejection prevents publication
*For any* product in rejected workflow state, the system should prevent publication until the product is resubmitted and approved
**Validates: Requirements 12.3**

Property 40: Role-based workflow actions
*For any* product in a workflow state, the available actions should match the user's role permissions
**Validates: Requirements 12.4**


## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Invalid attribute type
   - Validation rule violation
   - Required field missing
   - Invalid locale or channel code
   - Duplicate attribute code
   - Invalid file format

2. **Not Found Errors** (404 Not Found)
   - Product not found
   - Attribute not found
   - Family not found
   - Asset not found
   - Channel not found
   - Version not found

3. **Conflict Errors** (409 Conflict)
   - Attribute code already exists
   - Family code already exists
   - Cannot delete attribute in use
   - Cannot delete asset in use
   - Sync conflict detected

4. **Authorization Errors** (403 Forbidden)
   - Insufficient permissions for operation
   - Workflow action not allowed in current state
   - Cannot modify published product

5. **Business Logic Errors** (422 Unprocessable Entity)
   - Completeness below threshold
   - Product has validation errors
   - Cannot publish product in draft state
   - Circular relationship detected
   - Invalid variant configuration

6. **External Integration Errors** (502 Bad Gateway)
   - External PIM unreachable
   - External PIM authentication failed
   - External PIM API error

7. **Server Errors** (500 Internal Server Error)
   - Database connection failed
   - File storage error
   - Unexpected error during processing

### Error Response Format

```typescript
interface PimError {
  error: string
  message: string
  code: string
  details?: Record<string, any>
  field?: string
  validationErrors?: Array<{
    field: string
    message: string
    rule?: string
  }>
}
```

### Error Handling Strategies

1. **Validation Errors**
   - Validate early and return specific error messages
   - Include field name and validation rule in error
   - Provide suggestions for correction

2. **Import/Export Errors**
   - Continue processing on row-level errors
   - Collect all errors for batch reporting
   - Provide row numbers and field names
   - Generate error report file

3. **Sync Errors**
   - Log detailed error information
   - Continue with remaining products
   - Notify administrators of failures
   - Provide retry mechanism

4. **Asset Upload Errors**
   - Validate file type and size before upload
   - Clean up partial uploads on failure
   - Provide clear error messages for unsupported formats

5. **Workflow Errors**
   - Validate state transitions before execution
   - Prevent invalid state changes
   - Provide clear feedback on why action is not allowed

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Coverage Areas**:
1. Attribute validation logic
2. Completeness calculation
3. Version comparison algorithms
4. Field mapping transformations
5. Workflow state machine
6. Locale isolation
7. Channel filtering

**Example Unit Tests**:
- Test completeness calculation with various attribute combinations
- Test validation rules for different attribute types
- Test field mapping with transformations
- Test workflow state transitions
- Test variant attribute inheritance logic

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: pim-integration, Property {number}: {property_text}`

**Coverage Areas**:
1. Attribute CRUD operations with random data
2. Product enrichment with random attributes
3. Completeness calculation with random product states
4. Import/export with random data sets
5. Version creation and restoration
6. Variant inheritance with random configurations
7. Bulk operations with random product sets
8. Locale isolation with random content
9. Channel filtering with random configurations
10. Workflow transitions with random sequences

**Example Property Tests**:
```typescript
// Feature: pim-integration, Property 4: Locale isolation
test('saving content in one locale does not affect other locales', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        productId: fc.string(),
        locale1: fc.constantFrom('en-US', 'fr-FR', 'de-DE'),
        locale2: fc.constantFrom('en-US', 'fr-FR', 'de-DE'),
        content1: fc.string(),
        content2: fc.string()
      }).filter(d => d.locale1 !== d.locale2),
      async (data) => {
        // Set content for locale1
        await setProductContent(data.productId, data.locale1, data.content1)
        
        // Set content for locale2
        await setProductContent(data.productId, data.locale2, data.content2)
        
        // Verify locale1 content unchanged
        const locale1Content = await getProductContent(data.productId, data.locale1)
        expect(locale1Content).toBe(data.content1)
        
        // Verify locale2 content set correctly
        const locale2Content = await getProductContent(data.productId, data.locale2)
        expect(locale2Content).toBe(data.content2)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: pim-integration, Property 11: Completeness calculation accuracy
test('completeness score equals filled required / total required * 100', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        requiredAttributes: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        filledAttributes: fc.array(fc.string())
      }),
      async (data) => {
        const product = await createProductWithAttributes(
          data.requiredAttributes,
          data.filledAttributes
        )
        
        const completeness = await calculateCompleteness(product.id)
        
        const filledRequired = data.filledAttributes.filter(
          attr => data.requiredAttributes.includes(attr)
        ).length
        
        const expected = (filledRequired / data.requiredAttributes.length) * 100
        
        expect(completeness.overall).toBe(expected)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: pim-integration, Property 26: Version restoration round-trip
test('restoring a version returns product to that state', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        productId: fc.string(),
        initialData: fc.object(),
        modifiedData: fc.object()
      }),
      async (data) => {
        // Create product with initial data
        await updateProduct(data.productId, data.initialData)
        const version1 = await getLatestVersion(data.productId)
        
        // Modify product
        await updateProduct(data.productId, data.modifiedData)
        
        // Restore to version 1
        await restoreVersion(data.productId, version1.versionNumber)
        
        // Verify product matches initial data
        const restoredProduct = await getProduct(data.productId)
        expect(restoredProduct.data).toEqual(data.initialData)
        
        // Verify new version was created
        const latestVersion = await getLatestVersion(data.productId)
        expect(latestVersion.versionNumber).toBeGreaterThan(version1.versionNumber)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

**Framework**: Playwright for UI, Supertest for API

**Coverage Areas**:
1. Complete product enrichment workflow
2. Multi-locale content management
3. Asset upload and association
4. Import/export full cycle
5. Bulk operations on large product sets
6. Workflow approval process
7. External PIM synchronization
8. Channel publishing workflow

**Example Integration Tests**:
- Create product family, add attributes, create product, enrich, publish
- Upload assets, create collection, associate with products
- Import CSV file, validate results, export to different format
- Submit product for review, approve, publish to channel
- Sync with external PIM, verify data consistency

### Performance Testing

**Areas to Test**:
1. **Completeness Calculation**
   - Measure time for products with 10, 50, 100, 500 attributes
   - Target: < 100ms for 100 attributes

2. **Bulk Operations**
   - Test with 10, 100, 1000, 10000 products
   - Target: Process 100 products/second

3. **Import Performance**
   - Test with files of 100, 1000, 10000, 100000 rows
   - Target: Process 1000 rows/second

4. **Asset Upload**
   - Test with various file sizes (1MB, 10MB, 100MB)
   - Target: Upload and process 10MB image in < 5 seconds

5. **Version History**
   - Test retrieval with 10, 100, 1000 versions
   - Target: Retrieve version list in < 500ms

6. **Search Performance**
   - Test asset search with 1000, 10000, 100000 assets
   - Target: Return results in < 1 second

### Test Coverage Goals

- Unit test coverage: > 80% of service layer code
- Property test coverage: All 40 correctness properties
- Integration test coverage: All critical user workflows
- Performance test coverage: All timing-critical operations


## Implementation Notes

### Technology Choices

1. **Property-Based Testing Library:**
   - **fast-check** for TypeScript/JavaScript
   - Provides excellent shrinking capabilities
   - Integrates well with Vitest

2. **File Storage:**
   - S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces)
   - CloudFront or CDN for asset delivery
   - Image optimization with Sharp

3. **Background Jobs:**
   - Bull queue with Redis for async operations
   - Separate queues for imports, exports, and sync
   - Job retry with exponential backoff

4. **Caching Strategy:**
   - Redis for attribute definitions and family structures
   - Cache completeness scores with TTL
   - Invalidate cache on product updates

5. **Search:**
   - PostgreSQL full-text search for basic needs
   - Consider Elasticsearch for advanced search at scale

### Database Optimization

1. **Indexes:**
   - Index on PimAttributeValue(productId, attributeId, locale, channel)
   - Index on PimProductAsset(productId, purpose, locale, channel)
   - Index on PimProductVersion(productId, versionNumber)
   - Index on PimAsset(tags) using GIN for JSON
   - Index on Product(familyId)

2. **Query Optimization:**
   - Use CTEs for complex completeness calculations
   - Batch attribute value inserts
   - Use JSONB for flexible attribute storage
   - Implement pagination for large result sets

3. **Partitioning:**
   - Consider partitioning PimProductVersion by date
   - Partition PimAttributeValue by productId for very large catalogs

### Security Considerations

1. **Asset Security:**
   - Validate file types using magic numbers, not extensions
   - Scan uploaded files for malware
   - Generate signed URLs for private assets
   - Implement file size limits

2. **API Security:**
   - Require authentication for all PIM endpoints
   - Implement role-based access control
   - Rate limit bulk operations
   - Validate all input data

3. **External PIM Integration:**
   - Encrypt API credentials at rest
   - Use HTTPS for all external communications
   - Validate webhook signatures
   - Implement IP whitelisting for webhooks

4. **Data Privacy:**
   - Audit log all product modifications
   - Implement data retention policies
   - Support GDPR data export/deletion
   - Encrypt sensitive attribute values

### Monitoring and Observability

1. **Metrics to Track:**
   - Product enrichment rate
   - Average completeness score
   - Import/export job success rate
   - Asset upload volume and size
   - Sync success rate
   - Workflow approval time
   - API response times

2. **Alerts:**
   - Import job failures
   - Export job failures
   - External PIM sync failures
   - Low disk space for asset storage
   - High error rate on attribute validation
   - Workflow bottlenecks (products stuck in review)

3. **Logging:**
   - Log all product modifications with user ID
   - Log all workflow state changes
   - Log all import/export operations
   - Log all sync operations with external PIM
   - Log all validation failures

### Scalability Considerations

1. **Horizontal Scaling:**
   - Stateless API servers
   - Separate worker processes for background jobs
   - Load balancer for API traffic
   - CDN for asset delivery

2. **Database Scaling:**
   - Read replicas for reporting queries
   - Connection pooling
   - Query result caching
   - Consider sharding by product family for very large catalogs

3. **Asset Storage Scaling:**
   - Use object storage (S3) for unlimited capacity
   - Implement lazy loading for asset lists
   - Generate thumbnails asynchronously
   - Use progressive image loading

### Migration Strategy

1. **Phase 1: Core PIM Foundation (Weeks 1-4)**
   - Implement attribute system
   - Implement family system
   - Implement basic product enrichment
   - Migrate existing products to new structure

2. **Phase 2: Asset Management (Weeks 5-6)**
   - Implement asset upload and storage
   - Implement asset collections
   - Migrate existing product images to asset system
   - Implement asset search

3. **Phase 3: Multi-Locale & Channels (Weeks 7-8)**
   - Implement locale support
   - Implement channel system
   - Implement completeness calculation
   - Add validation rules

4. **Phase 4: Import/Export (Weeks 9-10)**
   - Implement import profiles
   - Implement export profiles
   - Implement background job processing
   - Add bulk operations

5. **Phase 5: Versioning & Workflow (Weeks 11-12)**
   - Implement version control
   - Implement workflow system
   - Add approval process
   - Implement audit logging

6. **Phase 6: External Integration (Weeks 13-14)**
   - Implement Akeneo adapter
   - Implement sync engine
   - Add conflict resolution
   - Test end-to-end sync

7. **Phase 7: Optimization & Polish (Weeks 15-16)**
   - Performance optimization
   - UI/UX improvements
   - Documentation
   - Training materials

### External PIM Integration Details

#### Akeneo Integration

Akeneo is a leading open-source PIM platform. Integration approach:

1. **Authentication:**
   - OAuth 2.0 client credentials flow
   - Store access token with refresh capability

2. **API Endpoints:**
   - GET /api/rest/v1/products - Fetch products
   - PATCH /api/rest/v1/products/{code} - Update product
   - GET /api/rest/v1/attributes - Fetch attributes
   - GET /api/rest/v1/families - Fetch families

3. **Field Mappings:**
   ```typescript
   {
     // Akeneo -> Mientior
     "identifier": "slug",
     "family": "familyId",
     "categories": "categoryId",
     "values": "attributeValues",
     "enabled": "status"
   }
   ```

4. **Sync Strategy:**
   - Poll for changes using updated_at timestamp
   - Use webhooks for real-time updates (if available)
   - Batch updates for efficiency
   - Handle pagination for large catalogs

5. **Conflict Resolution:**
   - Last-write-wins by default
   - Manual resolution for critical fields
   - Configurable per field

#### Alternative PIM Platforms

The sync architecture should support:
- **Saleor**: GraphQL API integration
- **Commercetools**: REST API integration
- **Custom PIM**: Generic REST/GraphQL adapter

### Admin UI Components

The admin interface will use Refine.dev with Ant Design:

1. **Product Editor:**
   - Dynamic form based on product family
   - Tabbed interface for attribute groups
   - Locale selector for localized fields
   - Channel selector for channel-specific values
   - Asset picker with drag-and-drop
   - Completeness indicator
   - Version history sidebar

2. **Attribute Manager:**
   - List view with filtering
   - Inline editing for simple changes
   - Modal for complex attribute configuration
   - Drag-and-drop for ordering
   - Validation rule builder

3. **Family Manager:**
   - Tree view of attribute groups
   - Drag-and-drop to assign groups
   - Required attribute selector
   - Preview of family structure

4. **Asset Library:**
   - Grid view with thumbnails
   - Upload with drag-and-drop
   - Bulk tagging
   - Collection management
   - Search and filter
   - Usage tracking (which products use this asset)

5. **Import/Export Manager:**
   - Profile list with templates
   - Field mapping interface
   - Job queue with status
   - Error report viewer
   - Download results

6. **Workflow Dashboard:**
   - Products pending review
   - Approval queue
   - Workflow history
   - Performance metrics

## Appendix

### Sample Attribute Definitions

```typescript
// Text Attribute
{
  code: "product_description",
  label: { "en-US": "Description", "fr-FR": "Description" },
  type: "TEXTAREA",
  isRequired: true,
  isLocalizable: true,
  validationRules: {
    minLength: 50,
    maxLength: 5000
  }
}

// Select Attribute
{
  code: "material",
  label: { "en-US": "Material", "fr-FR": "Matériau" },
  type: "SELECT",
  isRequired: true,
  isLocalizable: false,
  options: [
    { value: "cotton", label: { "en-US": "Cotton", "fr-FR": "Coton" } },
    { value: "polyester", label: { "en-US": "Polyester", "fr-FR": "Polyester" } },
    { value: "wool", label: { "en-US": "Wool", "fr-FR": "Laine" } }
  ]
}

// Metric Attribute
{
  code: "weight",
  label: { "en-US": "Weight", "fr-FR": "Poids" },
  type: "METRIC",
  isRequired: true,
  isLocalizable: false,
  validationRules: {
    min: 0,
    unit: "kg"
  }
}

// Price Attribute
{
  code: "msrp",
  label: { "en-US": "MSRP", "fr-FR": "Prix conseillé" },
  type: "PRICE",
  isRequired: false,
  isLocalizable: false,
  validationRules: {
    min: 0,
    currency: "EUR"
  }
}
```

### Sample Import Profile

```typescript
{
  code: "csv_product_import",
  label: "CSV Product Import",
  fileType: "CSV",
  delimiter: ",",
  encoding: "UTF-8",
  fieldMappings: {
    "SKU": {
      internalField: "slug",
      transformation: "lowercase"
    },
    "Product Name": {
      internalField: "name",
      transformation: "trim"
    },
    "Description": {
      internalField: "attributes.product_description",
      transformation: "trim"
    },
    "Price": {
      internalField: "price",
      transformation: "parseFloat"
    },
    "Category": {
      internalField: "categoryId",
      transformation: "lookupCategory"
    }
  },
  validationRules: {
    requiredFields: ["SKU", "Product Name", "Price"],
    uniqueFields: ["SKU"]
  }
}
```

### Sample Export Profile

```typescript
{
  code: "web_channel_export",
  label: "Web Channel Export",
  fileType: "JSON",
  channelCode: "ecommerce_web",
  locale: "fr-FR",
  attributeCodes: [
    "name",
    "product_description",
    "price",
    "material",
    "weight",
    "images"
  ],
  transformations: {
    "price": "formatCurrency",
    "weight": "formatMetric",
    "images": "generateCDNUrls"
  }
}
```

### Sample Workflow Configuration

```typescript
{
  stages: [
    {
      name: "draft",
      label: "Draft",
      allowedActions: ["submit_for_review"],
      allowedRoles: ["editor", "manager"]
    },
    {
      name: "in_review",
      label: "In Review",
      allowedActions: ["approve", "reject"],
      allowedRoles: ["reviewer", "manager"]
    },
    {
      name: "approved",
      label: "Approved",
      allowedActions: ["publish"],
      allowedRoles: ["publisher", "manager"]
    },
    {
      name: "published",
      label: "Published",
      allowedActions: ["unpublish"],
      allowedRoles: ["publisher", "manager"]
    }
  ],
  transitions: {
    "draft -> in_review": {
      action: "submit_for_review",
      validation: ["completeness >= 80", "no_validation_errors"]
    },
    "in_review -> approved": {
      action: "approve",
      validation: []
    },
    "in_review -> draft": {
      action: "reject",
      validation: [],
      requiresComment: true
    },
    "approved -> published": {
      action: "publish",
      validation: ["completeness >= 100"]
    }
  }
}
```


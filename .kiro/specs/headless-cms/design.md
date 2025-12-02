# Design Document - Headless CMS

## Overview

This design document outlines the architecture for a Headless Content Management System (CMS) for the Mientior e-commerce platform. The CMS will manage all non-product content including blog posts, landing pages, promotional banners, and homepage sections. The system follows a headless architecture where content management is decoupled from content presentation, allowing flexible content delivery through APIs.

The design supports flexible content modeling with reusable blocks, multi-language content management, scheduled publishing, version control, and SEO optimization. The system integrates with the existing Next.js application through REST APIs and provides a dedicated admin interface built with Refine.dev.

Key capabilities include:
- Flexible content modeling with custom content types and blocks
- Rich text editing with WYSIWYG editor
- Multi-locale content management for internationalization
- Scheduled publication and automatic content lifecycle management
- Version control with rollback capability
- Media asset management with responsive image generation
- SEO metadata management and preview
- Content preview before publication
- Publication workflow with approval stages
- REST API for content delivery
- Content templates for consistent creation
- Analytics integration for performance tracking

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin UI Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Content      │  │ Media        │  │ Analytics    │         │
│  │ Editor       │  │ Library      │  │ Dashboard    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ REST API         │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/cms/content                                        │  │
│  │  /api/cms/content-types                                  │  │
│  │  /api/cms/media                                          │  │
│  │  /api/cms/templates                                      │  │
│  │  /api/cms/preview                                        │  │
│  │  /api/cms/publish                                        │  │
│  │  /api/cms/analytics                                      │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Service Layer   │    │  Public API      │
│  ┌────────────┐  │    │  (Next.js App)   │
│  │ Content    │  │    │  ┌────────────┐  │
│  │ Service    │  │    │  │ Content    │  │
│  │            │  │    │  │ Delivery   │  │
│  │ Media      │  │    │  └────────────┘  │
│  │ Service    │  │    └──────────────────┘
│  │            │  │
│  │ Version    │  │
│  │ Service    │  │
│  │            │  │
│  │ Workflow   │  │
│  │ Service    │  │
│  │            │  │
│  │ Schedule   │  │
│  │ Service    │  │
│  └────────────┘  │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│  Data Layer      │
│  ┌────────────┐  │
│  │ PostgreSQL │  │
│  │ - Content  │  │
│  │ - Blocks   │  │
│  │ - Media    │  │
│  │ - Versions │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ S3/Storage │  │
│  │ - Images   │  │
│  │ - Videos   │  │
│  │ - Docs     │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Redis      │  │
│  │ - Cache    │  │
│  │ - Jobs     │  │
│  └────────────┘  │
└──────────────────┘
```

### Component Breakdown

1. **Admin UI Components** (Refine.dev + Ant Design)
   - Content editor with block-based editing
   - Rich text editor (TipTap or similar)
   - Media library with upload and organization
   - Content preview interface
   - Version history viewer
   - Publication workflow interface
   - Analytics dashboard
   - Template manager

2. **API Routes** (Next.js API Routes)
   - RESTful endpoints for content CRUD
   - Media upload and management endpoints
   - Preview generation endpoints
   - Publication and scheduling endpoints
   - Analytics data endpoints
   - Webhook endpoints for cache invalidation

3. **Service Layer** (Business Logic)
   - ContentService: CRUD and publishing operations
   - MediaService: File upload and processing
   - VersionService: Version control and comparison
   - WorkflowService: Publication workflow management
   - ScheduleService: Scheduled publication automation
   - TemplateService: Template management
   - AnalyticsService: Performance tracking integration

4. **Data Layer**
   - PostgreSQL for structured content data
   - S3-compatible storage for media files
   - Redis for caching and background jobs

## Components and Interfaces

### Database Schema Extensions

The CMS extends the database with new tables for content management:

```prisma
// Content Type Definition
model CmsContentType {
  id                String              @id @default(cuid())
  name              String              @unique
  label             Json                // Localized labels
  description       String?
  icon              String?
  allowedBlocks     Json                // Array of allowed block types
  requiredFields    Json                // Array of required field names
  seoEnabled        Boolean             @default(true)
  versioningEnabled Boolean             @default(true)
  workflowEnabled   Boolean             @default(true)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  content           CmsContent[]
  templates         CmsTemplate[]
  
  @@index([name])
  @@map("cms_content_types")
}

// Content Entry
model CmsContent {
  id                String              @id @default(cuid())
  contentTypeId     String
  title             String
  slug              String
  locale            String              @default("fr-FR")
  status            ContentStatus       @default(DRAFT)
  publishedAt       DateTime?
  scheduledAt       DateTime?
  expiresAt         DateTime?
  authorId          String
  publisherId       String?
  templateId        String?
  seoTitle          String?
  seoDescription    String?
  seoKeywords       Json?               // Array of keywords
  featuredImageId   String?
  blocks            Json                // Array of content blocks
  metadata          Json?               // Additional metadata
  viewCount         Int                 @default(0)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  contentType       CmsContentType      @relation(fields: [contentTypeId], references: [id])
  author            User                @relation("author", fields: [authorId], references: [id])
  publisher         User?               @relation("publisher", fields: [publisherId], references: [id])
  template          CmsTemplate?        @relation(fields: [templateId], references: [id])
  featuredImage     CmsMedia?           @relation(fields: [featuredImageId], references: [id])
  versions          CmsContentVersion[]
  translations      CmsContentTranslation[]
  workflow          CmsContentWorkflow?
  analytics         CmsContentAnalytics[]
  
  @@unique([slug, locale])
  @@index([contentTypeId])
  @@index([status])
  @@index([locale])
  @@index([authorId])
  @@index([publishedAt])
  @@map("cms_content")
}

// Content Version History
model CmsContentVersion {
  id                String              @id @default(cuid())
  contentId         String
  versionNumber     Int
  title             String
  blocks            Json
  seoTitle          String?
  seoDescription    String?
  metadata          Json?
  changes           Json?               // Summary of changes
  userId            String
  createdAt         DateTime            @default(now())
  
  content           CmsContent          @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user              User                @relation(fields: [userId], references: [id])
  
  @@unique([contentId, versionNumber])
  @@index([contentId])
  @@index([createdAt])
  @@map("cms_content_versions")
}

// Content Translations
model CmsContentTranslation {
  id                String              @id @default(cuid())
  sourceContentId   String
  targetContentId   String
  sourceLocale      String
  targetLocale      String
  createdAt         DateTime            @default(now())
  
  sourceContent     CmsContent          @relation(fields: [sourceContentId], references: [id], onDelete: Cascade)
  
  @@unique([sourceContentId, targetLocale])
  @@index([sourceContentId])
  @@index([targetContentId])
  @@map("cms_content_translations")
}

// Media Assets
model CmsMedia {
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
  altText           String?
  caption           String?
  tags              Json?               // Array of tag strings
  folderId          String?
  metadata          Json?               // EXIF, etc.
  uploadedBy        String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  folder            CmsMediaFolder?     @relation(fields: [folderId], references: [id])
  uploader          User                @relation(fields: [uploadedBy], references: [id])
  content           CmsContent[]
  
  @@index([mimeType])
  @@index([folderId])
  @@index([createdAt])
  @@map("cms_media")
}

// Media Folders
model CmsMediaFolder {
  id                String              @id @default(cuid())
  name              String
  parentId          String?
  path              String              // Full path for hierarchy
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  parent            CmsMediaFolder?     @relation("FolderHierarchy", fields: [parentId], references: [id])
  children          CmsMediaFolder[]    @relation("FolderHierarchy")
  media             CmsMedia[]
  
  @@unique([parentId, name])
  @@index([path])
  @@map("cms_media_folders")
}

// Content Templates
model CmsTemplate {
  id                String              @id @default(cuid())
  contentTypeId     String
  name              String
  description       String?
  thumbnail         String?
  blocks            Json                // Predefined block structure
  defaultValues     Json?               // Default field values
  isPublic          Boolean             @default(true)
  createdBy         String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  contentType       CmsContentType      @relation(fields: [contentTypeId], references: [id])
  creator           User                @relation(fields: [createdBy], references: [id])
  content           CmsContent[]
  
  @@index([contentTypeId])
  @@index([isPublic])
  @@map("cms_templates")
}

// Content Workflow
model CmsContentWorkflow {
  id                String              @id @default(cuid())
  contentId         String              @unique
  status            WorkflowStatus      @default(DRAFT)
  submittedAt       DateTime?
  submittedBy       String?
  reviewedAt        DateTime?
  reviewedBy        String?
  rejectionReason   String?
  comments          Json?               // Array of comment objects
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  content           CmsContent          @relation(fields: [contentId], references: [id], onDelete: Cascade)
  submitter         User?               @relation("submitter", fields: [submittedBy], references: [id])
  reviewer          User?               @relation("reviewer", fields: [reviewedBy], references: [id])
  
  @@index([contentId])
  @@index([status])
  @@map("cms_content_workflows")
}

// Content Analytics
model CmsContentAnalytics {
  id                String              @id @default(cuid())
  contentId         String
  date              DateTime            @default(now())
  pageViews         Int                 @default(0)
  uniqueVisitors    Int                 @default(0)
  avgTimeOnPage     Int?                // seconds
  bounceRate        Float?
  ctaClicks         Int                 @default(0)
  formSubmissions   Int                 @default(0)
  scrollDepth       Float?              // percentage
  
  content           CmsContent          @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  @@unique([contentId, date])
  @@index([contentId])
  @@index([date])
  @@map("cms_content_analytics")
}

// Preview Links
model CmsPreviewLink {
  id                String              @id @default(cuid())
  contentId         String
  token             String              @unique
  expiresAt         DateTime
  createdBy         String
  createdAt         DateTime            @default(now())
  
  creator           User                @relation(fields: [createdBy], references: [id])
  
  @@index([token])
  @@index([expiresAt])
  @@map("cms_preview_links")
}

// Enums
enum ContentStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum WorkflowStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
}

// Update existing User model
model User {
  // ... existing fields ...
  
  authoredContent   CmsContent[]        @relation("author")
  publishedContent  CmsContent[]        @relation("publisher")
  contentVersions   CmsContentVersion[]
  uploadedMedia     CmsMedia[]
  createdTemplates  CmsTemplate[]
  submittedWorkflows CmsContentWorkflow[] @relation("submitter")
  reviewedWorkflows  CmsContentWorkflow[] @relation("reviewer")
  previewLinks      CmsPreviewLink[]
}
```


### API Endpoints

#### Content Management

**GET /api/cms/content**
List content entries with filtering, sorting, and pagination.

Query Parameters:
- `type`: Filter by content type
- `status`: Filter by publication status
- `locale`: Filter by locale
- `author`: Filter by author ID
- `search`: Full-text search
- `page`, `limit`: Pagination

**GET /api/cms/content/[id]**
Get a single content entry with all blocks and metadata.

Query Parameters:
- `version`: Specific version number
- `includeVersions`: Include version history

**POST /api/cms/content**
Create a new content entry.

Request Body:
```typescript
{
  contentTypeId: string
  title: string
  slug: string
  locale: string
  blocks: ContentBlock[]
  seoTitle?: string
  seoDescription?: string
  featuredImageId?: string
  templateId?: string
}
```

**PATCH /api/cms/content/[id]**
Update content entry.

Request Body:
```typescript
{
  title?: string
  slug?: string
  blocks?: ContentBlock[]
  seoTitle?: string
  seoDescription?: string
  metadata?: object
}
```

**DELETE /api/cms/content/[id]**
Delete content entry (soft delete to archived status).

**POST /api/cms/content/[id]/publish**
Publish content immediately or schedule for later.

Request Body:
```typescript
{
  publishAt?: Date  // If provided, schedules publication
  expiresAt?: Date  // Optional expiration date
}
```

**POST /api/cms/content/[id]/unpublish**
Unpublish content and set to archived status.

#### Content Versions

**GET /api/cms/content/[id]/versions**
Get version history for content.

**GET /api/cms/content/[id]/versions/[versionNumber]**
Get specific version.

**POST /api/cms/content/[id]/versions/[versionNumber]/restore**
Restore content to a previous version.

**POST /api/cms/content/[id]/versions/compare**
Compare two versions.

Request Body:
```typescript
{
  version1: number
  version2: number
}
```

#### Media Management

**GET /api/cms/media**
List media assets with filtering and search.

Query Parameters:
- `type`: Filter by MIME type
- `folder`: Filter by folder ID
- `tags`: Filter by tags
- `search`: Search filename and alt text

**POST /api/cms/media**
Upload media asset.

Request: multipart/form-data with file and metadata

**PATCH /api/cms/media/[id]**
Update media metadata.

Request Body:
```typescript
{
  altText?: string
  caption?: string
  tags?: string[]
  folderId?: string
}
```

**DELETE /api/cms/media/[id]**
Delete media asset (only if not in use).

**GET /api/cms/media/[id]/usage**
Get list of content entries using this media asset.

#### Templates

**GET /api/cms/templates**
List available templates.

Query Parameters:
- `contentType`: Filter by content type

**POST /api/cms/templates**
Create a new template.

Request Body:
```typescript
{
  contentTypeId: string
  name: string
  description?: string
  blocks: ContentBlock[]
  defaultValues?: object
}
```

**GET /api/cms/templates/[id]**
Get template details.

**PATCH /api/cms/templates/[id]**
Update template.

**DELETE /api/cms/templates/[id]**
Delete template.

#### Preview

**POST /api/cms/content/[id]/preview**
Generate preview link for content.

Request Body:
```typescript
{
  expiresIn?: number  // Minutes until expiration (default: 60)
}
```

Response:
```typescript
{
  previewUrl: string
  token: string
  expiresAt: Date
}
```

**GET /api/cms/preview/[token]**
Access preview content.

#### Workflow

**POST /api/cms/content/[id]/workflow/submit**
Submit content for review.

**POST /api/cms/content/[id]/workflow/approve**
Approve content.

Request Body:
```typescript
{
  comments?: string
}
```

**POST /api/cms/content/[id]/workflow/reject**
Reject content.

Request Body:
```typescript
{
  reason: string
  comments?: string
}
```

**GET /api/cms/workflow/pending**
Get content pending review.

#### Analytics

**GET /api/cms/content/[id]/analytics**
Get analytics for content entry.

Query Parameters:
- `startDate`: Start date for analytics period
- `endDate`: End date for analytics period

Response:
```typescript
{
  pageViews: number
  uniqueVisitors: number
  avgTimeOnPage: number
  bounceRate: number
  ctaClicks: number
  formSubmissions: number
  scrollDepth: number
  trend: Array<{ date: string, views: number }>
}
```

**GET /api/cms/analytics/compare**
Compare analytics across multiple content entries.

Request Body:
```typescript
{
  contentIds: string[]
  startDate: Date
  endDate: Date
}
```

#### Public Content Delivery API

**GET /api/content/[slug]**
Get published content by slug for public consumption.

Query Parameters:
- `locale`: Content locale (default: fr-FR)

**GET /api/content/type/[contentType]**
Get all published content of a specific type.

Query Parameters:
- `locale`: Content locale
- `limit`: Number of items
- `page`: Page number

**GET /api/banners**
Get active promotional banners.

Query Parameters:
- `position`: Banner position (hero, sidebar, footer)
- `locale`: Content locale

### Service Layer

#### ContentService

```typescript
class ContentService {
  /**
   * Creates a new content entry
   */
  async createContent(data: CreateContentDto): Promise<CmsContent>
  
  /**
   * Updates content entry
   */
  async updateContent(
    contentId: string,
    data: UpdateContentDto
  ): Promise<CmsContent>
  
  /**
   * Gets content with all related data
   */
  async getContent(
    contentId: string,
    options?: { version?: number, includeVersions?: boolean }
  ): Promise<EnrichedContent>
  
  /**
   * Publishes content immediately or schedules publication
   */
  async publishContent(
    contentId: string,
    publishAt?: Date,
    expiresAt?: Date
  ): Promise<CmsContent>
  
  /**
   * Unpublishes content
   */
  async unpublishContent(contentId: string): Promise<CmsContent>
  
  /**
   * Duplicates content for translation
   */
  async duplicateForTranslation(
    contentId: string,
    targetLocale: string
  ): Promise<CmsContent>
  
  /**
   * Gets published content by slug for public API
   */
  async getPublishedBySlug(
    slug: string,
    locale: string
  ): Promise<CmsContent | null>
}
```

#### MediaService

```typescript
class MediaService {
  /**
   * Uploads and processes media file
   */
  async uploadMedia(
    file: File,
    metadata: MediaMetadata
  ): Promise<CmsMedia>
  
  /**
   * Generates responsive image variants
   */
  async generateImageVariants(mediaId: string): Promise<string[]>
  
  /**
   * Searches media assets
   */
  async searchMedia(query: MediaSearchQuery): Promise<CmsMedia[]>
  
  /**
   * Gets content entries using a media asset
   */
  async getMediaUsage(mediaId: string): Promise<CmsContent[]>
  
  /**
   * Deletes media if not in use
   */
  async deleteMedia(mediaId: string): Promise<void>
  
  /**
   * Organizes media into folders
   */
  async moveToFolder(
    mediaId: string,
    folderId: string
  ): Promise<CmsMedia>
}
```

#### VersionService

```typescript
class VersionService {
  /**
   * Creates a new version snapshot
   */
  async createVersion(
    contentId: string,
    userId: string,
    changes?: object
  ): Promise<CmsContentVersion>
  
  /**
   * Gets version history
   */
  async getVersionHistory(
    contentId: string
  ): Promise<CmsContentVersion[]>
  
  /**
   * Compares two versions
   */
  async compareVersions(
    contentId: string,
    version1: number,
    version2: number
  ): Promise<VersionComparison>
  
  /**
   * Restores content to a previous version
   */
  async restoreVersion(
    contentId: string,
    versionNumber: number,
    userId: string
  ): Promise<CmsContent>
}
```

#### WorkflowService

```typescript
class WorkflowService {
  /**
   * Submits content for review
   */
  async submitForReview(
    contentId: string,
    userId: string
  ): Promise<CmsContentWorkflow>
  
  /**
   * Approves content
   */
  async approveContent(
    contentId: string,
    reviewerId: string,
    comments?: string
  ): Promise<CmsContentWorkflow>
  
  /**
   * Rejects content
   */
  async rejectContent(
    contentId: string,
    reviewerId: string,
    reason: string,
    comments?: string
  ): Promise<CmsContentWorkflow>
  
  /**
   * Gets pending reviews
   */
  async getPendingReviews(): Promise<CmsContentWorkflow[]>
}
```

#### ScheduleService

```typescript
class ScheduleService {
  /**
   * Processes scheduled publications
   */
  async processScheduledPublications(): Promise<void>
  
  /**
   * Processes scheduled expirations
   */
  async processScheduledExpirations(): Promise<void>
  
  /**
   * Gets upcoming scheduled content
   */
  async getScheduledContent(
    startDate: Date,
    endDate: Date
  ): Promise<CmsContent[]>
  
  /**
   * Cancels scheduled publication
   */
  async cancelSchedule(contentId: string): Promise<CmsContent>
}
```

#### TemplateService

```typescript
class TemplateService {
  /**
   * Creates a new template
   */
  async createTemplate(data: CreateTemplateDto): Promise<CmsTemplate>
  
  /**
   * Creates content from template
   */
  async createFromTemplate(
    templateId: string,
    overrides?: Partial<CreateContentDto>
  ): Promise<CmsContent>
  
  /**
   * Gets templates for content type
   */
  async getTemplatesByType(
    contentTypeId: string
  ): Promise<CmsTemplate[]>
  
  /**
   * Updates template
   */
  async updateTemplate(
    templateId: string,
    data: UpdateTemplateDto
  ): Promise<CmsTemplate>
}
```

#### AnalyticsService

```typescript
class AnalyticsService {
  /**
   * Tracks page view
   */
  async trackPageView(
    contentId: string,
    visitorId: string
  ): Promise<void>
  
  /**
   * Tracks interaction event
   */
  async trackInteraction(
    contentId: string,
    eventType: string,
    metadata?: object
  ): Promise<void>
  
  /**
   * Gets analytics for content
   */
  async getContentAnalytics(
    contentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ContentAnalytics>
  
  /**
   * Compares analytics across content
   */
  async compareAnalytics(
    contentIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ComparativeAnalytics>
  
  /**
   * Integrates with external analytics
   */
  async syncWithExternalAnalytics(): Promise<void>
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface EnrichedContent {
  id: string
  contentType: CmsContentType
  title: string
  slug: string
  locale: string
  status: ContentStatus
  publishedAt?: Date
  scheduledAt?: Date
  expiresAt?: Date
  author: User
  publisher?: User
  template?: CmsTemplate
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  featuredImage?: CmsMedia
  blocks: ContentBlock[]
  metadata?: object
  versions: CmsContentVersion[]
  translations: ContentTranslation[]
  workflow?: CmsContentWorkflow
  analytics?: ContentAnalytics
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

interface ContentBlock {
  id: string
  type: BlockType
  order: number
  data: BlockData
}

type BlockType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'quote'
  | 'code'
  | 'cta'
  | 'form'
  | 'hero'
  | 'features'
  | 'testimonial'
  | 'html'

interface BlockData {
  [key: string]: any
}

interface ContentTranslation {
  sourceLocale: string
  targetLocale: string
  targetContentId: string
  targetContent?: CmsContent
}

interface VersionComparison {
  version1: CmsContentVersion
  version2: CmsContentVersion
  differences: FieldDifference[]
}

interface FieldDifference {
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'removed' | 'modified'
}

interface ContentAnalytics {
  contentId: string
  period: { startDate: Date, endDate: Date }
  pageViews: number
  uniqueVisitors: number
  avgTimeOnPage: number
  bounceRate: number
  ctaClicks: number
  formSubmissions: number
  scrollDepth: number
  trend: Array<{ date: string, views: number }>
}

interface ComparativeAnalytics {
  period: { startDate: Date, endDate: Date }
  entries: Array<{
    contentId: string
    title: string
    pageViews: number
    uniqueVisitors: number
    ctaClicks: number
  }>
}

interface MediaMetadata {
  altText?: string
  caption?: string
  tags?: string[]
  folderId?: string
}

interface MediaSearchQuery {
  search?: string
  type?: string
  folder?: string
  tags?: string[]
  limit?: number
  offset?: number
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified opportunities to consolidate redundant properties:

**Consolidations:**
- Properties 1.1, 3.1, 7.1, 13.1 (storage of various content types) all test data persistence and can be combined into a single comprehensive property
- Properties 1.2, 2.2 (block type support) test the same concept and can be combined
- Properties 1.4, 4.5, 11.1 (version creation on save) all test the same behavior and can be combined
- Properties 2.3, 4.4 (reordering) test the same functionality and can be combined
- Properties 6.2, 6.3 (scheduled publication/unpublication) both test time-based status changes and can be combined
- Properties 9.1, 9.3, 9.4 (workflow state transitions) can be combined into a single workflow property
- Properties 11.2, 11.3, 11.4, 11.5 (version operations) can be consolidated into fewer comprehensive properties
- Properties 12.1, 12.3, 12.4 (API content retrieval) can be combined

This consolidation reduces redundancy while maintaining comprehensive coverage of all requirements.

### Correctness Properties

Property 1: Content data persistence
*For any* content entry (blog post, landing page, banner, template), the system should store all provided data (title, slug, blocks, metadata, SEO data) and retrieve it identically
**Validates: Requirements 1.1, 2.1, 3.1, 7.1, 13.1**

Property 2: Content block type support
*For any* content entry, the system should accept and store all supported block types (text, image, video, quote, code, CTA, form, hero, features, testimonial, HTML) without data loss
**Validates: Requirements 1.2, 2.2**

Property 3: Version creation on save
*For any* content save operation, the system should create a new version with timestamp, user ID, and complete content snapshot
**Validates: Requirements 1.4, 4.5, 11.1, 11.5**

Property 4: Block reordering persistence
*For any* content with multiple blocks, reordering the blocks should update the order field and maintain the new sequence on retrieval
**Validates: Requirements 2.3, 4.4**

Property 5: CTA block configuration storage
*For any* CTA block, all configuration (button text, URL, style, tracking parameters) should be stored and retrieved identically
**Validates: Requirements 2.4**

Property 6: Content slug accessibility
*For any* published content with a slug, the content should be accessible via the public API at that slug
**Validates: Requirements 2.5**

Property 7: Banner priority ordering
*For any* set of active banners, the system should return them ordered by priority value (highest first)
**Validates: Requirements 3.3**

Property 8: Banner expiration filtering
*For any* banner with an expiration date in the past, the system should exclude it from active banner queries
**Validates: Requirements 3.4**

Property 9: Image variant generation
*For any* uploaded image, the system should generate responsive variants and make them accessible via URLs
**Validates: Requirements 3.5**

Property 10: Product selection linkage
*For any* content with selected products, the product IDs should be stored and the products should be retrievable
**Validates: Requirements 4.2**

Property 11: Locale assignment
*For any* content creation, the specified locale should be stored and used for content retrieval filtering
**Validates: Requirements 5.1**

Property 12: Translation independence
*For any* content with translations, modifying one translation should not affect the content of other translations
**Validates: Requirements 5.2, 5.4**

Property 13: Translation availability tracking
*For any* content, the system should correctly identify which locales have translations and which are missing
**Validates: Requirements 5.3**

Property 14: Locale-based content delivery
*For any* content request with a locale parameter, the system should return content in that locale if available
**Validates: Requirements 5.5**

Property 15: Schedule storage and retrieval
*For any* content with a scheduled publication date, the schedule should be stored and retrievable
**Validates: Requirements 6.1**

Property 16: Scheduled status transitions
*For any* content with a scheduled publication or expiration time, when that time arrives, the system should automatically update the status accordingly
**Validates: Requirements 6.2, 6.3**

Property 17: Scheduled content query
*For any* date range, the system should return all content scheduled for publication or expiration within that range
**Validates: Requirements 6.4**

Property 18: Schedule cancellation
*For any* scheduled content, canceling the schedule should remove the scheduled date and revert status to draft
**Validates: Requirements 6.5**

Property 19: Media search correctness
*For any* media search query, results should include all assets matching the search criteria (filename, alt text, tags, type) and exclude non-matching assets
**Validates: Requirements 7.2**

Property 20: Media usage tracking
*For any* media asset used in content, the system should track and report which content entries reference that asset
**Validates: Requirements 7.3**

Property 21: Media deletion protection
*For any* media asset currently in use by content, deletion attempts should be rejected with information about which content uses it
**Validates: Requirements 7.5**

Property 22: SEO metadata validation
*For any* content with required SEO fields, the system should reject saves that don't include complete SEO metadata
**Validates: Requirements 8.3**

Property 23: Slug uniqueness enforcement
*For any* content slug within a locale, the system should enforce uniqueness and reject duplicate slugs
**Validates: Requirements 8.4**

Property 24: Workflow state transitions
*For any* workflow action (submit, approve, reject), the system should transition to the correct status and record the action with timestamp, user, and comments
**Validates: Requirements 9.1, 9.3, 9.4, 9.5**

Property 25: Preview link generation
*For any* preview request, the system should generate a unique token with expiration time
**Validates: Requirements 10.1, 10.4**

Property 26: Preview link expiration
*For any* preview link past its expiration time, access attempts should be rejected
**Validates: Requirements 10.5**

Property 27: Version history ordering
*For any* content, version history should be ordered chronologically by creation timestamp
**Validates: Requirements 11.2**

Property 28: Version comparison accuracy
*For any* two versions of content, the comparison should identify all fields that differ between them
**Validates: Requirements 11.3**

Property 29: Version restoration round-trip
*For any* version restoration, the content should match the restored version's snapshot, and a new version should be created
**Validates: Requirements 11.4**

Property 30: API content retrieval
*For any* content request via API (by ID or slug), the system should return the content in JSON format with all blocks and metadata
**Validates: Requirements 12.1, 12.3**

Property 31: API status filtering
*For any* API query for published content, the system should return only content with status set to PUBLISHED
**Validates: Requirements 12.4**

Property 32: API query filtering
*For any* API query with filters (content type, status, locale, tags), results should include only content matching all specified filters
**Validates: Requirements 12.2**

Property 33: Cache invalidation webhook delivery
*For any* content publication or update, the system should trigger cache invalidation webhooks
**Validates: Requirements 12.5**

Property 34: Template instantiation
*For any* content created from a template, the content should initially have the template's block structure and default values
**Validates: Requirements 13.2**

Property 35: Template independence
*For any* content created from a template, modifications to the content should not affect the template, and template updates should not affect existing content
**Validates: Requirements 13.3, 13.4**

Property 36: Analytics event tracking
*For any* content interaction (page view, CTA click, form submission), the system should record the event with content ID and timestamp
**Validates: Requirements 14.1, 14.2**

Property 37: Analytics data retrieval
*For any* content and date range, the system should return aggregated analytics metrics for that period
**Validates: Requirements 14.3, 14.4**

Property 38: Analytics integration
*For any* tracked event, the system should forward the event to configured external analytics tools (PostHog, Google Analytics)
**Validates: Requirements 14.5**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Invalid content type
   - Missing required fields
   - Invalid slug format
   - Duplicate slug
   - Invalid locale code
   - Invalid block type
   - SEO metadata incomplete

2. **Not Found Errors** (404 Not Found)
   - Content not found
   - Media not found
   - Template not found
   - Version not found
   - Preview link not found

3. **Conflict Errors** (409 Conflict)
   - Slug already exists
   - Cannot delete media in use
   - Content already published
   - Schedule conflict

4. **Authorization Errors** (403 Forbidden)
   - Insufficient permissions
   - Cannot publish without approval
   - Cannot modify published content

5. **Business Logic Errors** (422 Unprocessable Entity)
   - Cannot publish draft content
   - Cannot restore to invalid version
   - Preview link expired
   - Schedule date in past

6. **Server Errors** (500 Internal Server Error)
   - Database connection failed
   - File storage error
   - Image processing failed

### Error Response Format

```typescript
interface CmsError {
  error: string
  message: string
  code: string
  details?: Record<string, any>
  field?: string
}
```

### Error Handling Strategies

1. **Validation Errors**
   - Validate early and return specific messages
   - Include field name in error
   - Provide suggestions for correction

2. **Media Upload Errors**
   - Validate file type and size before upload
   - Clean up partial uploads on failure
   - Provide clear error messages

3. **Workflow Errors**
   - Validate state transitions before execution
   - Prevent invalid state changes
   - Provide clear feedback on why action is not allowed

4. **Schedule Errors**
   - Validate dates are in future
   - Check for scheduling conflicts
   - Provide clear error messages

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Coverage Areas**:
1. Content CRUD operations
2. Version creation and comparison
3. Workflow state machine
4. Schedule processing logic
5. Media upload and processing
6. Slug generation and validation
7. SEO metadata validation
8. Block reordering logic

**Example Unit Tests**:
- Test content creation with various block types
- Test version comparison algorithm
- Test workflow state transitions
- Test slug uniqueness validation
- Test schedule date validation

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: headless-cms, Property {number}: {property_text}`

**Coverage Areas**:
1. Content data persistence across all content types
2. Block type support and storage
3. Version creation and restoration
4. Translation independence
5. Schedule processing
6. Media search and filtering
7. API query filtering
8. Workflow transitions
9. Analytics tracking

**Example Property Tests**:
```typescript
// Feature: headless-cms, Property 1: Content data persistence
test('content data is stored and retrieved identically', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        title: fc.string(),
        slug: fc.string(),
        locale: fc.constantFrom('fr-FR', 'en-US'),
        blocks: fc.array(fc.object()),
        seoTitle: fc.string(),
        seoDescription: fc.string()
      }),
      async (data) => {
        const content = await createContent(data)
        const retrieved = await getContent(content.id)
        
        expect(retrieved.title).toBe(data.title)
        expect(retrieved.slug).toBe(data.slug)
        expect(retrieved.locale).toBe(data.locale)
        expect(retrieved.blocks).toEqual(data.blocks)
        expect(retrieved.seoTitle).toBe(data.seoTitle)
        expect(retrieved.seoDescription).toBe(data.seoDescription)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: headless-cms, Property 12: Translation independence
test('modifying one translation does not affect others', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        title: fc.string(),
        content: fc.string(),
        newTitle: fc.string()
      }),
      async (data) => {
        // Create content in French
        const frContent = await createContent({
          title: data.title,
          locale: 'fr-FR',
          blocks: [{ type: 'text', data: { text: data.content } }]
        })
        
        // Create English translation
        const enContent = await duplicateForTranslation(frContent.id, 'en-US')
        
        // Modify English version
        await updateContent(enContent.id, { title: data.newTitle })
        
        // Verify French version unchanged
        const frRetrieved = await getContent(frContent.id)
        expect(frRetrieved.title).toBe(data.title)
        
        // Verify English version changed
        const enRetrieved = await getContent(enContent.id)
        expect(enRetrieved.title).toBe(data.newTitle)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: headless-cms, Property 29: Version restoration round-trip
test('restoring a version returns content to that state', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        initialTitle: fc.string(),
        modifiedTitle: fc.string()
      }),
      async (data) => {
        // Create content
        const content = await createContent({ title: data.initialTitle })
        const version1 = await getLatestVersion(content.id)
        
        // Modify content
        await updateContent(content.id, { title: data.modifiedTitle })
        
        // Restore to version 1
        await restoreVersion(content.id, version1.versionNumber)
        
        // Verify content matches initial state
        const restored = await getContent(content.id)
        expect(restored.title).toBe(data.initialTitle)
        
        // Verify new version was created
        const latestVersion = await getLatestVersion(content.id)
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
1. Complete content creation and publication workflow
2. Multi-locale content management
3. Media upload and usage tracking
4. Template-based content creation
5. Workflow approval process
6. Scheduled publication automation
7. Preview link generation and access
8. Analytics tracking and retrieval

**Example Integration Tests**:
- Create blog post, add blocks, publish, verify on public site
- Upload media, use in content, verify usage tracking
- Create template, instantiate content, verify independence
- Submit content for review, approve, publish
- Schedule content, wait for publication time, verify status change

### Performance Testing

**Areas to Test**:
1. **Content Query Performance**
   - Test with 100, 1000, 10000 content entries
   - Target: < 200ms for paginated queries

2. **Media Upload Performance**
   - Test with 1MB, 10MB, 50MB files
   - Target: 10MB image in < 5 seconds

3. **Version History Performance**
   - Test with 10, 100, 1000 versions
   - Target: Retrieve version list in < 500ms

4. **Search Performance**
   - Test content search with 1000, 10000 entries
   - Target: Return results in < 1 second

### Test Coverage Goals

- Unit test coverage: > 80% of service layer code
- Property test coverage: All 38 correctness properties
- Integration test coverage: All critical user workflows
- Performance test coverage: All timing-critical operations


## Implementation Notes

### Technology Choices

1. **Rich Text Editor:**
   - **TipTap** (recommended) - Modern, extensible, based on ProseMirror
   - Provides excellent block editing capabilities
   - Easy to customize and extend

2. **File Storage:**
   - S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces)
   - CloudFront or CDN for media delivery
   - Image optimization with Sharp

3. **Background Jobs:**
   - Bull queue with Redis for scheduled publications
   - Separate queues for publishing, analytics, and media processing
   - Job retry with exponential backoff

4. **Caching Strategy:**
   - Redis for published content caching
   - Cache published content with TTL
   - Invalidate cache on content updates via webhooks

5. **Property-Based Testing Library:**
   - **fast-check** for TypeScript/JavaScript
   - Provides excellent shrinking capabilities
   - Integrates well with Vitest

### Database Optimization

1. **Indexes:**
   - Index on CmsContent(slug, locale) for public queries
   - Index on CmsContent(status, publishedAt) for filtering
   - Index on CmsContent(contentTypeId, locale) for type queries
   - Index on CmsMedia(tags) using GIN for JSON
   - Index on CmsContentVersion(contentId, versionNumber)

2. **Query Optimization:**
   - Use CTEs for complex content queries
   - Implement pagination for large result sets
   - Use JSONB for flexible block storage
   - Cache frequently accessed content

3. **Partitioning:**
   - Consider partitioning CmsContentVersion by date
   - Partition CmsContentAnalytics by date for time-series data

### Security Considerations

1. **Content Security:**
   - Sanitize HTML in rich text content
   - Validate block data against schemas
   - Implement XSS protection
   - Rate limit content creation

2. **Media Security:**
   - Validate file types using magic numbers
   - Scan uploaded files for malware
   - Generate signed URLs for private media
   - Implement file size limits

3. **API Security:**
   - Require authentication for all CMS endpoints
   - Implement role-based access control
   - Rate limit API requests
   - Validate all input data

4. **Preview Security:**
   - Use cryptographically secure tokens
   - Implement token expiration
   - Limit preview link sharing
   - Log preview access

### Monitoring and Observability

1. **Metrics to Track:**
   - Content creation rate
   - Publication rate
   - Media upload volume
   - API response times
   - Cache hit rate
   - Scheduled job success rate

2. **Alerts:**
   - Failed scheduled publications
   - Media upload failures
   - High API error rate
   - Low cache hit rate
   - Workflow bottlenecks

3. **Logging:**
   - Log all content modifications
   - Log all workflow state changes
   - Log all publication events
   - Log all media uploads
   - Log all API errors

### Scalability Considerations

1. **Horizontal Scaling:**
   - Stateless API servers
   - Separate worker processes for background jobs
   - Load balancer for API traffic
   - CDN for media delivery

2. **Database Scaling:**
   - Read replicas for public content queries
   - Connection pooling
   - Query result caching
   - Consider sharding by content type for very large catalogs

3. **Media Storage Scaling:**
   - Use object storage (S3) for unlimited capacity
   - Implement lazy loading for media lists
   - Generate thumbnails asynchronously
   - Use progressive image loading

### Content Block System

The CMS uses a flexible block-based content system. Each block type has a specific schema:

**Text Block:**
```typescript
{
  type: 'text',
  data: {
    content: string  // Rich text HTML
  }
}
```

**Image Block:**
```typescript
{
  type: 'image',
  data: {
    mediaId: string
    alt: string
    caption?: string
    alignment: 'left' | 'center' | 'right' | 'full'
  }
}
```

**CTA Block:**
```typescript
{
  type: 'cta',
  data: {
    text: string
    url: string
    style: 'primary' | 'secondary' | 'outline'
    size: 'small' | 'medium' | 'large'
    tracking?: {
      campaign?: string
      source?: string
      medium?: string
    }
  }
}
```

**Hero Block:**
```typescript
{
  type: 'hero',
  data: {
    title: string
    subtitle?: string
    backgroundImageId?: string
    ctaText?: string
    ctaUrl?: string
    alignment: 'left' | 'center' | 'right'
  }
}
```

### SEO Optimization

1. **Meta Tags:**
   - Generate Open Graph tags from SEO metadata
   - Generate Twitter Card tags
   - Include canonical URLs
   - Generate structured data (JSON-LD)

2. **Sitemap Generation:**
   - Automatically generate sitemap.xml
   - Include all published content
   - Update on content publication
   - Submit to search engines

3. **Performance:**
   - Implement ISR (Incremental Static Regeneration)
   - Optimize images with next/image
   - Lazy load below-the-fold content
   - Minimize JavaScript bundle size

### Migration Strategy

1. **Phase 1: Core CMS Foundation (Weeks 1-2)**
   - Implement database schema
   - Implement content CRUD operations
   - Implement basic admin UI
   - Implement media upload

2. **Phase 2: Content Blocks & Rich Text (Weeks 3-4)**
   - Implement block system
   - Integrate rich text editor
   - Implement block reordering
   - Add block type support

3. **Phase 3: Multi-Locale & SEO (Weeks 5-6)**
   - Implement locale support
   - Implement translation linking
   - Implement SEO metadata
   - Add slug generation

4. **Phase 4: Workflow & Scheduling (Weeks 7-8)**
   - Implement workflow system
   - Implement scheduled publication
   - Add approval process
   - Implement background jobs

5. **Phase 5: Versioning & Preview (Weeks 9-10)**
   - Implement version control
   - Implement version comparison
   - Implement preview links
   - Add rollback capability

6. **Phase 6: Templates & Analytics (Weeks 11-12)**
   - Implement template system
   - Implement analytics tracking
   - Add analytics dashboard
   - Integrate external analytics

7. **Phase 7: Public API & Integration (Weeks 13-14)**
   - Implement public content API
   - Add cache invalidation webhooks
   - Implement ISR integration
   - Add sitemap generation

8. **Phase 8: Optimization & Polish (Weeks 15-16)**
   - Performance optimization
   - UI/UX improvements
   - Documentation
   - Training materials

### Admin UI Components

The admin interface will use Refine.dev with Ant Design:

1. **Content Editor:**
   - Block-based editor with drag-and-drop
   - Rich text editor for text blocks
   - Media picker for images/videos
   - SEO metadata form
   - Preview button
   - Version history sidebar

2. **Content List:**
   - Filterable table view
   - Status indicators
   - Quick actions (publish, edit, delete)
   - Bulk operations
   - Search functionality

3. **Media Library:**
   - Grid view with thumbnails
   - Upload with drag-and-drop
   - Folder organization
   - Tag management
   - Usage tracking display

4. **Template Manager:**
   - Template list view
   - Template editor
   - Preview templates
   - Duplicate templates

5. **Analytics Dashboard:**
   - Performance metrics
   - Trend charts
   - Comparative analytics
   - Export reports

6. **Workflow Dashboard:**
   - Pending reviews list
   - Approval queue
   - Workflow history
   - Performance metrics

### Content Delivery Optimization

1. **Caching Strategy:**
   - Cache published content in Redis
   - Set appropriate TTL based on content type
   - Invalidate cache on updates
   - Use stale-while-revalidate pattern

2. **ISR Integration:**
   - Use Next.js ISR for static generation
   - Revalidate on content publication
   - Implement on-demand revalidation
   - Cache at CDN level

3. **API Response Optimization:**
   - Implement field selection (sparse fieldsets)
   - Use compression (gzip/brotli)
   - Implement ETag for conditional requests
   - Add pagination to all list endpoints

### Webhook System

Implement webhooks for cache invalidation and external integrations:

```typescript
interface WebhookPayload {
  event: 'content.published' | 'content.updated' | 'content.deleted'
  contentId: string
  contentType: string
  slug: string
  locale: string
  timestamp: Date
}
```

Webhook endpoints should:
- Be configurable in admin settings
- Include retry logic with exponential backoff
- Log all webhook deliveries
- Support webhook signatures for security

## Appendix

### Sample Content Types

**Blog Post:**
```typescript
{
  name: 'blog-post',
  label: { 'fr-FR': 'Article de blog', 'en-US': 'Blog Post' },
  allowedBlocks: ['text', 'heading', 'image', 'video', 'quote', 'code'],
  requiredFields: ['title', 'slug', 'featuredImage', 'seoTitle', 'seoDescription'],
  seoEnabled: true,
  versioningEnabled: true,
  workflowEnabled: true
}
```

**Landing Page:**
```typescript
{
  name: 'landing-page',
  label: { 'fr-FR': 'Page d\'atterrissage', 'en-US': 'Landing Page' },
  allowedBlocks: ['hero', 'features', 'testimonial', 'cta', 'form', 'text', 'image'],
  requiredFields: ['title', 'slug', 'seoTitle', 'seoDescription'],
  seoEnabled: true,
  versioningEnabled: true,
  workflowEnabled: true
}
```

**Promotional Banner:**
```typescript
{
  name: 'banner',
  label: { 'fr-FR': 'Bannière', 'en-US': 'Banner' },
  allowedBlocks: ['image', 'text', 'cta'],
  requiredFields: ['title', 'image', 'link'],
  seoEnabled: false,
  versioningEnabled: false,
  workflowEnabled: false
}
```

### Sample Block Configurations

**Hero Section:**
```typescript
{
  type: 'hero',
  data: {
    title: 'Bienvenue sur Mientior',
    subtitle: 'Votre marketplace premium',
    backgroundImageId: 'cuid-123',
    ctaText: 'Découvrir',
    ctaUrl: '/products',
    alignment: 'center'
  }
}
```

**Feature Grid:**
```typescript
{
  type: 'features',
  data: {
    title: 'Nos avantages',
    features: [
      {
        icon: 'truck',
        title: 'Livraison rapide',
        description: 'Livraison en 24-48h'
      },
      {
        icon: 'shield',
        title: 'Paiement sécurisé',
        description: 'Transactions 100% sécurisées'
      }
    ]
  }
}
```

### Sample API Responses

**Get Published Content:**
```json
{
  "id": "cuid-123",
  "contentType": {
    "name": "blog-post",
    "label": "Article de blog"
  },
  "title": "Guide d'achat 2024",
  "slug": "guide-achat-2024",
  "locale": "fr-FR",
  "status": "PUBLISHED",
  "publishedAt": "2024-01-15T10:00:00Z",
  "author": {
    "id": "user-123",
    "name": "Jean Dupont"
  },
  "seoTitle": "Guide d'achat complet 2024 | Mientior",
  "seoDescription": "Découvrez notre guide d'achat complet...",
  "featuredImage": {
    "id": "media-123",
    "url": "https://cdn.mientior.com/images/guide-2024.jpg",
    "alt": "Guide d'achat 2024"
  },
  "blocks": [
    {
      "id": "block-1",
      "type": "heading",
      "order": 0,
      "data": {
        "level": 1,
        "text": "Introduction"
      }
    },
    {
      "id": "block-2",
      "type": "text",
      "order": 1,
      "data": {
        "content": "<p>Bienvenue dans notre guide...</p>"
      }
    }
  ],
  "viewCount": 1250,
  "createdAt": "2024-01-10T14:30:00Z",
  "updatedAt": "2024-01-15T09:45:00Z"
}
```

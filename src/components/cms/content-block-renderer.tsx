'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ContentBlockType = 
  | 'HERO'
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'CTA'
  | 'PRODUCT_GRID'
  | 'CATEGORY_GRID'
  | 'TESTIMONIALS'
  | 'FAQ'
  | 'NEWSLETTER'
  | 'CUSTOM_HTML'

interface ContentBlock {
  id: string
  name: string
  type: ContentBlockType
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null
  order: number
}

interface ContentBlockRendererProps {
  blocks: ContentBlock[]
  className?: string
}

export function ContentBlockRenderer({ blocks, className }: ContentBlockRendererProps) {
  return (
    <div className={cn('space-y-12', className)}>
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
    </div>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  const { type, content, settings } = block

  switch (type) {
    case 'HERO':
      return <HeroBlock content={content} settings={settings} />
    case 'TEXT':
      return <TextBlock content={content} settings={settings} />
    case 'IMAGE':
      return <ImageBlock content={content} settings={settings} />
    case 'VIDEO':
      return <VideoBlock content={content} settings={settings} />
    case 'CTA':
      return <CTABlock content={content} settings={settings} />
    case 'FAQ':
      return <FAQBlock content={content} settings={settings} />
    case 'NEWSLETTER':
      return <NewsletterBlock content={content} settings={settings} />
    case 'CUSTOM_HTML':
      return <CustomHTMLBlock content={content} />
    default:
      return null
  }
}

// Hero Block
function HeroBlock({ 
  content, 
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const {
    title,
    subtitle,
    backgroundImage,
    buttonText,
    buttonLink,
    alignment = 'center'
  } = content as {
    title?: string
    subtitle?: string
    backgroundImage?: string
    buttonText?: string
    buttonLink?: string
    alignment?: 'left' | 'center' | 'right'
  }

  return (
    <section 
      className={cn(
        'relative min-h-[400px] flex items-center justify-center bg-cover bg-center',
        settings?.fullWidth ? 'w-screen -mx-4' : ''
      )}
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className={cn(
        'relative z-10 container px-4 text-white',
        alignment === 'center' && 'text-center',
        alignment === 'right' && 'text-right'
      )}>
        {title && (
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        )}
        {subtitle && (
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">{subtitle}</p>
        )}
        {buttonText && buttonLink && (
          <Button asChild size="lg" variant="gradient">
            <Link href={buttonLink}>{buttonText}</Link>
          </Button>
        )}
      </div>
    </section>
  )
}

// Text Block
function TextBlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { title, body } = content as { title?: string; body?: string }

  return (
    <section className={cn('container px-4', settings?.className as string)}>
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
      )}
      {body && (
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </section>
  )
}

// Image Block
function ImageBlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { src, alt, caption } = content as { 
    src?: string
    alt?: string
    caption?: string 
  }

  if (!src) return null

  return (
    <figure className={cn('container px-4', settings?.className as string)}>
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={src}
          alt={alt || ''}
          fill
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// Video Block
function VideoBlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { url, title } = content as { url?: string; title?: string }

  if (!url) return null

  // Handle YouTube/Vimeo embeds
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const isVimeo = url.includes('vimeo.com')

  if (isYouTube || isVimeo) {
    let embedUrl = url
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (isVimeo) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      embedUrl = `https://player.vimeo.com/video/${videoId}`
    }

    return (
      <section className={cn('container px-4', settings?.className as string)}>
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    )
  }

  return (
    <section className={cn('container px-4', settings?.className as string)}>
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      <video 
        src={url} 
        controls 
        className="w-full rounded-lg"
      />
    </section>
  )
}

// CTA Block
function CTABlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { 
    title, 
    description, 
    buttonText, 
    buttonLink,
    backgroundColor 
  } = content as {
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    backgroundColor?: string
  }

  return (
    <section 
      className={cn(
        'py-12 px-4 text-center',
        settings?.className as string
      )}
      style={{ backgroundColor: backgroundColor || '#f97316' }}
    >
      <div className="container max-w-2xl mx-auto text-white">
        {title && (
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
        )}
        {description && (
          <p className="text-lg mb-6 opacity-90">{description}</p>
        )}
        {buttonText && buttonLink && (
          <Button asChild size="lg" variant="secondary">
            <Link href={buttonLink}>{buttonText}</Link>
          </Button>
        )}
      </div>
    </section>
  )
}

// FAQ Block
function FAQBlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { title, items } = content as {
    title?: string
    items?: Array<{ question: string; answer: string }>
  }

  return (
    <section className={cn('container px-4', settings?.className as string)}>
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title}</h2>
      )}
      <div className="max-w-3xl mx-auto space-y-4">
        {items?.map((item, idx) => (
          <details 
            key={idx}
            className="group border rounded-lg p-4 cursor-pointer"
          >
            <summary className="font-medium list-none flex items-center justify-between">
              {item.question}
              <span className="ml-2 transition-transform group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-4 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

// Newsletter Block
function NewsletterBlock({ 
  content,
  settings 
}: { 
  content: Record<string, unknown>
  settings?: Record<string, unknown> | null 
}) {
  const { title, description, placeholder, buttonText } = content as {
    title?: string
    description?: string
    placeholder?: string
    buttonText?: string
  }

  return (
    <section 
      className={cn(
        'py-12 px-4 bg-orange-600 text-white',
        settings?.className as string
      )}
    >
      <div className="container max-w-xl mx-auto text-center">
        {title && (
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
        )}
        {description && (
          <p className="mb-6 opacity-90">{description}</p>
        )}
        <form className="flex gap-2">
          <input
            type="email"
            placeholder={placeholder || 'votre@email.com'}
            className="flex-1 px-4 py-2 rounded-lg text-gray-900"
          />
          <Button type="submit" variant="secondary">
            {buttonText || "S'inscrire"}
          </Button>
        </form>
      </div>
    </section>
  )
}

// Custom HTML Block
function CustomHTMLBlock({ content }: { content: Record<string, unknown> }) {
  const { html } = content as { html?: string }

  if (!html) return null

  return (
    <div 
      className="container px-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

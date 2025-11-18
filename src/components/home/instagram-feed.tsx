'use client'

import * as React from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { Heart, MessageCircle, ExternalLink, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RippleButton } from '@/components/ui/ripple-button'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface InstagramPost {
  id: string
  imageUrl: string
  caption?: string
  likes: number
  comments: number
  permalink: string
}

interface InstagramFeedProps extends React.HTMLAttributes<HTMLElement> {
  instagramHandle?: string
  title?: string
  subtitle?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch Instagram posts')
  return res.json()
}

export default function InstagramFeed({
  instagramHandle = '@mientior',
  title = 'Suivez-Nous sur Instagram',
  subtitle = 'Rejoignez notre communauté et partagez vos looks',
  className,
  ...props
}: InstagramFeedProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  // Fetch Instagram posts from API
  const { data, error, isLoading } = useSWR<{
    success: boolean
    posts: InstagramPost[]
    cachedAt: string
    source: 'api' | 'cache' | 'fallback'
  }>('/api/instagram', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 3600000, // 1 hour client-side refresh
  })

  const posts = data?.posts || []

  if (isLoading) {
    return (
      <section className={cn('py-10 md:py-14', className)}>
        <div className="container mx-auto px-3 md:px-4 lg:px-6">
          <div className="mb-8 text-center">
            <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
              {title}
            </h2>
            <p className="text-lg text-nuanced-600">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-platinum-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !posts || posts.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14', className)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 flex flex-col items-center text-center',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <Camera className="h-8 w-8 text-orange-500" />
            <h2 className="font-display text-display-md md:text-display-lg text-anthracite-700">
              {title}
            </h2>
          </div>
          <p className="mb-6 text-lg text-nuanced-600">{subtitle}</p>
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xl font-semibold text-orange-500 transition-colors hover:text-orange-600"
          >
            {instagramHandle}
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {posts.map((post, index) => (
            <InstagramPostCard
              key={post.id}
              post={post}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <div
          className={cn(
            'mt-12 text-center',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
          style={{ animationDelay: '400ms' }}
        >
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <RippleButton
              variant="gradient"
              size="lg"
              className="group gap-2"
            >
              <Camera className="h-5 w-5" />
              Suivre sur Instagram
              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </a>
        </div>
      </div>
    </section>
  )
}

interface InstagramPostCardProps {
  post: InstagramPost
  className?: string
  style?: React.CSSProperties
}

function InstagramPostCard({ post, className, style }: InstagramPostCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative block overflow-hidden rounded-xl bg-platinum-100 transition-all duration-300',
        'hover:shadow-elevation-3 hover:-translate-y-1',
        className
      )}
      style={style}
    >
      {/* Image */}
      <div className="relative aspect-square">
        <Image
          src={post.imageUrl}
          alt={post.caption || 'Instagram post'}
          fill
          className={cn(
            'object-cover transition-all duration-500 group-hover:scale-110',
            !isImageLoaded && 'blur-sm',
            isImageLoaded && 'blur-0'
          )}
          sizes="(max-width: 768px) 50vw, 33vw"
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300',
            'opacity-0 group-hover:opacity-100'
          )}
        />

        {/* Instagram Icon (Top Right) */}
        <div
          className={cn(
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300',
            'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
          )}
        >
          <Camera className="h-4 w-4 text-white" />
        </div>

        {/* Stats Overlay */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 p-4 transition-all duration-300',
            'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          )}
        >
          {/* Caption (if available) */}
          {post.caption && (
            <p className="mb-3 line-clamp-2 text-sm text-white">
              {post.caption}
            </p>
          )}

          {/* Likes and Comments */}
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-white" />
              <span className="text-sm font-medium">{formatCount(post.likes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{formatCount(post.comments)}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

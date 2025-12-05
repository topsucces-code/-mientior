/**
 * Blog Post Detail Page
 * Display full blog post content
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Calendar, Clock, User, ArrowLeft, Tag, Share2, Heart, Eye } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

interface BlogSEO {
  title?: string
  description?: string
  keywords?: string[]
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    select: { title: true, excerpt: true, seo: true, featuredImage: true },
  })

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const seo = post.seo as BlogSEO | null

  return {
    title: seo?.title || `${post.title} | Mientior Blog`,
    description: seo?.description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
    },
  }
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      tags: {
        include: { tag: true },
      },
    },
  })

  if (!post) return null

  // Increment views
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  })

  return post
}

async function getRelatedPosts(categoryId: string | null, currentId: string) {
  if (!categoryId) return []

  return prisma.blogPost.findMany({
    where: {
      categoryId,
      status: 'PUBLISHED',
      id: { not: currentId },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      readTime: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.categoryId, post.id)
  const content = post.content as { blocks?: Array<{ type: string; data: Record<string, unknown> }> }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-platinum-50 py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-nuanced-600 hover:text-anthracite-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Category */}
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 hover:bg-orange-200"
            >
              {post.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="mt-4 text-3xl font-bold text-anthracite-700 md:text-4xl">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-nuanced-600">
            {post.authorName && (
              <div className="flex items-center gap-2">
                {post.authorAvatar ? (
                  <Image
                    src={post.authorAvatar}
                    alt={post.authorName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-platinum-200">
                    <User className="h-4 w-4 text-platinum-500" />
                  </div>
                )}
                <span>{post.authorName}</span>
              </div>
            )}

            {post.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
            )}

            {post.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.views} views</span>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative mt-8 aspect-video overflow-hidden rounded-xl">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-8 text-lg leading-relaxed text-nuanced-600">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="prose prose-lg mt-8 max-w-none">
            {content.blocks?.map((block, idx) => {
              switch (block.type) {
                case 'paragraph':
                  return (
                    <p key={idx} className="mb-4 text-nuanced-700">
                      {block.data.text as string}
                    </p>
                  )
                case 'header':
                  const level = (block.data.level as number) || 2
                  const text = block.data.text as string
                  if (level === 1) return <h1 key={idx} className="mb-4 mt-8 text-2xl font-bold text-anthracite-700">{text}</h1>
                  if (level === 2) return <h2 key={idx} className="mb-4 mt-8 text-xl font-bold text-anthracite-700">{text}</h2>
                  if (level === 3) return <h3 key={idx} className="mb-4 mt-6 text-lg font-bold text-anthracite-700">{text}</h3>
                  return <h4 key={idx} className="mb-4 mt-4 font-bold text-anthracite-700">{text}</h4>
                case 'list':
                  const items = block.data.items as string[]
                  const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
                  return (
                    <ListTag key={idx} className="mb-4 list-inside space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="text-nuanced-700">{item}</li>
                      ))}
                    </ListTag>
                  )
                case 'image':
                  return (
                    <figure key={idx} className="my-8">
                      <div className="relative aspect-video overflow-hidden rounded-lg">
                        <Image
                          src={block.data.url as string}
                          alt={(block.data.caption as string) || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {block.data.caption ? (
                        <figcaption className="mt-2 text-center text-sm text-nuanced-500">
                          {String(block.data.caption)}
                        </figcaption>
                      ) : null}
                    </figure>
                  )
                case 'quote':
                  return (
                    <blockquote key={idx} className="my-6 border-l-4 border-orange-500 pl-4 italic text-nuanced-600">
                      {block.data.text as string}
                      {block.data.caption ? (
                        <cite className="mt-2 block text-sm not-italic">
                          — {String(block.data.caption)}
                        </cite>
                      ) : null}
                    </blockquote>
                  )
                default:
                  return null
              }
            })}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-nuanced-500" />
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="rounded-full bg-platinum-100 px-3 py-1 text-sm text-nuanced-600 hover:bg-platinum-200"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 flex items-center justify-between border-t border-platinum-200 pt-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-nuanced-600">Share this article:</span>
              <div className="flex gap-2">
                <button className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-600 hover:bg-red-200">
              <Heart className="h-4 w-4" />
              <span>{post.likes}</span>
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-platinum-50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-2xl font-bold text-anthracite-700">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group overflow-hidden rounded-lg border border-platinum-200 bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-platinum-200">
                    {related.featuredImage ? (
                      <Image
                        src={related.featuredImage}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-anthracite-700 group-hover:text-orange-600">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-nuanced-600">
                        {related.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-nuanced-500">
                      <span>{formatDate(related.publishedAt)}</span>
                      {related.readTime && <span>{related.readTime} min read</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

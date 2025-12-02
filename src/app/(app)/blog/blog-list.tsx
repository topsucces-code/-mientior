'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImage: string | null
  publishedAt: Date | null
  readTime: number | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  _count: {
    posts: number
  }
}

interface BlogListProps {
  posts: BlogPost[]
  categories: BlogCategory[]
  currentCategory?: string
  currentTag?: string
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function BlogList({
  posts,
  categories,
  currentCategory,
  currentTag,
  pagination
}: BlogListProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-lg mb-4">Catégories</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/blog"
                    className={cn(
                      'block px-3 py-2 rounded-md transition-colors',
                      !currentCategory
                        ? 'bg-orange-100 text-orange-700'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    Toutes les catégories
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/blog?category=${cat.slug}`}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md transition-colors',
                        currentCategory === cat.slug
                          ? 'bg-orange-100 text-orange-700'
                          : 'hover:bg-gray-100'
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="text-sm text-gray-500">
                        {cat._count.posts}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Tags */}
            {currentTag && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-lg mb-4">Tag actif</h3>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                >
                  <Tag className="h-3 w-3" />
                  {currentTag}
                  <span className="ml-1">×</span>
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Aucun article trouvé.
              </p>
              <Link href="/blog" className="text-orange-600 hover:underline mt-2 inline-block">
                Voir tous les articles
              </Link>
            </div>
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="relative aspect-[16/10] bg-gray-100">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📝</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      {post.category && (
                        <Link
                          href={`/blog?category=${post.category.slug}`}
                          className="text-xs font-medium text-orange-600 hover:underline"
                        >
                          {post.category.name}
                        </Link>
                      )}
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="font-semibold text-lg mt-1 mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                        {post.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime} min
                          </span>
                        )}
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/blog?tag=${tag.slug}`}
                              className="text-xs px-2 py-0.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              #{tag.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    asChild={pagination.page > 1}
                  >
                    {pagination.page > 1 ? (
                      <Link href={`/blog?page=${pagination.page - 1}${currentCategory ? `&category=${currentCategory}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Link>
                    ) : (
                      <>
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </>
                    )}
                  </Button>

                  <span className="text-sm text-gray-600 px-4">
                    Page {pagination.page} sur {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    asChild={pagination.page < pagination.totalPages}
                  >
                    {pagination.page < pagination.totalPages ? (
                      <Link href={`/blog?page=${pagination.page + 1}${currentCategory ? `&category=${currentCategory}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

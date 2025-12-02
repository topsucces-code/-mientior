'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, TrendingUp, Package, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ProductCard, ProductCardProps } from '@/components/products/product-card'
import { cn } from '@/lib/utils'

export interface SearchProduct extends Omit<ProductCardProps, 'onQuickView'> {
  category?: string
}

export interface SearchBrand {
  id: string
  name: string
  slug: string
  logo?: string
  productCount: number
}

export interface SearchArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  image?: string
  publishedAt: string
  category?: string
}

export interface SearchResultsData {
  products: SearchProduct[]
  brands: SearchBrand[]
  articles: SearchArticle[]
  totalProducts?: number
  totalBrands?: number
  totalArticles?: number
}

export interface SearchResultsProps {
  query: string
  results: SearchResultsData
  onQueryChange?: (query: string) => void
  onClearQuery?: () => void
  className?: string
  correctedQuery?: string
  originalQuery?: string
}

export function SearchResults({
  query,
  results,
  onQueryChange,
  onClearQuery,
  className,
  correctedQuery,
  originalQuery,
}: SearchResultsProps) {
  const [searchInput, setSearchInput] = React.useState(query)

  React.useEffect(() => {
    setSearchInput(query)
  }, [query])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onQueryChange?.(searchInput)
  }

  const totalResults =
    (results.totalProducts || results.products.length) +
    (results.totalBrands || results.brands.length) +
    (results.totalArticles || results.articles.length)

  const hasResults = totalResults > 0

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Search Header */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nuanced-500" />
          <Input
            type="search"
            placeholder="Search products, brands, articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-11 pr-12 text-base h-12"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                onClearQuery?.()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-nuanced-500 hover:text-anthracite-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>

        {query && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-anthracite-700">
                Search results for "{query}"
              </h1>
              <p className="text-sm text-nuanced-600">
                {totalResults} {totalResults === 1 ? 'result' : 'results'} found
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Spell Correction Message */}
      {correctedQuery && originalQuery && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <p className="text-sm text-anthracite-700">
              Résultats pour{' '}
              <span className="font-semibold">&ldquo;{correctedQuery}&rdquo;</span>
              {' '}·{' '}
              <button
                onClick={() => onQueryChange?.(originalQuery)}
                className="text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
              >
                Rechercher plutôt &ldquo;{originalQuery}&rdquo;
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!hasResults && query && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-12 w-12 text-nuanced-400" />
            <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
              No results found
            </h3>
            <p className="mb-4 text-sm text-nuanced-600">
              We couldn't find anything matching "{query}". Try different keywords or browse our categories.
            </p>
            <Button variant="gradient" asChild>
              <Link href="/products">Browse All Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {hasResults && (
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
              {(results.totalProducts || results.products.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {results.totalProducts || results.products.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="brands" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Brands
              {(results.totalBrands || results.brands.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {results.totalBrands || results.brands.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Articles
              {(results.totalArticles || results.articles.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {results.totalArticles || results.articles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            {results.products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-nuanced-400" />
                  <p className="text-sm text-nuanced-600">No products found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="mt-6">
            {results.brands.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="mx-auto mb-3 h-10 w-10 text-nuanced-400" />
                  <p className="text-sm text-nuanced-600">No brands found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.brands.map((brand) => (
                  <Card key={brand.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-6">
                      {brand.logo ? (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-platinum-300">
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            className="object-contain p-2"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border border-platinum-300 bg-platinum-100">
                          <TrendingUp className="h-6 w-6 text-nuanced-400" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <Link
                          href={`/brands/${brand.slug}`}
                          className="font-semibold text-anthracite-700 hover:text-orange-500 hover:underline"
                        >
                          {brand.name}
                        </Link>
                        <p className="text-xs text-nuanced-600">
                          {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/brands/${brand.slug}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-6">
            {results.articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-nuanced-400" />
                  <p className="text-sm text-nuanced-600">No articles found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {results.articles.map((article) => (
                  <Card key={article.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <div className="flex flex-col sm:flex-row">
                      {article.image ? (
                        <div className="relative h-48 w-full flex-shrink-0 sm:h-auto sm:w-48">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 192px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-48 w-full flex-shrink-0 items-center justify-center bg-platinum-100 sm:h-auto sm:w-48">
                          <FileText className="h-10 w-10 text-nuanced-400" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">
                              <Link
                                href={`/blog/${article.slug}`}
                                className="hover:text-orange-500 hover:underline"
                              >
                                {article.title}
                              </Link>
                            </CardTitle>
                            {article.category && (
                              <Badge variant="outline" className="whitespace-nowrap">
                                {article.category}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {new Date(article.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="line-clamp-3 text-sm text-nuanced-600">
                            {article.excerpt}
                          </p>
                          <Button variant="link" className="mt-3 p-0" asChild>
                            <Link href={`/blog/${article.slug}`}>Read more →</Link>
                          </Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

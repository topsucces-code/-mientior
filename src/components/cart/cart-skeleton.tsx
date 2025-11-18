'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border border-platinum-300 bg-white p-4">
      <Skeleton className="h-24 w-24 flex-shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  )
}

export function CartSummarySkeleton() {
  return (
    <Card className="shadow-elevation-2 p-6">
      <Skeleton className="h-6 w-40 mb-6" />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-px w-full my-4" />
        <div className="flex justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    </Card>
  )
}

export function CartPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-16 w-full mb-4" />
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
        <div>
          <CartSummarySkeleton />
        </div>
      </div>
    </div>
  )
}

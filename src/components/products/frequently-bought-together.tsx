'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/stores/cart.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Product, BundleProduct, BundleProductInfo } from '@/types';

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  bundleProducts: BundleProduct[];
  discount?: number; // Default discount if not specified per-product
}

export function FrequentlyBoughtTogether({
  mainProduct,
  bundleProducts,
  discount = 5,
}: FrequentlyBoughtTogetherProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set([mainProduct.id, ...bundleProducts.map((bp) => bp.product.id)])
  );

  const { addItem } = useCartStore();
  const { toast } = useToast();

  const toggleProduct = (productId: string) => {
    if (productId === mainProduct.id) return; // Main product always selected

    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    if (selectedProducts.has(mainProduct.id)) {
      total += mainProduct.price;
    }
    bundleProducts.forEach((bp) => {
      if (selectedProducts.has(bp.product.id)) {
        total += bp.product.price;
      }
    });
    return total;
  };

  const calculateSavings = () => {
    let totalDiscount = 0;
    
    // Add main product discount if selected
    if (selectedProducts.has(mainProduct.id)) {
      totalDiscount += (mainProduct.price * discount) / 100;
    }
    
    // Add per-product discounts for bundle products
    bundleProducts.forEach((bp) => {
      if (selectedProducts.has(bp.product.id)) {
        const productDiscount = bp.discount !== undefined ? bp.discount : discount;
        totalDiscount += (bp.product.price * productDiscount) / 100;
      }
    });
    
    return totalDiscount;
  };

  const handleAddAllToCart = () => {
    const productsToAdd = [
      mainProduct,
      ...bundleProducts.map((bp) => bp.product),
    ].filter((product) => selectedProducts.has(product.id));

    productsToAdd.forEach((product) => {
      const productStock = 'stock' in product ? (product as { stock: number }).stock : 0
      addItem({
        id: product.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0]?.url || '',
        price: product.price,
        quantity: 1,
        stock: productStock,
      });
    });

    toast({
      title: 'Produits ajoutés au panier',
      description: `${productsToAdd.length} produit(s) ont été ajoutés à votre panier.`,
    });
  };

  const total = calculateTotal();
  const savings = calculateSavings();
  const finalTotal = total - savings;

  if (bundleProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border-2 border-platinum-300 p-6">
      <h2 className="text-xl font-bold text-graphite-900 mb-4">
        Souvent achetés ensemble
      </h2>

      {/* Products Grid - Responsive */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 mb-6">
        {/* Main Product */}
        <ProductCard
          product={mainProduct}
          isSelected={selectedProducts.has(mainProduct.id)}
          onToggle={() => {}} // Can't toggle main product
          isMainProduct
        />

        {bundleProducts.map((bundleProduct) => (
          <div key={bundleProduct.product.id} className="contents">
            <div className="hidden md:flex items-center justify-center text-platinum-400">
              <Plus className="h-6 w-6" />
            </div>
            <ProductCard
              product={bundleProduct.product}
              isSelected={selectedProducts.has(bundleProduct.product.id)}
              onToggle={() => toggleProduct(bundleProduct.product.id)}
            />
          </div>
        ))}
      </div>

      {/* Pricing and CTA */}
      <div className="border-t border-platinum-300 pt-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-graphite-600">Prix total:</span>
          <span className="text-graphite-600 line-through">{total.toFixed(2)} €</span>
        </div>
        {savings > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              Économisez {savings.toFixed(2)} € en achetant ensemble
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-graphite-900">Total:</span>
          <span className="text-2xl font-bold text-orange-600">
            {finalTotal.toFixed(2)} €
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddAllToCart}
          disabled={selectedProducts.size === 0}
          className={cn(
            'w-full md:w-auto px-8 py-3 rounded-lg font-semibold transition-all',
            'bg-orange-600 text-white hover:bg-orange-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Ajouter tout au panier ({selectedProducts.size} articles)
        </button>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product | BundleProductInfo;
  isSelected: boolean;
  onToggle: () => void;
  isMainProduct?: boolean;
}

function ProductCard({
  product,
  isSelected,
  onToggle,
  isMainProduct = false,
}: ProductCardProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-platinum-300 bg-platinum-50 md:flex-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={isMainProduct}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'bg-orange-600 border-orange-600'
            : 'bg-white border-platinum-300',
          isMainProduct ? 'cursor-not-allowed' : 'cursor-pointer hover:border-orange-600'
        )}
        aria-label={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${product.name}`}
      >
        {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </button>
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white">
        <Image
          src={product.images[0]?.url || '/placeholder-product.jpg'}
          alt={product.images[0]?.alt || product.name}
          fill
          className="object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-graphite-900 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-base font-bold text-graphite-900">
          {product.price.toFixed(2)} €
        </p>
      </div>
    </div>
  );
}

/**
 * Akeneo to Prisma Product Transformer
 *
 * This module transforms Akeneo PIM products into Prisma ProductCreateInput objects.
 * It handles localization (fr_FR, en_US), category/vendor mapping, slug generation,
 * variant extraction, image extraction, and technical attribute mapping.
 *
 * Transformation Flow:
 * 1. Extract basic fields (name, description, price) from Akeneo's localized attributes
 * 2. Generate unique slugs with collision detection
 * 3. Map Akeneo category codes to Prisma Category IDs
 * 4. Map vendor/brand attributes to Prisma Vendor IDs
 * 5. Extract nested relations (images, variants, specifications)
 * 6. Assemble complete ProductCreateInput object
 *
 * @module akeneo-transformer
 */

import { Prisma, ProductStatus, ApprovalStatus } from '@prisma/client';
import { AkeneoProduct, AkeneoAttributeValue } from '@/types/akeneo';
import { slugify } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

// ============================================================================
// CONSTANTS
// ============================================================================

// Attribute codes (Akeneo)
const ATTR_NAME = 'name';
const ATTR_DESCRIPTION = 'description';
const ATTR_PRICE = 'price';
const ATTR_COMPARE_AT_PRICE = 'compare_at_price';
const ATTR_STOCK = 'stock';
const ATTR_IMAGES = 'images';
const ATTR_MAIN_IMAGE = 'main_image';
const ATTR_SIZE = 'size';
const ATTR_COLOR = 'color';
const ATTR_PRICE_MODIFIER = 'price_modifier';
const ATTR_FEATURED = 'featured';
const ATTR_ON_SALE = 'on_sale';
const ATTR_BRAND = 'brand';
const ATTR_VENDOR = 'vendor';
const ATTR_WEIGHT = 'weight';
const ATTR_DIMENSIONS = 'dimensions';
const ATTR_MATERIAL = 'material';
const ATTR_CARE_INSTRUCTIONS = 'care_instructions';
const ATTR_COUNTRY_OF_ORIGIN = 'country_of_origin';

// Locales
const LOCALE_FR = 'fr_FR';
const LOCALE_EN = 'en_US';

// Defaults
const DEFAULT_STOCK = 0;
const DEFAULT_PRICE_MODIFIER = 0;
const MAX_SLUG_ATTEMPTS = 10;

// Technical attributes to extract for specifications
const TECHNICAL_ATTRIBUTES = [
  ATTR_WEIGHT,
  ATTR_DIMENSIONS,
  ATTR_MATERIAL,
  ATTR_CARE_INSTRUCTIONS,
  ATTR_COUNTRY_OF_ORIGIN,
] as const;

// ============================================================================
// INTERNAL TYPES (used for documentation and internal function type safety)
// ============================================================================

// These interfaces document the structure of objects returned by helper functions.
// They are intentionally kept here for documentation purposes even if unused in type annotations.

// In-memory caches for categories and vendors
const categoryCache = new Map<string, string | null>();
const vendorCache = new Map<string, string | null>();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract a single attribute value from Akeneo's complex values structure.
 * INTERNAL USE: Consider using type-specific helpers (getStringAttribute, getNumberAttribute, etc.)
 * to avoid repeated type checking in consuming code.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @param locale - Locale to filter by (default: 'fr_FR')
 * @param scope - Scope to filter by (default: null for global)
 * @returns Extracted value or null if not found
 *
 * @example
 * ```ts
 * getAttributeValue(product.values, 'name', 'en_US') // "Nike Air Max 90"
 * getAttributeValue(product.values, 'price') // 120.00
 * ```
 */
function getAttributeValue(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string,
  locale: string | null = LOCALE_FR,
  scope: string | null = null
): string | number | boolean | string[] | null {
  const attributeValues = values[attributeCode];

  if (!attributeValues || attributeValues.length === 0) {
    return null;
  }

  // Filter by locale and scope
  const matchingValue = attributeValues.find(val => {
    const localeMatch = locale === null || val.locale === locale;
    const scopeMatch = scope === null || val.scope === scope;
    return localeMatch && scopeMatch;
  });

  return matchingValue?.data ?? null;
}

/**
 * Extract a string attribute value from Akeneo.
 * Returns null if the attribute is not found or is not a string.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @param locale - Locale to filter by (default: 'fr_FR')
 * @param scope - Scope to filter by (default: null for global)
 * @returns String value or null
 *
 * @example
 * ```ts
 * getStringAttribute(product.values, 'name', 'en_US') // "Nike Air Max 90"
 * getStringAttribute(product.values, 'description') // "Product description"
 * ```
 */
export function getStringAttribute(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string,
  locale: string | null = LOCALE_FR,
  scope: string | null = null
): string | null {
  const value = getAttributeValue(values, attributeCode, locale, scope);
  return typeof value === 'string' ? value : null;
}

/**
 * Extract a number attribute value from Akeneo.
 * Returns null if the attribute is not found or is not a number.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @param locale - Locale to filter by (default: 'fr_FR')
 * @param scope - Scope to filter by (default: null for global)
 * @returns Number value or null
 *
 * @example
 * ```ts
 * getNumberAttribute(product.values, 'price') // 120.00
 * getNumberAttribute(product.values, 'stock') // 50
 * ```
 */
export function getNumberAttribute(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string,
  locale: string | null = null,
  scope: string | null = null
): number | null {
  const value = getAttributeValue(values, attributeCode, locale, scope);
  return typeof value === 'number' ? value : null;
}

/**
 * Extract a boolean attribute value from Akeneo.
 * Returns null if the attribute is not found or is not a boolean.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @param locale - Locale to filter by (default: 'fr_FR')
 * @param scope - Scope to filter by (default: null for global)
 * @returns Boolean value or null
 *
 * @example
 * ```ts
 * getBooleanAttribute(product.values, 'featured') // true
 * getBooleanAttribute(product.values, 'on_sale') // false
 * ```
 */
export function getBooleanAttribute(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string,
  locale: string | null = null,
  scope: string | null = null
): boolean | null {
  const value = getAttributeValue(values, attributeCode, locale, scope);
  return typeof value === 'boolean' ? value : null;
}

/**
 * Extract a string array attribute value from Akeneo.
 * Returns null if the attribute is not found or is not a string array.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @param locale - Locale to filter by (default: 'fr_FR')
 * @param scope - Scope to filter by (default: null for global)
 * @returns String array or null
 *
 * @example
 * ```ts
 * getStringArrayAttribute(product.values, 'sizes') // ["S", "M", "L"]
 * getStringArrayAttribute(product.values, 'colors') // ["red", "blue"]
 * ```
 */
export function getStringArrayAttribute(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string,
  locale: string | null = null,
  scope: string | null = null
): string[] | null {
  const value = getAttributeValue(values, attributeCode, locale, scope);
  return Array.isArray(value) ? value : null;
}

/**
 * Extract both French and English values for a localized attribute.
 *
 * @param values - Akeneo product values object
 * @param attributeCode - Attribute code to extract
 * @returns Object with fr and en keys
 *
 * @example
 * ```ts
 * getLocalizedValues(product.values, 'description')
 * // { fr: "Description FR", en: "Description EN" }
 * ```
 */
export function getLocalizedValues(
  values: Record<string, AkeneoAttributeValue[]>,
  attributeCode: string
): { fr: string | null; en: string | null } {
  return {
    fr: getStringAttribute(values, attributeCode, LOCALE_FR),
    en: getStringAttribute(values, attributeCode, LOCALE_EN),
  };
}

/**
 * Generate a unique slug with collision detection.
 *
 * @param baseName - Base name to slugify
 * @param akeneoIdentifier - Akeneo product identifier (fallback)
 * @returns Unique slug
 * @throws Error if max attempts exceeded
 *
 * @example
 * ```ts
 * await generateUniqueSlug("Nike Air Max 90", "nike-air-max-90")
 * // "nike-air-max-90" or "nike-air-max-90-2" if collision
 * ```
 */
export async function generateUniqueSlug(
  baseName: string,
  akeneoIdentifier: string
): Promise<string> {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 1;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      if (attempt > 0) {
        console.warn(
          `Slug collision detected for "${baseName}". Using "${slug}"`
        );
      }
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Final fallback: append Akeneo identifier
  const fallbackSlug = `${baseSlug}-${slugify(akeneoIdentifier)}`;
  console.warn(
    `Max slug attempts exceeded for "${baseName}". Using fallback: "${fallbackSlug}"`
  );

  return fallbackSlug;
}

/**
 * Extract product variants from Akeneo attributes (size, color, SKU).
 * Creates Cartesian product if multiple sizes/colors exist.
 *
 * SKU Generation Strategy:
 * - SKUs are derived from the Akeneo product identifier plus size/color attributes
 * - Pattern: `{identifier}-{size}-{color}` or `{identifier}-{size}` or `{identifier}-{color}`
 * - If no size/color variants exist, the SKU is the product identifier itself
 * - If Akeneo defines a dedicated variant SKU attribute in the future, this logic should
 *   be updated to read that attribute via ATTR_VARIANT_SKU and prefer it over the concatenated pattern
 *
 * @param akeneoProduct - Akeneo product object
 * @returns Array of variant create inputs
 *
 * @example
 * ```ts
 * extractVariants(product)
 * // [{ sku: 'nike-air-max-90-42-red', size: '42', color: 'red', stock: 10, priceModifier: 0 }]
 * ```
 */
export function extractVariants(
  akeneoProduct: AkeneoProduct
): Prisma.ProductVariantCreateWithoutProductInput[] {
  const sizeValue = getAttributeValue(akeneoProduct.values, ATTR_SIZE);
  const colorValue = getAttributeValue(akeneoProduct.values, ATTR_COLOR);
  const stockValue = getNumberAttribute(akeneoProduct.values, ATTR_STOCK);
  const priceModifierValue = getNumberAttribute(
    akeneoProduct.values,
    ATTR_PRICE_MODIFIER
  );

  // Normalize to arrays
  const sizes = Array.isArray(sizeValue)
    ? sizeValue
    : sizeValue
    ? [String(sizeValue)]
    : [];
  const colors = Array.isArray(colorValue)
    ? colorValue
    : colorValue
    ? [String(colorValue)]
    : [];

  const baseStock = stockValue ?? DEFAULT_STOCK;
  const basePriceModifier = priceModifierValue ?? DEFAULT_PRICE_MODIFIER;

  const variants: Prisma.ProductVariantCreateWithoutProductInput[] = [];

  // Cartesian product of sizes and colors
  if (sizes.length > 0 && colors.length > 0) {
    for (const size of sizes) {
      for (const color of colors) {
        variants.push({
          sku: `${akeneoProduct.identifier}-${size}-${color}`,
          size: size || null,
          color: color || null,
          stock: baseStock,
          priceModifier: basePriceModifier,
        });
      }
    }
  } else if (sizes.length > 0) {
    // Only sizes
    for (const size of sizes) {
      variants.push({
        sku: `${akeneoProduct.identifier}-${size}`,
        size: size || null,
        color: null,
        stock: baseStock,
        priceModifier: basePriceModifier,
      });
    }
  } else if (colors.length > 0) {
    // Only colors
    for (const color of colors) {
      variants.push({
        sku: `${akeneoProduct.identifier}-${color}`,
        size: null,
        color: color || null,
        stock: baseStock,
        priceModifier: basePriceModifier,
      });
    }
  } else {
    // No variants, create single variant with product identifier as SKU
    variants.push({
      sku: akeneoProduct.identifier,
      size: null,
      color: null,
      stock: baseStock,
      priceModifier: basePriceModifier,
    });
  }

  return variants;
}

/**
 * Extract product images from Akeneo media attributes.
 * Currently extracts only IMAGE type from Akeneo. All images are marked as type='IMAGE'.
 * If Akeneo introduces dedicated attributes for videos or 360-degree views,
 * this function should be extended to read those attributes and set appropriate types.
 *
 * @param akeneoProduct - Akeneo product object
 * @returns Array of image create inputs
 *
 * @example
 * ```ts
 * extractImages(product)
 * // [{ url: 'https://cdn.akeneo.com/img1.jpg', alt: 'Nike Air Max 90', type: 'IMAGE', order: 0 }]
 * ```
 */
export function extractImages(
  akeneoProduct: AkeneoProduct
): Prisma.ProductImageCreateWithoutProductInput[] {
  const mainImageValue = getStringAttribute(
    akeneoProduct.values,
    ATTR_MAIN_IMAGE
  );
  const imagesValue = getAttributeValue(akeneoProduct.values, ATTR_IMAGES);

  const productName = getStringAttribute(
    akeneoProduct.values,
    ATTR_NAME,
    LOCALE_FR
  );
  const altText = productName || akeneoProduct.identifier;

  const imageUrls: string[] = [];

  // Add main image first
  if (mainImageValue) {
    imageUrls.push(mainImageValue);
  }

  // Add additional images
  if (Array.isArray(imagesValue)) {
    imageUrls.push(...imagesValue.filter((url): url is string => typeof url === 'string'));
  } else if (typeof imagesValue === 'string') {
    imageUrls.push(imagesValue);
  }

  // Remove duplicates and create image objects
  const uniqueUrls = Array.from(new Set(imageUrls));

  return uniqueUrls.map((url, index) => ({
    url,
    alt: altText,
    type: 'IMAGE', // Only IMAGE type is extracted from Akeneo for now
    order: index,
  }));
}

/**
 * Map Akeneo technical attributes to Prisma specifications JSON.
 *
 * @param akeneoProduct - Akeneo product object
 * @returns Specifications object
 *
 * @example
 * ```ts
 * extractAttributes(product)
 * // { weight: '500g', material: 'Leather', dimensions: '30x20x10cm' }
 * ```
 */
export function extractAttributes(
  akeneoProduct: AkeneoProduct
): Record<string, unknown> {
  const specifications: Record<string, unknown> = {};

  // Extract technical attributes
  for (const attrCode of TECHNICAL_ATTRIBUTES) {
    const value = getAttributeValue(akeneoProduct.values, attrCode);
    if (value !== null) {
      specifications[attrCode] = value;
    }
  }

  // Extract custom attributes (any attribute not in standard list)
  const standardAttributes = new Set([
    ATTR_NAME,
    ATTR_DESCRIPTION,
    ATTR_PRICE,
    ATTR_COMPARE_AT_PRICE,
    ATTR_STOCK,
    ATTR_IMAGES,
    ATTR_MAIN_IMAGE,
    ATTR_SIZE,
    ATTR_COLOR,
    ATTR_PRICE_MODIFIER,
    ATTR_FEATURED,
    ATTR_ON_SALE,
    ATTR_BRAND,
    ATTR_VENDOR,
    ...TECHNICAL_ATTRIBUTES,
  ]);

  for (const attrCode in akeneoProduct.values) {
    if (!standardAttributes.has(attrCode)) {
      const value = getAttributeValue(akeneoProduct.values, attrCode);
      if (value !== null) {
        specifications[attrCode] = value;
      }
    }
  }

  return specifications;
}

/**
 * Select the primary category from Akeneo's category array.
 * Currently returns the first category in the array (index 0).
 *
 * Selection Strategy:
 * - Uses the first category assigned in Akeneo
 * - Future enhancement: could prefer categories from specific tree prefixes (e.g., 'master' tree)
 * - Future enhancement: could implement priority-based selection rules
 *
 * @param akeneoCategories - Array of Akeneo category codes
 * @returns Primary category code
 * @throws Error if categories array is empty
 *
 * @example
 * ```ts
 * selectPrimaryCategory(['sneakers', 'footwear', 'sports']) // 'sneakers'
 * ```
 */
export function selectPrimaryCategory(akeneoCategories: string[] | undefined): string {
  if (!akeneoCategories || akeneoCategories.length === 0) {
    throw new Error('At least one category is required to select a primary category');
  }

  // Current strategy: use the first category
  // This can be enhanced based on business requirements:
  // - Prefer categories from a specific tree (e.g., master catalog)
  // - Use a priority mapping configuration
  // - Select the most specific (deepest) category in the hierarchy
  const primaryCategory = akeneoCategories[0];
  if (!primaryCategory) {
    throw new Error('Primary category is undefined or empty');
  }
  return primaryCategory;
}

/**
 * Map Akeneo category code to Prisma Category ID.
 * Uses in-memory cache to avoid repeated DB queries.
 *
 * @param akeneoCategoryCode - Akeneo category code
 * @returns Prisma Category ID or null if not found
 *
 * @example
 * ```ts
 * await mapCategory('sneakers') // 'clx123abc'
 * ```
 */
export async function mapCategory(
  akeneoCategoryCode: string
): Promise<string | null> {
  // Check cache first
  if (categoryCache.has(akeneoCategoryCode)) {
    return categoryCache.get(akeneoCategoryCode) ?? null;
  }

  // Query database
  const category = await prisma.category.findFirst({
    where: { slug: akeneoCategoryCode },
    select: { id: true },
  });

  const categoryId = category?.id ?? null;

  // Cache result
  categoryCache.set(akeneoCategoryCode, categoryId);

  if (!categoryId) {
    console.warn(
      `Category not found for Akeneo code: "${akeneoCategoryCode}". Ensure categories are synced first.`
    );
  }

  return categoryId;
}

/**
 * Map Akeneo vendor/brand attribute to Prisma Vendor ID.
 * Uses in-memory cache to avoid repeated DB queries.
 *
 * @param akeneoProduct - Akeneo product object
 * @returns Prisma Vendor ID or null if not found
 *
 * @example
 * ```ts
 * await mapVendor(product) // 'clx456def' or null
 * ```
 */
export async function mapVendor(
  akeneoProduct: AkeneoProduct
): Promise<string | null> {
  // Try brand attribute first, then vendor
  const brandValue = getStringAttribute(akeneoProduct.values, ATTR_BRAND);
  const vendorValue = getStringAttribute(akeneoProduct.values, ATTR_VENDOR);

  const vendorName = brandValue || vendorValue;

  if (!vendorName) {
    return null;
  }

  const vendorSlug = slugify(vendorName);

  // Check cache first
  if (vendorCache.has(vendorSlug)) {
    return vendorCache.get(vendorSlug) ?? null;
  }

  // Query database
  const vendor = await prisma.vendors.findFirst({
    where: { slug: vendorSlug },
    select: { id: true },
  });

  const vendorId = vendor?.id ?? null;

  // Cache result
  vendorCache.set(vendorSlug, vendorId);

  if (!vendorId) {
    console.warn(
      `Vendor not found for "${vendorName}" (slug: "${vendorSlug}"). Product will be created without vendor.`
    );
  }

  return vendorId;
}

// ============================================================================
// MAIN TRANSFORMER FUNCTION
// ============================================================================

/**
 * Transform complete Akeneo product to Prisma ProductCreateInput.
 *
 * This is the main entry point for the transformation process.
 * It orchestrates all helper functions to produce a complete ProductCreateInput object.
 *
 * @param akeneoProduct - Akeneo product object
 * @returns Prisma ProductCreateInput ready for database insertion
 * @throws Error if required fields are missing or invalid
 *
 * @example
 * ```ts
 * const akeneoProduct = await fetchFromAkeneo('nike-air-max-90');
 * const productInput = await transformAkeneoProduct(akeneoProduct);
 * const product = await prisma.product.create({ data: productInput });
 * ```
 */
export async function transformAkeneoProduct(
  akeneoProduct: AkeneoProduct
): Promise<Prisma.ProductCreateInput> {
  try {
    // ========================================================================
    // EXTRACT BASIC FIELDS
    // ========================================================================

    // Name (required, French)
    const name = getStringAttribute(
      akeneoProduct.values,
      ATTR_NAME,
      LOCALE_FR
    );
    if (!name) {
      throw new Error(
        `Missing required field: name (fr_FR) for product ${akeneoProduct.identifier}`
      );
    }

    // Name (English, optional)
    const nameEn = getStringAttribute(
      akeneoProduct.values,
      ATTR_NAME,
      LOCALE_EN
    );

    // Description (French, optional)
    const description = getStringAttribute(
      akeneoProduct.values,
      ATTR_DESCRIPTION,
      LOCALE_FR
    );

    // Description (English, optional)
    const descriptionEn = getStringAttribute(
      akeneoProduct.values,
      ATTR_DESCRIPTION,
      LOCALE_EN
    );

    // Price (required)
    const price = getNumberAttribute(akeneoProduct.values, ATTR_PRICE);
    if (price === null || price <= 0) {
      throw new Error(
        `Missing or invalid required field: price for product ${akeneoProduct.identifier}`
      );
    }

    // Compare at price (optional)
    const compareAtPrice = getNumberAttribute(
      akeneoProduct.values,
      ATTR_COMPARE_AT_PRICE
    );

    // Extract variants first to calculate total stock
    const variants = extractVariants(akeneoProduct);
    // Stock is calculated as the sum of all variant stocks.
    // Note: If Akeneo defines a global product-level stock attribute (ATTR_STOCK),
    // it is used to initialize variant stock when no size/color variants exist.
    // For products with explicit variants, the global stock attribute is ignored.
    const stock = variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);

    // Featured (optional)
    const featured = getBooleanAttribute(
      akeneoProduct.values,
      ATTR_FEATURED
    ) ?? false;

    // On sale (optional)
    const onSale = getBooleanAttribute(
      akeneoProduct.values,
      ATTR_ON_SALE
    ) ?? false;

    // Status (map Akeneo enabled flag to Prisma enum)
    const status = akeneoProduct.enabled
      ? ProductStatus.ACTIVE
      : ProductStatus.DRAFT;

    // Approval status
    // PIM-synced products always start as PENDING to ensure manual review before publication.
    // This is intentional for PIM workflows and overrides Prisma's default APPROVED status.
    const approvalStatus = ApprovalStatus.PENDING;

    // ========================================================================
    // GENERATE UNIQUE SLUG
    // ========================================================================

    const slug = await generateUniqueSlug(name, akeneoProduct.identifier);

    // ========================================================================
    // MAP CATEGORY
    // ========================================================================

    if (!akeneoProduct.categories || akeneoProduct.categories.length === 0) {
      throw new Error(
        `Missing required category for product ${akeneoProduct.identifier}`
      );
    }

    // Select primary category using defined selection strategy
    const primaryCategoryCode = selectPrimaryCategory(akeneoProduct.categories);
    const categoryId = await mapCategory(primaryCategoryCode);
    if (!categoryId) {
      throw new Error(
        `Category "${primaryCategoryCode}" not found in database for product ${akeneoProduct.identifier}`
      );
    }

    // ========================================================================
    // MAP VENDOR (OPTIONAL)
    // ========================================================================

    const vendorId = await mapVendor(akeneoProduct);

    // ========================================================================
    // EXTRACT NESTED RELATIONS
    // ========================================================================

    const images = extractImages(akeneoProduct);
    const specifications = extractAttributes(akeneoProduct);

    // ========================================================================
    // BUILD PRODUCTCREATEINPUT
    // ========================================================================

    const productInput: Prisma.ProductCreateInput = {
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      price,
      compareAtPrice,
      stock,
      featured,
      onSale,
      status,
      approvalStatus,
      specifications: specifications as Prisma.InputJsonValue,
      category: {
        connect: { id: categoryId },
      },
      ...(vendorId && {
        vendor: {
          connect: { id: vendorId },
        },
      }),
      images: {
        create: images,
      },
      variants: {
        create: variants,
      },
    };

    return productInput;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to transform Akeneo product ${akeneoProduct.identifier}: ${errorMessage}`
    );
  }
}

/**
 * Clear in-memory caches (useful for testing or memory management).
 */
export function clearCaches(): void {
  categoryCache.clear();
  vendorCache.clear();
}

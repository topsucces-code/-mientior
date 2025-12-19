/**
 * Script to generate category SVG placeholders
 * Run with: npx tsx scripts/generate-category-svgs.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface CategorySVG {
  name: string
  filename: string
  gradientStart: string
  gradientEnd: string
  iconPath?: string
}

const categories: CategorySVG[] = [
  {
    name: 'Électronique',
    filename: 'electronique.jpg',
    gradientStart: '#4F46E5',
    gradientEnd: '#7C3AED',
    iconPath: 'M 550 380 L 650 380 L 650 580 L 550 580 Z M 570 400 L 630 400 L 630 520 L 570 520 Z M 580 540 L 620 540 L 620 560 L 580 560 Z'
  },
  {
    name: 'Mode & Accessoires',
    filename: 'mode.jpg',
    gradientStart: '#EC4899',
    gradientEnd: '#F43F5E',
    iconPath: 'M 580 350 L 620 350 L 620 390 L 580 390 Z M 550 390 L 650 390 L 620 630 L 580 630 Z'
  },
  {
    name: 'Maison & Jardin',
    filename: 'maison.jpg',
    gradientStart: '#10B981',
    gradientEnd: '#14B8A6',
    iconPath: 'M 600 340 L 680 420 L 680 630 L 520 630 L 520 420 Z M 560 470 L 640 470 L 640 590 L 560 590 Z'
  },
  {
    name: 'Sports & Loisirs',
    filename: 'sports.jpg',
    gradientStart: '#F59E0B',
    gradientEnd: '#EF4444',
    iconPath: 'M 600 350 C 640 350 680 390 680 430 C 680 470 640 510 600 510 C 560 510 520 470 520 430 C 520 390 560 350 600 350 Z M 590 520 L 610 520 L 610 630 L 590 630 Z'
  },
  {
    name: 'Beauté & Santé',
    filename: 'beaute.jpg',
    gradientStart: '#A855F7',
    gradientEnd: '#EC4899',
    iconPath: 'M 600 350 C 560 350 530 380 530 420 C 530 450 545 475 570 490 L 570 630 L 630 630 L 630 490 C 655 475 670 450 670 420 C 670 380 640 350 600 350 Z'
  },
  {
    name: 'Livres & Médias',
    filename: 'livres.jpg',
    gradientStart: '#14B8A6',
    gradientEnd: '#06B6D4',
    iconPath: 'M 530 360 L 670 360 L 670 630 L 530 630 Z M 550 380 L 650 380 L 650 400 L 550 400 Z M 550 420 L 650 420 L 650 440 L 550 440 Z M 550 460 L 650 460 L 650 480 L 550 480 Z'
  },
  {
    name: 'Jouets & Enfants',
    filename: 'jouets.jpg',
    gradientStart: '#FBBF24',
    gradientEnd: '#F59E0B',
    iconPath: 'M 600 350 C 630 350 655 375 655 405 C 655 435 630 460 600 460 C 570 460 545 435 545 405 C 545 375 570 350 600 350 Z M 560 470 L 640 470 L 640 630 L 560 630 Z M 580 490 L 620 490 L 620 610 L 580 610 Z'
  },
  {
    name: 'Alimentation & Boissons',
    filename: 'alimentation.jpg',
    gradientStart: '#EF4444',
    gradientEnd: '#F97316',
    iconPath: 'M 550 350 L 650 350 L 670 630 L 530 630 Z M 570 370 L 630 370 L 640 610 L 560 610 Z'
  },
]

function generateSVG(category: CategorySVG): string {
  return `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="categoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${category.gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${category.gradientEnd};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#categoryGradient)"/>
  <g opacity="0.1">
    <circle cx="200" cy="200" r="150" fill="#FFFFFF"/>
    <circle cx="1000" cy="700" r="200" fill="#FFFFFF"/>
    <circle cx="600" cy="450" r="100" fill="#FFFFFF"/>
  </g>
  <g fill="#FFFFFF" opacity="0.9">
    ${category.iconPath ? `<path d="${category.iconPath}" stroke="#FFFFFF" stroke-width="4"/>` : '<!-- Icon placeholder -->'}
  </g>
  <text x="600" y="720" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${category.name}</text>
</svg>`
}

async function main() {
  console.log('🎨 Generating category SVG placeholders...')

  const outputDir = join(process.cwd(), 'public', 'images', 'categories')

  // Ensure directory exists
  try {
    mkdirSync(outputDir, { recursive: true })
    console.log(`✅ Directory created/verified: ${outputDir}`)
  } catch (error) {
    console.error('❌ Error creating directory:', error)
    process.exit(1)
  }

  // Generate SVG files
  for (const category of categories) {
    try {
      const svgContent = generateSVG(category)
      const filePath = join(outputDir, category.filename)
      writeFileSync(filePath, svgContent, 'utf-8')
      console.log(`✅ Created: ${category.filename} (${category.name})`)
    } catch (error) {
      console.error(`❌ Error creating ${category.filename}:`, error)
    }
  }

  console.log('✨ SVG generation completed!')
}

main()
  .catch((e) => {
    console.error('Error generating SVGs:', e)
    process.exit(1)
  })

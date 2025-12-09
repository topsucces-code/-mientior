'use client'

import * as React from 'react'
import Image from 'next/image'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'

interface Testimonial {
  id: string
  name: string
  avatar: string
  location: string
  rating: number
  text: string
  product?: {
    name: string
    image: string
  }
  date: string
  verified: boolean
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Marie Dupont',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    location: 'Dakar, Sénégal',
    rating: 5,
    text: 'Produits de qualité exceptionnelle ! La livraison était rapide et l\'emballage soigné. Je recommande vivement cette boutique.',
    product: { name: 'Robe Élégante', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&q=80' },
    date: '15 janv. 2025',
    verified: true,
  },
  {
    id: '2',
    name: 'Amadou Diallo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    location: 'Abidjan, Côte d\'Ivoire',
    rating: 5,
    text: 'Service client au top ! J\'ai eu un problème avec ma commande et ils l\'ont résolu en moins de 24h. Merci Mientior !',
    product: { name: 'Montre Connectée', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80' },
    date: '12 janv. 2025',
    verified: true,
  },
  {
    id: '3',
    name: 'Fatou Ndiaye',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    location: 'Douala, Cameroun',
    rating: 5,
    text: 'Très satisfaite de mon achat. Les photos correspondent parfaitement au produit reçu. Je reviendrai !',
    product: { name: 'Sac à Main', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&q=80' },
    date: '10 janv. 2025',
    verified: true,
  },
  {
    id: '4',
    name: 'Kofi Mensah',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    location: 'Accra, Ghana',
    rating: 5,
    text: 'Prix compétitifs et qualité au rendez-vous. Le site est facile à naviguer et le paiement sécurisé.',
    product: { name: 'Sneakers Nike', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80' },
    date: '8 janv. 2025',
    verified: true,
  },
  {
    id: '5',
    name: 'Aisha Bello',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&q=80',
    location: 'Lagos, Nigeria',
    rating: 5,
    text: 'Produit conforme à mes attentes. Livraison dans les délais annoncés. Boutique très professionnelle.',
    product: { name: 'Parfum Luxe', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&q=80' },
    date: '5 janv. 2025',
    verified: true,
  },
]

interface TestimonialsEnhancedProps {
  testimonials?: Testimonial[]
  title?: string
  subtitle?: string
}

export default function TestimonialsEnhanced({
  testimonials = defaultTestimonials,
  title = 'Ce que disent nos clients',
  subtitle = 'Des milliers de clients satisfaits nous font confiance',
}: TestimonialsEnhancedProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  // Autoplay effect
  React.useEffect(() => {
    if (!emblaApi || isPaused) return
    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 4000)
    return () => clearInterval(interval)
  }, [emblaApi, isPaused])

  return (
    <section 
      className="py-10 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-turquoise-600 via-turquoise-500 to-turquoise-600 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3">
            {title}
          </h2>
          <p className="text-turquoise-100 text-sm sm:text-base md:text-lg max-w-md mx-auto">{subtitle}</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 mt-6 sm:mt-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">50k+</div>
              <div className="text-xs sm:text-sm text-turquoise-100">Clients satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">4.9</div>
              <div className="text-xs sm:text-sm text-turquoise-100">Note moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white">98%</div>
              <div className="text-xs sm:text-sm text-turquoise-100">Recommandent</div>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id} 
                  className="embla__slide flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_75%] lg:flex-[0_0_60%] px-2 sm:px-3 md:px-4"
                >
                  <div 
                    className={cn(
                      "bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-500",
                      index === selectedIndex ? "scale-100 opacity-100" : "scale-95 opacity-60"
                    )}
                  >
                    {/* Quote Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-turquoise-100 rounded-full flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
                      <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-turquoise-600" />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-5 md:mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5",
                            i < testimonial.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-5 sm:mb-6 md:mb-8 italic">
                      "{testimonial.text}"
                    </p>

                    {/* Product */}
                    {testimonial.product && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl mb-4 sm:mb-5 md:mb-6">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={testimonial.product.image}
                            alt={testimonial.product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium line-clamp-1">
                          A acheté: {testimonial.product.name}
                        </span>
                      </div>
                    )}

                    {/* Author */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 sm:border-3 border-turquoise-500 flex-shrink-0">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-sm sm:text-base">{testimonial.name}</span>
                          {testimonial.verified && (
                            <span className="px-1.5 py-0.5 sm:px-2 bg-emerald-100 text-emerald-600 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap">
                              ✓ Vérifié
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{testimonial.location}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400">{testimonial.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={scrollPrev}
            className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-turquoise-600 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-turquoise-600 transition-all hover:scale-110"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "w-6 sm:w-8 bg-white"
                  : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

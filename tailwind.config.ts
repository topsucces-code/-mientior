import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import tailwindcssForm from '@tailwindcss/forms'
import tailwindcssTypography from '@tailwindcss/typography'
import tailwindcssAspectRatio from '@tailwindcss/aspect-ratio'
import tailwindcssContainerQueries from '@tailwindcss/container-queries'

export default {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: ['class'],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '0.75rem',
                sm: '1rem',
                lg: '1.5rem',
            },
            screens: {
                sm: '100%',
                md: '100%',
                lg: '1280px',
                xl: '1440px',
                '2xl': '1600px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                // ============================================
                // 🎨 MIENTIOR - Palette "Frais & Confiant"
                // Turquoise/Orange - Confiance + Action
                // ============================================
                
                // Turquoise (Primary) - Confiance, fiabilité, modernité
                turquoise: {
                    50: '#ECFEFF',   // Fond neutre clair
                    100: '#CFFAFE',
                    200: '#A5F3FC',
                    300: '#67E8F9',
                    400: '#22D3EE',
                    500: '#06B6D4',  // Turquoise clair (hover, badges, icônes)
                    600: '#0891B2',  // Turquoise primaire (header, navigation, liens)
                    700: '#0E7490',
                    800: '#155E75',
                    900: '#164E63',
                    950: '#083344',
                },
                // Orange CTA - Urgence, action, conversions
                orange: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',  // Orange CTA (boutons d'achat, promotions)
                    600: '#EA580C',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
                    950: '#431407',
                },
                // Gris (Textes et UI)
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',  // Gris moyen (textes secondaires)
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',  // Gris foncé (textes principaux)
                    900: '#111827',
                    950: '#030712',
                },
                // Neutral palette - tons clairs
                platinum: {
                    50: '#ECFEFF',   // Fond neutre (backgrounds sections)
                    100: '#F5F5F4',
                    200: '#E7E5E4',
                    300: '#D6D3D1',
                    400: '#A8A29E',
                    500: '#78716C',
                },
                // Legacy aliases pour compatibilité
                emerald: {
                    50: '#ECFEFF',
                    100: '#CFFAFE',
                    200: '#A5F3FC',
                    300: '#67E8F9',
                    400: '#22D3EE',
                    500: '#06B6D4',
                    600: '#0891B2',
                    700: '#0E7490',
                    800: '#155E75',
                    900: '#164E63',
                },
                taupe: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
                copper: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
                },
                // Semantic colors
                success: {
                    light: '#D1FAE5',
                    DEFAULT: '#10B981',  // Vert succès (stock disponible, validation)
                    dark: '#059669',
                },
                warning: {
                    light: '#FEF3C7',
                    DEFAULT: '#F59E0B',
                    dark: '#D97706',
                },
                error: {
                    light: '#FEE2E2',
                    DEFAULT: '#EF4444',  // Rouge alerte (stock limité, erreurs)
                    dark: '#DC2626',
                },
                info: {
                    light: '#ECFEFF',
                    DEFAULT: '#0891B2',
                    dark: '#0E7490',
                },
            },
            fontFamily: {
                sans: [
                    'var(--font-inter)',
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'sans-serif',
                ],
                display: [
                    'var(--font-poppins)',
                    'Poppins',
                    'sans-serif',
                ],
                heading: [
                    'var(--font-poppins)',
                    'Poppins',
                    'sans-serif',
                ],
            },
            fontSize: {
                // Fluid typography scale using clamp() with 1.250 ratio (Major Third)
                'display-xl': ['clamp(3rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display-lg': ['clamp(2.5rem, 4vw, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display-md': ['clamp(2rem, 3vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display-sm': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }],
                'price-lg': ['2rem', {
                    lineHeight: '1', fontWeight: '800'

                }],
                'price-md': ['1.5rem', { lineHeight: '1', fontWeight: '800' }],
                'price-sm': ['1.25rem', { lineHeight: '1', fontWeight: '700' }],
            },
            fontFeatureSettings: {
                'numeric': '"tnum"',
            },
            spacing: {
                // Custom spacing units (8px system) - using unique names to avoid overriding defaults
                'u4': '0.25rem',   // 4px
                'u8': '0.5rem',     // 8px
                'u12': '0.75rem',   // 12px
                'u16': '1rem',      // 16px
                'u24': '1.5rem',    // 24px
                'u32': '2rem',      // 32px
                'u48': '3rem',      // 48px
                'u64': '4rem',      // 64px
                'u96': '6rem',      // 96px
                'u128': '8rem',     // 128px
            },
            boxShadow: {
                // Elevation system
                'elevation-1': '0 1px 3px rgba(0,0,0,0.12)',
                'elevation-2': '0 4px 6px rgba(0,0,0,0.1)',
                'elevation-3': '0 10px 15px rgba(0,0,0,0.1)',
                'elevation-4': '0 20px 25px rgba(0,0,0,0.15)',
            },
            borderRadius: {
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
                'full': '9999px',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-in-up': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'scale-in': {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                'shimmer': {
                    from: { backgroundPosition: '-200% 0' },
                    to: { backgroundPosition: '200% 0' },
                },
                'pulse-subtle': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                },
                'ripple': {
                    '0%': { transform: 'scale(0)', opacity: '0.8' },
                    '100%': { transform: 'scale(4)', opacity: '0' },
                },
                'slide-up-stagger': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'slide-down': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(-4px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'dropdown-open': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(-6px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'slide-up': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(10px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                'fade-slide-horizontal': {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0)',
                    },
                },
                'bounce-subtle': {
                    '0%, 100%': {
                        transform: 'translateY(0)',
                    },
                    '50%': {
                        transform: 'translateY(-8px)',
                    },
                },
                'pulse-ring': {
                    '0%': {
                        opacity: '1',
                        transform: 'scale(0.95)',
                    },
                    '50%': {
                        opacity: '0.7',
                        transform: 'scale(1.05)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(0.95)',
                    },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0) scale(1)' },
                    '50%': { transform: 'translateY(-20px) scale(1.05)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'fade-in-up': 'fade-in-up 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'scale-in': 'scale-in 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'shimmer': 'shimmer 1.6s linear infinite',
                'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
                'ripple': 'ripple 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'slide-up-stagger': 'slide-up-stagger 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'slide-down': 'slide-down 200ms ease-out',
                'slide-up': 'slide-up 200ms ease-out',
                'dropdown-open': 'dropdown-open 220ms ease-out',
                'fade-slide-horizontal': 'fade-slide-horizontal 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'bounce-subtle': 'bounce-subtle 1.5s ease-in-out infinite',
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'marquee-scroll': 'marquee-scroll 30s linear infinite',
                // 'banner-shine': 'bannerShine 3s infinite', // Removed: no longer used after header simplification
                'separator-blink': 'separatorBlink 1s infinite',
                'icon-rotate': 'iconRotate 2s infinite',
                'badge-shake': 'badgeShake 0.5s infinite',
                'discount-pulse': 'discountPulse 1.5s infinite',
                'feature-pulse': 'featurePulse 2s infinite',
            },
            transitionDuration: {
                'fast': '200ms',
                'normal': '300ms',
                'slow': '400ms',
            },
            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
            },
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '12px',
                'lg': '16px',
                'xl': '24px',
            },
        },
    },
    plugins: [
        tailwindcssForm,
        tailwindcssTypography,
        tailwindcssAspectRatio,
        tailwindcssContainerQueries,
        tailwindcssAnimate,
    ],
} satisfies Config

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
                // L'Opulence Organique - Luxe Naturel Branding
                // Vert Émeraude Profond (Primary) - Richesse, héritage, nature précieuse
                emerald: {
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    200: '#A7F3D0',
                    300: '#6EE7B7',
                    400: '#34D399',
                    500: '#047857',  // Vert Émeraude Profond
                    600: '#065F46',
                    700: '#064E3B',
                    800: '#022C22',
                    900: '#014737',
                },
                // Beige Doré / Taupe (Secondary) - Chaleur, élégance, confort
                taupe: {
                    50: '#FAF8F5',
                    100: '#F5F0E8',
                    200: '#E8DFD0',
                    300: '#D4C4A8',
                    400: '#C4A77D',
                    500: '#A68B5B',  // Beige Doré principal
                    600: '#8B7355',
                    700: '#6B5B45',
                    800: '#4A3F30',
                    900: '#2D2620',
                },
                // Cuivre / Or Rose (Accent) - Touche métallique chaude et contemporaine
                copper: {
                    50: '#FDF4F0',
                    100: '#FCE8E0',
                    200: '#F9D0C0',
                    300: '#F0A890',
                    400: '#E07850',
                    500: '#B87333',  // Cuivre principal
                    600: '#9A5D2A',
                    700: '#7A4A22',
                    800: '#5C381A',
                    900: '#3D2512',
                },
                // Or Rose pour les accents luxueux
                rosegold: {
                    50: '#FFF5F5',
                    100: '#FFEBE8',
                    200: '#FFD6D0',
                    300: '#FFB8AD',
                    400: '#E8A090',
                    500: '#B76E79',  // Or Rose principal
                    600: '#9A5A64',
                    700: '#7D474F',
                    800: '#60353B',
                    900: '#432428',
                },
                // Neutral palette - tons naturels
                platinum: {
                    50: '#FAFAF9',
                    100: '#F5F5F4',
                    200: '#E7E5E4',
                    300: '#D6D3D1',
                    400: '#A8A29E',
                    500: '#78716C',
                },
                anthracite: {
                    500: '#44403C',
                    600: '#292524',
                    700: '#1C1917',
                },
                nuanced: {
                    500: '#78716C',
                    600: '#57534E',
                    700: '#44403C',
                },
                // Alias pour compatibilité (orange -> copper)
                orange: {
                    50: '#FDF4F0',
                    100: '#FCE8E0',
                    200: '#F9D0C0',
                    300: '#F0A890',
                    400: '#E07850',
                    500: '#B87333',
                    600: '#9A5D2A',
                    700: '#7A4A22',
                    800: '#5C381A',
                    900: '#3D2512',
                },
                // Blue for info states (keeping for semantic purposes)
                blue: {
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                },
                // Semantic colors with proper contrast
                success: {
                    light: '#D1FAE5',
                    DEFAULT: '#10b981',
                    dark: '#047857',
                },
                warning: {
                    light: '#FEF3C7',
                    DEFAULT: '#f59e0b',
                    dark: '#D97706',
                },
                error: {
                    light: '#FEE2E2',
                    DEFAULT: '#ef4444',
                    dark: '#DC2626',
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
                        transform: 'translateY(-10px)',
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
                'slide-down': 'slide-down 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'slide-up': 'slide-up 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'fade-slide-horizontal': 'fade-slide-horizontal 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                'bounce-subtle': 'bounce-subtle 1.5s ease-in-out infinite',
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
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

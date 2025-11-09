import { NextRequest, NextResponse } from 'next/server'

/**
 * Promotional Banners API Route
 * GET /api/promo/banners - Fetch active promotional banners
 * 
 * TODO: Integrate with Payload CMS or database
 */

// Mock banners data
const MOCK_BANNERS = [
    {
        id: '1',
        title: 'Offre Spéciale Black Friday',
        message: '🎉 Offre spéciale : -20% sur tout le site avec le code WELCOME20',
        backgroundColor: 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)',
        textColor: '#ffffff',
        link: '/deals/black-friday',
        position: 'top' as const,
        priority: 1,
        active: true,
        startDate: new Date('2024-11-01').toISOString(),
        endDate: new Date('2024-12-31').toISOString(),
        dismissible: true
    },
    {
        id: '2',
        title: 'Livraison Gratuite',
        message: '🚚 Livraison gratuite dès 50€ d\'achat - Expédition rapide',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        link: '/shipping-info',
        position: 'top' as const,
        priority: 2,
        active: true,
        startDate: new Date('2024-01-01').toISOString(),
        endDate: null,
        dismissible: false
    },
    {
        id: '3',
        title: 'Nouveau : Paiement en 3x',
        message: '💳 Payez en 3 fois sans frais - À partir de 100€',
        backgroundColor: '#f59e0b',
        textColor: '#ffffff',
        link: '/payment-options',
        position: 'top' as const,
        priority: 3,
        active: false,
        startDate: new Date('2024-11-01').toISOString(),
        endDate: new Date('2024-11-30').toISOString(),
        dismissible: true
    }
]

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const position = searchParams.get('position') || 'top'
        const activeOnly = searchParams.get('active') !== 'false'

        let banners = [...MOCK_BANNERS]

        // Filter by position
        if (position) {
            banners = banners.filter(b => b.position === position)
        }

        // Filter by active status
        if (activeOnly) {
            banners = banners.filter(b => {
                if (!b.active) return false

                const now = new Date()
                const start = new Date(b.startDate)
                const end = b.endDate ? new Date(b.endDate) : null

                const isAfterStart = now >= start
                const isBeforeEnd = !end || now <= end

                return isAfterStart && isBeforeEnd
            })
        }

        // Sort by priority (ascending)
        banners.sort((a, b) => a.priority - b.priority)

        return NextResponse.json({
            success: true,
            data: banners,
            totalCount: banners.length
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        })

    } catch (error) {
        console.error('Banners fetch error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}

// Handle unsupported methods
export async function POST() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed. Banners are read-only via this endpoint.' },
        {
            status: 405,
            headers: { 'Allow': 'GET' }
        }
    )
}

export async function PUT() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        {
            status: 405,
            headers: { 'Allow': 'GET' }
        }
    )
}

export async function PATCH() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        {
            status: 405,
            headers: { 'Allow': 'GET' }
        }
    )
}

export async function DELETE() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        {
            status: 405,
            headers: { 'Allow': 'GET' }
        }
    )
}

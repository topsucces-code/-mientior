/**
 * Campaigns API - Development version without authentication
 * This is a temporary development endpoint while Better Auth is being configured
 * TODO: Replace with authenticated version once Better Auth is set up
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock campaigns data for development
const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Sale Campaign',
    type: 'EMAIL',
    status: 'COMPLETED',
    subject: 'Get 50% off this summer!',
    content: '<p>Summer sale is here!</p>',
    segmentCount: 1250,
    scheduledAt: new Date('2024-06-01'),
    sentAt: new Date('2024-06-01'),
    stats: {
      sent: 1250,
      opened: 850,
      clicked: 425,
      converted: 85,
    },
    createdAt: new Date('2024-05-25'),
  },
  {
    id: '2',
    name: 'New Product Launch',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Introducing our latest product',
    content: '<p>Check out our new product!</p>',
    segmentCount: 2500,
    scheduledAt: null,
    sentAt: new Date('2024-10-15'),
    stats: {
      sent: 2500,
      opened: 1750,
      clicked: 875,
      converted: 175,
    },
    createdAt: new Date('2024-10-10'),
  },
  {
    id: '3',
    name: 'Black Friday Preparation',
    type: 'EMAIL',
    status: 'SCHEDULED',
    subject: 'Black Friday is coming!',
    content: '<p>Get ready for Black Friday deals</p>',
    segmentCount: 5000,
    scheduledAt: new Date('2024-11-25'),
    sentAt: null,
    stats: null,
    createdAt: new Date('2024-11-01'),
  },
  {
    id: '4',
    name: 'SMS Flash Sale',
    type: 'SMS',
    status: 'DRAFT',
    subject: null,
    content: 'Flash sale! 30% off for 2 hours only. Shop now!',
    segmentCount: 0,
    scheduledAt: null,
    sentAt: null,
    stats: null,
    createdAt: new Date('2024-11-05'),
  },
];

// GET /api/campaigns - List campaigns with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('q');

    // Filter mock data
    let filtered = mockCampaigns;
    
    if (status) {
      filtered = filtered.filter(c => c.status === status.toUpperCase());
    }
    
    if (type) {
      filtered = filtered.filter(c => c.type === type.toUpperCase());
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        (c.subject && c.subject.toLowerCase().includes(lowerSearch))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(_start, _end);

    const headers = new Headers();
    headers.set('X-Total-Count', total.toString());
    headers.set('Access-Control-Expose-Headers', 'X-Total-Count');

    return NextResponse.json(paginated, { headers });
  } catch (error) {
    console.error('Campaign fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // In development, just return the created campaign with mock ID
    const newCampaign = {
      id: String(mockCampaigns.length + 1),
      ...body,
      createdAt: new Date(),
      stats: body.stats || null,
    };

    // Add to mock data (in-memory only)
    mockCampaigns.push(newCampaign);

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Campaign create error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

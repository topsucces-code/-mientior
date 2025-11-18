import { NextRequest, NextResponse } from 'next/server';

interface SavedView {
  id: string;
  name: string;
  resource: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
}

// Mock data for saved views (since we don't have the table in the database yet)
const mockViews: SavedView[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');

    // Filter by resource if provided
    const filteredViews = resource
      ? mockViews.filter(view => view.resource === resource)
      : mockViews;

    // Paginate
    const paginatedViews = filteredViews.slice(_start, _end);

    return NextResponse.json(paginatedViews, {
      headers: {
        'X-Total-Count': filteredViews.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching saved views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved views' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newView = {
      id: Math.random().toString(36).substring(7),
      name: body.name,
      resource: body.resource,
      filters: body.filters || {},
      isDefault: body.isDefault || false,
      createdAt: new Date().toISOString(),
    };

    mockViews.push(newView);

    return NextResponse.json(newView, { status: 201 });
  } catch (error) {
    console.error('Error creating saved view:', error);
    return NextResponse.json(
      { error: 'Failed to create saved view' },
      { status: 500 }
    );
  }
}

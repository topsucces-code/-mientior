import { NextRequest, NextResponse } from 'next/server';

interface SavedView {
  id: string;
  name: string;
  resource: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
}

// Mock data storage (same reference as route.ts)
const mockViews: SavedView[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const view = mockViews.find(v => v.id === id);

    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(view);
  } catch (error) {
    console.error('Error fetching saved view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved view' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const viewIndex = mockViews.findIndex(v => v.id === id);

    if (viewIndex === -1) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults for the same resource
    if (body.isDefault) {
      const currentView = mockViews[viewIndex];
      if (currentView) {
        mockViews.forEach((v, idx) => {
          if (v.resource === currentView.resource && idx !== viewIndex) {
            v.isDefault = false;
          }
        });
      }
    }

    mockViews[viewIndex] = {
      ...mockViews[viewIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockViews[viewIndex]);
  } catch (error) {
    console.error('Error updating saved view:', error);
    return NextResponse.json(
      { error: 'Failed to update saved view' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewIndex = mockViews.findIndex(v => v.id === id);

    if (viewIndex === -1) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    mockViews.splice(viewIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved view:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved view' },
      { status: 500 }
    );
  }
}

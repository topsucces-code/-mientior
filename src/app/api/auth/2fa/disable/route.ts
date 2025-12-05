import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { disable2FA, has2FAEnabled } from '@/lib/two-factor-service';

// POST /api/auth/2fa/disable - Disable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code requis pour désactiver l\'authentification à deux facteurs' },
        { status: 400 }
      );
    }

    // Check if 2FA is enabled
    const isEnabled = await has2FAEnabled(session.user.id);
    if (!isEnabled) {
      return NextResponse.json(
        { error: 'L\'authentification à deux facteurs n\'est pas activée' },
        { status: 400 }
      );
    }

    // Disable 2FA
    const success = await disable2FA(session.user.id, code);

    if (!success) {
      return NextResponse.json(
        { error: 'Code invalide. Veuillez réessayer.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentification à deux facteurs désactivée',
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation de l\'authentification à deux facteurs' },
      { status: 500 }
    );
  }
}

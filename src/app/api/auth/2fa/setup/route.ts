import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { enable2FA, has2FAEnabled } from '@/lib/two-factor-service';

// POST /api/auth/2fa/setup - Initialize 2FA setup
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if 2FA is already enabled
    const isEnabled = await has2FAEnabled(session.user.id);
    if (isEnabled) {
      return NextResponse.json(
        { error: 'L\'authentification à deux facteurs est déjà activée' },
        { status: 400 }
      );
    }

    // Generate secret and backup codes
    const { secret, uri, backupCodes } = await enable2FA(session.user.id);

    return NextResponse.json({
      success: true,
      secret,
      uri,
      backupCodes,
      message: 'Scannez le QR code avec votre application d\'authentification',
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la configuration de l\'authentification à deux facteurs' },
      { status: 500 }
    );
  }
}

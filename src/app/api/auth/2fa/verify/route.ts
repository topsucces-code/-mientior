import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { verify2FASetup, verify2FALogin } from '@/lib/two-factor-service';

// POST /api/auth/2fa/verify - Verify 2FA code
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
    const { code, action } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code requis' },
        { status: 400 }
      );
    }

    // Verify setup (first-time activation)
    if (action === 'setup') {
      const isValid = await verify2FASetup(session.user.id, code);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Code invalide. Veuillez réessayer.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Authentification à deux facteurs activée avec succès',
      });
    }

    // Verify login
    const result = await verify2FALogin(session.user.id, code);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Code invalide. Veuillez réessayer.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      usedBackupCode: result.usedBackupCode,
      message: result.usedBackupCode 
        ? 'Connexion réussie avec un code de secours' 
        : 'Code vérifié avec succès',
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code' },
      { status: 500 }
    );
  }
}

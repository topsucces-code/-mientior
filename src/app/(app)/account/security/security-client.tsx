'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { SessionList, type SessionInfo } from '@/components/account/session-list'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle, Smartphone, Key, Loader2, CheckCircle, XCircle, Lock, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SecurityPageClient() {
  const router = useRouter()
  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = React.useState(false)
  const [twoFALoading, setTwoFALoading] = React.useState(false)
  const [setupData, setSetupData] = React.useState<{ secret: string; uri: string; backupCodes: string[] } | null>(null)
  const [verifyCode, setVerifyCode] = React.useState('')
  const [showBackupCodes, setShowBackupCodes] = React.useState(false)
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')

  // Password Change State
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  // Delete Account State
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  // Fetch sessions on mount
  React.useEffect(() => {
    fetchSessions()
  }, [])

  // Generate QR code when setup data is available
  React.useEffect(() => {
    if (setupData?.uri) {
      QRCode.toDataURL(setupData.uri, { width: 256 })
        .then(setQrCodeUrl)
        .catch((err) => {
          console.error('Error generating QR code:', err)
          toast({
            title: 'Erreur',
            description: 'Impossible de générer le QR code',
            variant: 'destructive',
          })
        })
    }
  }, [setupData, toast])

  const fetchSessions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/user/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data.sessions)
    } catch (err) {
      setError('Failed to load sessions. Please try again.')
      console.error('Error fetching sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to log out session')
      }

      toast({
        title: 'Session logged out',
        description: 'The session has been successfully terminated.',
      })

      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to log out session',
        variant: 'destructive',
      })
    }
  }

  const handleLogoutAll = async () => {
    try {
      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to log out all sessions')
      }

      const data = await response.json()

      toast({
        title: 'All sessions logged out',
        description: `${data.sessionsInvalidated} session(s) have been terminated.`,
      })

      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to log out all sessions',
        variant: 'destructive',
      })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to change password')
      }

      toast({
        title: 'Mot de passe changé',
        description: 'Votre mot de passe a été modifié avec succès',
      })

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de changer le mot de passe',
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const password = prompt('Entrez votre mot de passe pour confirmer la suppression')
    if (!password) return

    const confirmation = prompt('Tapez DELETE en majuscules pour confirmer')
    if (confirmation !== 'DELETE') {
      toast({
        title: 'Annulé',
        description: 'Suppression du compte annulée',
      })
      return
    }

    setDeleteLoading(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete account')
      }

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte a été supprimé avec succès',
      })

      // Redirect to homepage after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le compte',
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and monitor active sessions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              If you see any suspicious activity or unrecognized devices, log them out immediately
              and consider changing your password.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
              <CardDescription>
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFAEnabled ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800">2FA activé</p>
                  <p className="text-sm text-emerald-600">Votre compte est protégé</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const code = prompt('Entrez votre code 2FA pour désactiver')
                  if (code) {
                    setTwoFALoading(true)
                    try {
                      const res = await fetch('/api/auth/2fa/disable', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                      })
                      if (res.ok) {
                        setTwoFAEnabled(false)
                        toast({ title: '2FA désactivé', description: 'L\'authentification à deux facteurs a été désactivée.' })
                      } else {
                        toast({ title: 'Erreur', description: 'Code invalide', variant: 'destructive' })
                      }
                    } finally {
                      setTwoFALoading(false)
                    }
                  }
                }}
                disabled={twoFALoading}
              >
                {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Désactiver
              </Button>
            </div>
          ) : setupData ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">1. Scannez ce QR code avec votre application d'authentification</p>
                <div className="flex justify-center p-4 bg-white rounded border">
                  {qrCodeUrl ? (
                    <div className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="QR Code 2FA"
                        className="w-64 h-64 mx-auto"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Scannez avec Google Authenticator, Authy ou une application similaire
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-16 w-16 mx-auto text-gray-400 mb-2 animate-spin" />
                      <p className="text-xs text-gray-500">Génération du QR code...</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Clé secrète (si vous ne pouvez pas scanner)</p>
                      <code className="text-sm font-mono text-gray-700 break-all">{setupData.secret}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret)
                        toast({ title: 'Copié !', description: 'La clé secrète a été copiée dans le presse-papier' })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">2. Entrez le code de vérification</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="000000" 
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                    className="w-32"
                  />
                  <Button 
                    onClick={async () => {
                      setTwoFALoading(true)
                      try {
                        const res = await fetch('/api/auth/2fa/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ code: verifyCode, action: 'setup' })
                        })
                        if (res.ok) {
                          setTwoFAEnabled(true)
                          setShowBackupCodes(true)
                          toast({ title: '2FA activé', description: 'L\'authentification à deux facteurs est maintenant active.' })
                        } else {
                          toast({ title: 'Erreur', description: 'Code invalide', variant: 'destructive' })
                        }
                      } finally {
                        setTwoFALoading(false)
                      }
                    }}
                    disabled={twoFALoading || verifyCode.length !== 6}
                  >
                    {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
                  </Button>
                </div>
              </div>

              {showBackupCodes && (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Codes de secours (à conserver en lieu sûr)</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {setupData.backupCodes.map((code, i) => (
                        <span key={i} className="bg-gray-100 p-1 rounded">{code}</span>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Protégez votre compte avec une application d'authentification comme Google Authenticator ou Authy.
              </p>
              <Button 
                onClick={async () => {
                  setTwoFALoading(true)
                  try {
                    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
                    if (res.ok) {
                      const data = await res.json()
                      setSetupData(data)
                    } else {
                      toast({ title: 'Erreur', description: 'Impossible de configurer 2FA', variant: 'destructive' })
                    }
                  } finally {
                    setTwoFALoading(false)
                  }
                }}
                disabled={twoFALoading}
              >
                {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                Activer 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe régulièrement pour plus de sécurité
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
                minLength={8}
              />
              <p className="text-sm text-nuanced-500">
                Au moins 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changement en cours...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Card */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-red-600">Supprimer le compte</CardTitle>
              <CardDescription>
                Supprimez définitivement votre compte et toutes vos données
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action est irréversible. Toutes vos commandes, avis et données personnelles seront supprimés.
              Les informations de commande nécessaires à la comptabilité seront anonymisées.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer mon compte
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <SessionList
        sessions={sessions}
        onLogoutSession={handleLogoutSession}
        onLogoutAll={handleLogoutAll}
        isLoading={isLoading}
      />
    </div>
  )
}

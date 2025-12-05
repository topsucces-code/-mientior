'use client'

import * as React from 'react'
import { SessionList, type SessionInfo } from '@/components/account/session-list'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle, Smartphone, Key, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SecurityPageClient() {
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

  // Fetch sessions on mount
  React.useEffect(() => {
    fetchSessions()
  }, [])

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
                  {/* QR Code would be rendered here - using text for now */}
                  <div className="text-center">
                    <Key className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 break-all max-w-xs">{setupData.secret}</p>
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

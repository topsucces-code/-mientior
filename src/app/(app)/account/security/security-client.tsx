'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('account.security')
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
            title: t('messages.error'),
            description: t('twoFactor.qrError'),
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
        title: t('sessions.loggedOut'),
        description: t('sessions.loggedOutDescription'),
      })

      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      toast({
        title: t('messages.error'),
        description: err instanceof Error ? err.message : t('sessions.logoutError'),
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
        title: t('sessions.allLoggedOut'),
        description: t('sessions.allLoggedOutDescription', { count: data.sessionsInvalidated }),
      })

      // Refresh sessions list
      await fetchSessions()
    } catch (err) {
      toast({
        title: t('messages.error'),
        description: err instanceof Error ? err.message : t('sessions.logoutAllError'),
        variant: 'destructive',
      })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: t('messages.error'),
        description: t('password.mismatch'),
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
        title: t('password.changed'),
        description: t('password.changedDescription'),
      })

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: error instanceof Error ? error.message : t('password.changeError'),
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const password = prompt(t('deleteAccount.confirmPassword'))
    if (!password) return

    const confirmation = prompt(t('deleteAccount.confirmText'))
    if (confirmation !== 'DELETE') {
      toast({
        title: t('deleteAccount.cancelled'),
        description: t('deleteAccount.cancelledDescription'),
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
        title: t('deleteAccount.deleted'),
        description: t('deleteAccount.deletedDescription'),
      })

      // Redirect to homepage after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: error instanceof Error ? error.message : t('deleteAccount.deleteError'),
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
              <CardTitle>{t('overview.title')}</CardTitle>
              <CardDescription>
                {t('overview.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('overview.alert')}
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
              <CardTitle>{t('twoFactor.title')}</CardTitle>
              <CardDescription>
                {t('twoFactor.description')}
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
                  <p className="font-medium text-emerald-800">{t('twoFactor.enabled')}</p>
                  <p className="text-sm text-emerald-600">{t('twoFactor.protected')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  const code = prompt(t('twoFactor.disablePrompt'))
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
                        toast({ title: t('twoFactor.disabled'), description: t('twoFactor.disabledDescription') })
                      } else {
                        toast({ title: t('messages.error'), description: t('twoFactor.invalidCode'), variant: 'destructive' })
                      }
                    } finally {
                      setTwoFALoading(false)
                    }
                  }
                }}
                disabled={twoFALoading}
              >
                {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                {t('twoFactor.disable')}
              </Button>
            </div>
          ) : setupData ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">{t('twoFactor.step1')}</p>
                <div className="flex justify-center p-4 bg-white rounded border">
                  {qrCodeUrl ? (
                    <div className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt={t('twoFactor.qrAlt')}
                        className="w-64 h-64 mx-auto"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {t('twoFactor.scanInstructions')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-16 w-16 mx-auto text-gray-400 mb-2 animate-spin" />
                      <p className="text-xs text-gray-500">{t('twoFactor.generatingQR')}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">{t('twoFactor.secretKey')}</p>
                      <code className="text-sm font-mono text-gray-700 break-all">{setupData.secret}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret)
                        toast({ title: t('twoFactor.copied'), description: t('twoFactor.copiedDescription') })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">{t('twoFactor.step2')}</p>
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
                          toast({ title: t('twoFactor.enabled'), description: t('twoFactor.enabledDescription') })
                        } else {
                          toast({ title: t('messages.error'), description: t('twoFactor.invalidCode'), variant: 'destructive' })
                        }
                      } finally {
                        setTwoFALoading(false)
                      }
                    }}
                    disabled={twoFALoading || verifyCode.length !== 6}
                  >
                    {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('twoFactor.verify')}
                  </Button>
                </div>
              </div>

              {showBackupCodes && (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{t('twoFactor.backupCodes')}</p>
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
                {t('twoFactor.notEnabled')}
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
                      toast({ title: t('messages.error'), description: t('twoFactor.setupError'), variant: 'destructive' })
                    }
                  } finally {
                    setTwoFALoading(false)
                  }
                }}
                disabled={twoFALoading}
              >
                {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                {t('twoFactor.enable')}
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
              <CardTitle>{t('password.title')}</CardTitle>
              <CardDescription>
                {t('password.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('password.current')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('password.currentPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('password.new')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('password.newPlaceholder')}
                required
                minLength={8}
              />
              <p className="text-sm text-nuanced-500">
                {t('password.requirements')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('password.confirm')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('password.confirmPlaceholder')}
                required
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('password.changing')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t('password.changeButton')}
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
              <CardTitle className="text-red-600">{t('deleteAccount.title')}</CardTitle>
              <CardDescription>
                {t('deleteAccount.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('deleteAccount.warning')}
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
                {t('deleteAccount.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteAccount.button')}
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

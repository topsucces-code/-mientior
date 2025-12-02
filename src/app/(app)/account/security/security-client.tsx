'use client'

import * as React from 'react'
import { SessionList, type SessionInfo } from '@/components/account/session-list'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle } from 'lucide-react'

export function SecurityPageClient() {
  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

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

'use client'

import * as React from 'react'
import { Monitor, Smartphone, Tablet, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'

export interface SessionInfo {
  id: string
  token: string
  ipAddress: string
  userAgent: string
  device: string
  location: string
  lastActivity: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

export interface SessionListProps {
  sessions: SessionInfo[]
  onLogoutSession: (sessionId: string) => Promise<void>
  onLogoutAll: () => Promise<void>
  isLoading?: boolean
}

export function SessionList({
  sessions,
  onLogoutSession,
  onLogoutAll,
  isLoading = false,
}: SessionListProps) {
  const [loadingSessionId, setLoadingSessionId] = React.useState<string | null>(null)
  const [loadingAll, setLoadingAll] = React.useState(false)

  const handleLogoutSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId)
    try {
      await onLogoutSession(sessionId)
    } finally {
      setLoadingSessionId(null)
    }
  }

  const handleLogoutAll = async () => {
    setLoadingAll(true)
    try {
      await onLogoutAll()
    } finally {
      setLoadingAll(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (device.toLowerCase().includes('tablet')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <div className="space-y-6">
      {/* Header with logout all button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-anthracite-700">Active Sessions</h2>
          <p className="text-sm text-nuanced-500">
            Manage your active sessions across different devices
          </p>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleLogoutAll}
            disabled={loadingAll || isLoading}
          >
            {loadingAll ? 'Logging out...' : 'Log out all other devices'}
          </Button>
        )}
      </div>

      {/* Current session */}
      {sessions.map((session) => {
        if (!session.isCurrent) return null

        return (
          <Card key={session.id} className="border-2 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {session.device}
                      <Badge variant="default" className="bg-orange-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Current Session
                      </Badge>
                    </CardTitle>
                    <CardDescription>This is your current active session</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2 text-nuanced-600">
                  <MapPin className="h-4 w-4" />
                  <span>{session.location}</span>
                </div>
                <div className="flex items-center gap-2 text-nuanced-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Other sessions */}
      {otherSessions.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-lg font-semibold text-anthracite-700">
              Other Sessions ({otherSessions.length})
            </h3>
            <div className="space-y-4">
              {otherSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-platinum-100 p-2 text-anthracite-600">
                          {getDeviceIcon(session.device)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{session.device}</CardTitle>
                          <CardDescription className="mt-1">
                            {session.location}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLogoutSession(session.id)}
                        disabled={loadingSessionId === session.id || isLoading}
                      >
                        {loadingSessionId === session.id ? 'Logging out...' : 'Log out'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-nuanced-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* No other sessions */}
      {otherSessions.length === 0 && sessions.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Monitor className="mb-3 h-12 w-12 text-nuanced-400" />
            <p className="text-sm font-medium text-anthracite-700">No other active sessions</p>
            <p className="mt-1 text-sm text-nuanced-500">
              You're only logged in on this device
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && sessions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
              <p className="text-sm text-nuanced-500">Loading sessions...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

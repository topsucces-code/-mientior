/**
 * PIM Alerting Module
 *
 * Provides health monitoring and alerting for Akeneo PIM synchronization.
 * Detects sync failures, delays, and connectivity issues.
 */

import { prisma } from '@/lib/prisma';
import { triggerAdminNotification } from '@/lib/pusher';
import { Role, PimSyncStatus } from '@prisma/client';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_FAILURE_THRESHOLD = 10; // 10% failure rate
export const DEFAULT_DELAY_THRESHOLD = 3600; // 1 hour in seconds
export const DEFAULT_HEALTH_CHECK_WINDOW = 86400; // 24 hours in seconds

export const AKENEO_ERROR_PATTERNS = [
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'fetch failed',
  'network error',
  'connect ECONNREFUSED',
  'getaddrinfo',
];

// ============================================================================
// Types
// ============================================================================

export type PimAlertType = 'sync_failed_threshold' | 'sync_delayed' | 'akeneo_unreachable';

export interface PimHealthStatus {
  isHealthy: boolean;
  alerts: Array<{
    type: PimAlertType;
    severity: 'urgent' | 'attention' | 'info';
    message: string;
    data?: any;
  }>;
  metrics: {
    totalSyncs: number;
    failedSyncs: number;
    successRate: number;
    lastSyncAt: Date | null;
    avgDuration: number | null;
  };
}

export interface Alert {
  id: string;
  type: 'urgent' | 'attention' | 'info';
  title: string;
  message: string;
  link: string;
  count?: number;
  timestamp: Date;
}

// ============================================================================
// Configuration
// ============================================================================

function getConfig() {
  return {
    failureThreshold: Number(process.env.PIM_SYNC_FAILURE_THRESHOLD) || DEFAULT_FAILURE_THRESHOLD,
    delayThreshold: Number(process.env.PIM_SYNC_DELAY_THRESHOLD) || DEFAULT_DELAY_THRESHOLD,
    healthCheckWindow: Number(process.env.PIM_SYNC_HEALTH_CHECK_WINDOW) || DEFAULT_HEALTH_CHECK_WINDOW,
  };
}

// ============================================================================
// Health Check Functions
// ============================================================================

/**
 * Check PIM sync health by analyzing recent sync logs
 *
 * Detects three types of issues:
 * 1. High failure rate (> configured threshold, default 10%)
 * 2. Sync delays (no sync in > configured time, default 1 hour)
 * 3. Akeneo unreachable (3+ consecutive connection errors)
 *
 * @returns Health status with alerts and metrics
 *
 * @example
 * const health = await checkPimSyncHealth();
 * if (!health.isHealthy) {
 *   console.log('PIM alerts:', health.alerts);
 * }
 */
export async function checkPimSyncHealth(): Promise<PimHealthStatus> {
  const config = getConfig();
  const windowStart = new Date(Date.now() - config.healthCheckWindow * 1000);

  try {
    // Run parallel queries for efficiency
    const [totalCount, failedCount, lastSync, avgDurationResult, recentLogs] = await Promise.all([
      // Total syncs in window
      prisma.pimSyncLog.count({
        where: {
          createdAt: { gte: windowStart },
        },
      }),

      // Failed syncs in window
      prisma.pimSyncLog.count({
        where: {
          createdAt: { gte: windowStart },
          status: PimSyncStatus.FAILED,
        },
      }),

      // Last sync timestamp
      prisma.pimSyncLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // Average duration
      prisma.pimSyncLog.aggregate({
        where: {
          createdAt: { gte: windowStart },
          duration: { not: null },
        },
        _avg: {
          duration: true,
        },
      }),

      // Recent logs for consecutive failure check
      prisma.pimSyncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          status: true,
          error: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate metrics
    const successRate = totalCount > 0 ? ((totalCount - failedCount) / totalCount) * 100 : 100;
    const failureRate = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;
    const avgDuration = avgDurationResult._avg.duration || null;
    const lastSyncAt = lastSync?.createdAt || null;

    const metrics = {
      totalSyncs: totalCount,
      failedSyncs: failedCount,
      successRate,
      lastSyncAt,
      avgDuration,
    };

    // Detect alerts
    const alerts: PimHealthStatus['alerts'] = [];

    // 1. Check for high failure rate
    if (totalCount > 0 && failureRate > config.failureThreshold) {
      alerts.push({
        type: 'sync_failed_threshold',
        severity: 'attention',
        message: `PIM sync failure rate is ${failureRate.toFixed(1)}% (threshold: ${config.failureThreshold}%)`,
        data: {
          failureRate,
          failedCount,
          totalCount,
          threshold: config.failureThreshold,
        },
      });
    }

    // 2. Check for sync delays
    if (lastSyncAt) {
      const timeSinceLastSync = (Date.now() - lastSyncAt.getTime()) / 1000; // seconds
      if (timeSinceLastSync > config.delayThreshold) {
        const hoursAgo = (timeSinceLastSync / 3600).toFixed(1);
        alerts.push({
          type: 'sync_delayed',
          severity: 'info',
          message: `No PIM sync in ${hoursAgo} hours (threshold: ${(config.delayThreshold / 3600).toFixed(1)} hours)`,
          data: {
            lastSyncAt,
            timeSinceLastSync,
            threshold: config.delayThreshold,
          },
        });
      }
    } else if (totalCount === 0) {
      // No sync logs at all
      alerts.push({
        type: 'sync_delayed',
        severity: 'info',
        message: 'No PIM sync logs found in monitoring window',
        data: {
          windowStart,
        },
      });
    }

    // 3. Check for Akeneo connectivity issues (3+ consecutive connection errors)
    let consecutiveErrors = 0;
    let lastErrorPattern: string | null = null;

    for (const log of recentLogs) {
      if (log.status === PimSyncStatus.FAILED && log.error) {
        // Check if error matches connection patterns
        const isConnectionError = AKENEO_ERROR_PATTERNS.some(pattern =>
          log.error?.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isConnectionError) {
          consecutiveErrors++;
          if (!lastErrorPattern) {
            lastErrorPattern = AKENEO_ERROR_PATTERNS.find(pattern =>
              log.error?.toLowerCase().includes(pattern.toLowerCase())
            ) || 'unknown';
          }
        } else {
          break; // Stop counting on non-connection error
        }
      } else {
        break; // Stop counting on success
      }
    }

    if (consecutiveErrors >= 3) {
      alerts.push({
        type: 'akeneo_unreachable',
        severity: 'urgent',
        message: `Akeneo PIM may be unreachable (${consecutiveErrors} consecutive connection errors)`,
        data: {
          consecutiveErrors,
          errorPattern: lastErrorPattern,
          recentAttempts: recentLogs.slice(0, consecutiveErrors).map(l => ({
            timestamp: l.createdAt,
            error: l.error,
          })),
        },
      });
    }

    console.log(`[PIM Alerts] Health check complete: ${alerts.length} alerts detected (${totalCount} syncs, ${failureRate.toFixed(1)}% failure rate)`);

    return {
      isHealthy: alerts.length === 0,
      alerts,
      metrics,
    };

  } catch (error) {
    console.error('[PIM Alerts] Health check failed:', error);

    // Return degraded status on error
    return {
      isHealthy: false,
      alerts: [{
        type: 'akeneo_unreachable',
        severity: 'urgent',
        message: 'Unable to check PIM sync health',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      }],
      metrics: {
        totalSyncs: 0,
        failedSyncs: 0,
        successRate: 0,
        lastSyncAt: null,
        avgDuration: null,
      },
    };
  }
}

// ============================================================================
// Alert Notification Functions
// ============================================================================

/**
 * Send PIM alert to admin users and trigger real-time notification
 *
 * Creates notification records for all active SUPER_ADMIN and ADMIN users,
 * and broadcasts via Pusher for real-time delivery.
 *
 * @param alertType - Type of alert to send
 * @param title - Alert title
 * @param message - Alert message
 * @param data - Optional alert metadata
 *
 * @example
 * await sendPimAlert(
 *   'sync_failed_threshold',
 *   'High PIM Sync Failure Rate',
 *   'PIM sync failure rate is 15.3%',
 *   { failureRate: 15.3, failedCount: 10 }
 * );
 */
export async function sendPimAlert(
  alertType: PimAlertType,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  try {
    // Map alert type to notification severity
    const notificationType = alertType === 'akeneo_unreachable'
      ? 'urgent'
      : alertType === 'sync_failed_threshold'
      ? 'attention'
      : 'info';

    // Get active admin users
    const adminUsers = await prisma.adminUser.findMany({
      where: {
        isActive: true,
        role: {
          in: [Role.SUPER_ADMIN, Role.ADMIN],
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (adminUsers.length === 0) {
      console.warn('[PIM Alerts] No active admin users found to send alert');
      return;
    }

    // Create notification records for all admins
    const notificationData = {
      type: notificationType,
      title,
      message,
      data: {
        alertType,
        link: '/admin/pim',
        timestamp: new Date().toISOString(),
        ...data,
      },
      read: false,
    };

    await prisma.notification.createMany({
      data: adminUsers.map(admin => ({
        ...notificationData,
        adminUserId: admin.id,
      })),
    });

    console.log(`[PIM Alerts] Created ${adminUsers.length} notification(s) for alert: ${alertType}`);

    // Trigger Pusher notification (fire-and-forget)
    triggerAdminNotification({
      event: 'pim-alert',
      alertType,
      title,
      message,
      data: {
        alertType,
        link: '/admin/pim',
        timestamp: new Date().toISOString(),
        ...data,
      },
    }).catch(error => {
      console.error('[PIM Alerts] Failed to send Pusher notification:', error);
      // Don't throw - Pusher failures shouldn't block alert creation
    });

  } catch (error) {
    console.error('[PIM Alerts] Failed to send alert:', error);
    throw error;
  }
}

// ============================================================================
// Alert Transformation Functions
// ============================================================================

/**
 * Get PIM alerts in dashboard-compatible format
 *
 * Checks PIM sync health and transforms any detected issues into
 * Alert objects compatible with the dashboard alerts API.
 *
 * @returns Array of Alert objects for dashboard display
 *
 * @example
 * const alerts = await getPimAlerts();
 * // Returns: [{ id: 'pim-1', type: 'urgent', title: '...', ... }]
 */
export async function getPimAlerts(): Promise<Alert[]> {
  try {
    const health = await checkPimSyncHealth();

    if (health.isHealthy) {
      return [];
    }

    // Transform health alerts into dashboard alerts
    const alerts: Alert[] = health.alerts.map((alert, index) => {
      const alertId = `pim-${alert.type}-${Date.now()}-${index}`;

      // Determine link based on alert type
      const link = alert.type === 'sync_failed_threshold'
        ? '/admin/pim?status=FAILED'
        : '/admin/pim';

      // Determine title based on alert type
      const titleMap: Record<PimAlertType, string> = {
        akeneo_unreachable: 'Akeneo PIM Unreachable',
        sync_failed_threshold: 'High PIM Sync Failure Rate',
        sync_delayed: 'PIM Sync Delayed',
      };

      return {
        id: alertId,
        type: alert.severity,
        title: titleMap[alert.type],
        message: alert.message,
        link,
        count: alert.data?.failedCount || alert.data?.consecutiveErrors || undefined,
        timestamp: new Date(),
      };
    });

    // Send notifications for urgent and attention alerts (fire-and-forget)
    for (const alert of health.alerts) {
      if (alert.severity === 'urgent' || alert.severity === 'attention') {
        const dashboardAlert = alerts.find(a => a.id.includes(alert.type));
        if (dashboardAlert) {
          sendPimAlert(
            alert.type,
            dashboardAlert.title,
            alert.message,
            alert.data
          ).catch(error => {
            console.error('[PIM Alerts] Failed to send notification:', error);
            // Don't throw - notification failures shouldn't break alert display
          });
        }
      }
    }

    return alerts;

  } catch (error) {
    console.error('[PIM Alerts] Failed to get PIM alerts:', error);
    return [];
  }
}

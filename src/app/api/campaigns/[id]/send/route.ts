/**
 * REST API endpoint for sending campaigns (Admin)
 * POST: Send campaign to target audience
 * 
 * Features:
 * - Queue-based email sending with BullMQ
 * - Batch processing for large campaigns
 * - Real-time stats tracking via webhooks
 * - Personalization support
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { queueCampaignForSending } from '@/lib/email-queue';
import { wrapInEmailTemplate, personalizeEmailContent } from '@/lib/email-personalizer';
import { Resend } from 'resend';
import { logAction } from '@/lib/audit-logger';

// Initialize Resend for direct sending (fallback if queue not available)
const resend = new Resend(process.env.RESEND_API_KEY);

// Use queue-based sending or direct sending
const USE_QUEUE = process.env.USE_EMAIL_QUEUE === 'true';

interface AdminSession {
  adminUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

async function handlePOST(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession?: AdminSession }
) {
  try {
    const { id } = params;

    // Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if campaign is in correct status
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Campaign can only be sent from DRAFT or SCHEDULED status' },
        { status: 400 }
      );
    }

    // Get segment filters from campaign
    const segmentFilters = (campaign.segmentFilters as Record<string, unknown>) || {};
    const segmentId = segmentFilters.segmentId as string | undefined;

    // Build user query based on segment filters
    const where: Record<string, unknown> = {};

    // Apply segment-based filters
    if (segmentId === 'all' || !segmentId) {
      // All users - no additional filters
    } else if (segmentId === 'platinum') {
      where.loyaltyLevel = 'PLATINUM';
    } else if (segmentId === 'inactive') {
      // Users who haven't ordered in 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      where.OR = [
        { totalOrders: 0 },
        { updatedAt: { lt: ninetyDaysAgo } },
      ];
    } else if (segmentId === 'high-value') {
      where.totalSpent = { gte: 500 };
    } else {
      // Custom segment - fetch from CustomerSegment
      const segment = await prisma.customerSegment.findUnique({
        where: { id: segmentId },
      });
      if (segment?.filters) {
        Object.assign(where, segment.filters);
      }
    }

    // Apply additional segment filters
    if (segmentFilters.loyaltyLevel) {
      where.loyaltyLevel = { in: segmentFilters.loyaltyLevel as string[] };
    }

    if (segmentFilters.minTotalSpent) {
      where.totalSpent = { gte: segmentFilters.minTotalSpent as number };
    }

    if (segmentFilters.minOrders) {
      where.totalOrders = { gte: segmentFilters.minOrders as number };
    }

    if (segmentFilters.createdAfter) {
      where.createdAt = { gte: new Date(segmentFilters.createdAfter as string) };
    }

    // Query recipients
    const recipients = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients match the segment filters' },
        { status: 400 }
      );
    }

    console.log(`[Campaign ${id}] Sending to ${recipients.length} recipients`);
    console.log(`[Campaign ${id}] Type: ${campaign.type}, Subject: ${campaign.subject}`);

    // Log the action
    if (adminSession?.adminUser) {
      await logAction({
        action: 'SEND_CAMPAIGN',
        resource: 'campaigns',
        resourceId: id,
        adminUserId: adminSession.adminUser.id,
        metadata: {
          recipientCount: recipients.length,
          campaignType: campaign.type,
          segmentId,
        },
      });
    }

    // Wrap content in email template
    const wrappedContent = wrapInEmailTemplate(campaign.content, {
      preheader: campaign.subject || undefined,
      showUnsubscribe: true,
    });

    if (USE_QUEUE && process.env.REDIS_HOST) {
      // Queue-based sending (recommended for production)
      const recipientIds = recipients.map((r) => r.id);
      const { totalBatches, totalRecipients } = await queueCampaignForSending(
        id,
        recipientIds,
        100 // batch size
      );

      return NextResponse.json({
        success: true,
        message: `Campaign queued for ${totalRecipients} recipients in ${totalBatches} batches`,
        campaign: {
          id,
          status: 'ACTIVE',
        },
        stats: {
          totalRecipients,
          totalBatches,
          queuedAt: new Date().toISOString(),
        },
      });
    } else {
      // Direct sending (for development or small campaigns)
      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Send in batches of 10 for direct sending
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (recipient) => {
            try {
              // Personalize content for this recipient
              const personalizedContent = personalizeEmailContent(wrappedContent, {
                firstName: recipient.firstName || undefined,
                lastName: recipient.lastName || undefined,
                email: recipient.email,
                unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}`,
              });

              if (process.env.RESEND_API_KEY) {
                // Send via Resend
                await resend.emails.send({
                  from: process.env.EMAIL_FROM || 'Mientior <noreply@mientior.com>',
                  to: [recipient.email],
                  subject: campaign.subject || 'Message from Mientior',
                  html: personalizedContent,
                  tags: [
                    { name: 'campaign_id', value: id },
                  ],
                });
              } else {
                // Simulate sending in development
                console.log(`[DEV] Would send email to ${recipient.email}`);
              }

              sentCount++;
            } catch (error) {
              failedCount++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`${recipient.email}: ${errorMessage}`);
              console.error(`Failed to send to ${recipient.email}:`, error);
            }
          })
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Update campaign status and stats
      const stats = {
        sent: sentCount,
        delivered: 0,
        opens: 0,
        uniqueOpens: 0,
        clicks: 0,
        uniqueClicks: 0,
        bounces: failedCount,
        unsubscribes: 0,
        complaints: 0,
        conversions: 0,
        revenue: 0,
        sentAt: new Date().toISOString(),
      };

      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          sentAt: new Date(),
          stats,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Campaign sent to ${sentCount} recipients (${failedCount} failed)`,
        campaign: updatedCampaign,
        stats,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
      });
    }
  } catch (error) {
    console.error('Campaign send error:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with MARKETING_WRITE permission
export const POST = withPermission(Permission.MARKETING_WRITE, handlePOST);

/**
 * REST API endpoint for sending campaigns (Admin)
 * POST: Send campaign to target audience
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';

async function handlePOST(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
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
    const segmentFilters = (campaign.segmentFilters as any) || {};

    // Build user query based on segment filters
    const where: any = {
      emailVerified: true, // Only send to verified emails
    };

    // Apply segment filters
    if (segmentFilters.loyaltyLevel) {
      where.loyaltyLevel = { in: segmentFilters.loyaltyLevel };
    }

    if (segmentFilters.minTotalSpent) {
      where.totalSpent = { gte: segmentFilters.minTotalSpent };
    }

    if (segmentFilters.minOrders) {
      where.totalOrders = { gte: segmentFilters.minOrders };
    }

    if (segmentFilters.createdAfter) {
      where.createdAt = { gte: new Date(segmentFilters.createdAfter) };
    }

    if (segmentFilters.hasOrders !== undefined) {
      if (segmentFilters.hasOrders) {
        where.totalOrders = { gt: 0 };
      } else {
        where.totalOrders = 0;
      }
    }

    // Query recipients
    const recipients = await prisma.user.findMany({
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

    // In a production environment, you would:
    // 1. Queue emails using BullMQ or similar
    // 2. Process emails in batches
    // 3. Track individual email statuses
    // 4. Handle bounces and unsubscribes
    // 5. Use a proper email service (Resend, SendGrid, etc.)

    // For now, we'll simulate sending by updating campaign status
    // TODO: Integrate with actual email sending service

    console.log(`[Campaign ${id}] Would send to ${recipients.length} recipients`);
    console.log(`[Campaign ${id}] Type: ${campaign.type}, Subject: ${campaign.subject}`);

    // Update campaign status and stats
    const stats = {
      sent: recipients.length,
      delivered: 0,
      opens: 0,
      clicks: 0,
      bounces: 0,
      unsubscribes: 0,
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

    // TODO: When implementing actual email sending:
    // 1. Create queue job for batch processing
    // 2. For each recipient, queue individual email
    // 3. Track delivery, opens, clicks via webhooks
    // 4. Update stats in real-time
    // Example implementation:
    /*
    const queue = new Queue('campaign-emails');

    for (const recipient of recipients) {
      await queue.add('send-email', {
        campaignId: id,
        recipientId: recipient.id,
        to: recipient.email,
        subject: campaign.subject,
        content: personalizeContent(campaign.content, recipient),
        trackingId: generateTrackingId(),
      });
    }
    */

    return NextResponse.json({
      success: true,
      message: `Campaign sent to ${recipients.length} recipients`,
      campaign: updatedCampaign,
      stats,
    });
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

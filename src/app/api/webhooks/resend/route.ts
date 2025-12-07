/**
 * Resend Webhook Handler
 * Processes email delivery events from Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { incrementCampaignStat, checkCampaignCompletion } from "@/lib/email-queue";

// Resend webhook event types
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    headers?: {
      "X-Campaign-Id"?: string;
      "X-Tracking-Id"?: string;
    };
    tags?: Array<{ name: string; value: string }>;
    click?: {
      link: string;
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
    bounce?: {
      message: string;
    };
  };
}

/**
 * Verify Resend webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract campaign ID from webhook payload
 */
function extractCampaignId(data: ResendWebhookPayload["data"]): string | null {
  // Try headers first
  if (data.headers?.["X-Campaign-Id"]) {
    return data.headers["X-Campaign-Id"];
  }

  // Try tags
  const campaignTag = data.tags?.find((t) => t.name === "campaign_id");
  if (campaignTag) {
    return campaignTag.value;
  }

  return null;
}

/**
 * Extract tracking ID from webhook payload
 */
function extractTrackingId(data: ResendWebhookPayload["data"]): string | null {
  if (data.headers?.["X-Tracking-Id"]) {
    return data.headers["X-Tracking-Id"];
  }

  const trackingTag = data.tags?.find((t) => t.name === "tracking_id");
  if (trackingTag) {
    return trackingTag.value;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("resend-signature") || "";
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature in production
    if (process.env.NODE_ENV === "production" && webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid Resend webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);
    const { type, data } = payload;

    console.log(`[Resend Webhook] Received event: ${type}`);

    const campaignId = extractCampaignId(data);
    const trackingId = extractTrackingId(data);

    if (!campaignId) {
      console.log("[Resend Webhook] No campaign ID found, skipping");
      return NextResponse.json({ received: true });
    }

    // Process event based on type
    switch (type) {
      case "email.sent":
        // Email was accepted by Resend
        console.log(`[Campaign ${campaignId}] Email sent to ${data.to[0]}`);
        break;

      case "email.delivered":
        // Email was delivered to recipient's mailbox
        await incrementCampaignStat(campaignId, "delivered");
        console.log(`[Campaign ${campaignId}] Email delivered to ${data.to[0]}`);
        break;

      case "email.delivery_delayed":
        // Delivery is being retried
        console.log(`[Campaign ${campaignId}] Delivery delayed for ${data.to[0]}`);
        break;

      case "email.bounced":
        // Email bounced
        await incrementCampaignStat(campaignId, "bounces");
        console.log(
          `[Campaign ${campaignId}] Email bounced for ${data.to[0]}: ${data.bounce?.message}`
        );
        break;

      case "email.complained":
        // Recipient marked as spam
        await incrementCampaignStat(campaignId, "complaints");
        console.log(`[Campaign ${campaignId}] Spam complaint from ${data.to[0]}`);
        break;

      case "email.opened":
        // Email was opened
        await incrementCampaignStat(campaignId, "opens");
        // Track unique opens (would need a separate tracking mechanism)
        console.log(`[Campaign ${campaignId}] Email opened by ${data.to[0]}`);
        break;

      case "email.clicked":
        // Link was clicked
        await incrementCampaignStat(campaignId, "clicks");
        console.log(
          `[Campaign ${campaignId}] Link clicked by ${data.to[0]}: ${data.click?.link}`
        );
        break;

      default:
        console.log(`[Resend Webhook] Unknown event type: ${type}`);
    }

    // Check if campaign is complete
    await checkCampaignCompletion(campaignId);

    // Store event for analytics (optional)
    try {
      await prisma.$executeRaw`
        INSERT INTO campaign_events (campaign_id, tracking_id, event_type, email, metadata, created_at)
        VALUES (${campaignId}, ${trackingId}, ${type}, ${data.to[0]}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT DO NOTHING
      `;
    } catch (error) {
      // Table might not exist yet, that's okay
      console.log("[Resend Webhook] Could not store event (table may not exist)");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Resend Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Resend sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

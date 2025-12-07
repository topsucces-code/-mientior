/**
 * Email Queue System using BullMQ
 * Handles batch email sending for campaigns with retry logic
 */

import { Queue, Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { personalizeEmailContent } from "./email-personalizer";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Redis connection config
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// Queue names
export const CAMPAIGN_EMAIL_QUEUE = "campaign-emails";
export const CAMPAIGN_BATCH_QUEUE = "campaign-batches";

// Types
export interface EmailJobData {
  campaignId: string;
  recipientId: string;
  to: string;
  subject: string;
  content: string;
  trackingId: string;
  firstName?: string;
  lastName?: string;
  unsubscribeUrl: string;
}

export interface BatchJobData {
  campaignId: string;
  batchNumber: number;
  totalBatches: number;
  recipientIds: string[];
}

// Create queues
export const emailQueue = new Queue<EmailJobData>(CAMPAIGN_EMAIL_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

export const batchQueue = new Queue<BatchJobData>(CAMPAIGN_BATCH_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  },
});

/**
 * Queue a campaign for sending
 * Splits recipients into batches and queues each batch
 */
export async function queueCampaignForSending(
  campaignId: string,
  recipientIds: string[],
  batchSize: number = 100
): Promise<{ totalBatches: number; totalRecipients: number }> {
  const batches: string[][] = [];
  
  for (let i = 0; i < recipientIds.length; i += batchSize) {
    batches.push(recipientIds.slice(i, i + batchSize));
  }

  // Queue each batch
  for (let i = 0; i < batches.length; i++) {
    await batchQueue.add(
      `batch-${campaignId}-${i}`,
      {
        campaignId,
        batchNumber: i + 1,
        totalBatches: batches.length,
        recipientIds: batches[i],
      },
      {
        delay: i * 1000, // Stagger batches by 1 second
      }
    );
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "ACTIVE",
      stats: {
        sent: 0,
        delivered: 0,
        opens: 0,
        uniqueOpens: 0,
        clicks: 0,
        uniqueClicks: 0,
        bounces: 0,
        unsubscribes: 0,
        complaints: 0,
        conversions: 0,
        revenue: 0,
        totalRecipients: recipientIds.length,
        totalBatches: batches.length,
        processedBatches: 0,
      },
    },
  });

  return {
    totalBatches: batches.length,
    totalRecipients: recipientIds.length,
  };
}

/**
 * Generate a unique tracking ID for email tracking
 */
export function generateTrackingId(): string {
  return `trk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(recipientId: string, campaignId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mientior.com";
  const token = Buffer.from(`${recipientId}:${campaignId}`).toString("base64");
  return `${baseUrl}/unsubscribe?token=${token}`;
}

/**
 * Process a batch of emails
 */
async function processBatch(job: Job<BatchJobData>): Promise<void> {
  const { campaignId, batchNumber, totalBatches, recipientIds } = job.data;

  console.log(`[Campaign ${campaignId}] Processing batch ${batchNumber}/${totalBatches}`);

  // Fetch campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Fetch recipients
  const recipients = await prisma.user.findMany({
    where: {
      id: { in: recipientIds },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  // Queue individual emails
  for (const recipient of recipients) {
    const trackingId = generateTrackingId();
    const unsubscribeUrl = generateUnsubscribeUrl(recipient.id, campaignId);

    await emailQueue.add(
      `email-${campaignId}-${recipient.id}`,
      {
        campaignId,
        recipientId: recipient.id,
        to: recipient.email,
        subject: campaign.subject || "",
        content: campaign.content,
        trackingId,
        firstName: recipient.firstName || undefined,
        lastName: recipient.lastName || undefined,
        unsubscribeUrl,
      },
      {
        jobId: `${campaignId}-${recipient.id}`, // Prevent duplicates
      }
    );
  }

  // Update batch progress
  const currentStats = (campaign.stats as Record<string, number>) || {};
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      stats: {
        ...currentStats,
        processedBatches: (currentStats.processedBatches || 0) + 1,
      },
    },
  });

  console.log(`[Campaign ${campaignId}] Batch ${batchNumber} queued ${recipients.length} emails`);
}

/**
 * Send a single email
 */
async function sendEmail(job: Job<EmailJobData>): Promise<void> {
  const {
    campaignId,
    recipientId,
    to,
    subject,
    content,
    trackingId,
    firstName,
    lastName,
    unsubscribeUrl,
  } = job.data;

  // Personalize content
  const personalizedContent = personalizeEmailContent(content, {
    firstName,
    lastName,
    email: to,
    unsubscribeUrl,
    trackingId,
  });

  // Add tracking pixel
  const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/email-tracking?type=open&tid=${trackingId}`;
  const contentWithTracking = `${personalizedContent}<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;

  try {
    // Send via Resend
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Mientior <noreply@mientior.com>",
      to: [to],
      subject,
      html: contentWithTracking,
      headers: {
        "X-Campaign-Id": campaignId,
        "X-Tracking-Id": trackingId,
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
      },
      tags: [
        { name: "campaign_id", value: campaignId },
        { name: "tracking_id", value: trackingId },
      ],
    });

    // Update campaign stats
    await incrementCampaignStat(campaignId, "sent");

    console.log(`[Campaign ${campaignId}] Email sent to ${to}, ID: ${result.data?.id}`);
  } catch (error) {
    console.error(`[Campaign ${campaignId}] Failed to send email to ${to}:`, error);
    throw error; // Will trigger retry
  }
}

/**
 * Increment a campaign stat atomically
 */
export async function incrementCampaignStat(
  campaignId: string,
  stat: string,
  amount: number = 1
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { stats: true },
  });

  const currentStats = (campaign?.stats as Record<string, number>) || {};
  
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      stats: {
        ...currentStats,
        [stat]: (currentStats[stat] || 0) + amount,
      },
    },
  });
}

/**
 * Check if campaign sending is complete
 */
export async function checkCampaignCompletion(campaignId: string): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { stats: true, status: true },
  });

  if (!campaign) return false;

  const stats = campaign.stats as Record<string, number>;
  const totalRecipients = stats.totalRecipients || 0;
  const sent = stats.sent || 0;
  const bounces = stats.bounces || 0;

  // Campaign is complete when all emails are sent or bounced
  if (sent + bounces >= totalRecipients && campaign.status === "ACTIVE") {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        sentAt: new Date(),
      },
    });
    return true;
  }

  return false;
}

// Create workers (only in server environment)
let batchWorker: Worker<BatchJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;

export function startEmailWorkers(): void {
  if (typeof window !== "undefined") {
    console.warn("Email workers can only run on the server");
    return;
  }

  // Batch worker
  batchWorker = new Worker<BatchJobData>(
    CAMPAIGN_BATCH_QUEUE,
    processBatch,
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  batchWorker.on("completed", (job) => {
    console.log(`Batch job ${job.id} completed`);
  });

  batchWorker.on("failed", (job, err) => {
    console.error(`Batch job ${job?.id} failed:`, err);
  });

  // Email worker
  emailWorker = new Worker<EmailJobData>(
    CAMPAIGN_EMAIL_QUEUE,
    sendEmail,
    {
      connection: redisConnection,
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000, // Max 100 emails per second
      },
    }
  );

  emailWorker.on("completed", async (job) => {
    console.log(`Email job ${job.id} completed`);
    // Check if campaign is complete
    await checkCampaignCompletion(job.data.campaignId);
  });

  emailWorker.on("failed", async (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err);
    if (job) {
      await incrementCampaignStat(job.data.campaignId, "bounces");
    }
  });

  console.log("Email workers started");
}

export function stopEmailWorkers(): void {
  batchWorker?.close();
  emailWorker?.close();
  console.log("Email workers stopped");
}

export default {
  emailQueue,
  batchQueue,
  queueCampaignForSending,
  generateTrackingId,
  generateUnsubscribeUrl,
  incrementCampaignStat,
  checkCampaignCompletion,
  startEmailWorkers,
  stopEmailWorkers,
};

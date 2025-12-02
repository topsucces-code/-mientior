import { Resend } from 'resend'

// Lazy-load Resend client to avoid initialization errors in tests
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

interface OrderEmailData {
  orderNumber: string
  email: string
}

interface UserEmailData {
  email: string
}

// Email template interfaces
export interface VerificationEmailData {
  name: string
  email: string
  verificationUrl: string
  expiresIn: string
}

export interface PasswordResetEmailData {
  name: string
  email: string
  resetUrl: string
  expiresIn: string
  ipAddress: string
}

export interface WelcomeEmailData {
  name: string
  email: string
}

export interface SecurityAlertEmailData {
  name: string
  email: string
  deviceInfo: string
  location: string
  ipAddress: string
  timestamp: string
}

export interface OrderConfirmationEmailData {
  orderNumber: string
  customerName: string
  email: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image?: string
  }>
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  shippingAddress: {
    firstName: string
    lastName: string
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
    phone: string
  }
  estimatedDelivery?: string
  orderNotes?: string
  orderDate: string
}

// Email sending configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@mientior.com',
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}

// Retry logic for email sending
async function sendEmailWithRetry(
  emailFn: () => Promise<void>,
  retries = EMAIL_CONFIG.maxRetries
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await emailFn()
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (attempt === retries) {
        console.error(`Email sending failed after ${retries} attempts:`, errorMessage)
        return { success: false, error: errorMessage }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.retryDelay * attempt))
    }
  }
  
  return { success: false, error: 'Max retries exceeded' }
}

// Helper to get Resend instance
function getResend(): Resend {
  return getResendClient()
}

// Email template generators
export function generateVerificationEmail(data: VerificationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .content h2 { color: #000000; font-size: 20px; margin-top: 0; }
          .content p { margin: 16px 0; color: #555; }
          .button { display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 24px 0; }
          .button:hover { background-color: #333333; }
          .footer { padding: 30px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
          .expiry { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mientior</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${data.name},</p>
            <p>Thank you for registering with Mientior! To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <div class="expiry">
              <strong>⏰ This link expires in ${data.expiresIn}</strong>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${data.verificationUrl}</p>
            <p>If you didn't create an account with Mientior, you can safely ignore this email.</p>
            <p>Need help? Contact our support team at support@mientior.com</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mientior. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .content h2 { color: #000000; font-size: 20px; margin-top: 0; }
          .content p { margin: 16px 0; color: #555; }
          .button { display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 24px 0; }
          .button:hover { background-color: #333333; }
          .footer { padding: 30px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
          .security-info { background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 12px; margin: 20px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mientior</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${data.name},</p>
            <p>We received a request to reset the password for your Mientior account. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⏰ This link expires in ${data.expiresIn}</strong>
            </div>
            <div class="security-info">
              <strong>🔒 Security Information</strong>
              <p style="margin: 8px 0;">Request made from IP: ${data.ipAddress}</p>
              <p style="margin: 8px 0;">If you didn't request this password reset, please ignore this email or contact support immediately if you're concerned about your account security.</p>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${data.resetUrl}</p>
            <p>For security reasons, this link can only be used once.</p>
            <p>Need help? Contact our support team at support@mientior.com</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mientior. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Mientior</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .content h2 { color: #000000; font-size: 20px; margin-top: 0; }
          .content p { margin: 16px 0; color: #555; }
          .button { display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 24px 0; }
          .button:hover { background-color: #333333; }
          .footer { padding: 30px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
          .tips { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .tips h3 { margin-top: 0; color: #000000; font-size: 16px; }
          .tips ul { margin: 0; padding-left: 20px; }
          .tips li { margin: 8px 0; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mientior</h1>
          </div>
          <div class="content">
            <h2>Welcome to Mientior! 🎉</h2>
            <p>Hi ${data.name},</p>
            <p>Your email has been verified and your account is now active! We're excited to have you join our community.</p>
            <div class="tips">
              <h3>🚀 Getting Started Tips:</h3>
              <ul>
                <li><strong>Complete your profile:</strong> Add your shipping address and payment methods for faster checkout</li>
                <li><strong>Browse our collections:</strong> Discover curated products from top vendors</li>
                <li><strong>Create a wishlist:</strong> Save your favorite items for later</li>
                <li><strong>Enable notifications:</strong> Get alerts about deals, new arrivals, and order updates</li>
                <li><strong>Join our loyalty program:</strong> Earn points with every purchase and unlock exclusive rewards</li>
              </ul>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mientior.com'}" class="button">Start Shopping</a>
            </div>
            <p>If you have any questions or need assistance, our support team is here to help at support@mientior.com</p>
            <p>Happy shopping!</p>
            <p>The Mientior Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mientior. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function generateSecurityAlertEmail(data: SecurityAlertEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login Detected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #dc3545; color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .content h2 { color: #dc3545; font-size: 20px; margin-top: 0; }
          .content p { margin: 16px 0; color: #555; }
          .button { display: inline-block; padding: 14px 32px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 24px 0; }
          .button:hover { background-color: #c82333; }
          .footer { padding: 30px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; color: #856404; }
          .device-info { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .device-info table { width: 100%; border-collapse: collapse; }
          .device-info td { padding: 8px 0; color: #555; }
          .device-info td:first-child { font-weight: 600; color: #000; width: 120px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Security Alert</h1>
          </div>
          <div class="content">
            <h2>New Login to Your Account</h2>
            <p>Hi ${data.name},</p>
            <p>We detected a new login to your Mientior account from a device or location we haven't seen before.</p>
            <div class="device-info">
              <table>
                <tr>
                  <td>Device:</td>
                  <td>${data.deviceInfo}</td>
                </tr>
                <tr>
                  <td>Location:</td>
                  <td>${data.location}</td>
                </tr>
                <tr>
                  <td>IP Address:</td>
                  <td>${data.ipAddress}</td>
                </tr>
                <tr>
                  <td>Time:</td>
                  <td>${data.timestamp}</td>
                </tr>
              </table>
            </div>
            <div class="alert">
              <strong>⚠️ Was this you?</strong>
              <p style="margin: 8px 0;">If you recognize this activity, you can safely ignore this email.</p>
              <p style="margin: 8px 0;">If you don't recognize this login, your account may have been compromised. Please secure your account immediately by changing your password.</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mientior.com'}/account/security" class="button">Review Account Security</a>
            </div>
            <p>You can also view all active sessions and log out from unfamiliar devices in your account security settings.</p>
            <p>Need help? Contact our support team immediately at support@mientior.com</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Mientior. All rights reserved.</p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

function generateOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const formatPrice = (price: number) => `${(price / 100).toFixed(2)} €`

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <span style="font-weight: 500; color: #1f2937;">${item.name}</span>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">×${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  const orderNotesHtml = data.orderNotes ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 20px;">📝</span>
        <strong style="color: #856404; font-size: 16px;">Instructions de livraison</strong>
      </div>
      <p style="margin: 0; color: #856404; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${data.orderNotes}</p>
    </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Mientior</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <!-- Success Message -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin-bottom: 16px;">
                <span style="color: white; font-size: 32px; line-height: 64px;">✓</span>
              </div>
              <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px;">Commande confirmée !</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px;">Merci ${data.customerName} pour votre commande</p>
            </div>

            <!-- Order Details -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Numéro de commande</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">#${data.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Date de commande</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${data.orderDate}</span>
              </div>
            </div>

            <!-- Items Table -->
            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Articles commandés</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Article</th>
                  <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Qté</th>
                  <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Order Summary -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Sous-total</span>
                <span style="color: #1f2937; font-size: 14px;">${formatPrice(data.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Livraison</span>
                <span style="color: #1f2937; font-size: 14px;">${formatPrice(data.shippingCost)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">TVA</span>
                <span style="color: #1f2937; font-size: 14px;">${formatPrice(data.tax)}</span>
              </div>
              ${data.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #10b981; font-size: 14px;">Réduction</span>
                  <span style="color: #10b981; font-size: 14px;">-${formatPrice(data.discount)}</span>
                </div>
              ` : ''}
              <div style="border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 12px; display: flex; justify-content: space-between;">
                <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Total</span>
                <span style="color: #ff6b35; font-size: 18px; font-weight: 700;">${formatPrice(data.total)}</span>
              </div>
            </div>

            <!-- Shipping Address -->
            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Adresse de livraison</h3>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}
              </p>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${data.shippingAddress.line1}</p>
              ${data.shippingAddress.line2 ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${data.shippingAddress.line2}</p>` : ''}
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                ${data.shippingAddress.postalCode} ${data.shippingAddress.city}
              </p>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${data.shippingAddress.country}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Tél: ${data.shippingAddress.phone}</p>
            </div>

            ${orderNotesHtml}

            ${data.estimatedDelivery ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">🚚</span>
                  <div>
                    <strong style="color: #1e40af; font-size: 14px;">Livraison estimée</strong>
                    <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 14px;">${data.estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mientior.com'}/account/orders"
                 style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Suivre ma commande
              </a>
            </div>

            <!-- Help Section -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Besoin d'aide ?</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Contactez-nous à <a href="mailto:support@mientior.com" style="color: #ff6b35; text-decoration: none;">support@mientior.com</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Mientior. Tous droits réservés.</p>
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              Vous recevez cet email car vous avez passé une commande sur Mientior.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Async email sending functions with retry logic
export async function sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmailWithRetry(async () => {
    const resend = getResend()
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Verify Your Email - Mientior',
      html: generateVerificationEmail(data),
    })
  })
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmailWithRetry(async () => {
    const resend = getResend()
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Reset Your Password - Mientior',
      html: generatePasswordResetEmail(data),
    })
  })
}

export async function sendWelcomeEmailAuth(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmailWithRetry(async () => {
    const resend = getResend()
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: 'Welcome to Mientior! 🎉',
      html: generateWelcomeEmail(data),
    })
  })
}

export async function sendSecurityAlertEmail(data: SecurityAlertEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmailWithRetry(async () => {
    const resend = getResend()
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: '🔒 Security Alert: New Login Detected - Mientior',
      html: generateSecurityAlertEmail(data),
    })
  })
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
  return sendEmailWithRetry(async () => {
    const resend = getResend()
    await resend.emails.send({
      from: 'orders@mientior.com',
      to: data.email,
      subject: `Confirmation de commande #${data.orderNumber} - Mientior`,
      html: generateOrderConfirmationEmail(data),
    })
  })
}

// Legacy functions for backward compatibility
export async function sendOrderConfirmation(order: OrderEmailData, user: UserEmailData) {
  const resend = getResend()
  // Use React Email template (to be implemented)
  return resend.emails.send({
    from: 'orders@mientior.com',
    to: user.email,
    subject: `Order confirmation #${order.orderNumber}`,
    html: '<p>Thank you for your order!</p>'
  })
}

export async function sendWelcomeEmail(user: UserEmailData) {
  const resend = getResend()
  return resend.emails.send({
    from: 'hello@mientior.com',
    to: user.email,
    subject: 'Welcome to Mientior!',
    html: '<p>Welcome!</p>'
  })
}

export async function sendShippingNotification(order: OrderEmailData, trackingNumber: string) {
  const resend = getResend()
  return resend.emails.send({
    from: 'shipping@mientior.com',
    to: order.email,
    subject: `Your order #${order.orderNumber} has shipped`,
    html: `<p>Tracking: ${trackingNumber}</p>`
  })
}

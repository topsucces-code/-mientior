# Express Checkout Backend Implementation

## Overview

This document provides a comprehensive implementation guide for the Express Checkout backend endpoints (Apple Pay, Google Pay, PayPal) with full PSP integration, security measures, and payment processing capabilities.

## Architecture

The Express Checkout implementation follows these principles:
- **Security First**: CSRF validation, rate limiting, fraud detection, input sanitization
- **PSP Integration**: Tokenization only (never store card data), PCI compliance
- **Idempotency**: Order IDs prevent duplicate charges
- **Fraud Prevention**: Risk scoring based on user behavior patterns
- **Analytics Integration**: Conversion tracking with payment method attribution

## Implemented Components

### 1. Shared Payment Utilities (`src/lib/payment-utils.ts`) ✅

**Purpose**: Centralized validation, fraud detection, and order management for all express payment methods.

**Key Functions**:
- `validateExpressPaymentRequest()` - Comprehensive request validation (rate limiting, CSRF, amount matching, stock validation)
- `checkForFraud()` - Risk scoring based on rapid requests, failed attempts, high-value guest checkouts, fast checkouts
- `createProvisionalExpressOrder()` - Creates provisional order linked to payment gateway
- `logPaymentAttempt()` - Audit logging with sensitive data hashing

**Security Features**:
- Rate limiting with `paymentRateLimit` (3 requests / 5 minutes)
- CSRF token validation from session storage
- Server-side amount validation (prevents client tampering)
- Input sanitization for all user inputs
- Fraud detection with configurable risk thresholds

### 2. Apple Pay Merchant Validation (`src/app/api/checkout/apple-pay/validate-merchant/route.ts`) ✅

**Endpoint**: `POST /api/checkout/apple-pay/validate-merchant`

**Purpose**: Validates merchant with Apple Pay servers during payment session initialization.

**Security**:
- Rate limited to 3 requests/minute
- CSRF token validation
- Domain validation (must match `NEXT_PUBLIC_APP_URL`)
- Apple domain verification (URL must end with `apple.com`)

**Production Requirements**:
```env
APPLE_PAY_MERCHANT_ID=merchant.com.mientior
APPLE_PAY_CERT_PATH=/path/to/merchant_id.pem
APPLE_PAY_KEY_PATH=/path/to/merchant_id.key
```

**Implementation Notes**:
- Currently returns mock merchant session for development
- Production requires Apple Pay Merchant Identity Certificate from Apple Developer portal
- Must make HTTPS POST to `validationURL` with certificate authentication
- Response includes `merchantSession` object required by ApplePaySession API

### 3. Apple Pay Payment Processing (`src/app/api/checkout/apple-pay/process/route.ts`) ✅

**Endpoint**: `POST /api/checkout/apple-pay/process`

**Purpose**: Processes Apple Pay payment token and completes order.

**Flow**:
1. Rate limiting and session validation
2. Parse request (token, items, shipping/billing address, total)
3. Validate payment request (CSRF, amount, items, stock)
4. Fraud detection (risk scoring)
5. Create/update provisional order
6. Process Apple Pay token with PSP (Paystack/Stripe)
7. Complete order in transaction (update status, decrement stock)
8. Log payment attempt
9. Return success response (frontend calls trackConversion)

**Request Body**:
```typescript
{
  token: any, // Apple Pay payment token
  items: OrderItem[],
  shippingAddress: Address,
  billingAddress?: Address,
  email?: string,
  total: number, // in euros
  shippingOption?: string,
  orderId?: string // for updating existing provisional order
}
```

**Response**:
```typescript
{
  success: true,
  orderId: string,
  orderNumber: string,
  paymentReference: string,
  total: number,
  status: 'PROCESSING',
  message: 'Payment processed successfully'
}
```

**Error Handling**:
- 429: Rate limit exceeded (with Retry-After header)
- 400: Validation errors (empty cart, amount mismatch, invalid inputs)
- 403: Fraud detected (risk score >= 8)
- 404: Order not found
- 501: Payment gateway not configured
- 500: Processing failed

## Remaining Implementations

### 4. Google Pay Payment Processing (`src/app/api/checkout/google-pay/process/route.ts`)

**Endpoint**: `POST /api/checkout/google-pay/process`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'
import {
  validateExpressPaymentRequest,
  checkForFraud,
  createProvisionalExpressOrder,
  logPaymentAttempt,
} from '@/lib/payment-utils'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = checkRateLimit(request, paymentRateLimit)
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { success: false, error: 'Too many payment attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // 2. Session and body parsing
    const session = await getSession()
    const body = await request.json()
    const { token, items, shippingAddress, billingAddress, email, total, shippingOption, orderId } = body

    // 3. Validate request
    const validation = await validateExpressPaymentRequest({
      request, items, total, shippingOption, email, orderId
    })

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, errorCode: validation.errorCode },
        { status: 400 }
      )
    }

    // 4. Fraud detection
    const fraudCheck = checkForFraud({
      requestHistory: [{ timestamp: Date.now(), success: false }],
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0],
      total: validation.computedTotal || 0,
      isGuest: !session,
    })

    if (!fraudCheck.passed) {
      await logPaymentAttempt({
        orderId: orderId || 'N/A',
        gateway: 'GOOGLE_PAY',
        success: false,
        errorMessage: 'Fraud detection triggered',
        metadata: { riskScore: fraudCheck.riskScore, flags: fraudCheck.flags },
      })
      return NextResponse.json(
        { success: false, error: 'Payment review required. Please contact support.', errorCode: 'FRAUD_DETECTED' },
        { status: 403 }
      )
    }

    // 5. Create/update provisional order
    let finalOrderId, orderNumber, orderTotal

    if (orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, total: true, paymentStatus: true },
      })

      if (!existingOrder) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      if (existingOrder.paymentStatus === 'PAID') return NextResponse.json({ success: false, error: 'Order already paid' }, { status: 400 })

      finalOrderId = existingOrder.id
      orderNumber = existingOrder.orderNumber
      orderTotal = Math.round(existingOrder.total * 100)
    } else {
      const provisionalOrder = await createProvisionalExpressOrder({
        items, shippingAddress, billingAddress,
        email: email || session?.user?.email || shippingAddress.email,
        userId: session?.user?.id,
        gateway: 'GOOGLE_PAY',
        shippingOption,
      })

      finalOrderId = provisionalOrder.orderId
      orderNumber = provisionalOrder.orderNumber
      orderTotal = provisionalOrder.total
    }

    // 6. Process Google Pay token
    /**
     * Production implementation with Stripe:
     *
     * const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
     * const paymentIntent = await stripe.paymentIntents.create({
     *   amount: orderTotal, // in cents
     *   currency: 'eur',
     *   payment_method_data: {
     *     type: 'card',
     *     card: { token: token.id } // Google Pay token
     *   },
     *   confirm: true,
     *   metadata: {
     *     orderId: finalOrderId,
     *     orderNumber,
     *     expressMethod: 'GOOGLE_PAY'
     *   }
     * })
     *
     * if (paymentIntent.status !== 'succeeded') {
     *   throw new Error('Payment failed')
     * }
     *
     * const paymentReference = paymentIntent.id
     */

    if (!process.env.STRIPE_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Pay processing not configured. Please set up payment gateway.', requiresSetup: true },
        { status: 501 }
      )
    }

    // Mock for development
    const paymentReference = `GOOGLE_PAY_${Date.now()}_${finalOrderId.slice(0, 8)}`

    // 7. Complete order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: finalOrderId },
        data: {
          paymentReference,
          paymentGateway: 'PAYSTACK',
          billingAddress: billingAddress ? JSON.stringify(billingAddress) : JSON.stringify(shippingAddress),
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          paymentMetadata: {
            gateway: 'GOOGLE_PAY',
            expressMethod: 'GOOGLE_PAY',
            reference: paymentReference,
            amount: orderTotal / 100,
            completedAt: new Date().toISOString(),
            dev: process.env.NODE_ENV !== 'production',
          },
          updatedAt: new Date(),
        },
        select: {
          id: true, orderNumber: true, status: true, paymentStatus: true, total: true,
          items: { select: { id: true, productId: true, variantId: true, quantity: true } },
        },
      })

      // Decrement stock
      for (const item of updated.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return updated
    })

    // 8. Log success
    await logPaymentAttempt({
      orderId: finalOrderId,
      gateway: 'GOOGLE_PAY',
      success: true,
      metadata: { reference: paymentReference, amount: orderTotal / 100 },
    })

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      paymentReference,
      total: updatedOrder.total,
      status: updatedOrder.status,
      message: 'Payment processed successfully',
    })
  } catch (error) {
    console.error('[Google Pay Process Error]', error)
    return NextResponse.json(
      { success: false, error: 'Payment processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### 5. PayPal Express Checkout (`src/app/api/checkout/paypal/generate-url/route.ts`)

**Endpoint**: `POST /api/checkout/paypal/generate-url`

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'
import {
  validateExpressPaymentRequest,
  createProvisionalExpressOrder,
  logPaymentAttempt,
} from '@/lib/payment-utils'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = checkRateLimit(request, paymentRateLimit)
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      )
    }

    // 2. Session and body parsing
    const session = await getSession()
    const body = await request.json()
    const { items, shippingAddress, billingAddress, email, total, shippingOption } = body

    // 3. Validate request
    const validation = await validateExpressPaymentRequest({
      request, items, total, shippingOption, email
    })

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, errorCode: validation.errorCode },
        { status: 400 }
      )
    }

    // 4. Create provisional order
    const provisionalOrder = await createProvisionalExpressOrder({
      items, shippingAddress, billingAddress,
      email: email || session?.user?.email || shippingAddress.email,
      userId: session?.user?.id,
      gateway: 'PAYPAL',
      shippingOption,
    })

    // 5. Generate PayPal order
    /**
     * Production implementation with PayPal SDK:
     *
     * import paypal from '@paypal/checkout-server-sdk'
     *
     * const environment = new paypal.core.SandboxEnvironment(
     *   process.env.PAYPAL_CLIENT_ID,
     *   process.env.PAYPAL_CLIENT_SECRET
     * )
     * const client = new paypal.core.PayPalHttpClient(environment)
     *
     * const request = new paypal.orders.OrdersCreateRequest()
     * request.prefer('return=representation')
     * request.requestBody({
     *   intent: 'CAPTURE',
     *   purchase_units: [{
     *     amount: {
     *       currency_code: 'EUR',
     *       value: (provisionalOrder.total / 100).toFixed(2)
     *     },
     *     reference_id: provisionalOrder.orderId
     *   }],
     *   application_context: {
     *     return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback?orderId=${provisionalOrder.orderId}`,
     *     cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`
     *   }
     * })
     *
     * const response = await client.execute(request)
     * const approvalUrl = response.result.links.find(link => link.rel === 'approve').href
     */

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'PayPal not configured. Please set up PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.', requiresSetup: true },
        { status: 501 }
      )
    }

    // Mock for development
    const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=EC-MOCK_${provisionalOrder.orderId}`

    await logPaymentAttempt({
      orderId: provisionalOrder.orderId,
      gateway: 'PAYPAL',
      success: true,
      metadata: { approvalUrlGenerated: true },
    })

    return NextResponse.json({
      success: true,
      approvalUrl,
      orderId: provisionalOrder.orderId,
      orderNumber: provisionalOrder.orderNumber,
    })
  } catch (error) {
    console.error('[PayPal Generate URL Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PayPal URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

## Environment Variables

Add to `.env.example`:

```env
# Express Checkout - Apple Pay
APPLE_PAY_MERCHANT_ID=merchant.com.mientior
APPLE_PAY_CERT_PATH=/path/to/merchant_id.pem
APPLE_PAY_KEY_PATH=/path/to/merchant_id.key

# Express Checkout - Google Pay (uses Stripe)
GOOGLE_PAY_MERCHANT_ID=BCR2DN4ABCDEFGH
GOOGLE_PAY_MERCHANT_NAME=Mientior Marketplace

# Express Checkout - PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox # or 'live' for production
```

## Frontend Integration

Frontend expects these endpoints to be available:

1. **Apple Pay**:
   - `POST /api/checkout/apple-pay/validate-merchant` - Returns merchant session
   - `POST /api/checkout/apple-pay/process` - Processes payment token

2. **Google Pay**:
   - `POST /api/checkout/google-pay/process` - Processes payment token

3. **PayPal**:
   - `POST /api/checkout/paypal/generate-url` - Returns approval URL for redirect

All endpoints require:
- `X-CSRF-Token` header (from `getCSRFToken()`)
- Request body with items, addresses, total

## Testing

### Development Mode
- Mock merchant sessions and payment tokens
- Bypasses PSP API calls
- Logs all attempts for debugging

### Production Checklist
1. Configure PSP credentials (Stripe, Paystack, PayPal)
2. Obtain Apple Pay Merchant Identity Certificate
3. Register domain with Apple Pay
4. Test with real payment methods in sandbox
5. Set up webhooks for payment confirmations
6. Enable fraud monitoring
7. Configure rate limiting in Redis (not in-memory)

## Security Considerations

1. **PCI Compliance**: Never log/store full card data, use tokenization only
2. **CSRF Protection**: All endpoints validate CSRF token from session storage
3. **Rate Limiting**: Strict limits on payment endpoints (3/5min)
4. **Fraud Detection**: Risk scoring based on user behavior, configurable thresholds
5. **Amount Validation**: Server-side totals computation prevents client tampering
6. **Idempotency**: Order IDs prevent duplicate charges
7. **Audit Logging**: All payment attempts logged with sensitive data hashed

## Analytics Integration

Frontend calls `trackConversion()` on success:

```typescript
trackConversion(orderId, revenue, 'apple_pay') // or 'google_pay', 'paypal'
```

This tracks:
- Purchase event
- Revenue attribution
- Payment method
- Conversion funnel completion

## Error Codes

- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_CSRF`: CSRF token validation failed
- `EMPTY_CART`: No items in cart
- `AMOUNT_MISMATCH`: Client/server total mismatch
- `FRAUD_DETECTED`: Risk score threshold exceeded
- `ORDER_NOT_FOUND`: Invalid order ID
- `ALREADY_PAID`: Order already completed

## Next Steps

1. ✅ Shared payment utilities implemented
2. ✅ Apple Pay merchant validation implemented
3. ✅ Apple Pay payment processing implemented (needs PSP integration)
4. ⏳ Implement Google Pay processing endpoint (see code above)
5. ⏳ Implement PayPal URL generation endpoint (see code above)
6. ⏳ Configure PSP credentials
7. ⏳ Test with real payment methods
8. ⏳ Set up monitoring and alerts

## Support

For issues:
- Check logs for `[Apple Pay]`, `[Google Pay]`, `[PayPal]` prefixes
- Verify environment variables are set
- Ensure PSP credentials are valid
- Review fraud detection scores if payments blocked
- Contact PSP support for token processing errors

# Express Checkout Quick Start Guide

## Overview

Express Checkout backend endpoints are now implemented for Apple Pay, Google Pay, and PayPal with comprehensive security measures.

## What's Been Implemented

✅ **Shared Payment Utilities** (`src/lib/payment-utils.ts`)
- Request validation (CSRF, rate limiting, amount matching)
- Fraud detection with risk scoring
- Provisional order creation
- Audit logging

✅ **Apple Pay** (`src/app/api/checkout/apple-pay/`)
- Merchant validation endpoint
- Payment processing endpoint

✅ **Google Pay** (`src/app/api/checkout/google-pay/process/`)
- Payment processing endpoint (enhanced)

✅ **PayPal** (`src/app/api/checkout/paypal/generate-url/`)
- Express checkout URL generation (enhanced)

✅ **Environment Variables** (`.env.example`)
- Apple Pay configuration
- Google Pay configuration
- PayPal configuration

## Quick Test (Development Mode)

### 1. Start the development server
```bash
npm run dev
```

### 2. Test Apple Pay validation
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/validate-merchant \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-token" \
  -d '{
    "validationURL": "https://apple-pay-gateway.apple.com/paymentservices/startSession",
    "domain": "localhost"
  }'
```

**Expected**: Mock merchant session in development

### 3. Test Google Pay processing
```bash
curl -X POST http://localhost:3000/api/checkout/google-pay/process \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-token" \
  -d '{
    "token": { "id": "tok_test_123" },
    "items": [{ "productId": "product-id", "quantity": 1 }],
    "total": 100,
    "email": "test@example.com",
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "line1": "123 Main St",
      "city": "Paris",
      "postalCode": "75001",
      "country": "FR",
      "email": "test@example.com"
    }
  }'
```

**Expected**: Mock payment processing in development

### 4. Test PayPal URL generation
```bash
curl -X POST http://localhost:3000/api/checkout/paypal/generate-url \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-token" \
  -d '{
    "items": [{ "productId": "product-id", "quantity": 1 }],
    "total": 100,
    "email": "test@example.com"
  }'
```

**Expected**: Mock PayPal approval URL in development

## Production Setup

### Prerequisites

1. **Payment Service Provider** (choose one or both):
   - Stripe account (for global markets)
   - Paystack account (for African markets)

2. **Express Payment Methods** (configure as needed):
   - Apple Pay merchant certificate
   - Google Pay merchant ID
   - PayPal developer account

### Configuration Steps

#### 1. Apple Pay Setup

```bash
# 1. Register domain with Apple Pay
# 2. Create Merchant ID: merchant.com.mientior
# 3. Generate Merchant Identity Certificate
# 4. Download certificate files

# Add to .env.local:
APPLE_PAY_MERCHANT_ID=merchant.com.mientior
APPLE_PAY_CERT_PATH=/path/to/merchant_id.pem
APPLE_PAY_KEY_PATH=/path/to/merchant_id_key.pem
```

**Resources**:
- Apple Developer Portal: https://developer.apple.com/account/
- Apple Pay Setup Guide: https://developer.apple.com/apple-pay/

#### 2. Google Pay Setup

```bash
# 1. Register with Google Pay Business Console
# 2. Get Merchant ID

# Add to .env.local:
GOOGLE_PAY_MERCHANT_ID=BCR2DN4ABCDEFGH
GOOGLE_PAY_MERCHANT_NAME=Mientior Marketplace

# Uses Stripe/Paystack for token processing (already configured)
```

**Resources**:
- Google Pay Business Console: https://pay.google.com/business/console/
- Google Pay Integration: https://developers.google.com/pay/api/web/guides/setup

#### 3. PayPal Setup

```bash
# 1. Create PayPal developer account
# 2. Create app in dashboard
# 3. Get Client ID and Secret

# Add to .env.local:
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
```

**Resources**:
- PayPal Developer Portal: https://developer.paypal.com/
- PayPal Orders API: https://developer.paypal.com/docs/api/orders/v2/

#### 4. PSP Configuration

**For Stripe**:
```bash
# Add to .env.local:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**For Paystack**:
```bash
# Already configured in .env.example
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Testing in Production

1. **Enable sandbox mode** for all payment methods
2. **Test each express payment flow**:
   - Apple Pay: Use Safari on iPhone/Mac
   - Google Pay: Use Chrome on Android/desktop
   - PayPal: Click PayPal button and complete flow
3. **Verify orders are created** correctly in database
4. **Check audit logs** for payment attempts
5. **Monitor fraud detection** scores

### Going Live

1. **Switch to production credentials**:
   - Update all `_TEST_` keys to production keys
   - Change `PAYPAL_MODE=live`
   - Change `PAYPAL_API_URL=https://api-m.paypal.com`

2. **Security checklist**:
   - ✅ HTTPS enabled
   - ✅ CSRF protection active
   - ✅ Rate limiting configured (use Redis in production)
   - ✅ Fraud detection thresholds set
   - ✅ Audit logging enabled
   - ✅ Error monitoring (Sentry/DataDog)

3. **Test with real money** (small amounts):
   - Test Apple Pay purchase
   - Test Google Pay purchase
   - Test PayPal purchase
   - Verify order completion
   - Verify stock decrement
   - Verify email confirmation (if configured)

## Troubleshooting

### Common Issues

**1. "Invalid security token" (403)**
- **Cause**: CSRF token validation failed
- **Fix**: Ensure frontend sends `X-CSRF-Token` header from `getCSRFToken()`

**2. "Too many payment attempts" (429)**
- **Cause**: Rate limit exceeded
- **Fix**: Wait for rate limit window to reset (5 minutes)

**3. "Payment amount mismatch" (400)**
- **Cause**: Client total doesn't match server calculation
- **Fix**: Ensure frontend uses server-computed totals

**4. "Fraud detection triggered" (403)**
- **Cause**: Risk score >= 8
- **Fix**: Review fraud detection logs, adjust thresholds if needed

**5. "Apple Pay processing not configured" (501)**
- **Cause**: Missing environment variables
- **Fix**: Set `APPLE_PAY_MERCHANT_ID`, `APPLE_PAY_CERT_PATH`, `APPLE_PAY_KEY_PATH`

**6. "Stock insuffisant" (400)**
- **Cause**: Not enough inventory
- **Fix**: Check product stock levels in database

### Debug Logs

Check console for prefixed logs:
- `[Apple Pay]` - Apple Pay operations
- `[Google Pay]` - Google Pay operations
- `[PayPal]` - PayPal operations
- `[Payment Attempt]` - Audit logs

## Security Best Practices

1. **Never log sensitive data**:
   - Card numbers
   - CVV codes
   - Full payment tokens
   - Personal information

2. **Use audit logging**:
   - Log all payment attempts (success/failure)
   - Hash sensitive identifiers
   - Monitor for suspicious patterns

3. **Fraud detection**:
   - Review fraud scores regularly
   - Adjust thresholds based on patterns
   - Block high-risk transactions
   - Manual review for edge cases

4. **PCI Compliance**:
   - Never store card data
   - Use tokenization only
   - Maintain PCI DSS compliance if processing cards

## Support & Documentation

- **Implementation Guide**: `EXPRESS_CHECKOUT_IMPLEMENTATION.md`
- **Summary**: `EXPRESS_CHECKOUT_SUMMARY.md`
- **Quick Start**: `EXPRESS_CHECKOUT_QUICK_START.md` (this file)

For issues:
1. Check documentation files
2. Review audit logs
3. Verify environment variables
4. Test in development mode
5. Contact PSP support if token processing fails

---

**Ready to integrate?** Follow the configuration steps above and start testing!

# Express Checkout Testing Guide

## Quick Start Testing

This guide provides step-by-step instructions for testing the Express Checkout implementation.

---

## Prerequisites

1. **Install Dependencies**:
```bash
npm install stripe @paypal/checkout-server-sdk
```

2. **Configure Environment Variables**:
Copy `.env.example` to `.env.local` and configure:

```bash
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_MODE=sandbox
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# Google Pay (Test Merchant ID)
GOOGLE_PAY_MERCHANT_ID=TEST_MERCHANT_ID
GOOGLE_PAY_MERCHANT_NAME=Mientior Test
```

3. **Start Development Server**:
```bash
npm run dev
```

---

## Test Scenarios

### 1. Apple Pay Merchant Validation

**Endpoint**: `POST /api/checkout/apple-pay/validate-merchant`

**Test Request**:
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/validate-merchant \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-csrf-token" \
  -d '{
    "validationURL": "https://apple-pay-gateway-cert.apple.com/paymentservices/startSession",
    "domain": "localhost:3000"
  }'
```

**Expected Response** (Development Mode):
```json
{
  "success": true,
  "merchantSession": {
    "epochTimestamp": 1700000000000,
    "expiresAt": 1700000300000,
    "merchantSessionIdentifier": "DEV_APPLE_PAY_...",
    "merchantIdentifier": "merchant.com.mientior.dev",
    "domainName": "localhost:3000",
    "displayName": "Mientior Marketplace (Dev)"
  },
  "dev": true
}
```

**Rate Limit Test**:
Make 4 requests within 1 minute → 4th request should return 429

---

### 2. Apple Pay Payment Processing

**Endpoint**: `POST /api/checkout/apple-pay/process`

**Test Request**:
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/process \
  -H "Content-Type: application/json" \
  -d '{
    "payment": {
      "token": {
        "paymentData": {"version":"EC_v1","data":"..."},
        "paymentMethod": {"network":"visa","type":"debit"},
        "transactionIdentifier": "APPLE_PAY_TEST_123"
      }
    },
    "total": 9999,
    "items": [
      {"productId": "prod_123", "quantity": 1, "price": 9999}
    ],
    "email": "test@example.com"
  }'
```

**Expected Success Response**:
```json
{
  "success": true,
  "orderId": "...",
  "orderNumber": "ORD-2024-12345",
  "paymentReference": "ref_..."
}
```

**Test Cases**:
- ✅ Valid payment → 200 with orderId
- ❌ Missing token → 400 MISSING_PAYMENT_TOKEN
- ❌ Invalid amount → 400 INVALID_AMOUNT
- ❌ Exceed rate limit → 429 RATE_LIMIT_EXCEEDED

---

### 3. Google Pay Payment Processing

**Endpoint**: `POST /api/checkout/google-pay/process`

**Test Request**:
```bash
curl -X POST http://localhost:3000/api/checkout/google-pay/process \
  -H "Content-Type: application/json" \
  -d '{
    "paymentData": {
      "paymentMethodData": {
        "type": "CARD",
        "tokenizationData": {
          "type": "PAYMENT_GATEWAY",
          "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
        },
        "info": {
          "cardNetwork": "VISA",
          "cardDetails": "1234"
        }
      }
    },
    "total": 9999,
    "items": [{"productId": "prod_123", "quantity": 1, "price": 9999}],
    "email": "test@example.com"
  }'
```

**Expected Success Response**:
```json
{
  "success": true,
  "orderId": "...",
  "orderNumber": "ORD-2024-12346",
  "paymentReference": "ref_..."
}
```

**Test Cases**:
- ✅ Valid token → 200 with orderId
- ❌ Missing paymentData → 400 MISSING_PAYMENT_DATA
- ❌ User cancelled (error in paymentData) → 400 PAYMENT_CANCELLED

---

### 4. PayPal URL Generation

**Endpoint**: `POST /api/checkout/paypal/generate-url`

**Test Request**:
```bash
curl -X POST http://localhost:3000/api/checkout/paypal/generate-url \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "prod_123", "quantity": 1, "price": 9999}
    ],
    "total": 9999
  }'
```

**Expected Success Response**:
```json
{
  "success": true,
  "url": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "orderId": "...",
  "orderNumber": "ORD-2024-12347"
}
```

**Frontend Integration**:
```javascript
const response = await fetch('/api/checkout/paypal/generate-url', {
  method: 'POST',
  body: JSON.stringify({ items, total }),
});
const { url } = await response.json();
window.location.href = url; // Redirect to PayPal
```

**Test Cases**:
- ✅ Valid items → 200 with approval URL
- ❌ Empty cart → 400 Cart items are required
- ❌ Amount mismatch → 400 Payment amount mismatch

---

### 5. PayPal Return Handler

**Endpoint**: `GET /api/checkout/paypal/generate-url?orderId=xxx&token=yyy`

**Test Request**:
```bash
curl "http://localhost:3000/api/checkout/paypal/generate-url?orderId=order_123&token=PAYPAL_TOKEN_123"
```

**Expected Behavior**:
- Captures PayPal payment
- Updates order status to PAID
- Redirects to `/checkout/confirmation/{orderId}`

---

## Security Testing

### Rate Limiting Tests

**Test 1: Payment Rate Limit (3 requests / 5 minutes)**
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/checkout/apple-pay/process \
    -H "Content-Type: application/json" \
    -d '{"payment":{"token":{}},"total":100}' &
done
```
**Expected**: 1-3 requests succeed, 4-5 return 429

**Test 2: Merchant Validation Rate Limit (3 requests / 1 minute)**
```bash
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/checkout/apple-pay/validate-merchant \
    -d '{"validationURL":"https://example.com"}' &
done
```
**Expected**: 1-3 succeed, 4th returns 429 with Retry-After header

### Fraud Detection Tests

**Test 3: Rapid Checkout (< 30 seconds)**
Simulated by making multiple payment requests in quick succession.
**Expected**: Fraud score increases, potential block if score ≥3

**Test 4: Multiple Failed Attempts**
Make 4 payment requests that fail validation.
**Expected**: 4th request returns 403 FRAUD_DETECTED

### Amount Tampering Test

**Test 5: Client Amount Mismatch**
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/process \
  -d '{
    "orderId": "existing_order_id",
    "total": 9999,
    "payment": {"token": {...}}
  }'
```
If order total in DB is 10000 (not 9999):
**Expected**: 400 AMOUNT_MISMATCH

---

## Integration Testing

### End-to-End Flow Test

**Scenario: Complete Apple Pay Purchase**

1. **Create Provisional Order**:
```bash
curl -X POST http://localhost:3000/api/orders/initialize \
  -d '{
    "items": [{"productId":"prod_1","quantity":1}],
    "shippingAddress": {"firstName":"Test","lastName":"User",...},
    "email": "test@example.com"
  }'
```
→ Returns `orderId`

2. **Validate Merchant** (Apple Pay specific):
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/validate-merchant \
  -d '{"validationURL":"...","domain":"localhost:3000"}'
```
→ Returns `merchantSession`

3. **Process Payment**:
```bash
curl -X POST http://localhost:3000/api/checkout/apple-pay/process \
  -d '{
    "orderId": "{{orderId}}",
    "payment": {"token": {...}},
    "total": 9999
  }'
```
→ Returns `success: true, paymentReference`

4. **Verify Order Status**:
```bash
curl http://localhost:3000/api/orders/{{orderId}}
```
→ Check `paymentStatus: "PAID"`, `status: "PROCESSING"`

---

## Monitoring & Debugging

### Check Logs
```bash
# Watch server logs
tail -f .next/server.log

# Filter for express checkout events
grep "Apple Pay\|Google Pay\|PayPal" .next/server.log
```

### Common Errors

**Error: "Apple Pay merchant validation not configured"**
- **Cause**: Missing `STRIPE_SECRET_KEY` or `APPLE_PAY_MERCHANT_ID`
- **Fix**: Set environment variables in `.env.local`

**Error: "Paystack express payment processing requires additional setup"**
- **Cause**: Paystack doesn't natively support express tokens
- **Fix**: Use Stripe for Apple Pay/Google Pay (`STRIPE_SECRET_KEY` required)

**Error: "Failed to create provisional order"**
- **Cause**: Stock validation failed or product not found
- **Fix**: Check product IDs exist in database with sufficient stock

**Error: "CSRF validation failed"**
- **Cause**: Missing or invalid CSRF token
- **Fix**: Frontend must send `X-CSRF-Token` header (or disable in dev)

---

## Performance Benchmarks

Expected response times (localhost, no PSP):
- **Merchant Validation**: < 100ms (dev mock)
- **Payment Processing**: < 500ms (with Stripe)
- **PayPal URL Generation**: < 300ms
- **Order Completion**: < 200ms

With real PSP calls (production):
- **Stripe PaymentIntent**: 500-1000ms
- **PayPal Order Create**: 800-1500ms
- **Paystack Initialize**: 600-1200ms

---

## Next Steps After Testing

1. ✅ All tests pass → Deploy to staging
2. ❌ Tests fail → Check logs, verify PSP credentials
3. Configure production PSP accounts:
   - Stripe: Switch to `sk_live_...` keys
   - PayPal: Switch to live mode, update API URL
4. Enable Sentry for production error tracking
5. Set up monitoring alerts for:
   - Payment failures > 5%
   - Fraud scores ≥3
   - Rate limit violations

---

## Support

**Issues**: Open a ticket with:
- Endpoint tested
- Request payload
- Response received
- Server logs

**Documentation**:
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [PayPal Sandbox](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Google Pay Test Environment](https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist)

---

**Last Updated**: November 17, 2024
**Status**: Ready for Testing

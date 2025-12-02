# Task 11.3: Manual Testing Guide

## Reset Password Form API Integration

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Ensure PostgreSQL and Redis are running
3. Have a test user account in the database

### Test Scenario 1: Successful Password Reset

**Steps:**
1. Navigate to `http://localhost:3000/forgot-password`
2. Enter a valid email address (e.g., test@example.com)
3. Click "Envoyer le lien de réinitialisation"
4. Check the console/logs for the reset email (or check your email if configured)
5. Copy the reset token from the email link
6. Navigate to `http://localhost:3000/reset-password?token=YOUR_TOKEN`
7. Enter a new password (e.g., "NewPassword123!")
8. Confirm the password
9. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ Password strength indicator shows as you type
- ✅ Form submits successfully
- ✅ Success message appears: "Mot de passe réinitialisé"
- ✅ Auto-redirect to login page after 2 seconds
- ✅ Can log in with new password

### Test Scenario 2: Invalid Token

**Steps:**
1. Navigate to `http://localhost:3000/reset-password?token=invalid-token-123`
2. Enter a new password
3. Confirm the password
4. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ Error message appears: "Le lien de réinitialisation est invalide ou a expiré."
- ✅ No redirect occurs
- ✅ User can click "Demander un nouveau lien"

### Test Scenario 3: Missing Token

**Steps:**
1. Navigate to `http://localhost:3000/reset-password` (no token parameter)

**Expected Results:**
- ✅ Shows "Lien invalide" page
- ✅ Message: "Le lien de réinitialisation est invalide ou a expiré."
- ✅ Link to request new reset link

### Test Scenario 4: Weak Password

**Steps:**
1. Navigate to reset password page with valid token
2. Enter a weak password (e.g., "weak")
3. Confirm the password
4. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ Client-side validation error appears before submission
- ✅ Error message indicates password requirements
- ✅ Password strength indicator shows "Faible" (weak)

### Test Scenario 5: Password Mismatch

**Steps:**
1. Navigate to reset password page with valid token
2. Enter password: "Password123!"
3. Enter confirm password: "DifferentPassword123!"
4. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ Validation error: "Les mots de passe ne correspondent pas"
- ✅ Form does not submit
- ✅ No API call is made

### Test Scenario 6: Reused Password

**Steps:**
1. Navigate to reset password page with valid token
2. Enter the same password the user currently has
3. Confirm the password
4. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ API returns error
- ✅ Error message: "Veuillez choisir un mot de passe que vous n'avez pas utilisé récemment."
- ✅ No redirect occurs

### Test Scenario 7: Breached Password

**Steps:**
1. Navigate to reset password page with valid token
2. Enter a commonly breached password (e.g., "Password123")
3. Confirm the password
4. Click "Réinitialiser le mot de passe"

**Expected Results:**
- ✅ API returns error
- ✅ Error message indicates password found in breach database
- ✅ No redirect occurs

### Test Scenario 8: Session Invalidation

**Steps:**
1. Log in to the application in multiple browsers/devices
2. Verify you have multiple active sessions
3. Complete password reset in one browser
4. Try to access protected pages in other browsers

**Expected Results:**
- ✅ All other sessions are invalidated
- ✅ Other browsers redirect to login
- ✅ Current session (if any) remains active

### Test Scenario 9: Password Strength Indicator

**Steps:**
1. Navigate to reset password page with valid token
2. Start typing in the password field
3. Observe the password strength indicator

**Expected Results:**
- ✅ Indicator appears when typing starts
- ✅ Shows requirements checklist (8+ chars, uppercase, lowercase, number, special char)
- ✅ Progress bar changes color (red → yellow → green)
- ✅ Checkmarks appear as requirements are met

### Test Scenario 10: Loading States

**Steps:**
1. Navigate to reset password page with valid token
2. Enter valid password and confirm
3. Click submit button
4. Observe the UI during submission

**Expected Results:**
- ✅ Submit button shows "Réinitialisation..." text
- ✅ Submit button is disabled
- ✅ Form inputs are disabled
- ✅ No double-submission possible

## API Endpoint Testing

### Using curl

**Test successful reset:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_VALID_TOKEN",
    "password": "NewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Test invalid token:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid-token",
    "password": "NewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid or expired reset token",
  "code": "TOKEN_INVALID"
}
```

## Automated Tests

Run the API tests:
```bash
npm test src/app/api/auth/reset-password/route.test.ts
```

**Expected Output:**
```
✓ POST /api/auth/reset-password (8 tests)
  ✓ should successfully reset password with valid token
  ✓ should reject invalid or expired token
  ✓ should reject password that does not meet requirements
  ✓ should reject reused password
  ✓ should reject breached password
  ✓ should require both token and password
  ✓ should invalidate all sessions except current one
  ✓ should handle user not found

Test Files  1 passed (1)
Tests  8 passed (8)
```

## Troubleshooting

### Issue: Token not found in email
**Solution:** Check the console logs for the reset email content, or configure Resend API key in `.env`

### Issue: Password validation fails unexpectedly
**Solution:** Ensure password meets all requirements:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Issue: Session invalidation not working
**Solution:** Ensure Redis is running and properly configured in `.env`

### Issue: Breached password check fails
**Solution:** Check internet connection (Have I Been Pwned API requires network access)

## Success Criteria

All test scenarios should pass with expected results. The form should:
- ✅ Connect to API successfully
- ✅ Handle all error cases gracefully
- ✅ Display appropriate error messages
- ✅ Show success message and redirect
- ✅ Provide excellent user experience with loading states and real-time feedback

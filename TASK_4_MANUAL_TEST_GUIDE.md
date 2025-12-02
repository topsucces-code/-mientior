# Task 4: Manual Testing Guide - Registration Success Feedback

## Test Environment Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Ensure database is running**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Open browser**
   - Navigate to: `http://localhost:3000/register`

## Test Case 1: Successful Registration with Toast Display

### Steps
1. Navigate to `/register`
2. Fill in the registration form:
   - **Nom complet**: Jean Dupont
   - **Email**: test-user-$(date +%s)@example.com (use unique email)
   - **Mot de passe**: SecurePass123!
   - **Confirmer le mot de passe**: SecurePass123!
3. Click "S'inscrire" button

### Expected Results
✅ **Success toast appears** with:
- Title: "Inscription réussie !"
- Description: "Votre compte a été créé avec succès. Un email de vérification a été envoyé à [your-email]. Veuillez vérifier votre boîte de réception."
- Green background with success icon (checkmark)
- "Renvoyer l'email" action button
- Close button (X) in top-right corner

✅ **Toast behavior**:
- Appears in top-right corner of screen
- Auto-dismisses after 5 seconds
- Can be manually dismissed by clicking X
- Stays visible if hovered (pauses auto-dismiss timer)

✅ **Form state**:
- Form remains visible (not replaced by success page)
- Form fields are cleared after successful registration
- User can register another account if needed

### Requirement Validation
- ✅ **1.1**: Success message displayed after registration
- ✅ **1.2**: Message instructs to check email
- ✅ **1.3**: User's email address is included in message
- ✅ **1.4**: "Renvoyer l'email" action button present
- ✅ **1.5**: Toast auto-dismisses after 5 seconds

## Test Case 2: Resend Verification Email

### Steps
1. Complete Test Case 1 (successful registration)
2. **Before toast dismisses**, click "Renvoyer l'email" button

### Expected Results
✅ **New toast appears** with:
- Title: "Email de vérification envoyé"
- Description: "Un nouvel email de vérification a été envoyé à [your-email]. Veuillez vérifier votre boîte de réception."
- Green success styling
- Auto-dismisses after 5 seconds

✅ **Original toast**:
- Original registration success toast remains visible
- Both toasts stack vertically

### Requirement Validation
- ✅ **1.4**: Resend action button works correctly
- ✅ Feedback provided for resend action

## Test Case 3: Manual Toast Dismissal

### Steps
1. Complete Test Case 1 (successful registration)
2. **Immediately** click the X (close) button on the toast

### Expected Results
✅ **Toast dismisses immediately**:
- Toast fades out smoothly
- No longer visible on screen
- Does not wait for 5-second auto-dismiss

### Requirement Validation
- ✅ User can manually dismiss toast
- ✅ Close button is functional

## Test Case 4: Toast Auto-Dismiss Timing

### Steps
1. Complete Test Case 1 (successful registration)
2. **Do not interact** with the toast
3. Use a stopwatch or count to 5 seconds

### Expected Results
✅ **Toast auto-dismisses**:
- Toast remains visible for approximately 5 seconds
- Toast fades out smoothly after 5 seconds
- No manual interaction required

### Requirement Validation
- ✅ **1.5**: Toast auto-dismisses after 5 seconds

## Test Case 5: Hover Pause Behavior

### Steps
1. Complete Test Case 1 (successful registration)
2. **Immediately** hover mouse over the toast
3. Keep mouse hovered for 10+ seconds
4. Move mouse away from toast

### Expected Results
✅ **Toast behavior**:
- Toast does NOT dismiss while hovered
- Timer pauses when mouse enters toast area
- Timer resumes when mouse leaves toast area
- Toast dismisses 5 seconds after mouse leaves

### Requirement Validation
- ✅ Hover pauses auto-dismiss timer (UX enhancement)

## Test Case 6: Multiple Toasts Stacking

### Steps
1. Register first user (Test Case 1)
2. **Before first toast dismisses**, register second user with different email
3. Observe toast behavior

### Expected Results
✅ **Toast stacking**:
- Second success toast appears below first toast
- Both toasts visible simultaneously
- Each toast has independent 5-second timer
- Toasts dismiss in order they appeared

### Requirement Validation
- ✅ Multiple toasts handled gracefully
- ✅ No UI overlap or conflicts

## Test Case 7: Email Address Display

### Steps
1. Register with a **long email address**:
   - Example: `very-long-email-address-for-testing@subdomain.example.com`
2. Observe toast message

### Expected Results
✅ **Email display**:
- Full email address visible in toast
- Text wraps if necessary
- No truncation or overflow
- Readable and properly formatted

### Requirement Validation
- ✅ **1.3**: Email address properly displayed

## Test Case 8: Accessibility Testing

### Steps
1. Complete Test Case 1 (successful registration)
2. **Use keyboard only**:
   - Press Tab to focus on toast
   - Press Tab to focus on "Renvoyer l'email" button
   - Press Enter to activate button
   - Press Tab to focus on close button
   - Press Enter to dismiss toast

### Expected Results
✅ **Keyboard navigation**:
- Toast is keyboard accessible
- Action button receives focus
- Close button receives focus
- Enter key activates buttons
- Focus indicators visible

✅ **Screen reader**:
- Toast content announced automatically
- ARIA live region: "polite"
- Button labels announced correctly

### Requirement Validation
- ✅ Toast is keyboard accessible
- ✅ Screen reader compatible

## Test Case 9: Network Error During Resend

### Steps
1. Complete Test Case 1 (successful registration)
2. **Open browser DevTools** → Network tab
3. Enable "Offline" mode
4. Click "Renvoyer l'email" button

### Expected Results
✅ **Error toast appears**:
- Title: "Erreur de connexion"
- Description: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer."
- Red error styling
- Does NOT auto-dismiss (manual dismiss only)

### Requirement Validation
- ✅ Network errors handled gracefully
- ✅ Appropriate error feedback provided

## Test Case 10: Visual Styling Verification

### Steps
1. Complete Test Case 1 (successful registration)
2. Inspect toast visual appearance

### Expected Results
✅ **Success toast styling**:
- Background: Light green (`bg-success-light`)
- Border: Green (`border-success`)
- Text: Dark green (`text-success-dark`)
- Icon: Green checkmark (CheckCircle2)
- Action button: Green background with white text
- Close button: Visible and styled

✅ **Contrast**:
- Text readable against background
- WCAG AA compliant (4.5:1 minimum)

### Requirement Validation
- ✅ Visual styling matches design system
- ✅ Accessibility contrast requirements met

## Browser Compatibility Testing

Test in the following browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers (responsive)

## Performance Testing

### Steps
1. Register 10 users rapidly (within 30 seconds)
2. Observe toast performance

### Expected Results
✅ **Performance**:
- Toasts render smoothly
- No lag or stuttering
- Memory usage reasonable
- Toasts dismiss properly

## Regression Testing

Verify that existing functionality still works:
- ✅ Registration form validation
- ✅ Password strength indicator
- ✅ Error messages for invalid input
- ✅ Google OAuth sign-in
- ✅ "Already have an account?" link

## Summary Checklist

- [ ] Test Case 1: Successful registration with toast ✅
- [ ] Test Case 2: Resend verification email ✅
- [ ] Test Case 3: Manual toast dismissal ✅
- [ ] Test Case 4: Toast auto-dismiss timing ✅
- [ ] Test Case 5: Hover pause behavior ✅
- [ ] Test Case 6: Multiple toasts stacking ✅
- [ ] Test Case 7: Email address display ✅
- [ ] Test Case 8: Accessibility testing ✅
- [ ] Test Case 9: Network error during resend ✅
- [ ] Test Case 10: Visual styling verification ✅
- [ ] Browser compatibility ✅
- [ ] Performance testing ✅
- [ ] Regression testing ✅

## Known Issues / Notes

- None at this time

## Next Steps

After completing manual testing:
1. Proceed to Task 5: Update registration form with error feedback
2. Consider writing automated E2E tests for registration flow
3. Monitor user feedback on toast UX

## Screenshots

To document testing, capture screenshots of:
1. Registration success toast
2. Resend verification toast
3. Multiple toasts stacked
4. Toast on mobile viewport
5. Dark mode toast (if applicable)

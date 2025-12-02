# Implementation Plan

- [x] 1. Create centralized message definitions
  - Create `src/lib/auth-messages.ts` with all message definitions
  - Define message types and interfaces
  - Include French translations for all messages
  - Add message parameters for dynamic content (email, duration, etc.)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Create custom authentication feedback hook
  - Create `src/hooks/use-auth-feedback.ts`
  - Implement `showMessage` function with message key parameter
  - Implement `dismissMessage` function
  - Add support for dynamic message parameters
  - Integrate with Sonner toast library
  - Configure ARIA live regions (polite/assertive)
  - _Requirements: 6.1, 6.2_

- [ ]* 2.1 Write property test for French language messages
  - **Property 7: All Messages Are In French**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 3. Add toast styling and theming
  - Create Tailwind CSS classes for toast variants (success, error, warning, info)
  - Implement Mientior brand colors (Orange #FF6B00, Blue #1E3A8A, Aurore #FFC107)
  - Add icons for each message type (success, error, warning, info)
  - Ensure WCAG AA color contrast compliance
  - Add smooth animations for toast appearance/dismissal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.3_

- [ ]* 3.1 Write property test for message visual distinction
  - **Property 8: Message Types Have Distinct Visual Styles**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 4. Update registration form with success feedback
  - Update `src/components/auth/auth-form.tsx` for registration mode
  - Add success message display after successful registration
  - Include user email in success message
  - Add "resend verification email" action button
  - Implement 5-second auto-dismiss for success messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 4.1 Write property test for email in success message
  - **Property 1: Success Message Contains Email**
  - **Validates: Requirements 1.3**

- [ ]* 4.2 Write property test for success message auto-dismiss
  - **Property 9: Success Messages Auto-Dismiss**
  - **Validates: Requirements 1.5, 10.1**

- [ ] 5. Update registration form with error feedback
  - Add error handling for duplicate email ("Cet email est déjà utilisé")
  - Add error handling for weak password with specific requirements
  - Add error handling for network errors
  - Preserve form data (except password) when errors occur
  - Display inline field errors with ARIA attributes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 5.1 Write property test for form data preservation
  - **Property 2: Error Messages Preserve Form Data**
  - **Validates: Requirements 2.5, 4.5**

- [ ]* 5.2 Write property test for error message persistence
  - **Property 10: Error Messages Persist Until Dismissed**
  - **Validates: Requirements 10.2**

- [x] 6. Update login form with success feedback
  - Update `src/components/auth/auth-form.tsx` for login mode
  - Add success message display after successful login
  - Implement 2-second display before redirect
  - Add loading indicator during redirect
  - Redirect to intended page or account dashboard
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Update login form with error feedback
  - Add error handling for invalid credentials
  - Add error handling for unverified email with resend action
  - Add error handling for account lockout with duration display
  - Add error handling for network errors
  - Preserve email field value on errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Implement loading states for all auth operations
  - Add loading indicator to submit button
  - Disable submit button during processing
  - Change button text to indicate processing ("Connexion en cours...", "Inscription en cours...")
  - Remove loading indicator within 500ms of completion
  - Add spinner icon with animation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property test for loading state behavior
  - **Property 3: Loading State Disables Submission**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 8.2 Write property test for loading indicator removal timing
  - **Property 11: Loading Indicator Removes Quickly**
  - **Validates: Requirements 5.4**

- [x] 9. Implement accessibility features
  - Add ARIA live regions to all toast notifications
  - Add aria-invalid and aria-describedby to form fields with errors
  - Add aria-label to all message icons
  - Implement keyboard navigation (Tab, Escape)
  - Ensure focus management after message dismissal
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 9.1 Write property test for ARIA attributes
  - **Property 4: Messages Have Appropriate ARIA Attributes**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 9.2 Write property test for icon text alternatives
  - **Property 5: Icons Have Text Alternatives**
  - **Validates: Requirements 6.4**

- [ ]* 9.3 Write property test for keyboard dismissal
  - **Property 6: Messages Are Keyboard Dismissible**
  - **Validates: Requirements 6.5, 9.3**

- [x] 10. Implement message dismissal functionality
  - Add close button (X icon) to all messages
  - Implement click handler for close button
  - Implement Escape key handler for dismissal
  - Add smooth dismiss animation
  - Support individual dismissal of multiple messages
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Implement message timing and auto-dismiss
  - Configure success messages to auto-dismiss after 5 seconds
  - Configure login success to auto-dismiss after 2 seconds
  - Configure info messages to auto-dismiss after 7 seconds
  - Keep error messages visible until manually dismissed
  - Implement hover-to-pause auto-dismiss timer
  - Add sequential display with 500ms delay for multiple messages
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write property test for hover pause behavior
  - **Property 12: Hover Pauses Auto-Dismiss**
  - **Validates: Requirements 10.4**

- [ ] 12. Update API routes to return structured error responses
  - Update `src/app/api/auth/register/route.ts` to return error codes
  - Update `src/app/api/auth/login/route.ts` to return error codes
  - Ensure consistent error response format across all auth endpoints
  - Add error codes: EMAIL_EXISTS, WEAK_PASSWORD, INVALID_CREDENTIALS, EMAIL_NOT_VERIFIED, ACCOUNT_LOCKED
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [ ]* 12.1 Write unit tests for API error responses
  - Test that each error scenario returns correct error code
  - Test error response format consistency
  - Test error message parameters
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [ ] 13. Add XSS protection for user-provided content
  - Sanitize email addresses before displaying in messages
  - Escape HTML in dynamic message content
  - Use React's built-in XSS protection
  - Validate all user input before display
  - _Security requirement_

- [ ]* 13.1 Write unit tests for XSS protection
  - Test that malicious input is sanitized
  - Test that HTML entities are escaped
  - Test that script tags are removed
  - _Security requirement_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 15. Add E2E tests for complete authentication flows
  - Test registration flow with success message display
  - Test registration with duplicate email error
  - Test login flow with success message and redirect
  - Test login with invalid credentials error
  - Test login with unverified email error
  - Test message dismissal with close button and Escape key
  - Test loading states during form submission
  - _Requirements: All_

- [ ]* 16. Add integration tests for message system
  - Test message display with various message keys
  - Test message auto-dismiss timing
  - Test multiple messages display sequentially
  - Test hover pause functionality
  - Test keyboard navigation and dismissal
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Final Checkpoint - Verify all functionality
  - Ensure all tests pass, ask the user if questions arise.

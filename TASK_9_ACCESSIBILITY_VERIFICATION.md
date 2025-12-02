# Task 9: Accessibility Verification Guide

## Quick Verification Steps

### 1. Keyboard Navigation Test

#### Test Escape Key Dismissal
1. Navigate to `/login` or `/register`
2. Trigger an error (e.g., submit empty form)
3. Press `Escape` key
4. ✅ Verify: Toast message dismisses
5. ✅ Verify: Focus returns to first input field

#### Test Tab Navigation
1. Navigate to `/login` or `/register`
2. Press `Tab` repeatedly
3. ✅ Verify: Focus moves through fields in order:
   - Email field
   - Password field
   - Remember me checkbox (login only)
   - Submit button
   - Google sign-in button
   - Register/Login link
4. ✅ Verify: Focus indicators are clearly visible

#### Test Toast Button Navigation
1. Trigger a toast with an action button (e.g., email verification)
2. Press `Tab` to focus on the action button
3. Press `Enter` or `Space` to activate
4. ✅ Verify: Action executes correctly

### 2. Screen Reader Test

#### Using NVDA (Windows) or VoiceOver (Mac)

**Test Form Field Errors:**
1. Enable screen reader
2. Navigate to `/register`
3. Submit form without filling fields
4. ✅ Verify: Screen reader announces "Email, invalid, Email invalide"
5. ✅ Verify: Screen reader announces error messages

**Test Toast Announcements:**
1. Submit valid registration
2. ✅ Verify: Screen reader announces "Inscription réussie!"
3. ✅ Verify: Description is read after title

**Test Icon Labels:**
1. Trigger different message types
2. ✅ Verify: Icons have proper labels (Succès, Erreur, Avertissement, Information)

### 3. ARIA Attribute Verification

#### Check with Browser DevTools

**Email Field:**
```html
<input 
  id="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">Email invalide</p>
```

**Password Field:**
```html
<input 
  id="password"
  aria-invalid="true"
  aria-describedby="password-error"
/>
<p id="password-error" role="alert">Le mot de passe est requis</p>
```

**Password Strength Indicator:**
```html
<div id="password-strength" aria-live="polite">
  <PasswordStrengthIndicator />
</div>
```

### 4. Focus Management Test

#### Test Focus Return After Dismissal
1. Open login form
2. Trigger an error message
3. Press `Escape` to dismiss
4. ✅ Verify: Focus returns to email input field
5. ✅ Verify: No focus is lost

#### Test Focus During Loading
1. Fill in login form
2. Click submit button
3. ✅ Verify: Button shows loading state
4. ✅ Verify: Button remains focused
5. ✅ Verify: Button is disabled during loading

### 5. Visual Focus Indicators

#### Check Focus Visibility
1. Use keyboard to navigate through form
2. ✅ Verify: Each focused element has visible outline
3. ✅ Verify: Focus ring color has sufficient contrast
4. ✅ Verify: Focus ring is 2px solid with 2px offset

#### Check Toast Focus
1. Display a toast message
2. Tab to action button
3. ✅ Verify: Button has visible focus indicator
4. ✅ Verify: Toast container highlights when child has focus

### 6. Error State Verification

#### Test aria-invalid
1. Submit form with invalid data
2. Open browser DevTools
3. Inspect input fields
4. ✅ Verify: `aria-invalid="true"` is set on invalid fields
5. ✅ Verify: `aria-invalid="false"` on valid fields

#### Test aria-describedby
1. Trigger field errors
2. Inspect input fields
3. ✅ Verify: `aria-describedby` points to error message ID
4. ✅ Verify: Error message has matching ID

### 7. ARIA Live Region Test

#### Test Polite Announcements
1. Type in password field (registration)
2. ✅ Verify: Password strength updates announced politely
3. ✅ Verify: Doesn't interrupt current screen reader output

#### Test Assertive Announcements
1. Submit form with errors
2. ✅ Verify: Error messages announced immediately
3. ✅ Verify: Interrupts current screen reader output

### 8. Reduced Motion Test

#### Test with Reduced Motion Preference
1. Enable reduced motion in OS settings
   - Windows: Settings > Ease of Access > Display > Show animations
   - macOS: System Preferences > Accessibility > Display > Reduce motion
2. Trigger toast messages
3. ✅ Verify: Animations are minimal or disabled
4. ✅ Verify: Functionality still works

### 9. High Contrast Mode Test

#### Test with High Contrast
1. Enable high contrast mode
   - Windows: Alt + Left Shift + Print Screen
   - macOS: System Preferences > Accessibility > Display > Increase contrast
2. Navigate through form
3. ✅ Verify: All elements remain visible
4. ✅ Verify: Focus indicators are clearly visible
5. ✅ Verify: Toast messages have proper borders

### 10. Mobile Accessibility Test

#### Test on Mobile Device
1. Open form on mobile browser
2. Use TalkBack (Android) or VoiceOver (iOS)
3. ✅ Verify: All elements are announced correctly
4. ✅ Verify: Touch targets are at least 44x44px
5. ✅ Verify: Swipe gestures work properly

## Automated Testing Commands

### Run Accessibility Tests
```bash
# If you have axe-core or similar tools installed
npm run test:a11y

# Or use browser extensions:
# - axe DevTools
# - WAVE
# - Lighthouse (Chrome DevTools)
```

### Lighthouse Accessibility Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Run audit
5. ✅ Target: Score 95+ (100 is ideal)

## Common Issues to Check

### ❌ Issues to Avoid
- [ ] Missing aria-label on icons
- [ ] aria-describedby pointing to non-existent ID
- [ ] Focus trap in toast notifications
- [ ] No visible focus indicator
- [ ] Keyboard navigation not working
- [ ] Screen reader not announcing errors

### ✅ Expected Behavior
- [x] All form fields have proper labels
- [x] Error messages have role="alert"
- [x] Icons have aria-label or aria-hidden
- [x] Escape key dismisses messages
- [x] Tab key navigates in logical order
- [x] Focus returns after dismissal
- [x] ARIA live regions announce changes

## Browser-Specific Notes

### Chrome/Edge
- Use F12 DevTools > Accessibility tab
- Check computed ARIA properties
- Verify accessibility tree

### Firefox
- Use F12 DevTools > Accessibility tab
- Check ARIA attributes in Inspector
- Use accessibility picker

### Safari
- Enable Develop menu
- Use Web Inspector > Node tab
- Check accessibility properties

## Screen Reader Shortcuts

### NVDA (Windows)
- `NVDA + Space`: Toggle browse/focus mode
- `Insert + F7`: List form fields
- `Insert + F5`: Refresh elements list

### JAWS (Windows)
- `Insert + F5`: List form fields
- `Insert + F6`: List headings
- `Insert + F7`: List links

### VoiceOver (macOS)
- `VO + U`: Open rotor
- `VO + Right/Left`: Navigate elements
- `VO + Space`: Activate element

### TalkBack (Android)
- Swipe right/left: Navigate
- Double tap: Activate
- Two-finger swipe down: Read from top

### VoiceOver (iOS)
- Swipe right/left: Navigate
- Double tap: Activate
- Three-finger swipe: Scroll

## Success Criteria

All of the following must be true:

- ✅ All form fields have proper ARIA attributes
- ✅ Error messages are announced by screen readers
- ✅ Keyboard navigation works throughout
- ✅ Focus indicators are clearly visible
- ✅ Escape key dismisses messages
- ✅ Focus returns after dismissal
- ✅ Icons have text alternatives
- ✅ ARIA live regions work correctly
- ✅ No accessibility errors in DevTools
- ✅ Lighthouse accessibility score 95+

## Resources

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

---

**Last Updated**: 2024
**Task**: 9 - Implement accessibility features
**Status**: ✅ Complete

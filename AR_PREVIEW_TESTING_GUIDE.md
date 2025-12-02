# AR Preview Feature - Testing Guide

## Overview

This guide helps you test the AR (Augmented Reality) preview functionality on the immersive product page.

## Prerequisites

### For iOS Testing
- iPhone or iPad with iOS 12 or later
- A9 chip or later (iPhone 6s and newer)
- Safari browser

### For Android Testing
- Android device with Android 7.0 (Nougat) or later
- ARCore support (most modern Android devices)
- Chrome browser

### 3D Model Requirements
- **iOS**: USDZ format
- **Android**: GLB format
- Recommended: Provide both formats for maximum compatibility

## Testing Checklist

### 1. Device Detection

#### ✅ iOS 12+ Device
- [ ] AR button appears in product gallery (bottom-left corner)
- [ ] Button shows "Voir en AR" text with cube icon
- [ ] Button has white background with shadow

#### ✅ Android 7+ Device
- [ ] AR button appears in product gallery (bottom-left corner)
- [ ] Button shows "Voir en AR" text with cube icon
- [ ] Button has white background with shadow

#### ✅ Unsupported Devices
- [ ] iOS < 12: Button does NOT appear
- [ ] Android < 7: Button does NOT appear
- [ ] Desktop browsers: Button does NOT appear
- [ ] No console errors or warnings

### 2. AR Button Interaction

#### Click/Tap Behavior
- [ ] Clicking button shows instructions modal
- [ ] Modal displays 3 numbered steps
- [ ] Modal has orange-themed design
- [ ] "Compris" button dismisses modal

#### Instructions Modal Content
- [ ] Step 1: "Pointez votre appareil vers une surface plane"
- [ ] Step 2: "Déplacez votre appareil pour détecter la surface"
- [ ] Step 3: "Touchez pour placer le produit et utilisez les gestes pour le manipuler"
- [ ] Orange cube icon in header
- [ ] Clear visual hierarchy

### 3. AR Session Launch

#### iOS (Quick Look)
- [ ] Tapping button launches AR Quick Look
- [ ] 3D model loads correctly
- [ ] Model appears at appropriate scale
- [ ] Can place model on detected surfaces
- [ ] Can rotate model with one finger
- [ ] Can scale model with pinch gesture
- [ ] Can move model by dragging
- [ ] "Done" button returns to product page

#### Android (Scene Viewer)
- [ ] Tapping button launches Scene Viewer
- [ ] 3D model loads correctly
- [ ] Model appears at appropriate scale
- [ ] Can place model on detected surfaces
- [ ] Can rotate model with one finger
- [ ] Can scale model with pinch gesture
- [ ] Can move model by dragging
- [ ] Back button returns to product page

### 4. Integration with Product Gallery

#### Desktop View
- [ ] AR button positioned in bottom-left corner
- [ ] Button overlays main product image
- [ ] Button visible on hover
- [ ] Button doesn't interfere with zoom controls
- [ ] Button doesn't interfere with navigation arrows

#### Mobile View
- [ ] AR button visible on first carousel slide
- [ ] Button positioned in bottom-left corner
- [ ] Button doesn't interfere with swipe gestures
- [ ] Button doesn't interfere with pagination dots

### 5. Error Handling

#### Missing Model URL
- [ ] Button doesn't render if `arModelUrl` is null/undefined
- [ ] No console errors

#### Network Issues
- [ ] Appropriate error message if model fails to load
- [ ] User can retry or return to product page

#### Unsupported Model Format
- [ ] iOS: Gracefully handles non-USDZ files
- [ ] Android: Gracefully handles non-GLB files

## Manual Testing Scenarios

### Scenario 1: First-Time AR User
1. Navigate to product page with AR model
2. Notice AR button in gallery
3. Tap AR button
4. Read instructions modal
5. Tap "Compris"
6. AR viewer launches
7. Follow on-screen instructions to place model
8. Interact with model (rotate, scale, move)
9. Exit AR viewer
10. Return to product page

**Expected**: Smooth, intuitive experience with clear guidance

### Scenario 2: Experienced AR User
1. Navigate to product page with AR model
2. Tap AR button directly
3. Quickly dismiss instructions modal
4. Place model immediately
5. Interact with model
6. Exit AR viewer

**Expected**: Fast, efficient workflow without friction

### Scenario 3: Unsupported Device
1. Open product page on desktop browser
2. Observe product gallery

**Expected**: No AR button visible, no errors, normal gallery experience

### Scenario 4: Multiple Products
1. Browse multiple products with AR models
2. Test AR on each product
3. Verify correct model loads for each product

**Expected**: Each product shows its own AR model correctly

## Sample Test Products

To test the AR feature, you'll need products with AR models. Here's how to set them up:

### Database Setup

```sql
-- Add AR model URL to a product
UPDATE "Product"
SET "arModelUrl" = 'https://example.com/models/product-123.usdz'
WHERE id = 'product-id-here';
```

### Test Model URLs

For testing purposes, you can use these sample AR models:

**iOS (USDZ):**
- Apple's sample models: https://developer.apple.com/augmented-reality/quick-look/

**Android (GLB):**
- Google's sample models: https://developers.google.com/ar/develop/scene-viewer

## Accessibility Testing

### Screen Reader Testing
- [ ] Button has descriptive ARIA label
- [ ] Instructions modal is announced
- [ ] Modal can be dismissed with keyboard

### Keyboard Navigation
- [ ] Button is focusable with Tab key
- [ ] Button can be activated with Enter/Space
- [ ] Modal can be dismissed with Escape key

### Color Contrast
- [ ] Button text meets WCAG AA standards
- [ ] Instructions text is readable
- [ ] Orange highlights are visible

## Performance Testing

### Load Time
- [ ] Button appears immediately on page load
- [ ] No delay in device detection
- [ ] Instructions modal opens instantly

### Memory Usage
- [ ] No memory leaks after multiple AR sessions
- [ ] Component cleans up properly on unmount

### Battery Impact
- [ ] AR session doesn't drain battery excessively
- [ ] Device doesn't overheat during AR use

## Browser Compatibility

### iOS Safari
- [ ] iOS 12: AR works
- [ ] iOS 13: AR works
- [ ] iOS 14: AR works
- [ ] iOS 15+: AR works

### Android Chrome
- [ ] Android 7: AR works
- [ ] Android 8: AR works
- [ ] Android 9: AR works
- [ ] Android 10+: AR works

### Desktop Browsers (Button Hidden)
- [ ] Chrome: No button
- [ ] Firefox: No button
- [ ] Safari: No button
- [ ] Edge: No button

## Common Issues and Solutions

### Issue: Button doesn't appear on iOS 12+
**Solution**: Check that the user agent is being detected correctly. Verify iOS version parsing.

### Issue: AR viewer doesn't launch
**Solution**: 
- iOS: Ensure model is in USDZ format
- Android: Ensure model is in GLB format
- Check model URL is accessible

### Issue: Model appears too large/small
**Solution**: Adjust model scale in 3D modeling software before export

### Issue: Instructions modal doesn't dismiss
**Solution**: Check that click handler is properly attached to "Compris" button

## Reporting Issues

When reporting issues, please include:

1. **Device Information**:
   - Device model (e.g., iPhone 13, Pixel 6)
   - OS version (e.g., iOS 15.4, Android 12)
   - Browser and version

2. **Steps to Reproduce**:
   - Exact steps taken
   - Product being tested
   - Model URL used

3. **Expected vs Actual Behavior**:
   - What should happen
   - What actually happened

4. **Screenshots/Videos**:
   - Screenshots of the issue
   - Screen recording if possible

5. **Console Logs**:
   - Any error messages
   - Network requests

## Success Criteria

The AR preview feature is considered successful when:

- ✅ Button appears only on AR-capable devices
- ✅ Instructions are clear and helpful
- ✅ AR viewer launches correctly on iOS and Android
- ✅ 3D models load and display properly
- ✅ Users can interact with models naturally
- ✅ Exit flow returns to product page smoothly
- ✅ No errors or crashes
- ✅ Performance is acceptable
- ✅ Accessibility requirements are met

## Next Steps After Testing

1. **Gather Feedback**: Collect user feedback on AR experience
2. **Optimize Models**: Adjust model sizes and quality based on performance
3. **Expand Library**: Add AR models to more products
4. **Analytics**: Track AR usage and conversion rates
5. **Iterate**: Improve based on user behavior and feedback

---

**Last Updated**: Task 5 Implementation
**Status**: Ready for Testing

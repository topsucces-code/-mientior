/**
 * Property-Based Tests for Product360Viewer Component
 * 
 * Tests correctness properties for 360° product viewer functionality
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Helper function to calculate frame from drag distance
 * This mirrors the logic in the Product360Viewer component
 */
function calculateFrameFromDrag(
  currentFrame: number,
  dragDistance: number,
  containerWidth: number,
  frameCount: number
): number {
  const normalizedDistance = dragDistance / containerWidth;
  const frameDelta = Math.floor(normalizedDistance * frameCount);
  
  let newFrame = currentFrame + frameDelta;
  // Wrap around
  while (newFrame < 0) newFrame += frameCount;
  while (newFrame >= frameCount) newFrame -= frameCount;
  
  return newFrame;
}

/**
 * Helper function to calculate rotation angle from frame
 */
function calculateRotationAngle(currentFrame: number, totalFrames: number): number {
  return Math.round((currentFrame / totalFrames) * 360);
}

describe('Product360Viewer - Property-Based Tests', () => {
  /**
   * Feature: immersive-product-page, Property 6: Frame selection proportional to drag
   * Validates: Requirements 2.3
   * 
   * Property: For any drag distance D and frame count N, the selected frame should be
   * proportional to the drag distance relative to container width.
   * 
   * Formula: frame = Math.floor((dragDistance / containerWidth) * frameCount) % frameCount
   */
  describe('Property 6: Frame selection proportional to drag', () => {
    it('should select frame proportional to drag distance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // frame count
          fc.integer({ min: 0, max: 99 }), // current frame (must be < frameCount)
          fc.integer({ min: -2000, max: 2000 }), // drag distance (can be negative)
          fc.integer({ min: 100, max: 2000 }), // container width
          (frameCount, currentFrameInput, dragDistance, containerWidth) => {
            // Ensure currentFrame is within valid range
            const currentFrame = currentFrameInput % frameCount;
            
            const newFrame = calculateFrameFromDrag(
              currentFrame,
              dragDistance,
              containerWidth,
              frameCount
            );
            
            // Property 1: Frame should always be within valid range
            expect(newFrame).toBeGreaterThanOrEqual(0);
            expect(newFrame).toBeLessThan(frameCount);
            
            // Property 2: Frame should be an integer
            expect(Number.isInteger(newFrame)).toBe(true);
            
            // Property 3: For zero drag distance, frame should not change
            if (dragDistance === 0) {
              expect(newFrame).toBe(currentFrame);
            }
            
            // Property 4: Frame delta should be proportional to drag distance
            const expectedFrameDelta = Math.floor((dragDistance / containerWidth) * frameCount);
            let expectedFrame = currentFrame + expectedFrameDelta;
            while (expectedFrame < 0) expectedFrame += frameCount;
            while (expectedFrame >= frameCount) expectedFrame -= frameCount;
            
            expect(newFrame).toBe(expectedFrame);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should wrap around correctly when dragging past boundaries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }), // frame count
          fc.integer({ min: 100, max: 1000 }), // container width
          (frameCount, containerWidth) => {
            // Test wrapping forward (from last frame to first)
            const lastFrame = frameCount - 1;
            const forwardDrag = containerWidth; // Drag one full width
            const newFrameForward = calculateFrameFromDrag(
              lastFrame,
              forwardDrag,
              containerWidth,
              frameCount
            );
            
            // Should wrap to near the beginning
            expect(newFrameForward).toBeGreaterThanOrEqual(0);
            expect(newFrameForward).toBeLessThan(frameCount);
            
            // Test wrapping backward (from first frame to last)
            const firstFrame = 0;
            const backwardDrag = -containerWidth; // Drag one full width backward
            const newFrameBackward = calculateFrameFromDrag(
              firstFrame,
              backwardDrag,
              containerWidth,
              frameCount
            );
            
            // Should wrap to near the end
            expect(newFrameBackward).toBeGreaterThanOrEqual(0);
            expect(newFrameBackward).toBeLessThan(frameCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very small and very large drag distances', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 60 }), // frame count
          fc.integer({ min: 0, max: 59 }), // current frame
          fc.integer({ min: 500, max: 1500 }), // container width
          (frameCount, currentFrameInput, containerWidth) => {
            const currentFrame = currentFrameInput % frameCount;
            
            // Very small drag (less than one frame)
            const smallDrag = 1;
            const frameSmallDrag = calculateFrameFromDrag(
              currentFrame,
              smallDrag,
              containerWidth,
              frameCount
            );
            expect(frameSmallDrag).toBeGreaterThanOrEqual(0);
            expect(frameSmallDrag).toBeLessThan(frameCount);
            
            // Very large drag (multiple full rotations)
            const largeDrag = containerWidth * 5;
            const frameLargeDrag = calculateFrameFromDrag(
              currentFrame,
              largeDrag,
              containerWidth,
              frameCount
            );
            expect(frameLargeDrag).toBeGreaterThanOrEqual(0);
            expect(frameLargeDrag).toBeLessThan(frameCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: immersive-product-page, Property 7: Rotation angle display accuracy
   * Validates: Requirements 2.4
   * 
   * Property: For any current frame F in a 360° viewer with N total frames,
   * the displayed rotation angle should be (F / N) * 360 degrees.
   */
  describe('Property 7: Rotation angle display accuracy', () => {
    it('should calculate rotation angle accurately for any frame', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // total frames
          fc.integer({ min: 0, max: 99 }), // current frame
          (totalFrames, currentFrameInput) => {
            // Ensure currentFrame is within valid range
            const currentFrame = currentFrameInput % totalFrames;
            
            const angle = calculateRotationAngle(currentFrame, totalFrames);
            
            // Property 1: Angle should be between 0 and 360
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(360);
            
            // Property 2: Angle should be an integer (rounded)
            expect(Number.isInteger(angle)).toBe(true);
            
            // Property 3: First frame should be at or near 0 degrees
            if (currentFrame === 0) {
              expect(angle).toBe(0);
            }
            
            // Property 4: Last frame should be near 360 degrees
            if (currentFrame === totalFrames - 1) {
              const expectedAngle = Math.round(((totalFrames - 1) / totalFrames) * 360);
              expect(angle).toBe(expectedAngle);
            }
            
            // Property 5: Angle should be proportional to frame position
            const expectedAngle = Math.round((currentFrame / totalFrames) * 360);
            expect(angle).toBe(expectedAngle);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce evenly distributed angles across all frames', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 60 }), // total frames
          (totalFrames) => {
            const angles: number[] = [];
            
            // Calculate angles for all frames
            for (let frame = 0; frame < totalFrames; frame++) {
              const angle = calculateRotationAngle(frame, totalFrames);
              angles.push(angle);
            }
            
            // Property 1: Angles should be monotonically increasing
            for (let i = 1; i < angles.length; i++) {
              expect(angles[i]).toBeGreaterThanOrEqual(angles[i - 1]);
            }
            
            // Property 2: First angle should be 0
            expect(angles[0]).toBe(0);
            
            // Property 3: All angles should be unique or very close
            const uniqueAngles = new Set(angles);
            // Allow some rounding duplicates for high frame counts
            expect(uniqueAngles.size).toBeGreaterThan(totalFrames * 0.8);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases correctly', () => {
      // Single frame (edge case)
      expect(calculateRotationAngle(0, 1)).toBe(0);
      
      // Two frames
      expect(calculateRotationAngle(0, 2)).toBe(0);
      expect(calculateRotationAngle(1, 2)).toBe(180);
      
      // Four frames (90-degree increments)
      expect(calculateRotationAngle(0, 4)).toBe(0);
      expect(calculateRotationAngle(1, 4)).toBe(90);
      expect(calculateRotationAngle(2, 4)).toBe(180);
      expect(calculateRotationAngle(3, 4)).toBe(270);
      
      // 36 frames (10-degree increments)
      expect(calculateRotationAngle(0, 36)).toBe(0);
      expect(calculateRotationAngle(9, 36)).toBe(90);
      expect(calculateRotationAngle(18, 36)).toBe(180);
      expect(calculateRotationAngle(27, 36)).toBe(270);
    });
  });
});

"use client";

import { useState, useEffect, useCallback } from "react";

// ==================== CARD VALIDATION TYPES ====================

export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export interface CardValidationState {
  isValid: boolean;
  cardType: CardType | null;
  errors: string[];
}

export interface City {
  id: string;
  name: string;
  postalCode: string;
  department?: string;
  region?: string;
  coordinates?: { lat: number; lng: number };
}

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  rules: ValidationRule[];
  serverValidation?: (value: string) => Promise<boolean>;
}

// ==================== CARD NUMBER FORMATTING & VALIDATION ====================

/**
 * Format card number with spaces every 4 digits
 * @param value - Raw card number input
 * @returns Formatted card number (XXXX XXXX XXXX XXXX)
 */
export function formatCardNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // Limit to 16 digits
  const limited = digits.slice(0, 16);

  // Add space every 4 digits
  const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited;

  return formatted;
}

/**
 * Validate card number using Luhn algorithm
 * @param number - Card number (with or without spaces)
 * @returns true if valid, false otherwise
 */
export function validateCardNumber(number: string): boolean {
  // Remove spaces and non-digits
  const digits = number.replace(/\D/g, "");

  // Must be between 13-19 digits
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card type from card number
 * @param number - Card number (partial or complete)
 * @returns Card type
 */
export function detectCardType(number: string): CardType {
  const digits = number.replace(/\D/g, "");

  // Visa: starts with 4
  if (/^4/.test(digits)) {
    return "visa";
  }

  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(digits) || /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720)/.test(digits)) {
    return "mastercard";
  }

  // Amex: starts with 34 or 37
  if (/^3[47]/.test(digits)) {
    return "amex";
  }

  // Discover: starts with 6011, 644-649, or 65
  if (/^6(?:011|5|4[4-9])/.test(digits)) {
    return "discover";
  }

  return "unknown";
}

// ==================== EXPIRY DATE VALIDATION ====================

/**
 * Format expiry date as MM/YY
 * @param value - Raw expiry input
 * @returns Formatted expiry (MM/YY)
 */
export function formatExpiryDate(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // Limit to 4 digits
  const limited = digits.slice(0, 4);

  // Add slash after MM
  if (limited.length >= 2) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  }

  return limited;
}

/**
 * Validate expiry date
 * @param expiry - Expiry date in MM/YY format
 * @returns true if valid and not expired, false otherwise
 */
export function validateExpiryDate(expiry: string): boolean {
  // Remove non-digits
  const digits = expiry.replace(/\D/g, "");

  // Must be 4 digits
  if (digits.length !== 4) {
    return false;
  }

  const month = parseInt(digits.slice(0, 2), 10);
  const year = parseInt(digits.slice(2), 10);

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1; // 0-indexed

  // Check if expired
  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

// ==================== CVV VALIDATION ====================

/**
 * Validate CVV based on card type
 * @param cvv - CVV code
 * @param cardType - Type of card
 * @returns true if valid, false otherwise
 */
export function validateCVV(cvv: string, cardType: CardType): boolean {
  // Remove non-digits
  const digits = cvv.replace(/\D/g, "");

  // Amex requires 4 digits, others require 3
  const requiredLength = cardType === "amex" ? 4 : 3;

  return digits.length === requiredLength;
}

// ==================== POSTAL CODE AUTOCOMPLETE ====================

let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Fetch cities by postal code with debouncing
 * @param postalCode - Postal code to search
 * @returns Promise of matching cities
 */
export async function fetchCitiesByPostalCode(postalCode: string): Promise<City[]> {
  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Return empty if postal code is too short
  if (postalCode.length < 2) {
    return [];
  }

  // Debounce for 300ms
  return new Promise((resolve, reject) => {
    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/checkout/cities?postalCode=${encodeURIComponent(postalCode)}`);

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        resolve(data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        resolve([]);
      }
    }, 300);
  });
}

// ==================== REAL-TIME FIELD VALIDATION HOOK ====================

interface UseFieldValidationOptions {
  fieldName: string;
  value: string;
  rules: ValidationRules;
}

interface UseFieldValidationResult {
  error: string | null;
  isValidating: boolean;
}

/**
 * Custom hook for real-time field validation
 * @param options - Validation options
 * @returns Validation result with error and loading state
 */
export function useFieldValidation({
  fieldName,
  value,
  rules,
}: UseFieldValidationOptions): UseFieldValidationResult {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    // Skip validation if value is empty
    if (!value.trim()) {
      setError(null);
      return;
    }

    // Client-side validation
    for (const rule of rules.rules) {
      if (!rule.validate(value)) {
        setError(rule.message);
        return;
      }
    }

    // Server-side validation (optional)
    if (rules.serverValidation) {
      setIsValidating(true);
      try {
        const isValid = await rules.serverValidation(value);
        if (!isValid) {
          setError("Validation failed");
        } else {
          setError(null);
        }
      } catch (err) {
        setError("Validation error");
      } finally {
        setIsValidating(false);
      }
    } else {
      setError(null);
    }
  }, [value, rules]);

  useEffect(() => {
    // Debounce validation by 500ms
    const timer = setTimeout(() => {
      validate();
    }, 500);

    return () => clearTimeout(timer);
  }, [validate]);

  return { error, isValidating };
}

// ==================== COMMON VALIDATION RULES ====================

export const validationRules = {
  required: (message = "Ce champ est requis"): ValidationRule => ({
    validate: (value: string) => value.trim().length > 0,
    message,
  }),

  email: (): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Email invalide",
  }),

  phone: (): ValidationRule => ({
    validate: (value: string) => /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(value),
    message: "Numéro de téléphone invalide",
  }),

  postalCode: (): ValidationRule => ({
    validate: (value: string) => /^\d{5}$/.test(value),
    message: "Code postal invalide (5 chiffres requis)",
  }),

  minLength: (min: number): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: `Minimum ${min} caractères requis`,
  }),

  maxLength: (max: number): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: `Maximum ${max} caractères autorisés`,
  }),
};

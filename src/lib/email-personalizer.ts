/**
 * Email Content Personalizer
 * Replaces template variables with actual user data
 */

export interface PersonalizationData {
  firstName?: string;
  lastName?: string;
  email?: string;
  unsubscribeUrl?: string;
  trackingId?: string;
  orderNumber?: string;
  productName?: string;
  discountCode?: string;
  customFields?: Record<string, string>;
}

/**
 * Default values for missing personalization data
 */
const DEFAULT_VALUES: Record<string, string> = {
  firstName: "Valued Customer",
  lastName: "",
  email: "",
  unsubscribeUrl: "#",
  trackingId: "",
  orderNumber: "",
  productName: "",
  discountCode: "",
};

/**
 * Variable pattern: {{variableName}}
 */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Personalize email content by replacing template variables
 * 
 * @param content - The email HTML content with template variables
 * @param data - The personalization data
 * @returns Personalized content
 */
export function personalizeEmailContent(
  content: string,
  data: PersonalizationData
): string {
  if (!content) return "";

  // Merge data with defaults
  const mergedData: Record<string, string> = {
    ...DEFAULT_VALUES,
    ...(data.customFields || {}),
  };
  
  // Override with provided values
  if (data.firstName !== undefined) mergedData.firstName = data.firstName;
  if (data.lastName !== undefined) mergedData.lastName = data.lastName;
  if (data.email !== undefined) mergedData.email = data.email;
  if (data.unsubscribeUrl !== undefined) mergedData.unsubscribeUrl = data.unsubscribeUrl;
  if (data.trackingId !== undefined) mergedData.trackingId = data.trackingId;
  if (data.orderNumber !== undefined) mergedData.orderNumber = data.orderNumber;
  if (data.productName !== undefined) mergedData.productName = data.productName;
  if (data.discountCode !== undefined) mergedData.discountCode = data.discountCode;

  // Add computed fields
  mergedData.fullName = `${mergedData.firstName} ${mergedData.lastName}`.trim();
  mergedData.year = new Date().getFullYear().toString();
  mergedData.date = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Replace all variables
  return content.replace(VARIABLE_PATTERN, (match, variableName) => {
    const value = mergedData[variableName];
    if (value !== undefined && value !== null) {
      return escapeHtml(value);
    }
    // Keep the original placeholder if no value found
    console.warn(`Unknown template variable: ${variableName}`);
    return match;
  });
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Add tracking links to all URLs in the content
 * 
 * @param content - The email HTML content
 * @param campaignId - The campaign ID
 * @param trackingId - The unique tracking ID for this recipient
 * @returns Content with tracked links
 */
export function addLinkTracking(
  content: string,
  campaignId: string,
  trackingId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mientior.com";
  
  // Pattern to match href attributes
  const hrefPattern = /href="(https?:\/\/[^"]+)"/gi;

  return content.replace(hrefPattern, (match, url) => {
    // Skip unsubscribe and tracking URLs
    if (url.includes("/unsubscribe") || url.includes("/api/webhooks")) {
      return match;
    }

    // Create tracked URL
    const trackedUrl = `${baseUrl}/api/webhooks/email-tracking?type=click&tid=${trackingId}&cid=${campaignId}&url=${encodeURIComponent(url)}`;
    return `href="${trackedUrl}"`;
  });
}

/**
 * Generate email subject with personalization
 */
export function personalizeSubject(
  subject: string,
  data: PersonalizationData
): string {
  return personalizeEmailContent(subject, data);
}

/**
 * Validate that all required variables are present in the data
 */
export function validatePersonalizationData(
  content: string,
  data: PersonalizationData
): { valid: boolean; missingVariables: string[] } {
  const variables: string[] = [];
  let match;

  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    if (match[1]) variables.push(match[1]);
  }

  const mergedData: Record<string, unknown> = {
    ...DEFAULT_VALUES,
    ...data,
    ...data.customFields,
  };

  const missingVariables = variables.filter(
    (v) => mergedData[v] === undefined || mergedData[v] === null
  );

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Extract all variables from content
 */
export function extractVariables(content: string): string[] {
  const variables = new Set<string>();
  let match;

  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    if (match[1]) variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Generate preview with sample data
 */
export function generatePreview(content: string): string {
  const sampleData: PersonalizationData = {
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    unsubscribeUrl: "https://mientior.com/unsubscribe?token=sample",
    trackingId: "trk_sample_123",
    orderNumber: "ORD-2024-001234",
    productName: "T-Shirt Premium",
    discountCode: "SAVE20",
  };

  return personalizeEmailContent(content, sampleData);
}

/**
 * Wrap content in email template
 */
export function wrapInEmailTemplate(
  content: string,
  options: {
    preheader?: string;
    showUnsubscribe?: boolean;
    unsubscribeUrl?: string;
  } = {}
): string {
  const { preheader, showUnsubscribe = true, unsubscribeUrl = "{{unsubscribeUrl}}" } = options;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Mientior</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 20px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #0891B2;
      padding: 24px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .email-body {
      padding: 32px 24px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer a {
      color: #0891B2;
      text-decoration: none;
    }
    .email-footer a:hover {
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #F97316;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      text-align: center;
    }
    .btn:hover {
      background-color: #ea580c;
    }
    .btn-secondary {
      background-color: #0891B2;
    }
    .btn-secondary:hover {
      background-color: #0e7490;
    }
    h2 {
      color: #1F2937;
      font-size: 24px;
      margin-top: 0;
    }
    p {
      margin: 16px 0;
      color: #4B5563;
    }
    .highlight {
      background-color: #ECFEFF;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #0891B2;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 24px 16px;
      }
      .btn {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Mientior</h1>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>© {{year}} Mientior. Tous droits réservés.</p>
        ${showUnsubscribe ? `
        <p>
          <a href="${unsubscribeUrl}">Se désabonner</a> | 
          <a href="https://mientior.com/preferences">Préférences email</a>
        </p>
        ` : ""}
        <p style="margin-top: 16px; font-size: 11px;">
          Cet email a été envoyé à {{email}}. Si vous avez des questions, contactez-nous à support@mientior.com
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default {
  personalizeEmailContent,
  addLinkTracking,
  personalizeSubject,
  validatePersonalizationData,
  extractVariables,
  generatePreview,
  wrapInEmailTemplate,
};

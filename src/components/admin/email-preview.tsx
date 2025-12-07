"use client";

import React, { useState } from "react";
import { Card, Button, Space, Tabs, Input, message, Modal } from "antd";
import {
  DesktopOutlined,
  MobileOutlined,
  SendOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface EmailPreviewProps {
  subject: string;
  content: string;
  preheader?: string;
  onSendTest?: (email: string) => Promise<void>;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  content,
  preheader,
  onSendTest,
}) => {
  const { t } = useTranslation(["admin", "common"]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [testEmailModalVisible, setTestEmailModalVisible] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail) {
      message.error(t("admin:campaigns.messages.emailRequired"));
      return;
    }

    if (!onSendTest) return;

    setSending(true);
    try {
      await onSendTest(testEmail);
      message.success(t("admin:campaigns.messages.testSent"));
      setTestEmailModalVisible(false);
      setTestEmail("");
    } catch (error) {
      message.error(t("admin:campaigns.messages.testFailed"));
    } finally {
      setSending(false);
    }
  };

  // Email template wrapper
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .email-header {
          background-color: #0891B2;
          padding: 24px;
          text-align: center;
        }
        .email-header img {
          max-height: 40px;
        }
        .email-header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
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
        }
        .email-footer a {
          color: #0891B2;
          text-decoration: none;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #F97316;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 16px 0;
        }
        .btn:hover {
          background-color: #ea580c;
        }
        @media only screen and (max-width: 600px) {
          .email-body {
            padding: 24px 16px;
          }
        }
      </style>
    </head>
    <body>
      ${preheader ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
      <div class="email-container">
        <div class="email-header">
          <h1>Mientior</h1>
        </div>
        <div class="email-body">
          ${content}
        </div>
        <div class="email-footer">
          <p>© ${new Date().getFullYear()} Mientior. All rights reserved.</p>
          <p>
            <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
            <a href="{{preferences_url}}">Email Preferences</a>
          </p>
          <p style="margin-top: 16px; font-size: 11px;">
            This email was sent to {{email}}. If you have questions, please contact us at support@mientior.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <Space>
          <Button
            type={viewMode === "desktop" ? "primary" : "default"}
            icon={<DesktopOutlined />}
            onClick={() => setViewMode("desktop")}
          >
            {t("admin:campaigns.preview.desktop")}
          </Button>
          <Button
            type={viewMode === "mobile" ? "primary" : "default"}
            icon={<MobileOutlined />}
            onClick={() => setViewMode("mobile")}
          >
            {t("admin:campaigns.preview.mobile")}
          </Button>
        </Space>
        {onSendTest && (
          <Button
            icon={<SendOutlined />}
            onClick={() => setTestEmailModalVisible(true)}
          >
            {t("admin:campaigns.actions.sendTest")}
          </Button>
        )}
      </div>

      {/* Subject Preview */}
      <Card size="small" className="bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-500">
            {t("admin:campaigns.fields.subject")}:
          </span>
          <span className="font-semibold">{subject || "(No subject)"}</span>
        </div>
        {preheader && (
          <div className="flex items-center gap-2 mt-1">
            <span className="font-medium text-gray-500">
              {t("admin:campaigns.fields.preheader")}:
            </span>
            <span className="text-gray-600">{preheader}</span>
          </div>
        )}
      </Card>

      {/* Email Preview */}
      <div
        className={`border rounded-lg overflow-hidden bg-gray-100 ${
          viewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
        }`}
      >
        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {t("admin:campaigns.preview.title")}
          </span>
        </div>
        <iframe
          srcDoc={emailTemplate}
          style={{
            width: "100%",
            height: viewMode === "mobile" ? "600px" : "500px",
            border: "none",
            backgroundColor: "#f3f4f6",
          }}
          title="Email Preview"
        />
      </div>

      {/* Variable Reference */}
      <Card size="small" title={t("admin:campaigns.preview.variables")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <code className="bg-gray-100 px-2 py-1 rounded">{"{{firstName}}"}</code>
          <code className="bg-gray-100 px-2 py-1 rounded">{"{{lastName}}"}</code>
          <code className="bg-gray-100 px-2 py-1 rounded">{"{{email}}"}</code>
          <code className="bg-gray-100 px-2 py-1 rounded">{"{{unsubscribe_url}}"}</code>
        </div>
      </Card>

      {/* Test Email Modal */}
      <Modal
        title={t("admin:campaigns.actions.sendTest")}
        open={testEmailModalVisible}
        onOk={handleSendTest}
        onCancel={() => setTestEmailModalVisible(false)}
        confirmLoading={sending}
        okText={t("common:buttons.send")}
      >
        <div className="space-y-4">
          <p>{t("admin:campaigns.messages.testEmailDescription")}</p>
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};

export default EmailPreview;

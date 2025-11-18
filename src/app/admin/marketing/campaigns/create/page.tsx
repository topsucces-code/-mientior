"use client";

import React, { useState, useEffect } from "react";
import { useCreate } from "@refinedev/core";
import {
  Steps,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  DatePicker,
  message,
  Row,
  Col,
  Statistic,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import dayjs, { Dayjs } from "dayjs";

const { TextArea } = Input;

interface CampaignDraft {
  name?: string;
  type?: "EMAIL" | "SMS" | "PUSH";
  subject?: string;
  content?: string;
  segmentId?: string;
  scheduledAt?: string | null;
}

export default function CampaignsCreate() {
  const { t } = useTranslation(["common", "admin"]);
  const router = useRouter();
  const [form] = Form.useForm();
  const { mutate: createCampaign } = useCreate();

  const [currentStep, setCurrentStep] = useState(0);
  const [campaignType, setCampaignType] = useState<"EMAIL" | "SMS" | "PUSH">("EMAIL");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);

  // Auto-save draft
  useEffect(() => {
    const interval = setInterval(() => {
      const draft: CampaignDraft = {
        name: form.getFieldValue("name"),
        type: campaignType,
        subject: form.getFieldValue("subject"),
        content,
        segmentId: form.getFieldValue("segmentId"),
        scheduledAt: scheduledAt?.toISOString() || null,
      };
      localStorage.setItem("campaign-draft", JSON.stringify(draft));
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [form, campaignType, content, scheduledAt]);

  // Restore draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem("campaign-draft");
    if (draftStr) {
      try {
        const draft: CampaignDraft = JSON.parse(draftStr);
        form.setFieldsValue({
          name: draft.name,
          type: draft.type,
          subject: draft.subject,
          segmentId: draft.segmentId,
        });
        if (draft.type) setCampaignType(draft.type);
        if (draft.content) setContent(draft.content);
        if (draft.scheduledAt) setScheduledAt(dayjs(draft.scheduledAt));
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
  }, [form]);

  // Fetch estimated recipients when segment changes
  useEffect(() => {
    const segmentId = form.getFieldValue("segmentId");
    if (segmentId) {
      // TODO: Fetch actual count from API
      setEstimatedRecipients(Math.floor(Math.random() * 1000) + 100);
    } else {
      setEstimatedRecipients(0);
    }
  }, [form]);

  const steps = [
    {
      title: t("admin:campaigns.steps.details"),
      description: t("admin:campaigns.steps.detailsDesc"),
    },
    {
      title: t("admin:campaigns.steps.content"),
      description: t("admin:campaigns.steps.contentDesc"),
    },
    {
      title: t("admin:campaigns.steps.audience"),
      description: t("admin:campaigns.steps.audienceDesc"),
    },
    {
      title: t("admin:campaigns.steps.schedule"),
      description: t("admin:campaigns.steps.scheduleDesc"),
    },
    {
      title: t("admin:campaigns.steps.review"),
      description: t("admin:campaigns.steps.reviewDesc"),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error(t("common:messages.validationError"));
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = () => {
    const values = form.getFieldsValue();
    createCampaign(
      {
        resource: "campaigns",
        values: {
          ...values,
          content,
          status: "DRAFT",
          scheduledAt: scheduledAt?.toISOString() || null,
        },
      },
      {
        onSuccess: () => {
          message.success(t("admin:campaigns.messages.draftSaved"));
          localStorage.removeItem("campaign-draft");
          router.push("/admin/marketing/campaigns");
        },
      }
    );
  };

  const handleSend = () => {
    form.validateFields().then((values) => {
      createCampaign(
        {
          resource: "campaigns",
          values: {
            ...values,
            content,
            status: scheduledAt ? "SCHEDULED" : "ACTIVE",
            scheduledAt: scheduledAt?.toISOString() || null,
          },
        },
        {
          onSuccess: (data) => {
            message.success(
              scheduledAt
                ? t("admin:campaigns.messages.scheduled")
                : t("admin:campaigns.messages.sent")
            );
            localStorage.removeItem("campaign-draft");
            
            // Send campaign if not scheduled
            if (!scheduledAt && data?.data?.id) {
              fetch(`/api/campaigns/${data.data.id}/send`, {
                method: "POST",
              });
            }
            
            router.push("/admin/marketing/campaigns");
          },
        }
      );
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Details
        return (
          <div>
            <Form.Item
              label={t("admin:campaigns.fields.name")}
              name="name"
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              label={t("admin:campaigns.fields.type")}
              name="type"
              rules={[{ required: true }]}
              initialValue="EMAIL"
            >
              <Select
                size="large"
                onChange={(value) => setCampaignType(value as "EMAIL" | "SMS" | "PUSH")}
              >
                <Select.Option value="EMAIL">{t("admin:campaigns.types.EMAIL")}</Select.Option>
                <Select.Option value="SMS">{t("admin:campaigns.types.SMS")}</Select.Option>
                <Select.Option value="PUSH">{t("admin:campaigns.types.PUSH")}</Select.Option>
              </Select>
            </Form.Item>
            {(campaignType === "EMAIL" || campaignType === "PUSH") && (
              <Form.Item
                label={t("admin:campaigns.fields.subject")}
                name="subject"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            )}
          </div>
        );

      case 1:
        // Content
        return (
          <div>
            {campaignType === "EMAIL" ? (
              <Form.Item label={t("admin:campaigns.fields.content")}>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder={t("admin:campaigns.contentPlaceholder")}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label={t("admin:campaigns.fields.message")}
                name="message"
                rules={[
                  { required: true },
                  {
                    max: campaignType === "SMS" ? 160 : 200,
                    message: `Maximum ${campaignType === "SMS" ? 160 : 200} characters`,
                  },
                ]}
              >
                <TextArea
                  rows={6}
                  showCount
                  maxLength={campaignType === "SMS" ? 160 : 200}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Form.Item>
            )}
          </div>
        );

      case 2:
        // Audience
        return (
          <div>
            <Form.Item
              label={t("admin:campaigns.fields.segment")}
              name="segmentId"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                placeholder={t("admin:campaigns.selectSegment")}
                onChange={() => {
                  // Trigger recipient count update
                  const segmentId = form.getFieldValue("segmentId");
                  if (segmentId) {
                    setEstimatedRecipients(Math.floor(Math.random() * 1000) + 100);
                  }
                }}
              >
                <Select.Option value="all">{t("admin:campaigns.segments.all")}</Select.Option>
                <Select.Option value="platinum">{t("admin:campaigns.segments.platinum")}</Select.Option>
                <Select.Option value="inactive">{t("admin:campaigns.segments.inactive")}</Select.Option>
                <Select.Option value="high-value">{t("admin:campaigns.segments.highValue")}</Select.Option>
              </Select>
            </Form.Item>
            {estimatedRecipients > 0 && (
              <Card>
                <Statistic
                  title={t("admin:campaigns.fields.estimatedRecipients")}
                  value={estimatedRecipients}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            )}
          </div>
        );

      case 3:
        // Schedule
        return (
          <div>
            <Form.Item label={t("admin:campaigns.fields.schedule")}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type={!scheduledAt ? "primary" : "default"}
                  onClick={() => setScheduledAt(null)}
                  block
                >
                  {t("admin:campaigns.sendNow")}
                </Button>
                <Button
                  type={scheduledAt ? "primary" : "default"}
                  onClick={() => setScheduledAt(dayjs().add(1, "day"))}
                  block
                >
                  {t("admin:campaigns.scheduleLater")}
                </Button>
              </Space>
            </Form.Item>
            {scheduledAt && (
              <Form.Item label={t("admin:campaigns.fields.scheduledAt")}>
                <DatePicker
                  showTime
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            )}
          </div>
        );

      case 4:
        // Review
        const values = form.getFieldsValue();
        return (
          <div>
            <Card title={t("admin:campaigns.steps.review")} style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>{t("admin:campaigns.fields.name")}:</strong>
                  <div>{values.name}</div>
                </Col>
                <Col span={12}>
                  <strong>{t("admin:campaigns.fields.type")}:</strong>
                  <div>
                    <Tag>{campaignType}</Tag>
                  </div>
                </Col>
                {values.subject && (
                  <Col span={24}>
                    <strong>{t("admin:campaigns.fields.subject")}:</strong>
                    <div>{values.subject}</div>
                  </Col>
                )}
                <Col span={24}>
                  <strong>{t("admin:campaigns.fields.content")}:</strong>
                  <div
                    style={{
                      maxHeight: 200,
                      overflow: "auto",
                      padding: 8,
                      background: "#f5f5f5",
                      borderRadius: 4,
                    }}
                  >
                    {campaignType === "EMAIL" ? (
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                      content
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <strong>{t("admin:campaigns.fields.estimatedRecipients")}:</strong>
                  <div style={{ fontSize: 24, color: "#3f8600" }}>
                    {estimatedRecipients}
                  </div>
                </Col>
                <Col span={12}>
                  <strong>{t("admin:campaigns.fields.schedule")}:</strong>
                  <div>
                    {scheduledAt
                      ? scheduledAt.format("MMM D, YYYY HH:mm")
                      : t("admin:campaigns.sendImmediately")}
                  </div>
                </Col>
              </Row>
            </Card>
            <Card title={t("admin:campaigns.estimatedCost")}>
              <Statistic
                title={`Cost (${campaignType})`}
                value={
                  campaignType === "EMAIL"
                    ? (estimatedRecipients * 0.001).toFixed(2)
                    : (estimatedRecipients * 0.01).toFixed(2)
                }
                prefix="$"
              />
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin/marketing/campaigns")}
          style={{ marginBottom: 16 }}
        >
          {t("common:buttons.back")}
        </Button>

        <h2>{t("admin:campaigns.create")}</h2>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        <Form form={form} layout="vertical" style={{ marginBottom: 24 }}>
          {renderStepContent()}
        </Form>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {currentStep > 0 && (
              <Button onClick={prev} icon={<ArrowLeftOutlined />}>
                {t("common:buttons.previous")}
              </Button>
            )}
          </div>
          <Space>
            <Button icon={<SaveOutlined />} onClick={handleSaveDraft}>
              {t("common:buttons.saveDraft")}
            </Button>
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next} icon={<ArrowRightOutlined />}>
                {t("common:buttons.next")}
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                size="large"
              >
                {scheduledAt
                  ? t("admin:campaigns.schedule")
                  : t("admin:campaigns.send")}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}

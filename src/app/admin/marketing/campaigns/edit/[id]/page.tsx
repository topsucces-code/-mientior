"use client";

import React, { useState, useEffect } from "react";
import { useShow, useUpdate, useCreate } from "@refinedev/core";
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
  Alert,
  Modal,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  SendOutlined,
  CopyOutlined,
  StopOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { EmailPreview } from "@/components/admin/email-preview";
import dayjs, { Dayjs } from "dayjs";

const { TextArea } = Input;

interface PageProps {
  params: { id: string };
}

export default function CampaignEdit({ params }: PageProps) {
  const { id } = params;
  const { t } = useTranslation(["common", "admin"]);
  const router = useRouter();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [campaignType, setCampaignType] = useState<"EMAIL" | "SMS" | "PUSH">("EMAIL");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Fetch campaign data
  const { query } = useShow({
    resource: "campaigns",
    id,
  });

  const { data, isLoading } = query;
  const campaign = data?.data;

  const { mutate: updateCampaign } = useUpdate();
  const { mutate: createCampaign } = useCreate();

  // Populate form when data loads
  useEffect(() => {
    if (campaign) {
      form.setFieldsValue({
        name: campaign.name,
        type: campaign.type,
        subject: campaign.subject,
        segmentId: campaign.segmentId || campaign.segmentFilters?.segmentId,
      });

      setCampaignType(campaign.type);
      setContent(campaign.content || "");
      if (campaign.scheduledAt) {
        setScheduledAt(dayjs(campaign.scheduledAt));
      }
    }
  }, [campaign, form]);

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

  // Check if campaign is editable
  const isEditable = campaign?.status === "DRAFT" || campaign?.status === "SCHEDULED";
  const isReadOnly = campaign?.status === "COMPLETED" || campaign?.status === "CANCELLED" || campaign?.status === "ACTIVE";
  const isScheduled = campaign?.status === "SCHEDULED";

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

  const handleSave = () => {
    const values = form.getFieldsValue();
    updateCampaign(
      {
        resource: "campaigns",
        id,
        values: {
          ...values,
          content,
          scheduledAt: scheduledAt?.toISOString() || null,
        },
      },
      {
        onSuccess: () => {
          message.success(t("admin:campaigns.messages.saved"));
          query.refetch();
        },
        onError: () => {
          message.error(t("admin:campaigns.messages.saveError"));
        },
      }
    );
  };

  const handleDuplicate = () => {
    const values = form.getFieldsValue();
    createCampaign(
      {
        resource: "campaigns",
        values: {
          ...values,
          name: `${values.name} (Copy)`,
          content,
          status: "DRAFT",
          scheduledAt: null,
        },
      },
      {
        onSuccess: (data) => {
          message.success(t("admin:campaigns.messages.duplicated"));
          router.push(`/admin/marketing/campaigns/edit/${data.data.id}`);
        },
        onError: () => {
          message.error(t("admin:campaigns.messages.duplicateError"));
        },
      }
    );
  };

  const handleCancel = () => {
    Modal.confirm({
      title: t("admin:campaigns.messages.cancelConfirm"),
      content: t("admin:campaigns.messages.cancelWarning"),
      okText: t("common:buttons.yes"),
      okType: "danger",
      cancelText: t("common:buttons.no"),
      onOk: () => {
        updateCampaign(
          {
            resource: "campaigns",
            id,
            values: { status: "CANCELLED" },
          },
          {
            onSuccess: () => {
              message.success(t("admin:campaigns.messages.cancelled"));
              router.push("/admin/marketing/campaigns");
            },
          }
        );
      },
    });
  };

  const handleSendTest = async (email: string) => {
    const response = await fetch(`/api/campaigns/${id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to send test email");
    }
  };

  const handleSend = () => {
    form.validateFields().then((values) => {
      // Validate scheduled date is not in the past
      if (scheduledAt && scheduledAt.isBefore(dayjs())) {
        message.error(t("admin:campaigns.messages.pastDate"));
        return;
      }

      // First save the campaign
      updateCampaign(
        {
          resource: "campaigns",
          id,
          values: {
            ...values,
            content,
            status: scheduledAt ? "SCHEDULED" : "ACTIVE",
            scheduledAt: scheduledAt?.toISOString() || null,
          },
        },
        {
          onSuccess: async () => {
            // Then trigger send if not scheduled
            if (!scheduledAt) {
              try {
                await fetch(`/api/campaigns/${id}/send`, {
                  method: "POST",
                });
                message.success(t("admin:campaigns.messages.sent"));
              } catch (error) {
                message.error(t("admin:campaigns.messages.sendError"));
              }
            } else {
              message.success(t("admin:campaigns.messages.scheduled"));
            }
            router.push(`/admin/marketing/campaigns/show/${id}`);
          },
        }
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Alert
          message={t("admin:campaigns.messages.notFound")}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Details
        return (
          <div>
            {isReadOnly && (
              <Alert
                message={t("admin:campaigns.messages.readOnly")}
                type="warning"
                showIcon
                className="mb-4"
              />
            )}
            <Form.Item
              label={t("admin:campaigns.fields.name")}
              name="name"
              rules={[{ required: true }]}
            >
              <Input size="large" disabled={isReadOnly || isScheduled} />
            </Form.Item>
            <Form.Item
              label={t("admin:campaigns.fields.type")}
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                onChange={(value) => setCampaignType(value as "EMAIL" | "SMS" | "PUSH")}
                disabled={isReadOnly || isScheduled}
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
                <Input size="large" disabled={isReadOnly || isScheduled} />
              </Form.Item>
            )}
          </div>
        );

      case 1:
        // Content
        return (
          <div>
            <div className="flex justify-end mb-4">
              {campaignType === "EMAIL" && (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                >
                  {t("admin:campaigns.actions.preview")}
                </Button>
              )}
            </div>
            {campaignType === "EMAIL" ? (
              <Form.Item label={t("admin:campaigns.fields.content")}>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder={t("admin:campaigns.contentPlaceholder")}
                  disabled={isReadOnly || isScheduled}
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
                  disabled={isReadOnly || isScheduled}
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
                disabled={isReadOnly && campaign.status !== "SCHEDULED"}
                onChange={() => {
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
                  disabled={isReadOnly && campaign.status !== "SCHEDULED"}
                >
                  {t("admin:campaigns.sendNow")}
                </Button>
                <Button
                  type={scheduledAt ? "primary" : "default"}
                  onClick={() => setScheduledAt(dayjs().add(1, "day"))}
                  block
                  disabled={isReadOnly && campaign.status !== "SCHEDULED"}
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
                  disabled={isReadOnly && campaign.status !== "SCHEDULED"}
                />
                {scheduledAt.isBefore(dayjs()) && (
                  <Alert
                    message={t("admin:campaigns.messages.pastDate")}
                    type="error"
                    showIcon
                    className="mt-2"
                  />
                )}
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
                <Col span={12}>
                  <strong>{t("admin:campaigns.fields.status")}:</strong>
                  <div>
                    <Tag color={campaign.status === "DRAFT" ? "default" : "blue"}>
                      {campaign.status}
                    </Tag>
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
        <div className="flex justify-between items-center mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/admin/marketing/campaigns")}
          >
            {t("common:buttons.back")}
          </Button>
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              {t("admin:campaigns.actions.duplicate")}
            </Button>
            {campaign.status === "SCHEDULED" && (
              <Button danger icon={<StopOutlined />} onClick={handleCancel}>
                {t("admin:campaigns.actions.cancel")}
              </Button>
            )}
          </Space>
        </div>

        <h2>
          {t("admin:campaigns.edit")}: {campaign.name}
        </h2>

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
            {isEditable && (
              <Button icon={<SaveOutlined />} onClick={handleSave}>
                {t("common:buttons.save")}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next} icon={<ArrowRightOutlined />}>
                {t("common:buttons.next")}
              </Button>
            )}
            {currentStep === steps.length - 1 && isEditable && (
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

      {/* Email Preview Modal */}
      <Modal
        title={t("admin:campaigns.actions.preview")}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <EmailPreview
          subject={form.getFieldValue("subject") || ""}
          content={content}
          onSendTest={handleSendTest}
        />
      </Modal>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useShow, useUpdate, useCreate } from "@refinedev/core";
import {
  Card,
  Button,
  Space,
  Tag,
  Descriptions,
  Table,
  Modal,
  message,
  Spin,
  Alert,
  Tabs,
  Input,
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CopyOutlined,
  SendOutlined,
  StopOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { CampaignStats, CampaignStatsData } from "@/components/admin/campaign-stats";
import {
  CampaignCharts,
  TimeSeriesData,
  DeviceData,
  LocationData,
  LinkData,
} from "@/components/admin/campaign-charts";

interface PageProps {
  params: { id: string };
}

interface Recipient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED";
  openedAt?: string;
  clickedAt?: string;
}

export default function CampaignShow({ params }: PageProps) {
  const { id } = params;
  const { t } = useTranslation(["admin", "common"]);
  const router = useRouter();

  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  // Fetch campaign data
  const { query } = useShow({
    resource: "campaigns",
    id,
  });

  const { data, isLoading } = query;
  const campaign = data?.data;

  const { mutate: updateCampaign } = useUpdate();
  const { mutate: createCampaign } = useCreate();

  // Parse stats
  const stats: CampaignStatsData = useMemo(() => {
    const rawStats = campaign?.stats || {};
    return {
      sent: rawStats.sent || 0,
      delivered: rawStats.delivered || 0,
      opens: rawStats.opens || 0,
      uniqueOpens: rawStats.uniqueOpens || rawStats.opens || 0,
      clicks: rawStats.clicks || 0,
      uniqueClicks: rawStats.uniqueClicks || rawStats.clicks || 0,
      bounces: rawStats.bounces || 0,
      unsubscribes: rawStats.unsubscribes || 0,
      complaints: rawStats.complaints || 0,
      conversions: rawStats.conversions || 0,
      revenue: rawStats.revenue || 0,
      sentAt: campaign?.sentAt,
    };
  }, [campaign]);

  // Mock chart data (in production, this would come from the API)
  const timeSeriesData: TimeSeriesData[] = useMemo(() => {
    if (!campaign?.sentAt) return [];
    const data: TimeSeriesData[] = [];
    const startDate = new Date(campaign.sentAt);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toISOString(),
        opens: Math.floor(Math.random() * 100) + (i === 0 ? 200 : 10),
        clicks: Math.floor(Math.random() * 30) + (i === 0 ? 50 : 5),
      });
    }
    return data;
  }, [campaign?.sentAt]);

  const deviceData: DeviceData[] = [
    { device: "Desktop", count: Math.floor(stats.uniqueOpens * 0.45), percentage: 45 },
    { device: "Mobile", count: Math.floor(stats.uniqueOpens * 0.40), percentage: 40 },
    { device: "Tablet", count: Math.floor(stats.uniqueOpens * 0.12), percentage: 12 },
    { device: "Other", count: Math.floor(stats.uniqueOpens * 0.03), percentage: 3 },
  ];

  const locationData: LocationData[] = [
    { country: "Senegal", countryCode: "SN", count: Math.floor(stats.uniqueOpens * 0.35), percentage: 35 },
    { country: "Ivory Coast", countryCode: "CI", count: Math.floor(stats.uniqueOpens * 0.25), percentage: 25 },
    { country: "Cameroon", countryCode: "CM", count: Math.floor(stats.uniqueOpens * 0.15), percentage: 15 },
    { country: "Nigeria", countryCode: "NG", count: Math.floor(stats.uniqueOpens * 0.10), percentage: 10 },
    { country: "France", countryCode: "FR", count: Math.floor(stats.uniqueOpens * 0.15), percentage: 15 },
  ];

  const linkData: LinkData[] = [
    { url: "https://mientior.com/products", clicks: Math.floor(stats.clicks * 0.4), uniqueClicks: Math.floor(stats.uniqueClicks * 0.4) },
    { url: "https://mientior.com/sale", clicks: Math.floor(stats.clicks * 0.3), uniqueClicks: Math.floor(stats.uniqueClicks * 0.3) },
    { url: "https://mientior.com/new-arrivals", clicks: Math.floor(stats.clicks * 0.2), uniqueClicks: Math.floor(stats.uniqueClicks * 0.2) },
    { url: "https://mientior.com/account", clicks: Math.floor(stats.clicks * 0.1), uniqueClicks: Math.floor(stats.uniqueClicks * 0.1) },
  ];

  // Mock recipients (in production, this would be paginated from the API)
  const recipients: Recipient[] = useMemo(() => {
    if (!campaign) return [];
    const mockRecipients: Recipient[] = [];
    const statuses: Recipient["status"][] = ["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED"];
    for (let i = 0; i < 20; i++) {
      mockRecipients.push({
        id: `recipient-${i}`,
        email: `user${i}@example.com`,
        firstName: `User`,
        lastName: `${i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)] as "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED",
        openedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        clickedAt: Math.random() > 0.7 ? new Date().toISOString() : undefined,
      });
    }
    return mockRecipients;
  }, [campaign]);

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch) return recipients;
    return recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        r.firstName?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        r.lastName?.toLowerCase().includes(recipientSearch.toLowerCase())
    );
  }, [recipients, recipientSearch]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "default",
      SCHEDULED: "blue",
      ACTIVE: "processing",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return colors[status] || "default";
  };

  const getRecipientStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "default",
      SENT: "blue",
      DELIVERED: "cyan",
      OPENED: "green",
      CLICKED: "purple",
      BOUNCED: "red",
      UNSUBSCRIBED: "orange",
    };
    return colors[status] || "default";
  };

  const handleDuplicate = () => {
    createCampaign(
      {
        resource: "campaigns",
        values: {
          name: `${campaign?.name} (Copy)`,
          type: campaign?.type,
          subject: campaign?.subject,
          content: campaign?.content,
          segmentFilters: campaign?.segmentFilters,
          status: "DRAFT",
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
              query.refetch();
            },
          }
        );
      },
    });
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST",
      });

      if (response.ok) {
        message.success(t("admin:campaigns.messages.sent"));
        setSendModalVisible(false);
        query.refetch();
      } else {
        const error = await response.json();
        message.error(error.error || t("admin:campaigns.messages.sendError"));
      }
    } catch (error) {
      message.error(t("admin:campaigns.messages.sendError"));
    } finally {
      setSending(false);
    }
  };

  const handleExportRecipients = () => {
    const csv = [
      ["Email", "First Name", "Last Name", "Status", "Opened At", "Clicked At"].join(","),
      ...recipients.map((r) =>
        [
          r.email,
          r.firstName || "",
          r.lastName || "",
          r.status,
          r.openedAt || "",
          r.clickedAt || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${id}-recipients.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <Card className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/marketing/campaigns")}
              className="mb-4"
            >
              {t("common:buttons.back")}
            </Button>
            <h1 className="text-2xl font-bold mb-2">{campaign.name}</h1>
            <Space>
              <Tag color={getStatusColor(campaign.status)}>{campaign.status}</Tag>
              <Tag>{campaign.type}</Tag>
            </Space>
          </div>
          <Space>
            {campaign.status === "DRAFT" && (
              <>
                <Link href={`/admin/marketing/campaigns/edit/${id}`}>
                  <Button icon={<EditOutlined />}>
                    {t("common:buttons.edit")}
                  </Button>
                </Link>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setSendModalVisible(true)}
                >
                  {t("admin:campaigns.actions.send")}
                </Button>
              </>
            )}
            {campaign.status === "SCHEDULED" && (
              <Button danger icon={<StopOutlined />} onClick={handleCancel}>
                {t("admin:campaigns.actions.cancel")}
              </Button>
            )}
            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              {t("admin:campaigns.actions.duplicate")}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>
              {t("common:buttons.refresh")}
            </Button>
          </Space>
        </div>
      </Card>

      {/* Stats */}
      {(campaign.status === "COMPLETED" || campaign.status === "ACTIVE") && (
        <div className="mb-6">
          <CampaignStats stats={stats} status={campaign.status} />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: t("admin:campaigns.tabs.details"),
            children: (
              <Card>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label={t("admin:campaigns.fields.name")}>
                    {campaign.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.type")}>
                    <Tag>{campaign.type}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.status")}>
                    <Tag color={getStatusColor(campaign.status)}>{campaign.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.subject")}>
                    {campaign.subject || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.segment")}>
                    {campaign.segmentFilters?.segmentId || "All Users"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.scheduledAt")}>
                    {campaign.scheduledAt
                      ? new Date(campaign.scheduledAt).toLocaleString()
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.sentAt")}>
                    {campaign.sentAt
                      ? new Date(campaign.sentAt).toLocaleString()
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.createdAt")}>
                    {new Date(campaign.createdAt).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:campaigns.fields.content")} span={2}>
                    <div
                      className="max-h-64 overflow-auto p-4 bg-gray-50 rounded"
                      dangerouslySetInnerHTML={{ __html: campaign.content }}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: "performance",
            label: t("admin:campaigns.tabs.performance"),
            disabled: campaign.status === "DRAFT" || campaign.status === "SCHEDULED",
            children: (
              <CampaignCharts
                timeSeriesData={timeSeriesData}
                deviceData={deviceData}
                locationData={locationData}
                linkData={linkData}
              />
            ),
          },
          {
            key: "recipients",
            label: t("admin:campaigns.tabs.recipients"),
            disabled: campaign.status === "DRAFT",
            children: (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <Input.Search
                    placeholder={t("admin:campaigns.searchRecipients")}
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    style={{ width: 300 }}
                  />
                  <Button icon={<DownloadOutlined />} onClick={handleExportRecipients}>
                    {t("common:buttons.export")}
                  </Button>
                </div>
                <Table
                  dataSource={filteredRecipients}
                  columns={[
                    {
                      title: t("admin:campaigns.recipients.email"),
                      dataIndex: "email",
                      key: "email",
                    },
                    {
                      title: t("admin:campaigns.recipients.name"),
                      key: "name",
                      render: (_: unknown, record: Recipient) =>
                        `${record.firstName || ""} ${record.lastName || ""}`.trim() || "—",
                    },
                    {
                      title: t("admin:campaigns.recipients.status"),
                      dataIndex: "status",
                      key: "status",
                      render: (status: string) => (
                        <Tag color={getRecipientStatusColor(status)}>{status}</Tag>
                      ),
                      filters: [
                        { text: "Sent", value: "SENT" },
                        { text: "Delivered", value: "DELIVERED" },
                        { text: "Opened", value: "OPENED" },
                        { text: "Clicked", value: "CLICKED" },
                        { text: "Bounced", value: "BOUNCED" },
                      ],
                      onFilter: (value, record: Recipient) => record.status === value,
                    },
                    {
                      title: t("admin:campaigns.recipients.openedAt"),
                      dataIndex: "openedAt",
                      key: "openedAt",
                      render: (date: string) =>
                        date ? new Date(date).toLocaleString() : "—",
                    },
                    {
                      title: t("admin:campaigns.recipients.clickedAt"),
                      dataIndex: "clickedAt",
                      key: "clickedAt",
                      render: (date: string) =>
                        date ? new Date(date).toLocaleString() : "—",
                    },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} recipients` }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Send Confirmation Modal */}
      <Modal
        title={t("admin:campaigns.actions.send")}
        open={sendModalVisible}
        onOk={handleSend}
        onCancel={() => setSendModalVisible(false)}
        confirmLoading={sending}
        okText={t("admin:campaigns.actions.sendNow")}
      >
        <div className="space-y-4">
          <Alert
            message={t("admin:campaigns.messages.sendConfirmTitle")}
            description={t("admin:campaigns.messages.sendConfirmDesc")}
            type="info"
            showIcon
          />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t("admin:campaigns.fields.name")}>
              {campaign.name}
            </Descriptions.Item>
            <Descriptions.Item label={t("admin:campaigns.fields.type")}>
              {campaign.type}
            </Descriptions.Item>
            <Descriptions.Item label={t("admin:campaigns.fields.estimatedRecipients")}>
              <span className="text-green-600 font-bold">
                {stats.sent || "Calculating..."}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("admin:campaigns.estimatedCost")}>
              ${((stats.sent || 100) * (campaign.type === "EMAIL" ? 0.001 : 0.01)).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
          <Progress percent={0} status="active" showInfo={false} />
        </div>
      </Modal>
    </div>
  );
}

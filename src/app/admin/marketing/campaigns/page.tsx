"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTable } from "@refinedev/core";
import {
  Table,
  Space,
  Button,
  Tag,
  Tabs,
  Card,
  Modal,
  message,
  Progress,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExportOutlined,
  StopOutlined,
  MailOutlined,
  MessageOutlined,
  BellOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "dayjs/locale/en";

interface Campaign {
  id: string;
  name: string;
  type: "EMAIL" | "SMS" | "PUSH";
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  segmentCount: number;
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
}

export default function CampaignsList() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Set dayjs locale based on i18n language
  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  // Build filters based on active tab
  const tabFilters = useMemo(() => {
    const filterList: Array<{ field: string; operator: "eq"; value: string }> = [];

    if (activeTab !== "all") {
      filterList.push({
        field: "status",
        operator: "eq",
        value: activeTab.toUpperCase(),
      });
    }

    return filterList;
  }, [activeTab]);

  const tableResult = useTable({
    resource: "campaigns",
    filters: {
      permanent: tabFilters,
    },
  });

  const campaigns = (tableResult.tableQuery?.data?.data || []) as Campaign[];
  const total = tableResult.tableQuery?.data?.total || 0;
  const isLoading = tableResult.tableQuery?.isLoading || false;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      EMAIL: <MailOutlined />,
      SMS: <MessageOutlined />,
      PUSH: <BellOutlined />,
    };
    return icons[type] || <MailOutlined />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      EMAIL: "blue",
      SMS: "green",
      PUSH: "purple",
    };
    return colors[type] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "default",
      SCHEDULED: "orange",
      ACTIVE: "blue",
      COMPLETED: "green",
      CANCELLED: "red",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: t("admin:campaigns.fields.name"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Campaign) => (
        <Link href={`/admin/marketing/campaigns/show/${record.id}`}>
          <strong>{text}</strong>
        </Link>
      ),
    },
    {
      title: t("admin:campaigns.fields.type"),
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {t(`admin:campaigns.types.${type}`)}
        </Tag>
      ),
      filters: [
        { text: t("admin:campaigns.types.EMAIL"), value: "EMAIL" },
        { text: t("admin:campaigns.types.SMS"), value: "SMS" },
        { text: t("admin:campaigns.types.PUSH"), value: "PUSH" },
      ],
    },
    {
      title: t("admin:campaigns.fields.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{t(`admin:campaigns.status.${status}`)}</Tag>
      ),
    },
    {
      title: t("admin:campaigns.fields.audience"),
      dataIndex: "segmentCount",
      key: "segmentCount",
      render: (count: number) => `${count || 0} ${t("admin:campaigns.fields.recipients")}`,
    },
    {
      title: t("admin:campaigns.fields.scheduled"),
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (date?: string) =>
        date ? dayjs(date).format("MMM D, YYYY HH:mm") : t("common:common.notScheduled"),
    },
    {
      title: t("admin:campaigns.fields.sent"),
      dataIndex: "sentAt",
      key: "sentAt",
      render: (date?: string) =>
        date ? dayjs(date).format("MMM D, YYYY HH:mm") : "-",
    },
    {
      title: t("admin:campaigns.stats.openRate"),
      key: "openRate",
      render: (_: unknown, record: Campaign) => {
        if (!record.stats || record.stats.sent === 0) return "-";
        const rate = (record.stats.opened / record.stats.sent) * 100;
        return (
          <Tooltip title={`${record.stats.opened} / ${record.stats.sent}`}>
            <Progress
              percent={rate}
              size="small"
              status={rate > 20 ? "success" : rate > 10 ? "normal" : "exception"}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </Tooltip>
        );
      },
    },
    {
      title: t("admin:campaigns.stats.clickRate"),
      key: "clickRate",
      render: (_: unknown, record: Campaign) => {
        if (!record.stats || record.stats.sent === 0) return "-";
        const rate = (record.stats.clicked / record.stats.sent) * 100;
        return (
          <Tooltip title={`${record.stats.clicked} / ${record.stats.sent}`}>
            <Progress
              percent={rate}
              size="small"
              status={rate > 5 ? "success" : rate > 2 ? "normal" : "exception"}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </Tooltip>
        );
      },
    },
    {
      title: t("admin:common.actions"),
      key: "actions",
      fixed: "right" as const,
      render: (_: unknown, record: Campaign) => (
        <Space>
          <Link href={`/admin/marketing/campaigns/show/${record.id}`}>
            <Button type="link" size="small" icon={<EyeOutlined />}>
              {t("common:common.view")}
            </Button>
          </Link>
          {record.status === "DRAFT" && (
            <Link href={`/admin/marketing/campaigns/edit/${record.id}`}>
              <Button type="link" size="small" icon={<EditOutlined />}>
                {t("common:common.edit")}
              </Button>
            </Link>
          )}
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record.id)}
          >
            {t("common:common.duplicate")}
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleDuplicate = (_campaignId: string) => {
    message.success(t("admin:campaigns.messages.duplicated"));
    // TODO: Implement duplicate functionality
  };

  const handleBulkCancel = () => {
    Modal.confirm({
      title: t("admin:campaigns.bulkActions.cancel"),
      content: t("admin:campaigns.bulkActions.cancelConfirm", {
        count: selectedRowKeys.length,
      }),
      okText: t("common:buttons.cancel"),
      okType: "danger",
      onOk: () => {
        message.success(t("admin:campaigns.messages.cancelSuccess"));
        setSelectedRowKeys([]);
        // TODO: Implement cancel
      },
    });
  };

  const handleBulkExport = () => {
    message.info(t("admin:campaigns.messages.exporting"));
    // TODO: Implement export functionality
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: t("common:common.confirmDelete"),
      content: t("admin:campaigns.bulkActions.deleteConfirm", {
        count: selectedRowKeys.length,
      }),
      okText: t("common:buttons.delete"),
      okType: "danger",
      onOk: () => {
        message.success(t("admin:campaigns.messages.bulkDeleteSuccess"));
        setSelectedRowKeys([]);
        // TODO: Implement delete
      },
    });
  };

  const tabItems = [
    {
      key: "all",
      label: t("common:common.all"),
    },
    {
      key: "draft",
      label: t("admin:campaigns.status.DRAFT"),
    },
    {
      key: "scheduled",
      label: t("admin:campaigns.status.SCHEDULED"),
    },
    {
      key: "active",
      label: t("admin:campaigns.status.ACTIVE"),
    },
    {
      key: "completed",
      label: t("admin:campaigns.status.COMPLETED"),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>{t("admin:campaigns.title")}</h2>
          <Link href="/admin/marketing/campaigns/create">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("admin:campaigns.create")}
            </Button>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Card style={{ marginBottom: 16, backgroundColor: "#f0f2f5" }}>
            <Space>
              <span>
                {t("common:common.selected", { count: selectedRowKeys.length })}
              </span>
              <Button
                icon={<StopOutlined />}
                onClick={handleBulkCancel}
              >
                {t("admin:campaigns.bulkActions.cancel")}
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => message.info(t("admin:campaigns.messages.duplicating"))}
              >
                {t("common:common.duplicate")}
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleBulkExport}
              >
                {t("common:buttons.export")}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleBulkDelete}
              >
                {t("common:buttons.delete")}
              </Button>
            </Space>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={campaigns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t("common:common.totalItems", { total }),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}

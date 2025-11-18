"use client";

import React from "react";
import { useUpdate, useList } from "@refinedev/core";
import { Table, Space, Button, Tag, Tabs, Badge, Avatar, Rate, Modal, Form, Input, message } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined, FilterOutlined, CheckOutlined, StopOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AdvancedFilters } from "@/components/admin/advanced-filters";
import { ColumnSelector, ColumnConfig } from "@/components/admin/column-selector";
import { SavedViewsSelector } from "@/components/admin/saved-views-selector";
import { BulkActions } from "@/components/admin/bulk-actions";

interface Vendor {
  id: string;
  businessName: string;
  email: string;
  logo?: string;
  status: string;
  commissionRate: number;
  rating: number;
  _count?: {
    products: number;
    orders: number;
  };
  createdAt: string;
}

export default function VendorsList() {
  const { t } = useTranslation(["admin", "common"]);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [inviteModalVisible, setInviteModalVisible] = React.useState(false);
  const [form] = Form.useForm();
  const { mutate: updateVendor } = useUpdate();
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const [columns, setColumns] = React.useState<ColumnConfig[]>([
    { key: "logo", title: t("admin:vendors.fields.logo"), visible: true },
    { key: "businessName", title: t("admin:vendors.fields.businessName"), visible: true },
    { key: "email", title: t("admin:vendors.fields.email"), visible: true },
    { key: "status", title: t("admin:vendors.fields.status"), visible: true },
    { key: "products", title: t("admin:vendors.fields.products"), visible: true },
    { key: "commissionRate", title: t("admin:vendors.fields.commissionRate"), visible: true },
    { key: "rating", title: t("admin:vendors.fields.rating"), visible: true },
    { key: "createdAt", title: t("admin:vendors.fields.createdAt"), visible: true },
    { key: "actions", title: t("common:labels.actions"), visible: true, fixed: true },
  ]);

  // Build filters based on active tab
  const tabFilters = React.useMemo(() => {
    const baseFilters = { ...filters };
    if (activeTab !== "all") {
      baseFilters.status = activeTab.toUpperCase();
    }
    return baseFilters;
  }, [activeTab, filters]);

  // Fetch vendors list with filters
  const vendorsList = useList({
    resource: "vendors",
    pagination: {
      pageSize: 10,
    },
    filters: Object.entries(tabFilters).map(([field, value]) => ({
      field,
      operator: "eq",
      value,
    })),
  });

  const vendors = vendorsList?.result?.data || [];
  const isLoading = vendorsList?.query?.isLoading || false;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      ACTIVE: "green",
      SUSPENDED: "red",
      BANNED: "volcano",
    };
    return colors[status] || "default";
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
  };

  const handleViewSelect = (viewFilters: Record<string, unknown>) => {
    setFilters(viewFilters);
  };

  const handleApprove = (vendorId: string) => {
    updateVendor({
      resource: "vendors",
      id: vendorId,
      values: { status: "ACTIVE" },
      successNotification: {
        message: t("admin:vendors.messages.approveSuccess"),
        type: "success",
      },
    });
  };

  const handleSuspend = (vendorId: string) => {
    Modal.confirm({
      title: t("common:messages.confirm"),
      content: t("admin:vendors.messages.suspendConfirm"),
      onOk: () => {
        updateVendor({
          resource: "vendors",
          id: vendorId,
          values: { status: "SUSPENDED" },
          successNotification: {
            message: t("admin:vendors.messages.suspendSuccess"),
            type: "success",
          },
        });
      },
    });
  };

  const handleInvite = async (values: { email: string; businessName: string }) => {
    try {
      const response = await fetch("/api/vendors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(t("admin:vendors.messages.inviteSuccess"));
        form.resetFields();
        setInviteModalVisible(false);
      } else {
        message.error(t("admin:vendors.messages.inviteError"));
      }
    } catch (error) {
      message.error(t("admin:vendors.messages.inviteError"));
    }
  };

  const statusOptions = [
    { label: t("admin:vendors.status.PENDING"), value: "PENDING" },
    { label: t("admin:vendors.status.ACTIVE"), value: "ACTIVE" },
    { label: t("admin:vendors.status.SUSPENDED"), value: "SUSPENDED" },
  ];

  const tabItems = [
    { key: "all", label: t("admin:vendors.tabs.all") },
    { key: "pending", label: <Badge count={0} offset={[10, 0]}>{t("admin:vendors.tabs.pending")}</Badge> },
    { key: "active", label: t("admin:vendors.tabs.active") },
    { key: "suspended", label: t("admin:vendors.tabs.suspended") },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1>{t("admin:resources.vendors")}</h1>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(true)}
          >
            {t("common:buttons.filter")}
          </Button>
          <ColumnSelector columns={columns} onColumnsChange={setColumns} />
          <SavedViewsSelector
            resource="vendors"
            onViewSelect={handleViewSelect}
          />
          <Button
            icon={<MailOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            {t("admin:vendors.actions.invite")}
          </Button>
          <Link href="/admin/vendors/create">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("admin:vendors.actions.create")}
            </Button>
          </Link>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <AdvancedFilters
        resource="vendors"
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      <Table dataSource={vendors} loading={isLoading} rowKey="id" rowSelection={rowSelection}>
        {visibleColumns.map((col) => {
          if (col.key === "logo") {
            return (
              <Table.Column
                key="logo"
                dataIndex="logo"
                title={col.title}
                width={80}
                render={(logo: string, record: Vendor) => (
                  <Avatar
                    src={logo}
                    size={40}
                    shape="square"
                  >
                    {record.businessName.charAt(0).toUpperCase()}
                  </Avatar>
                )}
              />
            );
          }
          if (col.key === "businessName") {
            return (
              <Table.Column
                key="businessName"
                dataIndex="businessName"
                title={col.title}
                render={(name: string, record: Vendor) => (
                  <Link href={`/admin/vendors/show/${record.id}`}>
                    <a style={{ color: "#1890ff", fontWeight: 500 }}>{name}</a>
                  </Link>
                )}
              />
            );
          }
          if (col.key === "email") {
            return <Table.Column key="email" dataIndex="email" title={col.title} />;
          }
          if (col.key === "status") {
            return (
              <Table.Column
                key="status"
                dataIndex="status"
                title={col.title}
                render={(status: string) => (
                  <Tag color={getStatusColor(status)}>
                    {t(`admin:vendors.status.${status}`)}
                  </Tag>
                )}
              />
            );
          }
          if (col.key === "products") {
            return (
              <Table.Column
                key="products"
                title={col.title}
                render={(_, record: Vendor) => (
                  <Badge
                    count={record._count?.products || 0}
                    showZero
                    style={{ backgroundColor: "#52c41a" }}
                  />
                )}
              />
            );
          }
          if (col.key === "commissionRate") {
            return (
              <Table.Column
                key="commissionRate"
                dataIndex="commissionRate"
                title={col.title}
                render={(rate: number) => `${rate}%`}
              />
            );
          }
          if (col.key === "rating") {
            return (
              <Table.Column
                key="rating"
                dataIndex="rating"
                title={col.title}
                render={(rating: number) => <Rate disabled value={rating} />}
              />
            );
          }
          if (col.key === "createdAt") {
            return (
              <Table.Column
                key="createdAt"
                dataIndex="createdAt"
                title={col.title}
                render={(date: string) => new Date(date).toLocaleDateString()}
              />
            );
          }
          if (col.key === "actions") {
            return (
              <Table.Column
                key="actions"
                title={col.title}
                render={(_, record: Vendor) => (
                  <Space>
                    {record.status === "PENDING" && (
                      <Button
                        icon={<CheckOutlined />}
                        size="small"
                        type="primary"
                        onClick={() => handleApprove(record.id)}
                      >
                        {t("admin:vendors.actions.approve")}
                      </Button>
                    )}
                    {record.status === "ACTIVE" && (
                      <Button
                        icon={<StopOutlined />}
                        size="small"
                        danger
                        onClick={() => handleSuspend(record.id)}
                      >
                        {t("admin:vendors.actions.suspend")}
                      </Button>
                    )}
                    <Link href={`/admin/vendors/show/${record.id}`}>
                      <Button icon={<EyeOutlined />} size="small">
                        {t("common:buttons.view")}
                      </Button>
                    </Link>
                    <Link href={`/admin/vendors/edit/${record.id}`}>
                      <Button icon={<EditOutlined />} size="small">
                        {t("common:buttons.edit")}
                      </Button>
                    </Link>
                  </Space>
                )}
              />
            );
          }
          return null;
        })}
      </Table>

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        resource="vendors"
        onClearSelection={() => setSelectedRowKeys([])}
        statusOptions={statusOptions}
      />

      <Modal
        title={t("admin:vendors.actions.invite")}
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite}>
          <Form.Item
            name="businessName"
            label={t("admin:vendors.fields.businessName")}
            rules={[{ required: true, message: t("admin:vendors.messages.businessNameRequired") }]}
          >
            <Input placeholder={t("admin:vendors.messages.businessNamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("admin:vendors.fields.email")}
            rules={[
              { required: true, message: t("admin:vendors.messages.emailRequired") },
              { type: "email", message: t("admin:vendors.messages.emailInvalid") },
            ]}
          >
            <Input placeholder="vendor@example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

"use client";

import React from "react";
import { useTable, useUpdate } from "@refinedev/core";
import { Table, Space, Button, Tag, Avatar, Badge, Tabs, Modal, Form, InputNumber, Statistic, Row, Col } from "antd";
import { EyeOutlined, FilterOutlined, MailOutlined, TrophyOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AdvancedFilters } from "@/components/admin/advanced-filters";
import { ColumnSelector, ColumnConfig } from "@/components/admin/column-selector";
import { SavedViewsSelector } from "@/components/admin/saved-views-selector";
import { BulkActions } from "@/components/admin/bulk-actions";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export default function UsersList() {
  const { t } = useTranslation(["common", "admin"]);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [pointsModalVisible, setPointsModalVisible] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSizeState, setPageSizeState] = React.useState(10);
  const { mutate: updateUser } = useUpdate();

  const [columns, setColumns] = React.useState<ColumnConfig[]>([
    { key: "avatar", title: "", visible: true },
    { key: "name", title: t("admin:users.fields.name"), visible: true },
    { key: "email", title: t("admin:users.fields.email"), visible: true },
    { key: "loyaltyLevel", title: t("admin:users.fields.loyaltyLevel"), visible: true },
    { key: "loyaltyPoints", title: t("admin:users.fields.loyaltyPoints"), visible: true },
    { key: "totalOrders", title: t("admin:users.fields.totalOrders"), visible: true },
    { key: "totalSpent", title: t("admin:users.fields.totalSpent"), visible: true },
    { key: "createdAt", title: t("common.createdAt"), visible: true },
    { key: "actions", title: t("common.actions"), visible: true, fixed: true },
  ]);

  // Build filters based on active tab
  const tabFilters = React.useMemo(() => {
    const baseFilters = { ...filters };
    if (activeTab !== "all") {
      baseFilters.loyaltyLevel = activeTab.toUpperCase();
    }
    return baseFilters;
  }, [activeTab, filters]);

  const tableResult = useTable({
    resource: "users",
    pagination: {
      mode: "server",
    },
    filters: {
      permanent: Object.entries(tabFilters).map(([field, value]) => ({
        field,
        operator: "eq",
        value,
      })),
    },
  });

  const users = (tableResult.tableQuery?.data?.data as User[]) || [];
  const total = tableResult.tableQuery?.data?.total || 0;
  const isLoading = tableResult.tableQuery?.isLoading || false;

  const getLoyaltyColor = (level: string) => {
    const colors: Record<string, string> = {
      BRONZE: "orange",
      SILVER: "default",
      GOLD: "gold",
      PLATINUM: "purple",
    };
    return colors[level] || "default";
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

  const handleAddPoints = async (values: { points: number }) => {
    if (!selectedUser) return;

    updateUser({
      resource: "users",
      id: selectedUser.id,
      values: {
        loyaltyPoints: selectedUser.loyaltyPoints + values.points,
      },
      successNotification: {
        message: t("admin:users.messages.pointsAdded"),
        type: "success",
      },
    });

    setPointsModalVisible(false);
    setSelectedUser(null);
    form.resetFields();
  };

  const loyaltyOptions = [
    { label: t("admin:users.loyaltyLevel.BRONZE"), value: "BRONZE" },
    { label: t("admin:users.loyaltyLevel.SILVER"), value: "SILVER" },
    { label: t("admin:users.loyaltyLevel.GOLD"), value: "GOLD" },
    { label: t("admin:users.loyaltyLevel.PLATINUM"), value: "PLATINUM" },
  ];

  // Commented out - can be used for bulk level changes in the future
  // const handleChangeLevel = (user: User, newLevel: string) => {
  //   Modal.confirm({
  //     title: "Change Loyalty Level",
  //     content: `Change ${user.firstName || user.email}'s loyalty level to ${newLevel}?`,
  //     onOk: () => {
  //       updateUser({
  //         resource: "users",
  //         id: user.id,
  //         values: { loyaltyLevel: newLevel },
  //         successNotification: {
  //           message: t("admin:users.messages.levelChanged", { level: newLevel }),
  //           type: "success",
  //         },
  //       });
  //     },
  //   });
  // };

  const tabItems = [
    { key: "all", label: t("admin:menu.allCustomers") },
    { key: "bronze", label: <Badge color="orange">{t("admin:users.loyaltyLevel.BRONZE")}</Badge> },
    { key: "silver", label: <Badge color="default">{t("admin:users.loyaltyLevel.SILVER")}</Badge> },
    { key: "gold", label: <Badge color="gold">{t("admin:users.loyaltyLevel.GOLD")}</Badge> },
    { key: "platinum", label: <Badge color="purple">{t("admin:users.loyaltyLevel.PLATINUM")}</Badge> },
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
        <h1>{t("admin:resources.customers")}</h1>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(true)}
          >
            {t("admin:filters.advanced")}
          </Button>
          <ColumnSelector columns={columns} onColumnsChange={setColumns} />
          <SavedViewsSelector
            resource="users"
            onViewSelect={handleViewSelect}
          />
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Total Customers"
            value={total}
            prefix={<UserOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total LTV"
            value={users.reduce((sum: number, u: User) => sum + u.totalSpent, 0)}
            prefix="$"
            precision={2}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Avg Order Value"
            value={
              users.reduce((sum: number, u: User) => sum + (u.totalSpent / (u.totalOrders || 1)), 0) /
                (users.length || 1)
            }
            prefix="$"
            precision={2}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Platinum Members"
            value={users.filter((u: User) => u.loyaltyLevel === "PLATINUM").length}
            prefix={<TrophyOutlined style={{ color: "#722ed1" }} />}
          />
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <AdvancedFilters
        resource="users"
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      <Table
        dataSource={users}
        loading={isLoading}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          current: currentPage,
          pageSize: pageSizeState,
          total,
          onChange: (page, size) => {
            setCurrentPage(page);
            if (size && size !== pageSizeState) {
              setPageSizeState(size);
            }
          },
        }}
      >
        {visibleColumns.map((col) => {
          if (col.key === "avatar") {
            return (
              <Table.Column
                key="avatar"
                width={60}
                render={(_: unknown, record: User) => (
                  <Avatar size={40}>
                    {(record.firstName?.charAt(0) || record.email.charAt(0)).toUpperCase()}
                  </Avatar>
                )}
              />
            );
          }
          if (col.key === "name") {
            return (
              <Table.Column
                key="name"
                title={col.title}
                render={(_: unknown, record: User) => (
                  <Link href={`/admin/users/show/${record.id}`}>
                    <a style={{ color: "#1890ff", fontWeight: 500 }}>
                      {record.firstName || record.lastName
                        ? `${record.firstName || ""} ${record.lastName || ""}`.trim()
                        : record.email}
                    </a>
                  </Link>
                )}
              />
            );
          }
          if (col.key === "email") {
            return (
              <Table.Column
                key="email"
                dataIndex="email"
                title={col.title}
                render={(email: string) => (
                  <Space>
                    {email}
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  </Space>
                )}
              />
            );
          }
          if (col.key === "loyaltyLevel") {
            return (
              <Table.Column
                key="loyaltyLevel"
                dataIndex="loyaltyLevel"
                title={col.title}
                render={(level: string, record: User) => (
                  <Tag
                    color={getLoyaltyColor(level)}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedUser(record)}
                  >
                    {t(`admin:users.loyaltyLevel.${level}`)}
                  </Tag>
                )}
              />
            );
          }
          if (col.key === "loyaltyPoints") {
            return (
              <Table.Column
                key="loyaltyPoints"
                dataIndex="loyaltyPoints"
                title={col.title}
                render={(points: number, record: User) => (
                  <Button
                    type="link"
                    onClick={() => {
                      setSelectedUser(record);
                      setPointsModalVisible(true);
                    }}
                  >
                    {points.toLocaleString()} pts
                  </Button>
                )}
              />
            );
          }
          if (col.key === "totalOrders") {
            return (
              <Table.Column
                key="totalOrders"
                dataIndex="totalOrders"
                title={col.title}
                render={(total: number) => (
                  <Badge count={total} showZero style={{ backgroundColor: "#1890ff" }} />
                )}
              />
            );
          }
          if (col.key === "totalSpent") {
            return (
              <Table.Column
                key="totalSpent"
                dataIndex="totalSpent"
                title={col.title}
                render={(spent: number) => (
                  <strong>${(spent || 0).toFixed(2)}</strong>
                )}
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
                render={(_: unknown, record: User) => (
                  <Space>
                    <Link href={`/admin/users/show/${record.id}`}>
                      <Button icon={<EyeOutlined />} size="small">
                        {t("common.view")}
                      </Button>
                    </Link>
                    <Button icon={<MailOutlined />} size="small">
                      Email
                    </Button>
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
        resource="users"
        onClearSelection={() => setSelectedRowKeys([])}
        statusOptions={loyaltyOptions}
      />

      {/* Add Points Modal */}
      <Modal
        title={`Add Loyalty Points - ${selectedUser?.firstName || selectedUser?.email}`}
        open={pointsModalVisible}
        onCancel={() => {
          setPointsModalVisible(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddPoints}>
          <Form.Item
            name="points"
            label="Points to Add"
            rules={[{ required: true, message: "Please enter points" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              max={10000}
              placeholder="Enter points"
            />
          </Form.Item>
          <p>Current Points: {selectedUser?.loyaltyPoints || 0}</p>
        </Form>
      </Modal>
    </div>
  );
}

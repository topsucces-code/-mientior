"use client";

import React, { useState, useMemo } from "react";
import { useTable } from "@refinedev/core";
import {
  Table,
  Space,
  Button,
  Tag,
  Avatar,
  Badge,
  Slider,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  ShoppingOutlined,
  FilterOutlined,
  ExportOutlined,
  PlusOutlined,
  DeleteOutlined,
  GiftOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Search } = Input;

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  loyaltyLevel: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}

export default function CustomersList() {
  const { t } = useTranslation(["common", "admin"]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [segmentModalVisible, setSegmentModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [loyaltyLevels, setLoyaltyLevels] = useState<string[]>([]);
  const [spentRange, setSpentRange] = useState<[number, number]>([0, 10000]);
  const [ordersRange, setOrdersRange] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Build filters
  const filters = useMemo(() => {
    const filterList: Array<{ field: string; operator: "contains" | "in" | "between"; value: unknown }> = [];

    if (searchText) {
      filterList.push({
        field: "search",
        operator: "contains",
        value: searchText,
      });
    }

    if (loyaltyLevels.length > 0) {
      filterList.push({
        field: "loyaltyLevel",
        operator: "in",
        value: loyaltyLevels,
      });
    }

    if (spentRange[0] > 0 || spentRange[1] < 10000) {
      filterList.push({
        field: "totalSpent",
        operator: "between",
        value: spentRange,
      });
    }

    if (ordersRange[0] > 0 || ordersRange[1] < 100) {
      filterList.push({
        field: "totalOrders",
        operator: "between",
        value: ordersRange,
      });
    }

    if (dateRange[0] && dateRange[1]) {
      filterList.push({
        field: "createdAt",
        operator: "between",
        value: [dateRange[0].toISOString(), dateRange[1].toISOString()],
      });
    }

    return filterList;
  }, [searchText, loyaltyLevels, spentRange, ordersRange, dateRange]);

  const tableResult = useTable({
    resource: "users",
    filters: {
      permanent: filters,
    },
  });

  const users = useMemo(
    () => (tableResult.tableQuery?.data?.data || []) as Customer[],
    [tableResult.tableQuery?.data?.data]
  );
  const total = tableResult.tableQuery?.data?.total || 0;
  const isLoading = tableResult.tableQuery?.isLoading || false;

  // Calculate stats
  const stats = useMemo(() => {
    const totalCustomers = total;
    const totalLTV = users.reduce((sum, user) => sum + (user.totalSpent || 0), 0);
    const totalSpent = users.reduce((sum, user) => sum + (user.totalSpent || 0), 0);
    const totalOrders = users.reduce((sum, user) => sum + (user.totalOrders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const platinumMembers = users.filter((user) => user.loyaltyLevel === "PLATINUM").length;

    return {
      totalCustomers,
      totalLTV,
      avgOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
      platinumMembers,
    };
  }, [users, total]);

  const getLoyaltyColor = (level: string) => {
    const colors: Record<string, string> = {
      BRONZE: "#CD7F32",
      SILVER: "#C0C0C0",
      GOLD: "#FFD700",
      PLATINUM: "#E5E4E2",
    };
    return colors[level] || "default";
  };

  const getLoyaltyIcon = (level: string) => {
    return <TrophyOutlined style={{ color: getLoyaltyColor(level) }} />;
  };

  const columns = [
    {
      title: t("admin:customers.fields.customer"),
      dataIndex: "firstName",
      key: "customer",
      render: (_: string, record: Customer) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <Link href={`/admin/customers/show/${record.id}`}>
              <strong>
                {record.firstName && record.lastName
                  ? `${record.firstName} ${record.lastName}`
                  : record.email}
              </strong>
            </Link>
            <div style={{ fontSize: "12px", color: "#999" }}>
              <MailOutlined /> {record.email}
              {record.emailVerified && (
                <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 4 }} />
              )}
            </div>
            {record.phone && (
              <div style={{ fontSize: "12px", color: "#999" }}>
                <PhoneOutlined /> {record.phone}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t("admin:customers.fields.loyaltyLevel"),
      dataIndex: "loyaltyLevel",
      key: "loyaltyLevel",
      render: (level: string) => (
        <Tag color={getLoyaltyColor(level)} icon={getLoyaltyIcon(level)}>
          {level}
        </Tag>
      ),
      filters: [
        { text: "Bronze", value: "BRONZE" },
        { text: "Silver", value: "SILVER" },
        { text: "Gold", value: "GOLD" },
        { text: "Platinum", value: "PLATINUM" },
      ],
    },
    {
      title: t("admin:customers.fields.loyaltyPoints"),
      dataIndex: "loyaltyPoints",
      key: "loyaltyPoints",
      render: (points: number) => (
        <Badge count={points} showZero style={{ backgroundColor: "#52c41a" }} />
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.totalOrders"),
      dataIndex: "totalOrders",
      key: "totalOrders",
      render: (count: number) => (
        <Space>
          <ShoppingOutlined />
          {count || 0}
        </Space>
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.totalSpent"),
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (amount: number) => (
        <Space>
          <DollarOutlined />
          ${(amount || 0).toFixed(2)}
        </Space>
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.lastOrder"),
      dataIndex: "lastOrderDate",
      key: "lastOrderDate",
      render: (date?: string) =>
        date ? dayjs(date).format("MMM D, YYYY") : t("common.never"),
    },
    {
      title: t("common.registered"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
      sorter: true,
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      render: (_: unknown, record: Customer) => (
        <Space>
          <Link href={`/admin/customers/show/${record.id}`}>
            <Button type="link" size="small" icon={<UserOutlined />}>
              {t("common.view")}
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleBulkExport = () => {
    message.info("Exporting selected customers...");
    // TODO: Implement export functionality
  };

  const handleBulkAddPoints = () => {
    Modal.confirm({
      title: t("admin:customers.bulkActions.addPoints"),
      content: (
        <Form>
          <Form.Item label={t("admin:customers.fields.points")} name="points">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        message.success("Points added successfully!");
        // TODO: Implement add points
      },
    });
  };

  const handleBulkChangeLevel = () => {
    Modal.confirm({
      title: t("admin:customers.bulkActions.changeLevel"),
      content: (
        <Form>
          <Form.Item label={t("admin:customers.fields.loyaltyLevel")} name="level">
            <Select>
              <Select.Option value="BRONZE">Bronze</Select.Option>
              <Select.Option value="SILVER">Silver</Select.Option>
              <Select.Option value="GOLD">Gold</Select.Option>
              <Select.Option value="PLATINUM">Platinum</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        message.success("Loyalty level changed successfully!");
        // TODO: Implement change level
      },
    });
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: t("common.confirmDelete"),
      content: t("admin:customers.bulkActions.deleteConfirm", {
        count: selectedRowKeys.length,
      }),
      okText: t("common.delete"),
      okType: "danger",
      onOk: () => {
        message.success("Customers deleted successfully!");
        setSelectedRowKeys([]);
        // TODO: Implement delete
      },
    });
  };

  const handleCreateSegment = () => {
    form.validateFields().then((values) => {
      message.success(
        t("admin:customers.segments.created", { name: values.segmentName })
      );
      setSegmentModalVisible(false);
      form.resetFields();
      // TODO: Implement segment creation
    });
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.totalCustomers")}
              value={stats.totalCustomers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.totalLTV")}
              value={stats.totalLTV}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.avgOrderValue")}
              value={stats.avgOrderValue}
              prefix={<ShoppingOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.platinumMembers")}
              value={stats.platinumMembers}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Search
                placeholder={t("admin:customers.search")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={setSearchText}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                mode="multiple"
                placeholder={t("admin:customers.fields.loyaltyLevel")}
                value={loyaltyLevels}
                onChange={setLoyaltyLevels}
                style={{ width: "100%" }}
              >
                <Select.Option value="BRONZE">Bronze</Select.Option>
                <Select.Option value="SILVER">Silver</Select.Option>
                <Select.Option value="GOLD">Gold</Select.Option>
                <Select.Option value="PLATINUM">Platinum</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          {filtersVisible && (
            <>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <div>
                    <label>{t("admin:customers.fields.totalSpent")}: ${spentRange[0]} - ${spentRange[1]}</label>
                    <Slider
                      range
                      min={0}
                      max={10000}
                      step={100}
                      value={spentRange}
                      onChange={(value) => setSpentRange(value as [number, number])}
                    />
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div>
                    <label>{t("admin:customers.fields.totalOrders")}: {ordersRange[0]} - {ordersRange[1]}</label>
                    <Slider
                      range
                      min={0}
                      max={100}
                      value={ordersRange}
                      onChange={(value) => setOrdersRange(value as [number, number])}
                    />
                  </div>
                </Col>
              </Row>
            </>
          )}

          <Row justify="space-between">
            <Col>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                {filtersVisible ? t("common.hideFilters") : t("common.showFilters")}
              </Button>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setSegmentModalVisible(true)}
                >
                  {t("admin:customers.segments.create")}
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>
              {t("common.selected", { count: selectedRowKeys.length })}
            </span>
            <Button
              icon={<ExportOutlined />}
              onClick={handleBulkExport}
            >
              {t("common.export")}
            </Button>
            <Button
              icon={<GiftOutlined />}
              onClick={handleBulkAddPoints}
            >
              {t("admin:customers.bulkActions.addPoints")}
            </Button>
            <Button
              icon={<TrophyOutlined />}
              onClick={handleBulkChangeLevel}
            >
              {t("admin:customers.bulkActions.changeLevel")}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleBulkDelete}
            >
              {t("common.delete")}
            </Button>
          </Space>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t("common.totalItems", { total }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Segment Modal */}
      <Modal
        title={t("admin:customers.segments.create")}
        open={segmentModalVisible}
        onOk={handleCreateSegment}
        onCancel={() => {
          setSegmentModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:customers.segments.name")}
            name="segmentName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t("admin:customers.segments.description")} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
              {t("admin:customers.segments.filterInfo")}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12 }}>
              <strong>{t("admin:customers.segments.currentFilters")}:</strong>
            </p>
            <ul style={{ margin: "4px 0 0", paddingLeft: 20, fontSize: 12 }}>
              {loyaltyLevels.length > 0 && (
                <li>Loyalty: {loyaltyLevels.join(", ")}</li>
              )}
              {(spentRange[0] > 0 || spentRange[1] < 10000) && (
                <li>Spent: ${spentRange[0]} - ${spentRange[1]}</li>
              )}
              {(ordersRange[0] > 0 || ordersRange[1] < 100) && (
                <li>Orders: {ordersRange[0]} - {ordersRange[1]}</li>
              )}
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

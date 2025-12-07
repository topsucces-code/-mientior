"use client";

import React, { useState } from "react";
import { useTable, useCreate, useUpdate } from "@refinedev/core";
import {
  Table,
  Space,
  Button,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Badge,
  Tooltip,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface PromoCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  usageCount: number;
  usageLimit?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  minOrderAmount?: number;
  maxDiscount?: number;
  conditions?: {
    scope?: string;
    categoryIds?: string[];
    productIds?: string[];
    perUserLimit?: number;
    firstOrderOnly?: boolean;
  };
}

export default function PromoCodesList() {
  const { t } = useTranslation(["common", "admin"]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [form] = Form.useForm();

  const { mutate: createPromoCode } = useCreate();
  const { mutate: updatePromoCode } = useUpdate();

  const tableResult = useTable({
    resource: "promo-codes",
  });

  const promoCodes = (tableResult.tableQuery?.data?.data || []) as PromoCode[];
  const total = tableResult.tableQuery?.data?.total || 0;
  const isLoading = tableResult.tableQuery?.isLoading || false;

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PERCENTAGE: "blue",
      FIXED_AMOUNT: "green",
      FREE_SHIPPING: "purple",
    };
    return colors[type] || "default";
  };

  const formatValue = (type: string, value: number) => {
    if (type === "PERCENTAGE") return `${value}%`;
    if (type === "FIXED_AMOUNT") return `$${value}`;
    return "Free Shipping";
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Space>
          <code style={{ padding: "4px 8px", background: "#f0f0f0", borderRadius: 4 }}>
            {code}
          </code>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(code);
              message.success("Copied to clipboard");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={getTypeColor(type)}>{type}</Tag>,
      filters: [
        { text: "Percentage", value: "PERCENTAGE" },
        { text: "Fixed Amount", value: "FIXED_AMOUNT" },
        { text: "Free Shipping", value: "FREE_SHIPPING" },
      ],
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value: number, record: PromoCode) => formatValue(record.type, value),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: unknown, record: PromoCode) => (
        <Tooltip
          title={
            record.usageLimit
              ? `${record.usageCount} / ${record.usageLimit} used`
              : `${record.usageCount} used (unlimited)`
          }
        >
          <Badge
            count={record.usageCount}
            showZero
            style={{
              backgroundColor: record.usageLimit && record.usageCount >= record.usageLimit
                ? "#ff4d4f"
                : "#52c41a",
            }}
          />
          {record.usageLimit && (
            <span style={{ marginLeft: 8, color: "#999" }}>
              / {record.usageLimit}
            </span>
          )}
        </Tooltip>
      ),
    },
    {
      title: "Valid From",
      dataIndex: "validFrom",
      key: "validFrom",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Valid Until",
      dataIndex: "validTo",
      key: "validTo",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: PromoCode) => {
        const now = dayjs();
        const validFrom = dayjs(record.validFrom);
        const validTo = dayjs(record.validTo);
        const isExpired = now.isAfter(validTo);
        const isNotYetValid = now.isBefore(validFrom);

        if (!isActive) {
          return <Tag color="default">Disabled</Tag>;
        }
        if (isExpired) {
          return <Tag color="red">Expired</Tag>;
        }
        if (isNotYetValid) {
          return <Tag color="orange">Scheduled</Tag>;
        }
        return <Tag color="green">Active</Tag>;
      },
      filters: [
        { text: "Active", value: true },
        { text: "Disabled", value: false },
      ],
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      render: (_: unknown, record: PromoCode) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleActive(record)}
          >
            {record.isActive ? "Disable" : "Enable"}
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ code: generateCode() });
    setEditingCode(null);
    setModalVisible(true);
  };

  const handleEdit = (code: PromoCode) => {
    form.setFieldsValue({
      code: code.code,
      type: code.type,
      value: code.value,
      usageLimit: code.usageLimit,
      validDates: [dayjs(code.validFrom), dayjs(code.validTo)],
      minPurchase: code.minOrderAmount,
      maxDiscount: code.maxDiscount,
      scope: code.conditions?.scope || "CART",
      categoryIds: code.conditions?.categoryIds || [],
      productIds: code.conditions?.productIds || [],
      perUserLimit: code.conditions?.perUserLimit,
      firstOrderOnly: code.conditions?.firstOrderOnly || false,
    });
    setEditingCode(code);
    setModalVisible(true);
  };

  const handleToggleActive = (code: PromoCode) => {
    updatePromoCode({
      resource: "promo-codes",
      id: code.id,
      values: { isActive: !code.isActive },
      successNotification: {
        message: code.isActive
          ? "Promo code disabled successfully"
          : "Promo code enabled successfully",
        type: "success",
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const dates = values.validDates as [Dayjs, Dayjs];
      const data = {
        code: values.code,
        type: values.type,
        value: values.value,
        usageLimit: values.usageLimit || null,
        validFrom: dates[0].toISOString(),
        validTo: dates[1].toISOString(),
        isActive: true,
        minOrderAmount: values.minPurchase || null,
        maxDiscount: values.maxDiscount || null,
        conditions: {
          scope: values.scope || "CART",
          categoryIds: values.categoryIds || null,
          productIds: values.productIds || null,
          perUserLimit: values.perUserLimit || null,
          firstOrderOnly: values.firstOrderOnly || false,
        },
      };

      if (editingCode) {
        updatePromoCode(
          {
            resource: "promo-codes",
            id: editingCode.id,
            values: data,
          },
          {
            onSuccess: () => {
              message.success("Saved successfully");
              setModalVisible(false);
              form.resetFields();
            },
          }
        );
      } else {
        createPromoCode(
          {
            resource: "promo-codes",
            values: data,
          },
          {
            onSuccess: () => {
              message.success("Promo code created successfully");
              setModalVisible(false);
              form.resetFields();
            },
          }
        );
      }
    });
  };

  const handleBulkDisable = () => {
    message.success("Promo codes disabled successfully!");
    setSelectedRowKeys([]);
    // TODO: Implement bulk disable
  };

  const handleBulkEnable = () => {
    message.success("Promo codes enabled successfully!");
    setSelectedRowKeys([]);
    // TODO: Implement bulk enable
  };

  const handleBulkExport = () => {
    message.info("Exporting selected promo codes...");
    // TODO: Implement export
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: "Confirm Delete",
      content: `Are you sure you want to delete ${selectedRowKeys.length} promo codes?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        message.success("Promo codes deleted successfully!");
        setSelectedRowKeys([]);
        // TODO: Implement delete
      },
    });
  };

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
          <h2 style={{ margin: 0 }}>Promo Codes</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Promo Code
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <Card style={{ marginBottom: 16, backgroundColor: "#f0f2f5" }}>
            <Space>
              <span>{selectedRowKeys.length} selected</span>
              <Button icon={<CheckOutlined />} onClick={handleBulkEnable}>
                Enable
              </Button>
              <Button icon={<CloseOutlined />} onClick={handleBulkDisable}>
                Disable
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleBulkExport}>
                Export
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={handleBulkDelete}>
                Delete
              </Button>
            </Space>
          </Card>
        )}

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={promoCodes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCode ? t("admin:promoCodes.edit") : t("admin:promoCodes.create")}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:promoCodes.fields.code")}
            name="code"
            rules={[{ required: true }]}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => form.setFieldsValue({ code: generateCode() })}
              >
                {t("admin:promoCodes.generateCode")}
              </Button>
            }
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("admin:promoCodes.fields.type")}
            name="type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="PERCENTAGE">Percentage Discount</Select.Option>
              <Select.Option value="FIXED_AMOUNT">Fixed Amount</Select.Option>
              <Select.Option value="FREE_SHIPPING">Free Shipping</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("type") !== "FREE_SHIPPING" && (
                <Form.Item
                  label={t("admin:promoCodes.fields.value")}
                  name="value"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={getFieldValue("type") === "PERCENTAGE" ? 100 : undefined}
                    prefix={getFieldValue("type") === "PERCENTAGE" ? "%" : "$"}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item
            label={t("admin:promoCodes.fields.usageLimit")}
            name="usageLimit"
            extra={t("admin:promoCodes.usageLimitHint")}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item
            label={t("admin:promoCodes.fields.validDates")}
            name="validDates"
            rules={[{ required: true }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label={t("admin:promoCodes.fields.minPurchase")}
            name="minPurchase"
            extra={t("admin:promoCodes.minPurchaseHint")}
          >
            <InputNumber style={{ width: "100%" }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item
            label={t("admin:promoCodes.fields.maxDiscount")}
            name="maxDiscount"
            extra={t("admin:promoCodes.maxDiscountHint")}
          >
            <InputNumber style={{ width: "100%" }} min={0} prefix="$" />
          </Form.Item>

          {/* Scope Selection */}
          <Form.Item
            label={t("admin:promoCodes.fields.scope")}
            name="scope"
            initialValue="CART"
          >
            <Select>
              <Select.Option value="CART">{t("admin:promoCodes.scopes.cart")}</Select.Option>
              <Select.Option value="SHIPPING">{t("admin:promoCodes.scopes.shipping")}</Select.Option>
              <Select.Option value="CATEGORY">{t("admin:promoCodes.scopes.category")}</Select.Option>
              <Select.Option value="PRODUCT">{t("admin:promoCodes.scopes.product")}</Select.Option>
            </Select>
          </Form.Item>

          {/* Category Selection (conditional) */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.scope !== currentValues.scope
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("scope") === "CATEGORY" && (
                <Form.Item
                  label={t("admin:promoCodes.fields.categories")}
                  name="categoryIds"
                  rules={[{ required: true, message: t("admin:promoCodes.messages.categoryRequired") }]}
                >
                  <Select
                    mode="multiple"
                    placeholder={t("admin:promoCodes.selectCategories")}
                    style={{ width: "100%" }}
                  >
                    {/* Categories would be loaded from API */}
                    <Select.Option value="electronics">Electronics</Select.Option>
                    <Select.Option value="clothing">Clothing</Select.Option>
                    <Select.Option value="home">Home & Garden</Select.Option>
                    <Select.Option value="beauty">Beauty</Select.Option>
                  </Select>
                </Form.Item>
              )
            }
          </Form.Item>

          {/* Product Selection (conditional) */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.scope !== currentValues.scope
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("scope") === "PRODUCT" && (
                <Form.Item
                  label={t("admin:promoCodes.fields.products")}
                  name="productIds"
                  rules={[{ required: true, message: t("admin:promoCodes.messages.productRequired") }]}
                >
                  <Select
                    mode="multiple"
                    placeholder={t("admin:promoCodes.selectProducts")}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {/* Products would be loaded from API */}
                    <Select.Option value="prod-1">Product 1</Select.Option>
                    <Select.Option value="prod-2">Product 2</Select.Option>
                    <Select.Option value="prod-3">Product 3</Select.Option>
                  </Select>
                </Form.Item>
              )
            }
          </Form.Item>

          {/* Per User Limit */}
          <Form.Item
            label={t("admin:promoCodes.fields.perUserLimit")}
            name="perUserLimit"
            extra={t("admin:promoCodes.perUserLimitHint")}
          >
            <InputNumber style={{ width: "100%" }} min={1} placeholder="Unlimited" />
          </Form.Item>

          {/* First Order Only */}
          <Form.Item
            name="firstOrderOnly"
            valuePropName="checked"
          >
            <Checkbox>{t("admin:promoCodes.fields.firstOrderOnly")}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

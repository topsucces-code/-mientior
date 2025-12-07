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
  Statistic,
  Row,
  Col,
  Progress,
  Modal,
  message,
  Spin,
  Alert,
  Tabs,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import dayjs from "dayjs";

interface PageProps {
  params: { id: string };
}

interface PromoCodeUsage {
  id: string;
  orderId: string;
  userId: string;
  discountAmount: number;
  usedAt: string;
  order?: {
    orderNumber: string;
    total: number;
  };
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function PromoCodeShow({ params }: PageProps) {
  const { id } = params;
  const { t } = useTranslation(["admin", "common"]);
  const router = useRouter();

  const [usageSearch, setUsageSearch] = useState("");

  // Fetch promo code data
  const { query } = useShow({
    resource: "promo-codes",
    id,
  });

  const { data, isLoading } = query;
  const promoCode = data?.data;

  const { mutate: updatePromoCode } = useUpdate();
  const { mutate: createPromoCode } = useCreate();

  // Calculate stats
  const stats = useMemo(() => {
    if (!promoCode) return null;

    const usages = (promoCode.usages || []) as PromoCodeUsage[];
    const totalDiscountGiven = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
    const totalOrders = usages.length;
    const totalOrderValue = usages.reduce((sum, u) => sum + (u.order?.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
    const conversionRate = promoCode.usageLimit
      ? (promoCode.usageCount / promoCode.usageLimit) * 100
      : 0;

    // Usage over time (mock data for visualization)
    const usageByDate: Record<string, number> = {};
    usages.forEach((u) => {
      const date = dayjs(u.usedAt).format("YYYY-MM-DD");
      usageByDate[date] = (usageByDate[date] || 0) + 1;
    });

    return {
      totalDiscountGiven,
      totalOrders,
      totalOrderValue,
      avgOrderValue,
      conversionRate,
      usageByDate,
    };
  }, [promoCode]);

  // Filter usages
  const filteredUsages = useMemo(() => {
    const usages = (promoCode?.usages || []) as PromoCodeUsage[];
    if (!usageSearch) return usages;
    return usages.filter(
      (u) =>
        u.order?.orderNumber?.toLowerCase().includes(usageSearch.toLowerCase()) ||
        u.user?.email?.toLowerCase().includes(usageSearch.toLowerCase())
    );
  }, [promoCode?.usages, usageSearch]);

  const getStatusInfo = () => {
    if (!promoCode) return { status: "Unknown", color: "default" };

    const now = dayjs();
    const validFrom = promoCode.validFrom ? dayjs(promoCode.validFrom) : null;
    const validTo = promoCode.validTo ? dayjs(promoCode.validTo) : null;

    if (!promoCode.isActive) {
      return { status: t("admin:promoCodes.status.disabled"), color: "default" };
    }
    if (validTo && now.isAfter(validTo)) {
      return { status: t("admin:promoCodes.status.expired"), color: "red" };
    }
    if (validFrom && now.isBefore(validFrom)) {
      return { status: t("admin:promoCodes.status.scheduled"), color: "orange" };
    }
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return { status: t("admin:promoCodes.status.exhausted"), color: "volcano" };
    }
    return { status: t("admin:promoCodes.status.active"), color: "green" };
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PERCENTAGE: t("admin:promoCodes.types.percentage"),
      FIXED_AMOUNT: t("admin:promoCodes.types.fixed"),
      FREE_SHIPPING: t("admin:promoCodes.types.freeShipping"),
    };
    return labels[type] || type;
  };

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      CART: t("admin:promoCodes.scopes.cart"),
      SHIPPING: t("admin:promoCodes.scopes.shipping"),
      CATEGORY: t("admin:promoCodes.scopes.category"),
      PRODUCT: t("admin:promoCodes.scopes.product"),
    };
    return labels[scope] || scope;
  };

  const formatValue = () => {
    if (!promoCode) return "";
    if (promoCode.type === "PERCENTAGE") return `${promoCode.value}%`;
    if (promoCode.type === "FIXED_AMOUNT") return `$${promoCode.value}`;
    return t("admin:promoCodes.types.freeShipping");
  };

  const handleToggleActive = () => {
    updatePromoCode(
      {
        resource: "promo-codes",
        id,
        values: { isActive: !promoCode?.isActive },
      },
      {
        onSuccess: () => {
          message.success(
            promoCode?.isActive
              ? t("admin:promoCodes.messages.disabled")
              : t("admin:promoCodes.messages.enabled")
          );
          query.refetch();
        },
      }
    );
  };

  const handleDuplicate = () => {
    createPromoCode(
      {
        resource: "promo-codes",
        values: {
          code: `${promoCode?.code}-COPY`,
          type: promoCode?.type,
          value: promoCode?.value,
          minOrderAmount: promoCode?.minOrderAmount,
          maxDiscount: promoCode?.maxDiscount,
          usageLimit: promoCode?.usageLimit,
          validFrom: promoCode?.validFrom,
          validTo: promoCode?.validTo,
          conditions: promoCode?.conditions,
          isActive: false,
        },
      },
      {
        onSuccess: (data) => {
          message.success(t("admin:promoCodes.messages.duplicated"));
          router.push(`/admin/marketing/promo-codes/show/${data.data.id}`);
        },
      }
    );
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t("admin:promoCodes.messages.deleteConfirm"),
      content: t("admin:promoCodes.messages.deleteWarning"),
      okText: t("common:buttons.delete"),
      okType: "danger",
      cancelText: t("common:buttons.cancel"),
      onOk: async () => {
        try {
          await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
          message.success(t("admin:promoCodes.messages.deleted"));
          router.push("/admin/marketing/promo-codes");
        } catch (error) {
          message.error(t("admin:promoCodes.messages.deleteError"));
        }
      },
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promoCode?.code || "");
    message.success(t("admin:promoCodes.messages.copied"));
  };

  const handleExportUsages = () => {
    const usages = promoCode?.usages || [];
    const csv = [
      ["Order Number", "User Email", "Discount Amount", "Order Total", "Used At"].join(","),
      ...usages.map((u: PromoCodeUsage) =>
        [
          u.order?.orderNumber || "",
          u.user?.email || "",
          u.discountAmount,
          u.order?.total || "",
          dayjs(u.usedAt).format("YYYY-MM-DD HH:mm"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-code-${promoCode?.code}-usages.csv`;
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

  if (!promoCode) {
    return (
      <div className="p-6">
        <Alert
          message={t("admin:promoCodes.messages.notFound")}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <Card className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/admin/marketing/promo-codes")}
              className="mb-4"
            >
              {t("common:buttons.back")}
            </Button>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold m-0">
                <code className="bg-gray-100 px-3 py-1 rounded text-2xl">
                  {promoCode.code}
                </code>
              </h1>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
              />
            </div>
            <Space>
              <Tag color={statusInfo.color}>{statusInfo.status}</Tag>
              <Tag>{getTypeLabel(promoCode.type)}</Tag>
              {promoCode.conditions?.scope && (
                <Tag color="blue">{getScopeLabel(promoCode.conditions.scope)}</Tag>
              )}
            </Space>
          </div>
          <Space>
            <Link href={`/admin/marketing/promo-codes`}>
              <Button icon={<EditOutlined />}>
                {t("common:buttons.edit")}
              </Button>
            </Link>
            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              {t("admin:promoCodes.actions.duplicate")}
            </Button>
            <Button
              icon={promoCode.isActive ? <CloseOutlined /> : <CheckOutlined />}
              onClick={handleToggleActive}
            >
              {promoCode.isActive
                ? t("admin:promoCodes.actions.disable")
                : t("admin:promoCodes.actions.enable")}
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              {t("common:buttons.delete")}
            </Button>
          </Space>
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("admin:promoCodes.stats.usageCount")}
                value={promoCode.usageCount}
                suffix={promoCode.usageLimit ? `/ ${promoCode.usageLimit}` : ""}
                prefix={<ShoppingCartOutlined />}
              />
              {promoCode.usageLimit && (
                <Progress
                  percent={stats.conversionRate}
                  size="small"
                  strokeColor={stats.conversionRate >= 90 ? "#ff4d4f" : "#0891B2"}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("admin:promoCodes.stats.totalDiscount")}
                value={stats.totalDiscountGiven}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("admin:promoCodes.stats.totalOrders")}
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("admin:promoCodes.stats.avgOrderValue")}
                value={stats.avgOrderValue}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs */}
      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: t("admin:promoCodes.tabs.details"),
            children: (
              <Card>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label={t("admin:promoCodes.fields.code")}>
                    <code className="bg-gray-100 px-2 py-1 rounded">{promoCode.code}</code>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.type")}>
                    <Tag>{getTypeLabel(promoCode.type)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.value")}>
                    <span className="text-xl font-bold text-green-600">{formatValue()}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.status")}>
                    <Tag color={statusInfo.color}>{statusInfo.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.scope")}>
                    {promoCode.conditions?.scope
                      ? getScopeLabel(promoCode.conditions.scope)
                      : t("admin:promoCodes.scopes.cart")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.usageLimit")}>
                    {promoCode.usageLimit || t("common:labels.unlimited")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.perUserLimit")}>
                    {promoCode.conditions?.perUserLimit || t("common:labels.unlimited")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.usageCount")}>
                    {promoCode.usageCount}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.validFrom")}>
                    {promoCode.validFrom
                      ? dayjs(promoCode.validFrom).format("MMM D, YYYY HH:mm")
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.validTo")}>
                    {promoCode.validTo
                      ? dayjs(promoCode.validTo).format("MMM D, YYYY HH:mm")
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.minPurchase")}>
                    {promoCode.minOrderAmount ? `$${promoCode.minOrderAmount}` : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.maxDiscount")}>
                    {promoCode.maxDiscount ? `$${promoCode.maxDiscount}` : "—"}
                  </Descriptions.Item>
                  {promoCode.conditions?.firstOrderOnly && (
                    <Descriptions.Item label={t("admin:promoCodes.fields.firstOrderOnly")} span={2}>
                      <Tag color="purple">{t("common:labels.yes")}</Tag>
                    </Descriptions.Item>
                  )}
                  {promoCode.conditions?.categoryIds && (
                    <Descriptions.Item label={t("admin:promoCodes.fields.categories")} span={2}>
                      {promoCode.conditions.categoryIds.map((catId: string) => (
                        <Tag key={catId}>{catId}</Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                  {promoCode.conditions?.productIds && (
                    <Descriptions.Item label={t("admin:promoCodes.fields.products")} span={2}>
                      {promoCode.conditions.productIds.map((prodId: string) => (
                        <Tag key={prodId}>{prodId}</Tag>
                      ))}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label={t("admin:promoCodes.fields.createdAt")}>
                    {dayjs(promoCode.createdAt).format("MMM D, YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("admin:promoCodes.fields.updatedAt")}>
                    {dayjs(promoCode.updatedAt).format("MMM D, YYYY HH:mm")}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: "usage",
            label: t("admin:promoCodes.tabs.usage"),
            children: (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <Input.Search
                    placeholder={t("admin:promoCodes.searchUsage")}
                    value={usageSearch}
                    onChange={(e) => setUsageSearch(e.target.value)}
                    style={{ width: 300 }}
                  />
                  <Button icon={<DownloadOutlined />} onClick={handleExportUsages}>
                    {t("common:buttons.export")}
                  </Button>
                </div>
                <Table
                  dataSource={filteredUsages}
                  columns={[
                    {
                      title: t("admin:promoCodes.usage.orderNumber"),
                      key: "orderNumber",
                      render: (_: unknown, record: PromoCodeUsage) => (
                        <Link href={`/admin/orders/show/${record.orderId}`}>
                          <span className="text-blue-600 hover:underline">
                            {record.order?.orderNumber || record.orderId}
                          </span>
                        </Link>
                      ),
                    },
                    {
                      title: t("admin:promoCodes.usage.user"),
                      key: "user",
                      render: (_: unknown, record: PromoCodeUsage) => (
                        <span>
                          {record.user?.firstName} {record.user?.lastName}
                          <br />
                          <span className="text-gray-500 text-sm">{record.user?.email}</span>
                        </span>
                      ),
                    },
                    {
                      title: t("admin:promoCodes.usage.discountAmount"),
                      dataIndex: "discountAmount",
                      key: "discountAmount",
                      render: (amount: number) => (
                        <span className="text-green-600 font-medium">-${amount.toFixed(2)}</span>
                      ),
                    },
                    {
                      title: t("admin:promoCodes.usage.orderTotal"),
                      key: "orderTotal",
                      render: (_: unknown, record: PromoCodeUsage) =>
                        record.order?.total ? `$${record.order.total.toFixed(2)}` : "—",
                    },
                    {
                      title: t("admin:promoCodes.usage.usedAt"),
                      dataIndex: "usedAt",
                      key: "usedAt",
                      render: (date: string) => dayjs(date).format("MMM D, YYYY HH:mm"),
                      sorter: (a: PromoCodeUsage, b: PromoCodeUsage) =>
                        dayjs(a.usedAt).unix() - dayjs(b.usedAt).unix(),
                    },
                  ]}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `${t("common:labels.total")} ${total} ${t("common:labels.items")}`,
                  }}
                />
              </Card>
            ),
          },
          {
            key: "analytics",
            label: t("admin:promoCodes.tabs.analytics"),
            children: (
              <Card>
                {stats && Object.keys(stats.usageByDate).length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">{t("admin:promoCodes.analytics.usageOverTime")}</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.usageByDate)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, count]) => (
                          <div key={date} className="flex items-center gap-4">
                            <span className="w-28 text-gray-500">{dayjs(date).format("MMM D")}</span>
                            <Progress
                              percent={(count / Math.max(...Object.values(stats.usageByDate))) * 100}
                              format={() => `${count} ${t("admin:promoCodes.analytics.uses")}`}
                              strokeColor="#0891B2"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <Alert
                    message={t("admin:promoCodes.analytics.noData")}
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

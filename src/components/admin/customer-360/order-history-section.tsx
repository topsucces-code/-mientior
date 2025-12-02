"use client";

import React, { useState } from "react";
import { Card, Table, Space, Tag, Button, Modal, Statistic, Row, Col, Typography } from "antd";
import { 
  ShoppingOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
  InboxOutlined
} from "@ant-design/icons";
import { useTable, useShow } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import Link from "next/link";

const { Text } = Typography;

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  itemsCount: number;
  shippingAddress?: {
    city: string;
    country: string;
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
}

interface OrderHistorySectionProps {
  customerId: string;
}

export function OrderHistorySection({ customerId }: OrderHistorySectionProps) {
  const { t } = useTranslation(["common", "admin"]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch orders for this customer
  const { tableQuery } = useTable<Order>({
    resource: `admin/customers/${customerId}/orders`,
    pagination: {
      pageSize: 5,
    },
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
  });

  // Fetch order details when modal opens
  const { query: orderDetailQuery } = useShow<OrderDetail>({
    resource: "admin/orders",
    id: selectedOrderId || "",
    queryOptions: {
      enabled: !!selectedOrderId,
    },
  });

  const orders = tableQuery.data?.data || [];
  const totalOrders = tableQuery.data?.total || 0;
  const isLoading = tableQuery.isLoading;
  const orderDetail = orderDetailQuery.data?.data;

  // Calculate order metrics
  const orderMetrics = React.useMemo(() => {
    if (!orders.length) return { totalRevenue: 0, averageOrderValue: 0 };
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalRevenue / orders.length;
    
    return { totalRevenue, averageOrderValue };
  }, [orders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      shipped: "cyan",
      delivered: "green",
      cancelled: "red",
      refunded: "purple"
    };
    return colors[status.toLowerCase()] || "default";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setModalVisible(true);
  };

  const columns = [
    {
      title: t("admin:orders.fields.orderNumber"),
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text: string, record: Order) => (
        <Link href={`/admin/orders/show/${record.id}`}>
          <Text strong style={{ color: "#1890ff" }}>{text}</Text>
        </Link>
      ),
    },
    {
      title: t("common.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Text>{dayjs(date).format("MMM D, YYYY")}</Text>
      ),
    },
    {
      title: t("admin:orders.fields.items"),
      dataIndex: "itemsCount",
      key: "itemsCount",
      render: (count: number) => (
        <Space>
          <InboxOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: t("admin:orders.fields.total"),
      dataIndex: "total",
      key: "total",
      render: (amount: number) => (
        <Text strong>{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: t("admin:orders.fields.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(`admin:orders.status.${status.toUpperCase()}`)}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_: unknown, record: Order) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record.id)}
        >
          {t("common.view")}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card 
        title={
          <Space>
            <ShoppingOutlined />
            {t("admin:customers.360.orders.title")}
          </Space>
        }
        extra={
          <Link href={`/admin/orders?customerId=${customerId}`}>
            <Button type="link" size="small">
              {t("admin:customers.360.orders.viewAll")}
            </Button>
          </Link>
        }
        style={{ height: "100%" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Order Metrics */}
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.orders.totalOrders")}
                value={totalOrders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.orders.totalRevenue")}
                value={orderMetrics.totalRevenue}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarOutlined />}
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.orders.averageValue")}
                value={orderMetrics.averageOrderValue}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<CalendarOutlined />}
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
          </Row>

          {/* Orders Table */}
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
        </Space>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={
          <Space>
            <ShoppingOutlined />
            {t("admin:customers.360.orders.orderDetails")}
            {orderDetail && (
              <Tag color="blue">{orderDetail.orderNumber}</Tag>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedOrderId(null);
        }}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            {t("common.close")}
          </Button>,
          orderDetail && (
            <Link key="view" href={`/admin/orders/show/${orderDetail.id}`}>
              <Button type="primary">
                {t("admin:customers.360.orders.viewFullOrder")}
              </Button>
            </Link>
          ),
        ]}
        width={800}
        loading={orderDetailQuery.isLoading}
      >
        {orderDetail && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {/* Order Summary */}
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:orders.fields.orderDate")}</Text>
                  <Text>{dayjs(orderDetail.createdAt).format("MMMM D, YYYY HH:mm")}</Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:orders.fields.status")}</Text>
                  <Tag color={getStatusColor(orderDetail.status)}>
                    {t(`admin:orders.status.${orderDetail.status.toUpperCase()}`)}
                  </Tag>
                </Space>
              </Col>
            </Row>

            {/* Order Items */}
            <div>
              <Text strong>{t("admin:orders.fields.items")}</Text>
              <Table
                dataSource={orderDetail.items}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ marginTop: 8 }}
                columns={[
                  {
                    title: t("admin:orders.fields.product"),
                    dataIndex: "productName",
                    key: "productName",
                  },
                  {
                    title: t("admin:orders.fields.quantity"),
                    dataIndex: "quantity",
                    key: "quantity",
                    width: 80,
                  },
                  {
                    title: t("admin:orders.fields.price"),
                    dataIndex: "price",
                    key: "price",
                    width: 100,
                    render: (price: number) => formatCurrency(price),
                  },
                  {
                    title: t("admin:orders.fields.total"),
                    dataIndex: "total",
                    key: "total",
                    width: 100,
                    render: (total: number) => (
                      <Text strong>{formatCurrency(total)}</Text>
                    ),
                  },
                ]}
              />
            </div>

            {/* Shipping Address */}
            <div>
              <Text strong>{t("admin:orders.fields.shippingAddress")}</Text>
              <div style={{ marginTop: 8, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
                <Text>
                  {orderDetail.shippingAddress.addressLine1}
                  {orderDetail.shippingAddress.addressLine2 && <><br />{orderDetail.shippingAddress.addressLine2}</>}
                  <br />
                  {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} {orderDetail.shippingAddress.postalCode}
                  <br />
                  {orderDetail.shippingAddress.country}
                </Text>
              </div>
            </div>

            {/* Payment & Tracking */}
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:orders.fields.paymentMethod")}</Text>
                  <Text>{orderDetail.paymentMethod}</Text>
                </Space>
              </Col>
              {orderDetail.trackingNumber && (
                <Col span={12}>
                  <Space direction="vertical" size="small">
                    <Text strong>{t("admin:orders.fields.trackingNumber")}</Text>
                    <Text code>{orderDetail.trackingNumber}</Text>
                  </Space>
                </Col>
              )}
            </Row>

            {/* Order Total */}
            <div style={{ textAlign: "right", paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
              <Text strong style={{ fontSize: "18px" }}>
                {t("admin:orders.fields.total")}: {formatCurrency(orderDetail.total)}
              </Text>
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
}
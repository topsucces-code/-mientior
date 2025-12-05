"use client";

import { useShow, useUpdate } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Table, Tag, Timeline, Form, Select, Button, Space, Card } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

export default function OrderShow({ params }: { params: { id: string } }) {
  const { query } = useShow({
    resource: "orders",
    id: params.id,
  });

  const { mutate: updateOrder } = useUpdate();
  const [form] = Form.useForm();

  const { data, isLoading } = query;
  const record = data?.data;

  const handleStatusUpdate = (values: any) => {
    updateOrder({
      resource: "orders",
      id: params.id,
      values: {
        status: values.status,
        paymentStatus: values.paymentStatus,
      },
      successNotification: {
        message: "Order status updated successfully",
        type: "success",
      },
    });
  };

  const itemsColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_: any, record: any) => `$${(record.quantity * record.price).toFixed(2)}`,
    },
    {
      title: "Variant",
      dataIndex: "variant",
      key: "variant",
      render: (variant: any) => {
        if (!variant) return "—";
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        if (variant.sku) parts.push(`SKU: ${variant.sku}`);
        return parts.join(", ") || "—";
      },
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      shipped: "cyan",
      delivered: "green",
      cancelled: "red",
    };
    return colors[status.toLowerCase()] || "default";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      paid: "green",
      failed: "red",
      refunded: "purple",
    };
    return colors[status.toLowerCase()] || "default";
  };

  const timelineItems = [
    {
      color: "green",
      children: (
        <>
          <strong>Order Created</strong>
          <br />
          {record?.createdAt ? new Date(record.createdAt).toLocaleString() : ""}
        </>
      ),
    },
  ];

  if (record?.status?.toLowerCase() === "processing") {
    timelineItems.push({
      color: "blue",
      children: (
        <>
          <strong>Processing</strong>
          <br />
          Order is being prepared
        </>
      ),
    });
  }

  if (record?.status?.toLowerCase() === "shipped") {
    timelineItems.push({
      color: "cyan",
      children: (
        <>
          <strong>Shipped</strong>
          <br />
          In transit
        </>
      ),
    });
  }

  if (record?.status?.toLowerCase() === "delivered") {
    timelineItems.push({
      color: "green",
      children: (
        <>
          <strong>Delivered</strong>
          <br />
          Order successfully delivered
        </>
      ),
    });
  }

  if (record?.status?.toLowerCase() === "cancelled") {
    timelineItems.push({
      color: "red",
      children: (
        <>
          <strong>Cancelled</strong>
          <br />
          Order was cancelled
        </>
      ),
    });
  }

  return (
    <Show isLoading={isLoading}>
      <Descriptions title="Order Details" bordered column={2}>
        <Descriptions.Item label="Order ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="Order Number">{record?.orderNumber}</Descriptions.Item>
        <Descriptions.Item label="User ID">{record?.userId}</Descriptions.Item>
        <Descriptions.Item label="Created">
          {record?.createdAt ? new Date(record.createdAt).toLocaleString() : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(record?.status || "")}>
            {record?.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Payment Status">
          <Tag color={getPaymentStatusColor(record?.paymentStatus || "")}>
            {record?.paymentStatus?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Subtotal">${record?.subtotal?.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Shipping">${record?.shipping?.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Tax">${record?.tax?.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Discount">${record?.discount?.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Total" span={2}>
          <strong style={{ fontSize: "1.2em" }}>${record?.total?.toFixed(2)}</strong>
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label="Notes" span={2}>
            {record.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Order Items</Title>
        <Table
          dataSource={record?.items || []}
          columns={itemsColumns}
          rowKey="productId"
          pagination={false}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <Card title="Shipping Address" size="small">
          {record?.shippingAddress && (
            <>
              <p><strong>{record.shippingAddress.firstName} {record.shippingAddress.lastName}</strong></p>
              <p>{record.shippingAddress.line1}</p>
              {record.shippingAddress.line2 && <p>{record.shippingAddress.line2}</p>}
              <p>{record.shippingAddress.city}, {record.shippingAddress.postalCode}</p>
              <p>{record.shippingAddress.country}</p>
              <p>Phone: {record.shippingAddress.phone}</p>
              {record.shippingAddress.email && <p>Email: {record.shippingAddress.email}</p>}
            </>
          )}
        </Card>

        <Card title="Billing Address" size="small">
          {record?.billingAddress ? (
            <>
              <p><strong>{record.billingAddress.firstName} {record.billingAddress.lastName}</strong></p>
              <p>{record.billingAddress.line1}</p>
              {record.billingAddress.line2 && <p>{record.billingAddress.line2}</p>}
              <p>{record.billingAddress.city}, {record.billingAddress.postalCode}</p>
              <p>{record.billingAddress.country}</p>
              <p>Phone: {record.billingAddress.phone}</p>
              {record.billingAddress.email && <p>Email: {record.billingAddress.email}</p>}
            </>
          ) : (
            <p>Same as shipping address</p>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Order Timeline</Title>
        <Timeline items={timelineItems} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Update Order Status</Title>
        <Form
          form={form}
          layout="inline"
          onFinish={handleStatusUpdate}
          initialValues={{
            status: record?.status?.toUpperCase(),
            paymentStatus: record?.paymentStatus?.toUpperCase(),
          }}
        >
          <Form.Item name="status" label="Order Status">
            <Select style={{ width: 150 }}>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
              <Select.Option value="SHIPPED">Shipped</Select.Option>
              <Select.Option value="DELIVERED">Delivered</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentStatus" label="Payment Status">
            <Select style={{ width: 150 }}>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PAID">Paid</Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
              <Select.Option value="REFUNDED">Refunded</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Status
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Show>
  );
}

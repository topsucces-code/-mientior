"use client";

import { useShow, useUpdate } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
  Typography,
  Descriptions,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Button,
  Space,
  Avatar,
  Rate,
  Upload,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ShopOutlined,
  ShoppingOutlined,
  FileOutlined,
  UploadOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

export default function VendorShow({ params }: { params: { id: string } }) {
  const { query } = useShow({
    resource: "vendors",
    id: params.id,
  });

  const { mutate: updateVendor } = useUpdate();
  const [form] = Form.useForm();
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);

  const { data, isLoading } = query;
  const record = data?.data;

  const handleApprove = () => {
    updateVendor({
      resource: "vendors",
      id: params.id,
      values: { status: "ACTIVE" },
      successNotification: {
        message: "Vendor approved successfully",
        type: "success",
      },
    });
  };

  const handleSuspend = () => {
    Modal.confirm({
      title: "Suspend Vendor",
      content: "Are you sure you want to suspend this vendor?",
      onOk: () => {
        updateVendor({
          resource: "vendors",
          id: params.id,
          values: { status: "SUSPENDED" },
          successNotification: {
            message: "Vendor suspended successfully",
            type: "success",
          },
        });
      },
    });
  };

  const handleProcessPayout = async (values: { amount: number; period: string }) => {
    try {
      const response = await fetch(`/api/vendors/${params.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("Payout processed successfully");
        setPayoutModalVisible(false);
        form.resetFields();
        query.refetch();
      } else {
        message.error("Failed to process payout");
      }
    } catch (error) {
      message.error("Failed to process payout");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      ACTIVE: "green",
      SUSPENDED: "red",
      BANNED: "volcano",
    };
    return colors[status] || "default";
  };

  const getPayoutStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      PAID: "green",
      FAILED: "red",
    };
    return colors[status] || "default";
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      SHIPPED: "cyan",
      DELIVERED: "green",
      CANCELLED: "red",
    };
    return colors[status.toLowerCase()] || "default";
  };

  const documentColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "approved" ? "green" : status === "rejected" ? "red" : "orange"}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Upload Date",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, doc: { url: string }) => (
        <Space>
          <Button size="small" href={doc.url} target="_blank">
            View
          </Button>
          <Button size="small" icon={<CheckOutlined />} type="primary">
            Approve
          </Button>
          <Button size="small" icon={<CloseOutlined />} danger>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images: { url: string }[]) => (
        <Avatar src={images?.[0]?.url} shape="square" size={40} />
      ),
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (name: string, product: { id: string }) => (
        <Link href={`/admin/products/edit/${product.id}`}>
          <a style={{ color: "#1890ff" }}>{name}</a>
        </Link>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "orange"}>{status}</Tag>
      ),
    },
  ];

  interface VendorOrder {
    id: string;
    orderNumber: string;
    createdAt: string;
    userId: string;
    total: number;
    status: string;
  }

  const orderColumns = [
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (orderNumber: string, order: VendorOrder) => (
        <Link href={`/admin/orders/show/${order.id}`}>
          <span style={{ color: "#1890ff" }}>{orderNumber}</span>
        </Link>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Customer",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      title: "Commission",
      key: "commission",
      render: (_: unknown, order: VendorOrder) => {
        const commission = (order.total * (record?.commissionRate || 10)) / 100;
        return `$${commission.toFixed(2)}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>{status?.toUpperCase()}</Tag>
      ),
    },
  ];

  const payoutColumns = [
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getPayoutStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Paid At",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : "—"),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  // Calculate stats
  const totalRevenue = record?.orders?.reduce((sum: number, order: { total: number }) => sum + order.total, 0) || 0;
  const pendingPayouts = record?.payouts
    ?.filter((p: { status: string }) => p.status === "PENDING")
    ?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0;

  return (
    <Show isLoading={isLoading}>
      {/* Header with status and actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Space size="large">
          <Avatar src={record?.logo} size={64} shape="square">
            {record?.businessName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {record?.businessName}
            </Title>
            <Space>
              <Tag color={getStatusColor(record?.status || "")}>
                {record?.status}
              </Tag>
              <Rate disabled value={record?.rating || 0} />
            </Space>
          </div>
        </Space>
        <Space>
          {record?.status === "PENDING" && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApprove}
            >
              Approve
            </Button>
          )}
          {record?.status === "ACTIVE" && (
            <Button danger icon={<CloseOutlined />} onClick={handleSuspend}>
              Suspend
            </Button>
          )}
          <Link href={`/admin/vendors/edit/${params.id}`}>
            <Button icon={<EditOutlined />}>Edit</Button>
          </Link>
          <Button icon={<MailOutlined />}>Message</Button>
          <Button icon={<UserOutlined />}>Impersonate</Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary">Products</Text>
                <Title level={2} style={{ margin: 0 }}>
                  {record?._count?.products || 0}
                </Title>
              </div>
              <ShopOutlined style={{ fontSize: 40, color: "#1890ff" }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary">Orders</Text>
                <Title level={2} style={{ margin: 0 }}>
                  {record?._count?.orders || 0}
                </Title>
              </div>
              <ShoppingOutlined style={{ fontSize: 40, color: "#52c41a" }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary">Total Revenue</Text>
                <Title level={2} style={{ margin: 0 }}>
                  ${totalRevenue.toFixed(2)}
                </Title>
              </div>
              <DollarOutlined style={{ fontSize: 40, color: "#faad14" }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary">Commission Due</Text>
                <Title level={2} style={{ margin: 0 }}>
                  ${pendingPayouts.toFixed(2)}
                </Title>
              </div>
              <FileOutlined style={{ fontSize: 40, color: "#f5222d" }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Vendor Details */}
      <Descriptions title="Vendor Details" bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Business Name">{record?.businessName}</Descriptions.Item>
        <Descriptions.Item label="Email">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{record?.phone || "—"}</Descriptions.Item>
        <Descriptions.Item label="Commission Rate">{record?.commissionRate}%</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(record?.status || "")}>{record?.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Rating">
          <Rate disabled value={record?.rating || 0} />
        </Descriptions.Item>
        <Descriptions.Item label="Joined">
          {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : "—"}
        </Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label="Description" span={2}>
            <Paragraph>{record.description}</Paragraph>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Documents */}
      <Card title="Documents" style={{ marginBottom: 24 }}>
        <Table
          dataSource={record?.documents || []}
          columns={documentColumns}
          rowKey="type"
          pagination={false}
          locale={{ emptyText: "No documents uploaded" }}
        />
        <Upload style={{ marginTop: 16 }}>
          <Button icon={<UploadOutlined />}>Upload Document</Button>
        </Upload>
      </Card>

      {/* Products */}
      <Card title="Products" style={{ marginBottom: 24 }}>
        <Table
          dataSource={record?.products || []}
          columns={productColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Orders */}
      <Card title="Orders" style={{ marginBottom: 24 }}>
        <Table
          dataSource={record?.orders || []}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Payouts */}
      <Card
        title="Payouts"
        extra={
          <Button
            type="primary"
            onClick={() => setPayoutModalVisible(true)}
          >
            Process Payout
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={record?.payouts || []}
          columns={payoutColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Internal Notes */}
      <Card
        title="Internal Notes (Admin Only)"
        extra={
          <Button onClick={() => setNotesModalVisible(true)}>
            Add Note
          </Button>
        }
      >
        <Paragraph>{record?.notes || "No notes added yet."}</Paragraph>
      </Card>

      {/* Payout Modal */}
      <Modal
        title="Process Payout"
        open={payoutModalVisible}
        onCancel={() => setPayoutModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleProcessPayout}>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              prefix="$"
              style={{ width: "100%" }}
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="period"
            label="Period"
            rules={[{ required: true, message: "Please enter period" }]}
          >
            <Input placeholder="e.g. January 2024" />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
}

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
  Progress,
  Statistic,
  Tabs,
  Select,
  DatePicker,
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
  DownloadOutlined,
  LineChartOutlined,
  StarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useState, use, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { DocumentUploader, VendorDocument } from "@/components/admin/document-uploader";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorShow({ params }: PageProps) {
  const { id } = use(params);
  const { t } = useTranslation(["admin", "common"]);
  const { query } = useShow({
    resource: "vendors",
    id,
  });

  const { mutate: updateVendor } = useUpdate();
  const [form] = Form.useForm();
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState<string>("all");

  const { data, isLoading } = query;
  const record = data?.data;
  const [documentFilter, setDocumentFilter] = useState<string>("all");

  // Remove duplicate declaration
  const handleApprove = () => {
    updateVendor({
      resource: "vendors",
      id,
      values: { status: "ACTIVE" },
      successNotification: {
        message: t("admin:vendors.messages.approveSuccess"),
        type: "success",
      },
    });
  };

  const handleSuspend = () => {
    Modal.confirm({
      title: t("admin:vendors.actions.suspend"),
      content: t("admin:vendors.messages.suspendConfirm"),
      onOk: () => {
        updateVendor({
          resource: "vendors",
          id,
          values: { status: "SUSPENDED" },
          successNotification: {
            message: t("admin:vendors.messages.suspendSuccess"),
            type: "success",
          },
        });
      },
    });
  };

  const handleProcessPayout = async (values: { amount: number; period: string }) => {
    try {
      const response = await fetch(`/api/vendors/${id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(t("admin:vendors.messages.payoutSuccess"));
        setPayoutModalVisible(false);
        form.resetFields();
        query.refetch();
      } else {
        message.error(t("admin:vendors.messages.payoutError"));
      }
    } catch (error) {
      message.error(t("admin:vendors.messages.payoutError"));
    }
  };

  // Handle document updates
  const handleDocumentsChange = async (documents: VendorDocument[]) => {
    try {
      await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      });
      query.refetch();
    } catch (error) {
      message.error(t("admin:vendors.messages.updateError"));
    }
  };

  // Export payouts to CSV
  const handleExportPayouts = () => {
    const payouts = record?.payouts || [];
    const csv = [
      ["Period", "Amount", "Status", "Paid At", "Created At"].join(","),
      ...payouts.map((p: any) =>
        [
          p.period,
          p.amount,
          p.status,
          p.paidAt || "",
          new Date(p.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-${id}-payouts.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!record) return null;

    const orders = record.orders || [];
    const products = record.products || [];
    const reviews = products.flatMap((p: any) => p.reviews || []);

    const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    // Monthly sales data for chart
    const monthlySales: Record<string, number> = {};
    orders.forEach((order: any) => {
      const month = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthlySales[month] = (monthlySales[month] || 0) + (order.total || 0);
    });

    // Top products
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    orders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        const pid = item.productId;
        if (!productSales[pid]) {
          productSales[pid] = { name: item.productName || "Unknown", sales: 0, revenue: 0 };
        }
        productSales[pid].sales += item.quantity;
        productSales[pid].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales,
      avgOrderValue,
      avgRating,
      reviewCount: reviews.length,
      monthlySales,
      topProducts,
      conversionRate: products.length > 0 ? (orders.length / products.length) * 100 : 0,
    };
  }, [record]);

  // Filter payouts
  const filteredPayouts = useMemo(() => {
    const payouts = record?.payouts || [];
    if (payoutFilter === "all") return payouts;
    return payouts.filter((p: any) => p.status === payoutFilter);
  }, [record?.payouts, payoutFilter]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    const docs = record?.documents || [];
    if (documentFilter === "all") return docs;
    return docs.filter((d: any) => d.status === documentFilter);
  }, [record?.documents, documentFilter]);

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
          <Link href={`/admin/vendors/edit/${id}`}>
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

      {/* Documents - Enhanced */}
      <Card
        title={t("admin:vendors.sections.documents")}
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Select
              value={documentFilter}
              onChange={setDocumentFilter}
              style={{ width: 120 }}
            >
              <Select.Option value="all">{t("common:labels.all")}</Select.Option>
              <Select.Option value="PENDING">{t("admin:vendors.status.PENDING")}</Select.Option>
              <Select.Option value="APPROVED">{t("admin:vendors.status.APPROVED")}</Select.Option>
              <Select.Option value="REJECTED">{t("admin:vendors.status.REJECTED")}</Select.Option>
            </Select>
          </Space>
        }
      >
        <DocumentUploader
          documents={filteredDocuments}
          onChange={handleDocumentsChange}
          showActions={true}
          readOnly={false}
        />
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

      {/* Payouts - Enhanced */}
      <Card
        title={t("admin:vendors.sections.payouts")}
        extra={
          <Space>
            <Select
              value={payoutFilter}
              onChange={setPayoutFilter}
              style={{ width: 120 }}
            >
              <Select.Option value="all">{t("common:labels.all")}</Select.Option>
              <Select.Option value="PENDING">{t("admin:vendors.status.PENDING")}</Select.Option>
              <Select.Option value="PROCESSING">{t("admin:vendors.status.PROCESSING")}</Select.Option>
              <Select.Option value="PAID">{t("admin:vendors.status.PAID")}</Select.Option>
              <Select.Option value="FAILED">{t("admin:vendors.status.FAILED")}</Select.Option>
            </Select>
            <Button icon={<DownloadOutlined />} onClick={handleExportPayouts}>
              {t("common:buttons.export")}
            </Button>
            <Button
              type="primary"
              onClick={() => setPayoutModalVisible(true)}
            >
              {t("admin:vendors.actions.processPayout")}
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={filteredPayouts}
          columns={payoutColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Performance Section - NEW */}
      {performanceMetrics && (
        <Card
          title={
            <Space>
              <LineChartOutlined />
              {t("admin:vendors.sections.performance")}
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic
                title={t("admin:vendors.metrics.totalSales")}
                value={performanceMetrics.totalSales}
                precision={2}
                prefix="$"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t("admin:vendors.metrics.avgOrderValue")}
                value={performanceMetrics.avgOrderValue}
                precision={2}
                prefix="$"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t("admin:vendors.metrics.avgRating")}
                value={performanceMetrics.avgRating}
                precision={1}
                suffix={`/ 5 (${performanceMetrics.reviewCount} ${t("admin:vendors.metrics.reviews")})`}
                prefix={<StarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t("admin:vendors.metrics.conversionRate")}
                value={performanceMetrics.conversionRate}
                precision={1}
                suffix="%"
              />
            </Col>
          </Row>

          <Tabs
            items={[
              {
                key: "topProducts",
                label: t("admin:vendors.tabs.topProducts"),
                children: (
                  <Table
                    dataSource={performanceMetrics.topProducts}
                    columns={[
                      {
                        title: t("admin:vendors.fields.product"),
                        dataIndex: "name",
                        key: "name",
                      },
                      {
                        title: t("admin:vendors.fields.sales"),
                        dataIndex: "sales",
                        key: "sales",
                      },
                      {
                        title: t("admin:vendors.fields.revenue"),
                        dataIndex: "revenue",
                        key: "revenue",
                        render: (v: number) => `$${v.toFixed(2)}`,
                      },
                    ]}
                    rowKey="name"
                    pagination={false}
                    size="small"
                  />
                ),
              },
              {
                key: "monthlySales",
                label: t("admin:vendors.tabs.monthlySales"),
                children: (
                  <div className="space-y-2">
                    {Object.entries(performanceMetrics.monthlySales).map(([month, amount]) => (
                      <div key={month} className="flex items-center gap-4">
                        <span className="w-24">{month}</span>
                        <Progress
                          percent={Math.min(
                            100,
                            (amount / Math.max(...Object.values(performanceMetrics.monthlySales))) * 100
                          )}
                          format={() => `$${amount.toFixed(2)}`}
                          strokeColor="#0891B2"
                        />
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

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

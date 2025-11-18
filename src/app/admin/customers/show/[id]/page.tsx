"use client";

import { useShow, useTable, useUpdate } from "@refinedev/core";
import {
  Typography,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Space,
  Button,
  Table,
  Rate,
  Timeline,
  Input,
  Modal,
  Form,
  message,
  Statistic,
  Badge,
  Progress,
  Select,
} from "antd";
import { use } from "react";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  ShoppingOutlined,
  HeartOutlined,
  StarOutlined,
  HomeOutlined,
  TagOutlined,
  EditOutlined,
  GiftOutlined,
  LockOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
  lastLogin?: string;
  createdAt: string;
  addresses?: Address[];
  tags?: string[];
  notes?: string;
}

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  items: number;
}

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  addedAt: string;
}

interface Review {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export default function CustomerShow({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation(["common", "admin"]);
  const { id } = use(params);
  const { query } = useShow<Customer>({
    resource: "users",
    id: id,
  });

  const { mutate: updateCustomer } = useUpdate();
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const customer = query.data?.data;
  const isLoading = query.isLoading;

  // Fetch orders
  const ordersResult = useTable({
    resource: "orders",
    filters: {
      permanent: [
        {
          field: "userId",
          operator: "eq",
          value: id,
        },
      ],
    },
  });

  const orders = (ordersResult.tableQuery?.data?.data || []) as Order[];

  // Mock data for demonstration (replace with actual API calls)
  const wishlist: WishlistItem[] = [];
  const reviews: Review[] = [];
  const addresses: Address[] = customer?.addresses || [];

  // Calculate stats
  const stats = useMemo(() => {
    if (!customer) return null;

    const totalOrders = customer.totalOrders || 0;
    const totalSpent = customer.totalSpent || 0;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const ltv = totalSpent; // Simplified LTV calculation

    // Loyalty progress
    const loyaltyLevels: Record<string, { current: number; next: number | null; nextLevel: string | null }> = {
      BRONZE: { current: 0, next: 1000, nextLevel: "SILVER" },
      SILVER: { current: 1000, next: 2500, nextLevel: "GOLD" },
      GOLD: { current: 2500, next: 5000, nextLevel: "PLATINUM" },
      PLATINUM: { current: 5000, next: null, nextLevel: null },
    };

    const currentLevel = loyaltyLevels[customer.loyaltyLevel];
    
    if (!currentLevel) {
      return null;
    }

    const progress = currentLevel.next
      ? ((customer.loyaltyPoints - currentLevel.current) /
          (currentLevel.next - currentLevel.current)) *
        100
      : 100;

    return {
      totalOrders,
      totalSpent,
      avgOrderValue,
      ltv,
      loyaltyProgress: Math.min(progress, 100),
      nextLevel: currentLevel.nextLevel,
      pointsToNext: currentLevel.next
        ? currentLevel.next - customer.loyaltyPoints
        : 0,
    };
  }, [customer]);

  const getLoyaltyColor = (level: string) => {
    const colors: Record<string, string> = {
      BRONZE: "#CD7F32",
      SILVER: "#C0C0C0",
      GOLD: "#FFD700",
      PLATINUM: "#E5E4E2",
    };
    return colors[level] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      shipped: "cyan",
      delivered: "green",
      cancelled: "red",
      approved: "green",
      rejected: "red",
    };
    return colors[status] || "default";
  };

  const orderColumns = [
    {
      title: t("admin:orders.fields.orderNumber"),
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text: string, record: Order) => (
        <Link href={`/admin/orders/show/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: t("common.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: t("admin:orders.fields.items"),
      dataIndex: "items",
      key: "items",
    },
    {
      title: t("admin:orders.fields.total"),
      dataIndex: "total",
      key: "total",
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: t("admin:orders.fields.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
  ];

  const reviewColumns = [
    {
      title: t("admin:reviews.fields.product"),
      dataIndex: "productName",
      key: "productName",
      render: (text: string, record: Review) => (
        <Link href={`/admin/products/show/${record.productId}`}>{text}</Link>
      ),
    },
    {
      title: t("admin:reviews.fields.rating"),
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => <Rate disabled value={rating} />,
    },
    {
      title: t("admin:reviews.fields.comment"),
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
    {
      title: t("common.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: t("admin:reviews.fields.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: (_: unknown, record: Review) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => message.success("Review approved")}
              >
                {t("common.approve")}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => message.success("Review rejected")}
              >
                {t("common.reject")}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleAddPoints = () => {
    form.validateFields().then((values) => {
      updateCustomer({
        resource: "users",
        id: id,
        values: {
          loyaltyPoints: (customer?.loyaltyPoints || 0) + values.points,
        },
        successNotification: {
          message: t("admin:customers.messages.pointsAdded"),
          type: "success",
        },
      });
      setPointsModalVisible(false);
      form.resetFields();
    });
  };

  const handleChangeLevel = (newLevel: string) => {
    Modal.confirm({
      title: t("admin:customers.actions.changeLevel"),
      content: t("admin:customers.messages.changeLevelConfirm", {
        level: newLevel,
      }),
      onOk: () => {
        updateCustomer({
          resource: "users",
          id: id,
          values: { loyaltyLevel: newLevel },
          successNotification: {
            message: t("admin:customers.messages.levelChanged"),
            type: "success",
          },
        });
      },
    });
  };

  const handleSaveNotes = () => {
    form.validateFields().then((values) => {
      updateCustomer({
        resource: "users",
        id: id,
        values: { notes: values.notes },
        successNotification: {
          message: t("common.savedSuccessfully"),
          type: "success",
        },
      });
      setNotesModalVisible(false);
    });
  };

  const handleSaveTags = () => {
    form.validateFields().then((values) => {
      updateCustomer({
        resource: "users",
        id: id,
        values: { tags: values.tags },
        successNotification: {
          message: t("common.savedSuccessfully"),
          type: "success",
        },
      });
      setTagsModalVisible(false);
    });
  };

  if (isLoading || !customer) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Avatar
              src={customer.avatar}
              icon={<UserOutlined />}
              size={80}
            />
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0 }}>
                {customer.firstName && customer.lastName
                  ? `${customer.firstName} ${customer.lastName}`
                  : customer.email}
              </Title>
              <Space>
                <Text>
                  <MailOutlined /> {customer.email}
                  {customer.emailVerified && (
                    <CheckCircleOutlined
                      style={{ color: "#52c41a", marginLeft: 4 }}
                    />
                  )}
                </Text>
                {customer.phone && (
                  <Text>
                    <PhoneOutlined /> {customer.phone}
                  </Text>
                )}
              </Space>
              <Space>
                <Tag
                  color={getLoyaltyColor(customer.loyaltyLevel)}
                  icon={<TrophyOutlined />}
                >
                  {customer.loyaltyLevel}
                </Tag>
                <Badge
                  count={customer.loyaltyPoints}
                  showZero
                  style={{ backgroundColor: "#52c41a" }}
                />
                {stats?.nextLevel && (
                  <Text type="secondary">
                    {stats.pointsToNext} points to {stats.nextLevel}
                  </Text>
                )}
              </Space>
              <Space>
                <Text type="secondary">
                  {t("admin:customers.fields.memberSince")}:{" "}
                  {dayjs(customer.createdAt).format("MMM D, YYYY")}
                </Text>
                {customer.lastLogin && (
                  <Text type="secondary">
                    {t("admin:customers.fields.lastLogin")}:{" "}
                    {dayjs(customer.lastLogin).format("MMM D, YYYY")}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical">
              <Button icon={<EditOutlined />} block>
                {t("common.edit")}
              </Button>
              <Button icon={<MailOutlined />} block>
                {t("common.sendEmail")}
              </Button>
              <Button
                icon={<GiftOutlined />}
                block
                onClick={() => setPointsModalVisible(true)}
              >
                {t("admin:customers.actions.addPoints")}
              </Button>
              <Button
                icon={<TrophyOutlined />}
                block
                onClick={() =>
                  Modal.confirm({
                    title: t("admin:customers.actions.changeLevel"),
                    content: (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Button
                          block
                          onClick={() => handleChangeLevel("BRONZE")}
                        >
                          Bronze
                        </Button>
                        <Button
                          block
                          onClick={() => handleChangeLevel("SILVER")}
                        >
                          Silver
                        </Button>
                        <Button block onClick={() => handleChangeLevel("GOLD")}>
                          Gold
                        </Button>
                        <Button
                          block
                          onClick={() => handleChangeLevel("PLATINUM")}
                        >
                          Platinum
                        </Button>
                      </Space>
                    ),
                  })
                }
              >
                {t("admin:customers.actions.changeLevel")}
              </Button>
              <Button icon={<LockOutlined />} block danger>
                {t("admin:customers.actions.resetPassword")}
              </Button>
              <Button icon={<DeleteOutlined />} block danger>
                {t("common.delete")}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Loyalty Progress */}
        {stats?.nextLevel && (
          <div style={{ marginTop: 16 }}>
            <Text strong>
              {t("admin:customers.fields.loyaltyProgress")}
            </Text>
            <Progress
              percent={stats.loyaltyProgress}
              status="active"
              strokeColor={getLoyaltyColor(customer.loyaltyLevel)}
            />
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.totalOrders")}
              value={stats?.totalOrders}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.totalSpent")}
              value={stats?.totalSpent}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.avgOrderValue")}
              value={stats?.avgOrderValue}
              prefix={<ShoppingOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("admin:customers.stats.ltv")}
              value={stats?.ltv}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          {/* Orders */}
          <Card
            title={
              <Space>
                <ShoppingOutlined />
                {t("admin:customers.sections.orders")}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={orderColumns}
              dataSource={orders}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>

          {/* Wishlist */}
          <Card
            title={
              <Space>
                <HeartOutlined />
                {t("admin:customers.sections.wishlist")}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {wishlist.length === 0 ? (
              <Text type="secondary">{t("admin:customers.emptyWishlist")}</Text>
            ) : (
              <Row gutter={16}>
                {wishlist.map((item) => (
                  <Col key={item.id} xs={12} sm={8} md={6}>
                    <Card
                      hoverable
                      cover={
                        <Image
                          alt={item.productName}
                          src={item.productImage || "/placeholder.png"}
                          width={200}
                          height={200}
                          style={{ objectFit: "cover" }}
                        />
                      }
                    >
                      <Card.Meta
                        title={item.productName}
                        description={`$${item.price.toFixed(2)}`}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          {/* Reviews */}
          <Card
            title={
              <Space>
                <StarOutlined />
                {t("admin:customers.sections.reviews")}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {reviews.length === 0 ? (
              <Text type="secondary">{t("admin:customers.emptyReviews")}</Text>
            ) : (
              <Table
                columns={reviewColumns}
                dataSource={reviews}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Addresses */}
          <Card
            title={
              <Space>
                <HomeOutlined />
                {t("admin:customers.sections.addresses")}
              </Space>
            }
            extra={
              <Button type="link" size="small" icon={<PlusOutlined />}>
                {t("common.add")}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            {addresses.length === 0 ? (
              <Text type="secondary">{t("admin:customers.emptyAddresses")}</Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    size="small"
                    extra={
                      address.isDefault && (
                        <Tag color="green">{t("common.default")}</Tag>
                      )
                    }
                  >
                    <Paragraph style={{ margin: 0, fontSize: 12 }}>
                      {address.addressLine1}
                      {address.addressLine2 && <br />}
                      {address.addressLine2}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                    </Paragraph>
                    <Space style={{ marginTop: 8 }}>
                      <Button type="link" size="small">
                        {t("common.edit")}
                      </Button>
                      {!address.isDefault && (
                        <Button type="link" size="small">
                          {t("common.setDefault")}
                        </Button>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>

          {/* Tags */}
          <Card
            title={
              <Space>
                <TagOutlined />
                {t("admin:customers.sections.tags")}
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({ tags: customer.tags || [] });
                  setTagsModalVisible(true);
                }}
              >
                {t("common.edit")}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Space wrap>
              {(customer.tags || []).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {(!customer.tags || customer.tags.length === 0) && (
                <Text type="secondary">{t("admin:customers.emptyTags")}</Text>
              )}
            </Space>
          </Card>

          {/* Notes */}
          <Card
            title={t("admin:customers.sections.notes")}
            extra={
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({ notes: customer.notes || "" });
                  setNotesModalVisible(true);
                }}
              >
                {t("common.edit")}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {customer.notes || (
                <Text type="secondary">{t("admin:customers.emptyNotes")}</Text>
              )}
            </Paragraph>
          </Card>

          {/* Activity Timeline */}
          <Card
            title={t("admin:customers.sections.activity")}
            style={{ marginBottom: 16 }}
          >
            <Timeline
              items={[
                {
                  children: `${t("admin:customers.activity.registered")} ${dayjs(
                    customer.createdAt
                  ).format("MMM D, YYYY")}`,
                  color: "green",
                },
                ...(customer.lastLogin
                  ? [
                      {
                        children: `${t(
                          "admin:customers.activity.lastLogin"
                        )} ${dayjs(customer.lastLogin).format("MMM D, YYYY")}`,
                        color: "blue",
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <Modal
        title={t("admin:customers.actions.addPoints")}
        open={pointsModalVisible}
        onOk={handleAddPoints}
        onCancel={() => {
          setPointsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:customers.fields.points")}
            name="points"
            rules={[{ required: true }, { type: "number", min: 1 }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item label={t("admin:customers.fields.reason")} name="reason">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("admin:customers.sections.notes")}
        open={notesModalVisible}
        onOk={handleSaveNotes}
        onCancel={() => setNotesModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t("admin:customers.fields.notes")} name="notes">
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t("admin:customers.sections.tags")}
        open={tagsModalVisible}
        onOk={handleSaveTags}
        onCancel={() => setTagsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t("admin:customers.fields.tags")} name="tags">
            <Select mode="tags" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

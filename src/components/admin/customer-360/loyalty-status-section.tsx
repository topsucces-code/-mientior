"use client";

import React from "react";
import { Card, Space, Tag, Progress, Typography, Row, Col, Statistic, Alert, Table } from "antd";
import { 
  TrophyOutlined,
  GiftOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  StarOutlined
} from "@ant-design/icons";
import { useShow } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface LoyaltyData {
  tier: string;
  pointsBalance: number;
  lifetimePoints: number;
  referralCode: string;
  referralCount: number;
  recentTransactions: Array<{
    id: string;
    type: 'earned' | 'redeemed' | 'expired';
    points: number;
    description: string;
    createdAt: string;
  }>;
  tierProgress: {
    current: number;
    next: number | null;
    nextTier: string | null;
    pointsToNext: number;
    progressPercent: number;
  };
  expiringPoints: {
    amount: number;
    expiryDate: string;
  } | null;
}

interface LoyaltyStatusSectionProps {
  customerId: string;
}

export function LoyaltyStatusSection({ customerId }: LoyaltyStatusSectionProps) {
  const { t } = useTranslation(["common", "admin"]);

  const { query } = useShow<LoyaltyData>({
    resource: `admin/customers/${customerId}/loyalty`,
    id: customerId,
  });

  const loyaltyData = query.data?.data;
  const isLoading = query.isLoading;

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: "#CD7F32",
      SILVER: "#C0C0C0", 
      GOLD: "#FFD700",
      PLATINUM: "#E5E4E2"
    };
    return colors[tier.toUpperCase()] || "#1890ff";
  };

  const getTierIcon = (tier: string) => {
    return <TrophyOutlined style={{ color: getTierColor(tier) }} />;
  };

  const getTransactionColor = (type: string) => {
    const colors = {
      earned: "green",
      redeemed: "blue", 
      expired: "red"
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const getTransactionIcon = (type: string) => {
    const icons = {
      earned: <GiftOutlined style={{ color: "#52c41a" }} />,
      redeemed: <StarOutlined style={{ color: "#1890ff" }} />,
      expired: <ClockCircleOutlined style={{ color: "#f5222d" }} />
    };
    return icons[type as keyof typeof icons] || <GiftOutlined />;
  };

  const transactionColumns = [
    {
      title: t("admin:customers.360.loyalty.transactions.type"),
      dataIndex: "type",
      key: "type",
      width: 80,
      render: (type: string) => (
        <Space>
          {getTransactionIcon(type)}
          <Tag color={getTransactionColor(type)} size="small">
            {t(`admin:customers.360.loyalty.transactions.${type}`)}
          </Tag>
        </Space>
      ),
    },
    {
      title: t("admin:customers.360.loyalty.transactions.points"),
      dataIndex: "points",
      key: "points",
      width: 80,
      render: (points: number, record: { type: string }) => (
        <Text 
          strong 
          style={{ 
            color: record.type === 'earned' ? '#52c41a' : 
                   record.type === 'redeemed' ? '#1890ff' : '#f5222d' 
          }}
        >
          {record.type === 'earned' ? '+' : '-'}{Math.abs(points)}
        </Text>
      ),
    },
    {
      title: t("admin:customers.360.loyalty.transactions.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("common.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (date: string) => (
        <Text style={{ fontSize: "12px" }}>
          {dayjs(date).format("MMM D")}
        </Text>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card 
        title={
          <Space>
            <TrophyOutlined />
            {t("admin:customers.360.loyalty.title")}
          </Space>
        }
        loading={true}
        style={{ height: "100%" }}
      />
    );
  }

  if (!loyaltyData) {
    return (
      <Card 
        title={
          <Space>
            <TrophyOutlined />
            {t("admin:customers.360.loyalty.title")}
          </Space>
        }
        style={{ height: "100%" }}
      >
        <Text type="secondary">{t("admin:customers.360.loyalty.notEnrolled")}</Text>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <TrophyOutlined />
          {t("admin:customers.360.loyalty.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Current Tier and Points */}
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              {getTierIcon(loyaltyData.tier)}
              <Tag color={getTierColor(loyaltyData.tier)} style={{ fontSize: "14px", padding: "4px 8px" }}>
                {loyaltyData.tier}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Statistic
              value={loyaltyData.pointsBalance}
              suffix={t("admin:customers.360.loyalty.points")}
              valueStyle={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}
            />
          </Col>
        </Row>

        {/* Tier Progress */}
        {loyaltyData.tierProgress.nextTier && (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Row justify="space-between">
              <Col>
                <Text strong style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.loyalty.progressTo")} {loyaltyData.tierProgress.nextTier}
                </Text>
              </Col>
              <Col>
                <Text style={{ fontSize: "12px", color: "#666" }}>
                  {loyaltyData.tierProgress.pointsToNext} {t("admin:customers.360.loyalty.pointsNeeded")}
                </Text>
              </Col>
            </Row>
            <Progress
              percent={loyaltyData.tierProgress.progressPercent}
              strokeColor={getTierColor(loyaltyData.tierProgress.nextTier)}
              size="small"
              showInfo={false}
            />
          </Space>
        )}

        {/* Expiring Points Warning */}
        {loyaltyData.expiringPoints && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={
              <Text style={{ fontSize: "12px" }}>
                {loyaltyData.expiringPoints.amount} {t("admin:customers.360.loyalty.pointsExpiring")} {dayjs(loyaltyData.expiringPoints.expiryDate).format("MMM D, YYYY")}
              </Text>
            }
          />
        )}

        {/* Loyalty Stats */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={t("admin:customers.360.loyalty.lifetimePoints")}
              value={loyaltyData.lifetimePoints}
              valueStyle={{ fontSize: "14px" }}
              prefix={<StarOutlined style={{ color: "#faad14" }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t("admin:customers.360.loyalty.referrals")}
              value={loyaltyData.referralCount}
              valueStyle={{ fontSize: "14px" }}
              prefix={<UserAddOutlined style={{ color: "#52c41a" }} />}
            />
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text strong style={{ fontSize: "12px" }}>
                {t("admin:customers.360.loyalty.referralCode")}
              </Text>
              <Text code style={{ fontSize: "11px" }}>
                {loyaltyData.referralCode}
              </Text>
            </Space>
          </Col>
        </Row>

        {/* Recent Transactions */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong style={{ fontSize: "12px" }}>
            {t("admin:customers.360.loyalty.recentTransactions")}
          </Text>
          <Table
            dataSource={loyaltyData.recentTransactions}
            columns={transactionColumns}
            rowKey="id"
            pagination={false}
            size="small"
            style={{ fontSize: "11px" }}
            scroll={{ x: 400 }}
          />
        </Space>
      </Space>
    </Card>
  );
}
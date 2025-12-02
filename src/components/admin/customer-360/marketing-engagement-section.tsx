"use client";

import React from "react";
import { Card, Space, Switch, Typography, Row, Col, Statistic, Tag, Table, Progress } from "antd";
import { 
  MailOutlined,
  MessageOutlined,
  BellOutlined,
  EyeOutlined,
  LinkOutlined,
  TeamOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { useShow } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text } = Typography;

interface MarketingData {
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushOptIn: boolean;
  campaigns: Array<{
    id: string;
    name: string;
    type: 'email' | 'sms' | 'push';
    sentAt: string;
    opened: boolean;
    clicked: boolean;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
  }>;
  openRate: number;
  clickRate: number;
  lastEmailOpened?: string;
  lastCampaignClicked?: string;
  segments: Array<{
    id: string;
    name: string;
    assignedAt: string;
    isAutomatic: boolean;
  }>;
  engagementScore: number;
}

interface MarketingEngagementSectionProps {
  customerId: string;
}

export function MarketingEngagementSection({ customerId }: MarketingEngagementSectionProps) {
  const { t } = useTranslation(["common", "admin"]);

  const { query } = useShow<MarketingData>({
    resource: `admin/customers/${customerId}/marketing`,
    id: customerId,
  });

  const marketingData = query.data?.data;
  const isLoading = query.isLoading;

  const getCampaignTypeIcon = (type: string) => {
    const icons = {
      email: <MailOutlined style={{ color: "#1890ff" }} />,
      sms: <MessageOutlined style={{ color: "#52c41a" }} />,
      push: <BellOutlined style={{ color: "#faad14" }} />
    };
    return icons[type as keyof typeof icons] || <MailOutlined />;
  };

  const getCampaignStatusColor = (status: string) => {
    const colors = {
      sent: "blue",
      delivered: "cyan",
      opened: "green",
      clicked: "purple",
      bounced: "red"
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "#52c41a"; // Green
    if (score >= 60) return "#faad14"; // Orange
    if (score >= 40) return "#fa8c16"; // Dark Orange
    return "#f5222d"; // Red
  };

  const campaignColumns = [
    {
      title: t("admin:customers.360.marketing.campaigns.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name: string, record: { type: string }) => (
        <Space>
          {getCampaignTypeIcon(record.type)}
          <Text style={{ fontSize: "12px" }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: t("admin:customers.360.marketing.campaigns.sent"),
      dataIndex: "sentAt",
      key: "sentAt",
      width: 80,
      render: (date: string) => (
        <Text style={{ fontSize: "11px" }}>
          {dayjs(date).format("MMM D")}
        </Text>
      ),
    },
    {
      title: t("admin:customers.360.marketing.campaigns.status"),
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string, record: { opened: boolean; clicked: boolean }) => (
        <Space direction="vertical" size="small">
          <Tag color={getCampaignStatusColor(status)} size="small">
            {t(`admin:customers.360.marketing.campaigns.${status}`)}
          </Tag>
          <Space size="small">
            {record.opened && (
              <EyeOutlined style={{ color: "#52c41a", fontSize: "10px" }} />
            )}
            {record.clicked && (
              <LinkOutlined style={{ color: "#1890ff", fontSize: "10px" }} />
            )}
          </Space>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card 
        title={
          <Space>
            <MailOutlined />
            {t("admin:customers.360.marketing.title")}
          </Space>
        }
        loading={true}
        style={{ height: "100%" }}
      />
    );
  }

  if (!marketingData) {
    return (
      <Card 
        title={
          <Space>
            <MailOutlined />
            {t("admin:customers.360.marketing.title")}
          </Space>
        }
        style={{ height: "100%" }}
      >
        <Text type="secondary">{t("admin:customers.360.marketing.noData")}</Text>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <MailOutlined />
          {t("admin:customers.360.marketing.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Opt-in Status */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong style={{ fontSize: "12px" }}>
            {t("admin:customers.360.marketing.preferences")}
          </Text>
          
          <Row gutter={16}>
            <Col span={8}>
              <Space direction="vertical" size="small" style={{ textAlign: "center", width: "100%" }}>
                <MailOutlined style={{ fontSize: "16px", color: marketingData.emailOptIn ? "#52c41a" : "#d9d9d9" }} />
                <Switch 
                  size="small" 
                  checked={marketingData.emailOptIn} 
                  disabled 
                />
                <Text style={{ fontSize: "10px" }}>
                  {t("admin:customers.360.marketing.email")}
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size="small" style={{ textAlign: "center", width: "100%" }}>
                <MessageOutlined style={{ fontSize: "16px", color: marketingData.smsOptIn ? "#52c41a" : "#d9d9d9" }} />
                <Switch 
                  size="small" 
                  checked={marketingData.smsOptIn} 
                  disabled 
                />
                <Text style={{ fontSize: "10px" }}>
                  {t("admin:customers.360.marketing.sms")}
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size="small" style={{ textAlign: "center", width: "100%" }}>
                <BellOutlined style={{ fontSize: "16px", color: marketingData.pushOptIn ? "#52c41a" : "#d9d9d9" }} />
                <Switch 
                  size="small" 
                  checked={marketingData.pushOptIn} 
                  disabled 
                />
                <Text style={{ fontSize: "10px" }}>
                  {t("admin:customers.360.marketing.push")}
                </Text>
              </Space>
            </Col>
          </Row>
        </Space>

        {/* Engagement Metrics */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={t("admin:customers.360.marketing.openRate")}
              value={marketingData.openRate}
              suffix="%"
              valueStyle={{ fontSize: "14px", color: "#1890ff" }}
              prefix={<EyeOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t("admin:customers.360.marketing.clickRate")}
              value={marketingData.clickRate}
              suffix="%"
              valueStyle={{ fontSize: "14px", color: "#52c41a" }}
              prefix={<LinkOutlined />}
            />
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small">
              <Text strong style={{ fontSize: "12px" }}>
                {t("admin:customers.360.marketing.engagement")}
              </Text>
              <Progress
                percent={marketingData.engagementScore}
                size="small"
                strokeColor={getEngagementColor(marketingData.engagementScore)}
                format={(percent) => (
                  <span style={{ fontSize: "10px" }}>{percent}%</span>
                )}
              />
            </Space>
          </Col>
        </Row>

        {/* Last Activity */}
        {(marketingData.lastEmailOpened || marketingData.lastCampaignClicked) && (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Text strong style={{ fontSize: "12px" }}>
              {t("admin:customers.360.marketing.lastActivity")}
            </Text>
            {marketingData.lastEmailOpened && (
              <Row align="middle">
                <Col flex="auto">
                  <Space>
                    <EyeOutlined style={{ color: "#1890ff", fontSize: "12px" }} />
                    <Text style={{ fontSize: "11px" }}>
                      {t("admin:customers.360.marketing.lastEmailOpened")}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Text style={{ fontSize: "11px", color: "#666" }}>
                    {dayjs(marketingData.lastEmailOpened).format("MMM D, YYYY")}
                  </Text>
                </Col>
              </Row>
            )}
            {marketingData.lastCampaignClicked && (
              <Row align="middle">
                <Col flex="auto">
                  <Space>
                    <LinkOutlined style={{ color: "#52c41a", fontSize: "12px" }} />
                    <Text style={{ fontSize: "11px" }}>
                      {t("admin:customers.360.marketing.lastCampaignClicked")}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Text style={{ fontSize: "11px", color: "#666" }}>
                    {dayjs(marketingData.lastCampaignClicked).format("MMM D, YYYY")}
                  </Text>
                </Col>
              </Row>
            )}
          </Space>
        )}

        {/* Assigned Segments */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong style={{ fontSize: "12px" }}>
            {t("admin:customers.360.marketing.segments")}
          </Text>
          <Space wrap>
            {marketingData.segments.map((segment) => (
              <Tag 
                key={segment.id}
                color={segment.isAutomatic ? "blue" : "green"}
                style={{ fontSize: "10px" }}
                icon={<TeamOutlined />}
              >
                {segment.name}
              </Tag>
            ))}
            {marketingData.segments.length === 0 && (
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {t("admin:customers.360.marketing.noSegments")}
              </Text>
            )}
          </Space>
        </Space>

        {/* Recent Campaigns */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong style={{ fontSize: "12px" }}>
            {t("admin:customers.360.marketing.recentCampaigns")}
          </Text>
          <Table
            dataSource={marketingData.campaigns.slice(0, 5)}
            columns={campaignColumns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 400 }}
          />
        </Space>
      </Space>
    </Card>
  );
}
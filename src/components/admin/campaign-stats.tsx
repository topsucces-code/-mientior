"use client";

import React from "react";
import { Card, Row, Col, Statistic, Progress, Tag, Space, Tooltip } from "antd";
import {
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface CampaignStatsData {
  sent: number;
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  bounces: number;
  unsubscribes: number;
  complaints: number;
  conversions: number;
  revenue: number;
  sentAt?: string;
}

interface CampaignStatsProps {
  stats: CampaignStatsData;
  status: string;
}

export const CampaignStats: React.FC<CampaignStatsProps> = ({ stats, status }) => {
  const { t } = useTranslation(["admin", "common"]);

  // Calculate rates
  const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
  const openRate = stats.delivered > 0 ? (stats.uniqueOpens / stats.delivered) * 100 : 0;
  const clickRate = stats.uniqueOpens > 0 ? (stats.uniqueClicks / stats.uniqueOpens) * 100 : 0;
  const conversionRate = stats.uniqueClicks > 0 ? (stats.conversions / stats.uniqueClicks) * 100 : 0;
  const bounceRate = stats.sent > 0 ? (stats.bounces / stats.sent) * 100 : 0;
  const unsubscribeRate = stats.delivered > 0 ? (stats.unsubscribes / stats.delivered) * 100 : 0;

  // Determine rate quality
  const getRateColor = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) return "#10B981";
    if (rate >= thresholds.warning) return "#F59E0B";
    return "#EF4444";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "default",
      SCHEDULED: "blue",
      ACTIVE: "processing",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return colors[status] || "default";
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card size="small" className="bg-gray-50">
        <div className="flex justify-between items-center">
          <Space>
            <Tag color={getStatusColor(status)}>{status}</Tag>
            {stats.sentAt && (
              <span className="text-gray-500">
                {t("admin:campaigns.stats.sentAt")}: {new Date(stats.sentAt).toLocaleString()}
              </span>
            )}
          </Space>
          <Space>
            <Tooltip title={t("admin:campaigns.stats.bounceRate")}>
              <Tag color={bounceRate > 5 ? "error" : "default"}>
                <WarningOutlined /> {bounceRate.toFixed(1)}% {t("admin:campaigns.stats.bounces")}
              </Tag>
            </Tooltip>
            <Tooltip title={t("admin:campaigns.stats.unsubscribeRate")}>
              <Tag color={unsubscribeRate > 1 ? "warning" : "default"}>
                <CloseCircleOutlined /> {unsubscribeRate.toFixed(2)}% {t("admin:campaigns.stats.unsubscribes")}
              </Tag>
            </Tooltip>
          </Space>
        </div>
      </Card>

      {/* Main Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.sent")}
              value={stats.sent}
              prefix={<SendOutlined />}
              valueStyle={{ color: "#0891B2" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.delivered")}
              value={stats.delivered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#10B981" }}
            />
            <Progress
              percent={deliveryRate}
              size="small"
              strokeColor={getRateColor(deliveryRate, { good: 95, warning: 90 })}
              format={(p) => `${p?.toFixed(1)}%`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.opens")}
              value={stats.uniqueOpens}
              suffix={`/ ${stats.opens}`}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#6366F1" }}
            />
            <Progress
              percent={openRate}
              size="small"
              strokeColor={getRateColor(openRate, { good: 25, warning: 15 })}
              format={(p) => `${p?.toFixed(1)}%`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.clicks")}
              value={stats.uniqueClicks}
              suffix={`/ ${stats.clicks}`}
              prefix={<LinkOutlined />}
              valueStyle={{ color: "#F97316" }}
            />
            <Progress
              percent={clickRate}
              size="small"
              strokeColor={getRateColor(clickRate, { good: 5, warning: 2 })}
              format={(p) => `${p?.toFixed(1)}%`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.conversions")}
              value={stats.conversions}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#10B981" }}
            />
            <Progress
              percent={conversionRate}
              size="small"
              strokeColor={getRateColor(conversionRate, { good: 3, warning: 1 })}
              format={(p) => `${p?.toFixed(1)}%`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title={t("admin:campaigns.stats.revenue")}
              value={stats.revenue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#10B981" }}
            />
            {stats.conversions > 0 && (
              <div className="text-sm text-gray-500 mt-2">
                {t("admin:campaigns.stats.avgOrderValue")}: ${(stats.revenue / stats.conversions).toFixed(2)}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Funnel Visualization */}
      <Card title={t("admin:campaigns.stats.funnel")}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 text-right text-gray-500">{t("admin:campaigns.stats.sent")}</div>
            <div className="flex-1">
              <Progress
                percent={100}
                strokeColor="#0891B2"
                format={() => stats.sent.toLocaleString()}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-right text-gray-500">{t("admin:campaigns.stats.delivered")}</div>
            <div className="flex-1">
              <Progress
                percent={deliveryRate}
                strokeColor="#10B981"
                format={() => `${stats.delivered.toLocaleString()} (${deliveryRate.toFixed(1)}%)`}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-right text-gray-500">{t("admin:campaigns.stats.opened")}</div>
            <div className="flex-1">
              <Progress
                percent={(stats.uniqueOpens / stats.sent) * 100}
                strokeColor="#6366F1"
                format={() => `${stats.uniqueOpens.toLocaleString()} (${openRate.toFixed(1)}%)`}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-right text-gray-500">{t("admin:campaigns.stats.clicked")}</div>
            <div className="flex-1">
              <Progress
                percent={(stats.uniqueClicks / stats.sent) * 100}
                strokeColor="#F97316"
                format={() => `${stats.uniqueClicks.toLocaleString()} (${clickRate.toFixed(1)}%)`}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 text-right text-gray-500">{t("admin:campaigns.stats.converted")}</div>
            <div className="flex-1">
              <Progress
                percent={(stats.conversions / stats.sent) * 100}
                strokeColor="#10B981"
                format={() => `${stats.conversions.toLocaleString()} (${conversionRate.toFixed(1)}%)`}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CampaignStats;

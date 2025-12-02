"use client";

import React from "react";
import { Card, Statistic, Row, Col, Space, Typography } from "antd";
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-media-query";

const { Text } = Typography;

interface MetricsData {
  lifetimeValue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalSpent: number;
  daysSinceLastPurchase: number;
  purchaseFrequency: number;
  customerTenure: number;
}

interface MetricsCardProps {
  metrics: MetricsData;
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const { t } = useTranslation(["common", "admin"]);
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatFrequency = (frequency: number) => {
    if (frequency < 1) {
      return `${(frequency * 30).toFixed(1)} ${t("admin:customers.360.metrics.daysPerOrder")}`;
    }
    return `${frequency.toFixed(1)} ${t("admin:customers.360.metrics.ordersPerMonth")}`;
  };

  const getRecencyColor = (days: number) => {
    if (days <= 30) return "#52c41a"; // Green
    if (days <= 90) return "#faad14"; // Orange
    return "#f5222d"; // Red
  };

  return (
    <Card 
      title={
        <Space>
          <RiseOutlined />
          {t("admin:customers.360.metrics.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Primary Metrics */}
        <Row gutter={isMobile ? 8 : 16}>
          <Col span={12}>
            <Statistic
              title={t("admin:customers.360.metrics.lifetimeValue")}
              value={metrics.lifetimeValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ 
                fontSize: isMobile ? "14px" : "18px", 
                fontWeight: "bold" 
              }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={t("admin:customers.360.metrics.totalOrders")}
              value={metrics.totalOrders}
              prefix={<ShoppingOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ 
                fontSize: isMobile ? "14px" : "18px", 
                fontWeight: "bold" 
              }}
            />
          </Col>
        </Row>

        {/* Secondary Metrics */}
        <Row gutter={isMobile ? 8 : 16}>
          <Col span={12}>
            <Statistic
              title={t("admin:customers.360.metrics.averageOrderValue")}
              value={metrics.averageOrderValue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<TrophyOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ fontSize: isMobile ? "12px" : "16px" }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={t("admin:customers.360.metrics.totalSpent")}
              value={metrics.totalSpent}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ fontSize: isMobile ? "12px" : "16px" }}
            />
          </Col>
        </Row>

        {/* Behavioral Metrics */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Row align="middle">
            <Col flex="auto">
              <Space>
                <ClockCircleOutlined style={{ color: getRecencyColor(metrics.daysSinceLastPurchase) }} />
                <Text strong style={{ fontSize: isMobile ? "11px" : "14px" }}>
                  {t("admin:customers.360.metrics.lastPurchase")}
                </Text>
              </Space>
            </Col>
            <Col>
              <Text style={{ 
                color: getRecencyColor(metrics.daysSinceLastPurchase),
                fontSize: isMobile ? "11px" : "14px"
              }}>
                {metrics.daysSinceLastPurchase === 0 
                  ? t("admin:customers.360.metrics.today")
                  : `${metrics.daysSinceLastPurchase} ${t("admin:customers.360.metrics.daysAgo")}`
                }
              </Text>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <CalendarOutlined style={{ color: "#1890ff" }} />
                <Text strong style={{ fontSize: isMobile ? "11px" : "14px" }}>
                  {t("admin:customers.360.metrics.purchaseFrequency")}
                </Text>
              </Space>
            </Col>
            <Col>
              <Text style={{ fontSize: isMobile ? "11px" : "14px" }}>
                {formatFrequency(metrics.purchaseFrequency)}
              </Text>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <TrophyOutlined style={{ color: "#52c41a" }} />
                <Text strong style={{ fontSize: isMobile ? "11px" : "14px" }}>
                  {t("admin:customers.360.metrics.customerTenure")}
                </Text>
              </Space>
            </Col>
            <Col>
              <Text style={{ fontSize: isMobile ? "11px" : "14px" }}>
                {Math.floor(metrics.customerTenure / 365)} {t("admin:customers.360.metrics.years")} {Math.floor((metrics.customerTenure % 365) / 30)} {t("admin:customers.360.metrics.months")}
              </Text>
            </Col>
          </Row>
        </Space>
      </Space>
    </Card>
  );
}
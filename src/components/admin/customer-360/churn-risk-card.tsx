"use client";

import React from "react";
import { Card, Alert, Space, Typography, Row, Col, Tag, Progress, Tooltip } from "antd";
import { 
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface ChurnRiskData {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: {
    daysSinceLastPurchase: number;
    engagementDecline: number;
    supportIssues: number;
  };
  retentionStrategies: string[];
}

interface ChurnRiskCardProps {
  churnRisk: ChurnRiskData;
}

export function ChurnRiskCard({ churnRisk }: ChurnRiskCardProps) {
  const { t } = useTranslation(["common", "admin"]);

  const getRiskColor = (level: string) => {
    const colors = {
      low: "#52c41a",
      medium: "#faad14", 
      high: "#f5222d"
    };
    return colors[level as keyof typeof colors] || "#faad14";
  };

  const getRiskIcon = (level: string) => {
    const icons = {
      low: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      medium: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
      high: <WarningOutlined style={{ color: "#f5222d" }} />
    };
    return icons[level as keyof typeof icons] || icons.medium;
  };

  const getAlertType = (level: string) => {
    const types = {
      low: "success" as const,
      medium: "warning" as const,
      high: "error" as const
    };
    return types[level as keyof typeof types] || "warning";
  };

  const getFactorSeverity = (value: number, type: 'days' | 'decline' | 'issues') => {
    switch (type) {
      case 'days':
        if (value <= 30) return { color: "#52c41a", severity: "low" };
        if (value <= 90) return { color: "#faad14", severity: "medium" };
        return { color: "#f5222d", severity: "high" };
      case 'decline':
        if (value <= 20) return { color: "#52c41a", severity: "low" };
        if (value <= 50) return { color: "#faad14", severity: "medium" };
        return { color: "#f5222d", severity: "high" };
      case 'issues':
        if (value <= 1) return { color: "#52c41a", severity: "low" };
        if (value <= 3) return { color: "#faad14", severity: "medium" };
        return { color: "#f5222d", severity: "high" };
      default:
        return { color: "#faad14", severity: "medium" };
    }
  };

  return (
    <Card 
      title={
        <Space>
          <WarningOutlined />
          {t("admin:customers.360.churnRisk.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Risk Level Alert */}
        <Alert
          type={getAlertType(churnRisk.level)}
          message={
            <Space>
              {getRiskIcon(churnRisk.level)}
              <Text strong>
                {t(`admin:customers.360.churnRisk.levels.${churnRisk.level}`)} 
                {t("admin:customers.360.churnRisk.risk")}
              </Text>
              <Tag color={getRiskColor(churnRisk.level)}>
                {churnRisk.score}%
              </Tag>
            </Space>
          }
          showIcon={false}
        />

        {/* Risk Factors */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong style={{ fontSize: "12px" }}>
            {t("admin:customers.360.churnRisk.factors.title")}
          </Text>
          
          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "11px" }}>
                  {t("admin:customers.360.churnRisk.factors.daysSinceLastPurchase")}
                </Text>
                <Tooltip title={t("admin:customers.360.churnRisk.factors.daysSinceLastPurchaseTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Tag 
                color={getFactorSeverity(churnRisk.factors.daysSinceLastPurchase, 'days').color}
                style={{ fontSize: "10px", margin: 0 }}
              >
                {churnRisk.factors.daysSinceLastPurchase} {t("admin:customers.360.churnRisk.days")}
              </Tag>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "11px" }}>
                  {t("admin:customers.360.churnRisk.factors.engagementDecline")}
                </Text>
                <Tooltip title={t("admin:customers.360.churnRisk.factors.engagementDeclineTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Tag 
                color={getFactorSeverity(churnRisk.factors.engagementDecline, 'decline').color}
                style={{ fontSize: "10px", margin: 0 }}
              >
                {churnRisk.factors.engagementDecline}%
              </Tag>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "11px" }}>
                  {t("admin:customers.360.churnRisk.factors.supportIssues")}
                </Text>
                <Tooltip title={t("admin:customers.360.churnRisk.factors.supportIssuesTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Tag 
                color={getFactorSeverity(churnRisk.factors.supportIssues, 'issues').color}
                style={{ fontSize: "10px", margin: 0 }}
              >
                {churnRisk.factors.supportIssues} {t("admin:customers.360.churnRisk.issues")}
              </Tag>
            </Col>
          </Row>
        </Space>

        {/* Retention Strategies */}
        {churnRisk.retentionStrategies.length > 0 && (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Text strong style={{ fontSize: "12px" }}>
              {t("admin:customers.360.churnRisk.retentionStrategies")}
            </Text>
            {churnRisk.retentionStrategies.slice(0, 2).map((strategy, index) => (
              <Text key={index} style={{ fontSize: "10px", color: "#666" }}>
                • {strategy}
              </Text>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}
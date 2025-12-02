"use client";

import React from "react";
import { Card, Progress, Space, Typography, Row, Col, Tag, Tooltip } from "antd";
import { 
  HeartOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface HealthScoreData {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    purchase: number;
    engagement: number;
    support: number;
    recency: number;
  };
  recommendations: string[];
}

interface HealthScoreCardProps {
  healthScore: HealthScoreData;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const { t } = useTranslation(["common", "admin"]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a"; // Green
    if (score >= 60) return "#faad14"; // Orange
    if (score >= 40) return "#fa8c16"; // Dark Orange
    return "#f5222d"; // Red
  };

  const getLevelIcon = (level: string) => {
    const icons = {
      excellent: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      good: <CheckCircleOutlined style={{ color: "#faad14" }} />,
      fair: <ExclamationCircleOutlined style={{ color: "#fa8c16" }} />,
      poor: <WarningOutlined style={{ color: "#f5222d" }} />
    };
    return icons[level as keyof typeof icons] || icons.fair;
  };

  const getLevelColor = (level: string) => {
    const colors = {
      excellent: "green",
      good: "orange",
      fair: "gold",
      poor: "red"
    };
    return colors[level as keyof typeof colors] || "default";
  };

  const getFactorColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    if (score >= 40) return "#fa8c16";
    return "#f5222d";
  };

  return (
    <Card 
      title={
        <Space>
          <HeartOutlined />
          {t("admin:customers.360.healthScore.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Main Score */}
        <div style={{ textAlign: "center" }}>
          <Progress
            type="circle"
            percent={healthScore.score}
            strokeColor={getScoreColor(healthScore.score)}
            size={80}
            format={(percent) => (
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                {percent}
              </span>
            )}
          />
          <div style={{ marginTop: 8 }}>
            <Space>
              {getLevelIcon(healthScore.level)}
              <Tag color={getLevelColor(healthScore.level)}>
                {t(`admin:customers.360.healthScore.levels.${healthScore.level}`)}
              </Tag>
            </Space>
          </div>
        </div>

        {/* Factor Breakdown */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text strong>{t("admin:customers.360.healthScore.factors.title")}</Text>
          
          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.healthScore.factors.purchase")}
                </Text>
                <Tooltip title={t("admin:customers.360.healthScore.factors.purchaseTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Progress
                percent={healthScore.factors.purchase}
                size="small"
                strokeColor={getFactorColor(healthScore.factors.purchase)}
                showInfo={false}
                style={{ width: "60px" }}
              />
            </Col>
            <Col style={{ width: "30px", textAlign: "right" }}>
              <Text style={{ fontSize: "11px" }}>{healthScore.factors.purchase}</Text>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.healthScore.factors.engagement")}
                </Text>
                <Tooltip title={t("admin:customers.360.healthScore.factors.engagementTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Progress
                percent={healthScore.factors.engagement}
                size="small"
                strokeColor={getFactorColor(healthScore.factors.engagement)}
                showInfo={false}
                style={{ width: "60px" }}
              />
            </Col>
            <Col style={{ width: "30px", textAlign: "right" }}>
              <Text style={{ fontSize: "11px" }}>{healthScore.factors.engagement}</Text>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.healthScore.factors.support")}
                </Text>
                <Tooltip title={t("admin:customers.360.healthScore.factors.supportTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Progress
                percent={healthScore.factors.support}
                size="small"
                strokeColor={getFactorColor(healthScore.factors.support)}
                showInfo={false}
                style={{ width: "60px" }}
              />
            </Col>
            <Col style={{ width: "30px", textAlign: "right" }}>
              <Text style={{ fontSize: "11px" }}>{healthScore.factors.support}</Text>
            </Col>
          </Row>

          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.healthScore.factors.recency")}
                </Text>
                <Tooltip title={t("admin:customers.360.healthScore.factors.recencyTooltip")}>
                  <InfoCircleOutlined style={{ fontSize: "10px", color: "#999" }} />
                </Tooltip>
              </Space>
            </Col>
            <Col>
              <Progress
                percent={healthScore.factors.recency}
                size="small"
                strokeColor={getFactorColor(healthScore.factors.recency)}
                showInfo={false}
                style={{ width: "60px" }}
              />
            </Col>
            <Col style={{ width: "30px", textAlign: "right" }}>
              <Text style={{ fontSize: "11px" }}>{healthScore.factors.recency}</Text>
            </Col>
          </Row>
        </Space>

        {/* Recommendations */}
        {healthScore.recommendations.length > 0 && (
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Text strong style={{ fontSize: "12px" }}>
              {t("admin:customers.360.healthScore.recommendations")}
            </Text>
            {healthScore.recommendations.slice(0, 2).map((recommendation, index) => (
              <Text key={index} style={{ fontSize: "11px", color: "#666" }}>
                • {recommendation}
              </Text>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}
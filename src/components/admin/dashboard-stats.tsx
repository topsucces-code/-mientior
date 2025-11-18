"use client";

import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  revenue: {
    total: number;
    change: number;
    period: string;
  };
  orders: {
    total: number;
    pending: number;
    change: number;
  };
  users: {
    total: number;
    newToday: number;
    change: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
}

interface DashboardStatsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  loading = false,
}) => {
  const { t } = useTranslation(["common", "admin"]);

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUpOutlined style={{ color: "#52c41a" }} />;
    } else if (change < 0) {
      return <ArrowDownOutlined style={{ color: "#ff4d4f" }} />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "#52c41a";
    if (change < 0) return "#ff4d4f";
    return undefined;
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title={t("admin.dashboard.kpis.totalRevenue")}
            value={stats.revenue.total}
            precision={2}
            prefix={<DollarCircleOutlined style={{ color: "#52c41a" }} />}
            suffix={
              <span style={{ fontSize: "14px", marginLeft: "8px" }}>
                {getTrendIcon(stats.revenue.change)}
                <span
                  style={{
                    color: getTrendColor(stats.revenue.change),
                    marginLeft: "4px",
                  }}
                >
                  {Math.abs(stats.revenue.change)}%
                </span>
              </span>
            }
            valueStyle={{ color: "#52c41a" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            {t("admin.dashboard.kpis.period", { period: stats.revenue.period })}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title={t("admin.dashboard.kpis.totalOrders")}
            value={stats.orders.total}
            prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
            suffix={
              <span style={{ fontSize: "14px", marginLeft: "8px" }}>
                {getTrendIcon(stats.orders.change)}
                <span
                  style={{
                    color: getTrendColor(stats.orders.change),
                    marginLeft: "4px",
                  }}
                >
                  {Math.abs(stats.orders.change)}%
                </span>
              </span>
            }
            valueStyle={{ color: "#1890ff" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            {t("admin.dashboard.kpis.pendingOrders", {
              count: stats.orders.pending,
            })}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title={t("admin.dashboard.kpis.totalUsers")}
            value={stats.users.total}
            prefix={<UserOutlined style={{ color: "#722ed1" }} />}
            suffix={
              <span style={{ fontSize: "14px", marginLeft: "8px" }}>
                {getTrendIcon(stats.users.change)}
                <span
                  style={{
                    color: getTrendColor(stats.users.change),
                    marginLeft: "4px",
                  }}
                >
                  {Math.abs(stats.users.change)}%
                </span>
              </span>
            }
            valueStyle={{ color: "#722ed1" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            {t("admin.dashboard.kpis.newToday", { count: stats.users.newToday })}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title={t("admin.dashboard.kpis.totalProducts")}
            value={stats.products.total}
            prefix={<ShoppingCartOutlined style={{ color: "#faad14" }} />}
            valueStyle={{ color: "#faad14" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            {stats.products.lowStock > 0 && (
              <span style={{ color: "#ff4d4f" }}>
                {t("admin.dashboard.kpis.lowStock", {
                  count: stats.products.lowStock,
                })}
              </span>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

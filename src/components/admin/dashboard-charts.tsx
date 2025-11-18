"use client";

import React from "react";
import { Card, Row, Col } from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
}

interface TopProduct {
  name: string;
  sales: number;
}

interface DashboardChartsProps {
  revenueData: RevenueData[];
  ordersByStatus: OrdersByStatus[];
  topProducts: TopProduct[];
  period?: string;
  loading?: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#faad14",
  PROCESSING: "#1890ff",
  SHIPPED: "#52c41a",
  DELIVERED: "#52c41a",
  CANCELLED: "#ff4d4f",
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  revenueData,
  ordersByStatus,
  topProducts,
  loading = false,
}) => {
  const { t } = useTranslation(["common", "admin"]);

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string }; value: number }> }) => {
    if (active && payload && payload.length && payload[0]) {
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>
            {dayjs(payload[0].payload.date).format("MMM DD, YYYY")}
          </p>
          <p style={{ margin: 0, color: "#1890ff" }}>
            {t("admin.dashboard.charts.revenue")}: $
            {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Revenue Trend Chart */}
      <Col xs={24} lg={16}>
        <Card
          title={t("admin.dashboard.charts.revenueTitle")}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => dayjs(value).format("MMM DD")}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1890ff"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={t("admin.dashboard.charts.revenue")}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Orders by Status Chart */}
      <Col xs={24} lg={8}>
        <Card
          title={t("admin.dashboard.charts.ordersByStatus")}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name={t("admin.dashboard.charts.orders")}
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Top Products Pie Chart */}
      <Col xs={24} lg={12}>
        <Card
          title={t("admin.dashboard.charts.topProducts")}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.sales}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sales"
              >
                {topProducts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

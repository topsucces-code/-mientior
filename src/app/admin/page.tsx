"use client";

import React from "react";
import { Card, Table, Select, Tag } from "antd";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import dayjs from "dayjs";

interface DashboardStatsData {
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
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

interface DashboardChartsData {
  revenue: Array<{ date: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; sales: number }>;
}

export default function AdminDashboard() {
  const { t } = useTranslation(["common", "admin"]);
  const [period, setPeriod] = React.useState("30d");
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStatsData | null>(null);
  const [charts, setCharts] = React.useState<DashboardChartsData | null>(null);

  // Fetch dashboard stats
  const fetchStats = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch dashboard charts
  const fetchCharts = React.useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/dashboard/charts?type=all&period=${period}`
      );
      const data = await response.json();
      setCharts(data.data);
    } catch (error) {
      console.error("Error fetching charts:", error);
    }
  }, [period]);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCharts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchCharts]);

  const recentOrders = stats?.recentOrders || [];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>{t("common:common.dashboard")}</h1>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 120 }}
          options={[
            { value: "7d", label: t("admin:dashboard.period.week") },
            { value: "30d", label: t("admin:dashboard.period.month") },
            { value: "90d", label: t("admin:dashboard.period.custom") },
            { value: "1y", label: t("admin:dashboard.period.year") },
          ]}
        />
      </div>

      {stats && <DashboardStats stats={stats} loading={loading} />}

      <div style={{ marginTop: 24 }}>
        {charts && (
          <DashboardCharts
            revenueData={charts.revenue || []}
            ordersByStatus={charts.ordersByStatus || []}
            topProducts={charts.topProducts || []}
            period={period}
            loading={loading}
          />
        )}
      </div>

      <Card
        title={t("admin:dashboard.recentOrders")}
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          size="small"
        >
          <Table.Column
            dataIndex="id"
            title={t("admin:orders.fields.orderId")}
            render={(id: string) => (
              <Link href={`/admin/orders/show/${id}`}>{id}</Link>
            )}
          />
          <Table.Column
            dataIndex="total"
            title={t("admin:orders.fields.total")}
            render={(value: number) => `$${value.toFixed(2)}`}
          />
          <Table.Column
            dataIndex="status"
            title={t("admin:orders.fields.status")}
            render={(status: string) => (
              <Tag
                color={
                  status === "PENDING"
                    ? "orange"
                    : status === "COMPLETED"
                    ? "green"
                    : "blue"
                }
              >
                {t(`admin:orders.status.${status.toUpperCase()}`)}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="createdAt"
            title={t("admin:orders.fields.createdAt")}
            render={(date: string) => dayjs(date).format("MMM DD, YYYY HH:mm")}
          />
        </Table>
      </Card>
    </div>
  );
}

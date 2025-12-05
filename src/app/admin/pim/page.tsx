"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface PimStats {
  sync: {
    total: number;
    success: number;
    failed: number;
    partial: number;
    pending: number;
    successRate: number;
  };
  performance: {
    averageDuration: number;
  };
  operations: {
    create: number;
    update: number;
    delete: number;
  };
  queue: {
    mainQueue: number;
    processingQueue: number;
    failedQueue: number;
    timestamp: string;
  };
}

interface SyncLog {
  id: string;
  akeneoProductId: string;
  operation: string;
  source: string;
  status: string;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ChartDataPoint {
  date: string;
  success: number;
  failed: number;
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "green",
  FAILED: "red",
  PENDING: "orange",
  PARTIAL: "blue",
};

const OPERATION_COLORS: Record<string, string> = {
  CREATE: "#52c41a",
  UPDATE: "#1890ff",
  DELETE: "#ff4d4f",
};

export default function PimDashboard() {
  const { t } = useTranslation(["admin", "common"]);
  const [stats, setStats] = React.useState<PimStats | null>(null);
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [filters, setFilters] = React.useState<{
    status?: string;
    operation?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // Fetch PIM stats
  const fetchStats = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pim/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching PIM stats:", error);
    }
  }, []);

  // Fetch chart data for sync logs
  const fetchChartData = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pim/logs?_start=0&_end=100&_sort=createdAt&_order=desc");
      if (response.ok) {
        const logs: SyncLog[] = await response.json();

        // Aggregate data by date
        const aggregated = logs.reduce((acc, log) => {
          const date = dayjs(log.createdAt).format("YYYY-MM-DD");
          if (!acc[date]) {
            acc[date] = { date, success: 0, failed: 0 };
          }
          if (log.status === "SUCCESS") {
            acc[date].success += 1;
          } else if (log.status === "FAILED") {
            acc[date].failed += 1;
          }
          return acc;
        }, {} as Record<string, ChartDataPoint>);

        const chartDataArray = Object.values(aggregated)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7); // Last 7 days

        setChartData(chartDataArray);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  }, []);

  // Initial data fetch
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchChartData()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchChartData]);

  // Build filter query params
  const buildFilterParams = React.useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.operation) params.append("operation", filters.operation);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    return params.toString();
  }, [filters]);

  // Setup useTable with filters
  const { tableProps } = useTable({
    resource: "admin/pim/logs",
    pagination: {
      pageSize: 10,
    },
    filters: {
      permanent: [
        ...(filters.status ? [{ field: "status", operator: "eq" as const, value: filters.status }] : []),
        ...(filters.operation ? [{ field: "operation", operator: "eq" as const, value: filters.operation }] : []),
        ...(filters.startDate ? [{ field: "startDate", operator: "eq" as const, value: filters.startDate }] : []),
        ...(filters.endDate ? [{ field: "endDate", operator: "eq" as const, value: filters.endDate }] : []),
      ],
    },
    syncWithLocation: false,
  });

  // Handle manual sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/admin/pim/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { status: "ACTIVE" },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        message.success(t("admin:pim.syncSuccess", { count: data.estimatedProducts }));
        // Refresh data after sync
        setTimeout(() => {
          fetchStats();
          fetchChartData();
        }, 2000);
      } else {
        const error = await response.json();
        message.error(error.error || t("admin:pim.syncError"));
      }
    } catch (error) {
      message.error(t("admin:pim.syncError"));
      console.error("Error syncing:", error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || "default";

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
        <h1>{t("admin:pim.title")}</h1>
        <Button
          type="primary"
          icon={<SyncOutlined spin={syncing} />}
          onClick={handleSync}
          loading={syncing}
          size="large"
        >
          {t("admin:pim.syncNow")}
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={t("admin:pim.kpis.totalSyncs")}
              value={stats?.sync.total || 0}
              prefix={<ApiOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              {t("admin:pim.kpis.successRate")}: {stats?.sync.successRate.toFixed(1) || 0}%
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={t("admin:pim.kpis.successful")}
              value={stats?.sync.success || 0}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              {t("admin:pim.kpis.pending")}: {stats?.sync.pending || 0}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={t("admin:pim.kpis.failed")}
              value={stats?.sync.failed || 0}
              prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              {t("admin:pim.kpis.partial")}: {stats?.sync.partial || 0}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={t("admin:pim.kpis.avgDuration")}
              value={stats?.performance.averageDuration || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              {t("admin:pim.kpis.queueSize")}: {(stats?.queue.mainQueue || 0) + (stats?.queue.processingQueue || 0)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={t("admin:pim.charts.syncTrend")}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => dayjs(value).format("MMM DD")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => dayjs(value).format("MMM DD, YYYY")}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name={t("admin:pim.charts.successful")}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  name={t("admin:pim.charts.failed")}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={t("admin:pim.charts.operationBreakdown")}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: t("admin:pim.operations.create"), value: stats?.operations.create || 0 },
                  { name: t("admin:pim.operations.update"), value: stats?.operations.update || 0 },
                  { name: t("admin:pim.operations.delete"), value: stats?.operations.delete || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name={t("admin:pim.charts.operations")}>
                  <Cell fill={OPERATION_COLORS.CREATE} />
                  <Cell fill={OPERATION_COLORS.UPDATE} />
                  <Cell fill={OPERATION_COLORS.DELETE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Select
            placeholder={t("admin:pim.filters.status")}
            style={{ width: 150 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { label: t("admin:pim.status.SUCCESS"), value: "SUCCESS" },
              { label: t("admin:pim.status.FAILED"), value: "FAILED" },
              { label: t("admin:pim.status.PENDING"), value: "PENDING" },
              { label: t("admin:pim.status.PARTIAL"), value: "PARTIAL" },
            ]}
          />
          <Select
            placeholder={t("admin:pim.filters.operation")}
            style={{ width: 150 }}
            allowClear
            value={filters.operation}
            onChange={(value) => setFilters({ ...filters, operation: value })}
            options={[
              { label: t("admin:pim.operations.create"), value: "CREATE" },
              { label: t("admin:pim.operations.update"), value: "UPDATE" },
              { label: t("admin:pim.operations.delete"), value: "DELETE" },
            ]}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  startDate: dates[0].toISOString(),
                  endDate: dates[1].toISOString(),
                });
              } else {
                setFilters({
                  ...filters,
                  startDate: undefined,
                  endDate: undefined,
                });
              }
            }}
          />
        </Space>
      </Card>

      {/* Recent Sync Logs Table */}
      <Card title={t("admin:pim.recentLogs")}>
        <Table {...tableProps} rowKey="id" size="small">
          <Table.Column
            dataIndex="id"
            title={t("admin:pim.fields.id")}
            width={80}
            render={(id: string) => id.slice(0, 8)}
          />
          <Table.Column
            dataIndex="source"
            title={t("admin:pim.fields.source")}
            width={100}
          />
          <Table.Column
            dataIndex="operation"
            title={t("admin:pim.fields.operation")}
            width={100}
            render={(operation: string) => (
              <Tag color={OPERATION_COLORS[operation] || "default"}>
                {t(`admin:pim.operations.${operation.toLowerCase()}`)}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="product"
            title={t("admin:pim.fields.product")}
            render={(product: SyncLog["product"]) =>
              product ? product.name : "-"
            }
          />
          <Table.Column
            dataIndex="status"
            title={t("admin:pim.fields.status")}
            width={100}
            render={(status: string) => (
              <Tag color={getStatusColor(status)}>
                {t(`admin:pim.status.${status}`)}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="duration"
            title={t("admin:pim.fields.duration")}
            width={100}
            render={(duration: number | null) =>
              duration ? `${duration}ms` : "-"
            }
          />
          <Table.Column
            dataIndex="createdAt"
            title={t("admin:pim.fields.createdAt")}
            width={150}
            render={(date: string) => dayjs(date).format("MMM DD, YYYY HH:mm")}
          />
        </Table>
      </Card>
    </div>
  );
}

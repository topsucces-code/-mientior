'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Space,
  Table,
  Progress,
  Tag,
  Spin,
  message,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  DownloadOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  kpis: {
    totalRevenue: { value: number; change: number };
    totalOrders: { value: number; change: number };
    newCustomers: { value: number; change: number };
    avgOrderValue: { value: number; change: number };
  };
  charts: {
    revenue: Array<{ date: string; revenue: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    salesByCategory: Array<{ name: string; value: number }>;
    topProducts: Array<{
      id: string;
      name: string;
      category: string;
      sales: number;
      revenue: number;
    }>;
  };
  funnel: {
    visitors: number;
    productViews: number;
    addToCart: number;
    checkoutStarted: number;
    ordersCompleted: number;
  };
}

export default function AnalyticsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [compareWith, setCompareWith] = useState<'previous-period' | 'previous-year'>('previous-period');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/analytics?period=${period}&compareWith=${compareWith}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        message.error(t('admin:analytics.messages.loadError'));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error(t('admin:analytics.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [period, compareWith, t]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Build KPIs from data
  const kpis = data ? [
    {
      title: t('admin:analytics.kpis.totalRevenue'),
      value: data.kpis.totalRevenue.value,
      prefix: '€',
      change: data.kpis.totalRevenue.change,
      trend: data.kpis.totalRevenue.change >= 0 ? 'up' : 'down',
      icon: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: t('admin:analytics.kpis.totalOrders'),
      value: data.kpis.totalOrders.value,
      change: data.kpis.totalOrders.change,
      trend: data.kpis.totalOrders.change >= 0 ? 'up' : 'down',
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
    },
    {
      title: t('admin:analytics.kpis.newCustomers'),
      value: data.kpis.newCustomers.value,
      change: data.kpis.newCustomers.change,
      trend: data.kpis.newCustomers.change >= 0 ? 'up' : 'down',
      icon: <UserOutlined />,
      color: '#722ed1',
    },
    {
      title: t('admin:analytics.kpis.avgOrderValue'),
      value: data.kpis.avgOrderValue.value,
      prefix: '€',
      change: data.kpis.avgOrderValue.change,
      trend: data.kpis.avgOrderValue.change >= 0 ? 'up' : 'down',
      icon: <LineChartOutlined />,
      color: '#faad14',
    },
  ] : [];

  // Build chart data from API response
  const revenueChartData = {
    labels: data?.charts.revenue.map((r) => {
      const date = new Date(r.date);
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: t('admin:analytics.charts.revenue'),
        data: data?.charts.revenue.map((r) => r.revenue) || [],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
      },
    ],
  };

  const ordersChartData = {
    labels: data?.charts.ordersByStatus.map((o) => o.status) || [],
    datasets: [
      {
        label: t('admin:analytics.charts.orders'),
        data: data?.charts.ordersByStatus.map((o) => o.count) || [],
        backgroundColor: ['#52c41a', '#1890ff', '#faad14', '#722ed1', '#ff4d4f'],
      },
    ],
  };

  const categoryColors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];
  const categoryData = {
    labels: data?.charts.salesByCategory.map((c) => c.name) || [],
    datasets: [
      {
        label: t('admin:analytics.charts.salesByCategory'),
        data: data?.charts.salesByCategory.map((c) => c.value) || [],
        backgroundColor: categoryColors,
      },
    ],
  };

  const topProducts = data?.charts.topProducts.map((p, index) => ({
    key: p.id || String(index),
    name: p.name,
    category: p.category,
    sales: p.sales,
    revenue: p.revenue,
  })) || [];

  const topProductsColumns = [
    {
      title: t('admin:analytics.topProducts.product'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin:analytics.topProducts.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: t('admin:analytics.topProducts.sales'),
      dataIndex: 'sales',
      key: 'sales',
      sorter: (a: typeof topProducts[0], b: typeof topProducts[0]) => a.sales - b.sales,
    },
    {
      title: t('admin:analytics.topProducts.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `€${revenue.toLocaleString()}`,
      sorter: (a: typeof topProducts[0], b: typeof topProducts[0]) => a.revenue - b.revenue,
    },
  ];

  // Funnel data
  const funnel = data?.funnel || {
    visitors: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarted: 0,
    ordersCompleted: 0,
  };

  // Export handlers
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analytics',
          format: 'pdf',
          period,
          data,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        message.success(t('admin:analytics.messages.exportSuccess'));
      } else {
        message.error(t('admin:analytics.messages.exportError'));
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error(t('admin:analytics.messages.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analytics',
          format: 'xlsx',
          period,
          data,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        message.success(t('admin:analytics.messages.exportSuccess'));
      } else {
        message.error(t('admin:analytics.messages.exportError'));
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error(t('admin:analytics.messages.exportError'));
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('admin:analytics.title')}</h1>
          <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
            {t('admin:analytics.subtitle')}
          </p>
        </Col>
        <Col>
          <Space>
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 140 }}
              options={[
                { label: t('admin:analytics.period.7d', '7 days'), value: '7d' },
                { label: t('admin:analytics.period.30d', '30 days'), value: '30d' },
                { label: t('admin:analytics.period.90d', '90 days'), value: '90d' },
                { label: t('admin:analytics.period.1y', '1 year'), value: '1y' },
              ]}
            />
            <Select
              value={compareWith}
              onChange={setCompareWith}
              style={{ width: 180 }}
              options={[
                { label: t('admin:analytics.compare.previousPeriod'), value: 'previous-period' },
                { label: t('admin:analytics.compare.previousYear'), value: 'previous-year' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchAnalytics} loading={loading}>
              {t('common:buttons.refresh', 'Refresh')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportPDF} loading={exporting}>
              {t('admin:analytics.actions.exportPDF')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel} loading={exporting}>
              {t('admin:analytics.actions.exportExcel')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpis.map((kpi, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: `${kpi.color}15`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginRight: 12,
                  }}
                >
                  {kpi.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    {kpi.title}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>
                    {kpi.prefix}
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.value}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: kpi.trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
                  {kpi.trend === 'up' ? <RiseOutlined /> : <FallOutlined />} {Math.abs(kpi.change)}%
                </span>
                <span style={{ color: '#8c8c8c', marginLeft: 8 }}>
                  vs {compareWith === 'previous-period' ? 'previous period' : 'last year'}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Overview" extra={<LineChartOutlined />}>
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value: string | number) => `$${Number(value).toLocaleString()}`,
                    },
                  },
                },
              }}
              height={300}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Sales by Category">
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
              height={300}
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Chart and Conversion Rates */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Orders by Day" extra={<BarChartOutlined />}>
            <Bar
              data={ordersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
              height={250}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Conversion Funnel">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{t('admin:analytics.funnel.visitors')}</span>
                  <span style={{ fontWeight: 600 }}>{funnel.visitors.toLocaleString()}</span>
                </div>
                <Progress percent={100} strokeColor="#1890ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{t('admin:analytics.funnel.productViews')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {funnel.productViews.toLocaleString()} ({funnel.visitors > 0 ? Math.round((funnel.productViews / funnel.visitors) * 100) : 0}%)
                  </span>
                </div>
                <Progress percent={funnel.visitors > 0 ? (funnel.productViews / funnel.visitors) * 100 : 0} strokeColor="#52c41a" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{t('admin:analytics.funnel.addToCart')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {funnel.addToCart.toLocaleString()} ({funnel.visitors > 0 ? Math.round((funnel.addToCart / funnel.visitors) * 100) : 0}%)
                  </span>
                </div>
                <Progress percent={funnel.visitors > 0 ? (funnel.addToCart / funnel.visitors) * 100 : 0} strokeColor="#faad14" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{t('admin:analytics.funnel.checkout')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {funnel.checkoutStarted.toLocaleString()} ({funnel.visitors > 0 ? Math.round((funnel.checkoutStarted / funnel.visitors) * 100) : 0}%)
                  </span>
                </div>
                <Progress percent={funnel.visitors > 0 ? (funnel.checkoutStarted / funnel.visitors) * 100 : 0} strokeColor="#722ed1" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{t('admin:analytics.funnel.orders')}</span>
                  <span style={{ fontWeight: 600 }}>
                    {funnel.ordersCompleted.toLocaleString()} ({funnel.visitors > 0 ? ((funnel.ordersCompleted / funnel.visitors) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <Progress percent={funnel.visitors > 0 ? (funnel.ordersCompleted / funnel.visitors) * 100 : 0} strokeColor="#eb2f96" showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Top Products Table */}
      <Card title="Top Performing Products" style={{ marginBottom: 24 }}>
        <Table
          columns={topProductsColumns}
          dataSource={topProducts}
          pagination={false}
        />
      </Card>
    </div>
  );
}

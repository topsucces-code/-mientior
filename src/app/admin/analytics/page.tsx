'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Progress,
  Tag,
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
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
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

const { RangePicker } = DatePicker;

type DateRange = [Dayjs, Dayjs];

interface KPI {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    fill?: boolean;
  }>;
}

export default function AnalyticsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [compareWith, setCompareWith] = useState<'previous-period' | 'previous-year'>('previous-period');

  // KPIs
  const kpis: KPI[] = [
    {
      title: t('admin:analytics.kpis.totalRevenue'),
      value: 125480.50,
      prefix: '$',
      change: 12.5,
      trend: 'up',
      icon: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: t('admin:analytics.kpis.totalOrders'),
      value: 1847,
      change: 8.3,
      trend: 'up',
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
    },
    {
      title: t('admin:analytics.kpis.newCustomers'),
      value: 523,
      change: -3.2,
      trend: 'down',
      icon: <UserOutlined />,
      color: '#722ed1',
    },
    {
      title: t('admin:analytics.kpis.avgOrderValue'),
      value: 67.92,
      prefix: '$',
      change: 4.7,
      trend: 'up',
      icon: <LineChartOutlined />,
      color: '#faad14',
    },
  ];

  // Revenue chart data
  const revenueChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: t('admin:analytics.charts.revenue'),
        data: [12000, 15000, 13000, 17000, 16000, 19000, 21000, 23000, 20000, 24000, 26000, 28000],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
      },
    ],
  };

  // Orders chart data
  const ordersChartData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: t('admin:analytics.charts.orders'),
        data: [45, 52, 48, 63, 71, 88, 76],
        backgroundColor: '#1890ff',
      },
    ],
  };

  // Category distribution
  const categoryData: ChartData = {
    labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Other'],
    datasets: [
      {
        label: t('admin:analytics.charts.salesByCategory'),
        data: [35, 25, 15, 12, 8, 5],
        backgroundColor: [
          '#1890ff',
          '#52c41a',
          '#faad14',
          '#722ed1',
          '#eb2f96',
          '#13c2c2',
        ],
      },
    ],
  };

  // Top products table data
  const topProducts = [
    {
      key: '1',
      name: 'MacBook Pro 16" M3 Max',
      category: 'Electronics',
      sales: 127,
      revenue: 317230,
      growth: 15.4,
    },
    {
      key: '2',
      name: 'iPhone 15 Pro Max',
      category: 'Electronics',
      sales: 243,
      revenue: 291570,
      growth: 22.1,
    },
    {
      key: '3',
      name: 'AirPods Pro',
      category: 'Electronics',
      sales: 389,
      revenue: 97250,
      growth: 8.7,
    },
    {
      key: '4',
      name: 'Samsung Galaxy S24 Ultra',
      category: 'Electronics',
      sales: 156,
      revenue: 187200,
      growth: -3.2,
    },
    {
      key: '5',
      name: 'Sony WH-1000XM5',
      category: 'Electronics',
      sales: 278,
      revenue: 111200,
      growth: 12.8,
    },
  ];

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
      render: (revenue: number) => `$${revenue.toLocaleString()}`,
      sorter: (a: typeof topProducts[0], b: typeof topProducts[0]) => a.revenue - b.revenue,
    },
    {
      title: t('admin:analytics.topProducts.growth'),
      dataIndex: 'growth',
      key: 'growth',
      render: (growth: number) => (
        <span style={{ color: growth >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {growth >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(growth)}%
        </span>
      ),
      sorter: (a: typeof topProducts[0], b: typeof topProducts[0]) => a.growth - b.growth,
    },
  ];

  // Export handlers
  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
    // TODO: Implement Excel export
  };

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
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as DateRange)}
              format="MMM DD, YYYY"
              allowClear={false}
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
            <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>
              {t('admin:analytics.actions.exportPDF')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
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
                    {kpi.value.toLocaleString()}
                    {kpi.suffix}
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
                  <span>Visitors</span>
                  <span style={{ fontWeight: 600 }}>10,000</span>
                </div>
                <Progress percent={100} strokeColor="#1890ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Product Views</span>
                  <span style={{ fontWeight: 600 }}>6,500 (65%)</span>
                </div>
                <Progress percent={65} strokeColor="#52c41a" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Add to Cart</span>
                  <span style={{ fontWeight: 600 }}>3,200 (32%)</span>
                </div>
                <Progress percent={32} strokeColor="#faad14" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Checkout Started</span>
                  <span style={{ fontWeight: 600 }}>2,400 (24%)</span>
                </div>
                <Progress percent={24} strokeColor="#722ed1" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Orders Completed</span>
                  <span style={{ fontWeight: 600 }}>1,847 (18.5%)</span>
                </div>
                <Progress percent={18.5} strokeColor="#eb2f96" showInfo={false} />
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

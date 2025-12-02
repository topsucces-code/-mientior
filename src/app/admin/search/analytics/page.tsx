'use client';

import { useState, useEffect } from 'react';
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
  Tag,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  SearchOutlined,
  LineChartOutlined,
  BarChartOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  GlobalOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
import type { DashboardAnalyticsReport, ZeroResultQuery, ProductClickStats } from '@/types';
import { format } from 'date-fns';

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
type PeriodType = '7d' | '30d' | '90d' | 'custom';
type CompareType = 'none' | 'previous-period' | 'previous-year';

export default function SearchAnalyticsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [dateRange, setDateRange] = useState<DateRange>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [compareWith, setCompareWith] = useState<CompareType>('none');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardAnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        interval: 'day',
        limit: '10',
      });

      if (compareWith !== 'none') {
        params.append('compareWith', compareWith);
      }

      const response = await fetch(`/api/admin/search/analytics/dashboard?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(t('admin:searchAnalytics.messages.loadError'));
      console.error('Failed to load search analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, compareWith]);

  // Handle period quick filters
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      const days = newPeriod === '7d' ? 7 : newPeriod === '30d' ? 30 : 90;
      setDateRange([dayjs().subtract(days, 'days'), dayjs()]);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates: DateRange | null) => {
    if (dates) {
      setDateRange(dates);
      setPeriod('custom');
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });

      const response = await fetch(`/api/admin/search/analytics/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${dateRange[0].format('YYYY-MM-DD')}-${dateRange[1].format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success(t('admin:searchAnalytics.messages.exportSuccess'));
    } catch (err) {
      message.error(t('admin:searchAnalytics.messages.exportError'));
      console.error('Export failed:', err);
    }
  };

  // Truncate long query strings
  const truncateQuery = (query: string, maxLength = 25) => {
    return query.length > maxLength ? `${query.substring(0, maxLength)}...` : query;
  };

  // Render KPI card
  const renderKPICard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    color: string,
    change?: number,
    suffix?: string
  ) => (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginRight: 12,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span style={{ fontSize: 14, fontWeight: 400 }}>{suffix}</span>}
          </div>
        </div>
      </div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {change >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ color: '#8c8c8c', marginLeft: 8 }}>
            {compareWith === 'previous-year'
              ? t('admin:searchAnalytics.compare.previousYear')
              : t('admin:searchAnalytics.compare.previousPeriod')}
          </span>
        </div>
      )}
    </Card>
  );

  // Chart configurations
  const trendsChartData = data
    ? {
        labels: data.trends.map((t) =>
          format(new Date(t.timestamp), 'MMM dd')
        ),
        datasets: [
          {
            label: t('admin:searchAnalytics.kpis.totalSearches'),
            data: data.trends.map((t) => t.count),
            borderColor: '#1890ff',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: t('admin:searchAnalytics.kpis.uniqueUsers'),
            data: data.trends.map((t) => t.uniqueUsers),
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            fill: false,
            tension: 0.4,
          },
        ],
      }
    : null;

  const localeChartData = data
    ? {
        labels: data.localeDistribution.map((l) => l.locale.toUpperCase()),
        datasets: [
          {
            data: data.localeDistribution.map((l) => l.count),
            backgroundColor: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
          },
        ],
      }
    : null;

  const topQueriesChartData = data
    ? {
        labels: data.topQueries.map((q) => truncateQuery(q.query)),
        datasets: [
          {
            label: t('admin:searchAnalytics.table.count'),
            data: data.topQueries.map((q) => q.count),
            backgroundColor: '#1890ff',
          },
        ],
      }
    : null;

  const ctrChartData = data
    ? {
        labels: data.ctrByQuery.map((q) => truncateQuery(q.query)),
        datasets: [
          {
            label: t('admin:searchAnalytics.table.ctr'),
            data: data.ctrByQuery.map((q) => q.ctr * 100),
            backgroundColor: '#52c41a',
          },
        ],
      }
    : null;

  // Table columns for zero-result queries
  const zeroResultColumns = [
    {
      title: t('admin:searchAnalytics.table.query'),
      dataIndex: 'query',
      key: 'query',
      render: (query: string) => <Tag color="red">{query}</Tag>,
    },
    {
      title: t('admin:searchAnalytics.table.count'),
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ZeroResultQuery, b: ZeroResultQuery) => a.count - b.count,
    },
    {
      title: t('admin:searchAnalytics.table.lastSearched'),
      dataIndex: 'lastSearched',
      key: 'lastSearched',
      render: (date: string) => format(new Date(date), 'PPp'),
    },
  ];

  // Table columns for product clicks
  const productClickColumns = [
    {
      title: t('admin:searchAnalytics.table.productId'),
      dataIndex: 'productId',
      key: 'productId',
      render: (id: string) => (
        <a href={`/admin/products/show/${id}`} target="_blank" rel="noopener noreferrer">
          {id.substring(0, 8)}...
        </a>
      ),
    },
    {
      title: t('admin:searchAnalytics.table.clicks'),
      dataIndex: 'clicks',
      key: 'clicks',
      sorter: (a: ProductClickStats, b: ProductClickStats) => a.clicks - b.clicks,
    },
    {
      title: t('admin:searchAnalytics.table.avgPosition'),
      dataIndex: 'avgPosition',
      key: 'avgPosition',
      render: (pos: number) => pos.toFixed(1),
    },
    {
      title: t('admin:searchAnalytics.table.topQueries'),
      dataIndex: 'queries',
      key: 'queries',
      render: (queries: string[]) => (
        <Space size={[0, 4]} wrap>
          {queries.slice(0, 3).map((q, i) => (
            <Tag key={i}>{truncateQuery(q, 15)}</Tag>
          ))}
        </Space>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={fetchData}>
            {t('admin:searchAnalytics.messages.retry')}
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
            {t('admin:searchAnalytics.title')}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
            {t('admin:searchAnalytics.subtitle')}
          </p>
        </Col>
        <Col>
          <Space wrap>
            <Button.Group>
              <Button
                type={period === '7d' ? 'primary' : 'default'}
                onClick={() => handlePeriodChange('7d')}
              >
                {t('admin:searchAnalytics.period.7d')}
              </Button>
              <Button
                type={period === '30d' ? 'primary' : 'default'}
                onClick={() => handlePeriodChange('30d')}
              >
                {t('admin:searchAnalytics.period.30d')}
              </Button>
              <Button
                type={period === '90d' ? 'primary' : 'default'}
                onClick={() => handlePeriodChange('90d')}
              >
                {t('admin:searchAnalytics.period.90d')}
              </Button>
            </Button.Group>
            <RangePicker
              value={dateRange}
              onChange={(dates) => handleDateRangeChange(dates as DateRange)}
              format="MMM DD, YYYY"
              allowClear={false}
            />
            <Select
              value={compareWith}
              onChange={setCompareWith}
              style={{ width: 180 }}
              options={[
                { label: t('admin:searchAnalytics.compare.none'), value: 'none' },
                { label: t('admin:searchAnalytics.compare.previousPeriod'), value: 'previous-period' },
                { label: t('admin:searchAnalytics.compare.previousYear'), value: 'previous-year' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              {t('admin:searchAnalytics.actions.refresh')}
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>
              {t('admin:searchAnalytics.actions.exportCSV')}
            </Button>
          </Space>
        </Col>
      </Row>

      {data && (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              {renderKPICard(
                t('admin:searchAnalytics.kpis.totalSearches'),
                data.totalSearches,
                <SearchOutlined />,
                '#1890ff',
                data.periodComparison?.changes.searchesChange
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {renderKPICard(
                t('admin:searchAnalytics.kpis.overallCTR'),
                `${(data.overallCTR * 100).toFixed(1)}%`,
                <BarChartOutlined />,
                '#52c41a',
                data.periodComparison?.changes.ctrChange
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {renderKPICard(
                t('admin:searchAnalytics.kpis.uniqueUsers'),
                data.uniqueUsers,
                <UserOutlined />,
                '#722ed1'
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {renderKPICard(
                t('admin:searchAnalytics.kpis.avgResults'),
                data.avgResultCount.toFixed(1),
                <LineChartOutlined />,
                '#faad14',
                data.periodComparison?.changes.resultsChange
              )}
            </Col>
          </Row>

          {/* Charts Row 1: Trends and Locale */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title={t('admin:searchAnalytics.charts.searchTrends')} extra={<LineChartOutlined />}>
                {trendsChartData && (
                  <Line
                    data={trendsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                    height={300}
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('admin:searchAnalytics.charts.localeDistribution')} extra={<GlobalOutlined />}>
                {localeChartData && data.localeDistribution.length > 0 ? (
                  <Doughnut
                    data={localeChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const locale = data.localeDistribution[context.dataIndex];
                              return `${locale.locale.toUpperCase()}: ${locale.count.toLocaleString()} (${locale.percentage.toFixed(1)}%)`;
                            },
                          },
                        },
                      },
                    }}
                    height={250}
                  />
                ) : (
                  <Empty description={t('admin:searchAnalytics.messages.noData')} />
                )}
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2: Top Queries and CTR */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={t('admin:searchAnalytics.charts.topQueries')} extra={<BarChartOutlined />}>
                {topQueriesChartData && data.topQueries.length > 0 ? (
                  <Bar
                    data={topQueriesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                        },
                      },
                    }}
                    height={300}
                  />
                ) : (
                  <Empty description={t('admin:searchAnalytics.messages.noData')} />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t('admin:searchAnalytics.charts.ctrByQuery')} extra={<BarChartOutlined />}>
                {ctrChartData && data.ctrByQuery.length > 0 ? (
                  <Bar
                    data={ctrChartData}
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
                          max: 100,
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                      },
                    }}
                    height={300}
                  />
                ) : (
                  <Empty description={t('admin:searchAnalytics.messages.noData')} />
                )}
              </Card>
            </Col>
          </Row>

          {/* Zero-Result Queries Table */}
          <Card title={t('admin:searchAnalytics.charts.zeroResults')} style={{ marginBottom: 24 }}>
            {data.zeroResultQueries.length > 0 ? (
              <Table
                columns={zeroResultColumns}
                dataSource={data.zeroResultQueries.map((q, i) => ({ ...q, key: i }))}
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            ) : (
              <Empty description={t('admin:searchAnalytics.empty.zeroResults')} />
            )}
          </Card>

          {/* Product Click Stats Table */}
          {data.productStats && data.productStats.length > 0 && (
            <Card title={t('admin:searchAnalytics.charts.productClicks')}>
              <Table
                columns={productClickColumns}
                dataSource={data.productStats.map((p, i) => ({ ...p, key: i }))}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

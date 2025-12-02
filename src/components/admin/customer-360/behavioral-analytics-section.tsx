"use client";

import React from "react";
import { Card, Space, Typography, Row, Col, Statistic } from "antd";
import { 
  BarChartOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { useShow } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";

const { Text } = Typography;

interface AnalyticsData {
  topCategories: Array<{
    category: string;
    viewCount: number;
    purchaseCount: number;
    revenue: number;
  }>;
  sessionStats: {
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  deviceBreakdown: Array<{
    device: 'mobile' | 'desktop' | 'tablet';
    sessions: number;
    percentage: number;
  }>;
  shoppingTimes: Array<{
    hour: number;
    dayOfWeek: string;
    sessions: number;
    orders: number;
  }>;
}

interface BehavioralAnalyticsSectionProps {
  customerId: string;
}

export function BehavioralAnalyticsSection({ customerId }: BehavioralAnalyticsSectionProps) {
  const { t } = useTranslation(["common", "admin"]);

  const { query } = useShow<AnalyticsData>({
    resource: `admin/customers/${customerId}/analytics`,
    id: customerId,
  });

  const analyticsData = query.data?.data;
  const isLoading = query.isLoading;

  // Colors for charts
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  const DEVICE_COLORS = {
    mobile: '#52c41a',
    desktop: '#1890ff', 
    tablet: '#faad14'
  };

  const getDeviceIcon = (device: string) => {
    const icons = {
      mobile: <MobileOutlined style={{ color: DEVICE_COLORS.mobile }} />,
      desktop: <DesktopOutlined style={{ color: DEVICE_COLORS.desktop }} />,
      tablet: <TabletOutlined style={{ color: DEVICE_COLORS.tablet }} />
    };
    return icons[device as keyof typeof icons] || <MobileOutlined />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Prepare shopping times heatmap data
  const shoppingHeatmapData = React.useMemo(() => {
    if (!analyticsData?.shoppingTimes) return [];
    
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return daysOfWeek.map(day => {
      const dayData = { day };
      hours.forEach(hour => {
        const timeSlot = analyticsData.shoppingTimes.find(
          slot => slot.dayOfWeek === day && slot.hour === hour
        );
        (dayData as any)[`h${hour}`] = timeSlot?.sessions || 0;
      });
      return dayData;
    });
  }, [analyticsData?.shoppingTimes]);

  if (isLoading) {
    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            {t("admin:customers.360.analytics.title")}
          </Space>
        }
        loading={true}
        style={{ height: "100%" }}
      />
    );
  }

  if (!analyticsData) {
    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            {t("admin:customers.360.analytics.title")}
          </Space>
        }
        style={{ height: "100%" }}
      >
        <Text type="secondary">{t("admin:customers.360.analytics.noData")}</Text>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <BarChartOutlined />
          {t("admin:customers.360.analytics.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Session Statistics */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={t("admin:customers.360.analytics.totalSessions")}
              value={analyticsData.sessionStats.totalSessions}
              prefix={<EyeOutlined />}
              valueStyle={{ fontSize: "16px" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("admin:customers.360.analytics.avgSessionDuration")}
              value={formatDuration(analyticsData.sessionStats.averageSessionDuration)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: "16px" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("admin:customers.360.analytics.bounceRate")}
              value={analyticsData.sessionStats.bounceRate}
              suffix="%"
              valueStyle={{ fontSize: "16px" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("admin:customers.360.analytics.pagesPerSession")}
              value={analyticsData.sessionStats.pagesPerSession}
              precision={1}
              valueStyle={{ fontSize: "16px" }}
            />
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={16}>
          {/* Top Categories Chart */}
          <Col xs={24} lg={12}>
            <Card size="small" title={t("admin:customers.360.analytics.topCategories")}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.topCategories.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      t(`admin:customers.360.analytics.${name}`)
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => t(`admin:customers.360.analytics.${value}`)}
                  />
                  <Bar dataKey="viewCount" fill="#1890ff" name="viewCount" />
                  <Bar dataKey="purchaseCount" fill="#52c41a" name="purchaseCount" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Device Breakdown Chart */}
          <Col xs={24} lg={12}>
            <Card size="small" title={t("admin:customers.360.analytics.deviceBreakdown")}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analyticsData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="sessions"
                  >
                    {analyticsData.deviceBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={DEVICE_COLORS[entry.device as keyof typeof DEVICE_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} (${props.payload.percentage}%)`,
                      t(`admin:customers.360.analytics.${props.payload.device}`)
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {t(`admin:customers.360.analytics.${entry.payload.device}`)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Device Breakdown Stats */}
        <Row gutter={16}>
          {analyticsData.deviceBreakdown.map((device) => (
            <Col key={device.device} span={8}>
              <Card size="small">
                <Statistic
                  title={t(`admin:customers.360.analytics.${device.device}`)}
                  value={device.sessions}
                  suffix={`(${device.percentage}%)`}
                  prefix={getDeviceIcon(device.device)}
                  valueStyle={{ fontSize: "14px" }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Shopping Times Heatmap */}
        <Card size="small" title={t("admin:customers.360.analytics.shoppingTimes")}>
          <div style={{ fontSize: "11px" }}>
            <Text type="secondary">
              {t("admin:customers.360.analytics.shoppingTimesDescription")}
            </Text>
            
            {/* Peak Shopping Times */}
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: "12px" }}>
                {t("admin:customers.360.analytics.peakTimes")}:
              </Text>
              <Space wrap style={{ marginTop: 4 }}>
                {analyticsData.shoppingTimes
                  .sort((a, b) => b.sessions - a.sessions)
                  .slice(0, 3)
                  .map((timeSlot, index) => (
                    <Text key={index} style={{ fontSize: "11px" }}>
                      {timeSlot.dayOfWeek} {timeSlot.hour}:00 ({timeSlot.sessions} {t("admin:customers.360.analytics.sessions")})
                    </Text>
                  ))
                }
              </Space>
            </div>
          </div>
        </Card>
      </Space>
    </Card>
  );
}
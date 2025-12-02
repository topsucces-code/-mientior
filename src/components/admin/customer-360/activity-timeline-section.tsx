"use client";

import React, { useState, useCallback } from "react";
import { Card, Timeline, Space, Typography, Button, Select, DatePicker, Row, Col, Tag, Spin } from "antd";
import { 
  HistoryOutlined,
  ShoppingOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  MailOutlined,
  UserOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined
} from "@ant-design/icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import { useIsMobile } from "@/hooks/use-media-query";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface TimelineEvent {
  id: string;
  type: 'order' | 'support' | 'loyalty' | 'marketing' | 'account';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    orderId?: string;
    ticketId?: string;
    campaignId?: string;
    amount?: number;
    points?: number;
    status?: string;
  };
}

interface ActivityTimelineSectionProps {
  customerId: string;
}

export function ActivityTimelineSection({ customerId }: ActivityTimelineSectionProps) {
  const { t } = useTranslation(["common", "admin"]);
  const isMobile = useIsMobile();
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Fetch timeline events with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['customer-timeline', customerId, eventTypeFilter, dateRange],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: '10',
        offset: pageParam.toString(),
      });

      if (eventTypeFilter.length > 0) {
        params.append('type', eventTypeFilter.join(','));
      }

      if (dateRange[0] && dateRange[1]) {
        params.append('from', dateRange[0].toISOString());
        params.append('to', dateRange[1].toISOString());
      }

      const response = await fetch(`/api/admin/customers/${customerId}/timeline?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline events');
      }
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length * 10 : undefined;
    },
    initialPageParam: 0,
  });

  const events = data?.pages.flatMap(page => page.events) || [];

  const getEventIcon = (type: string) => {
    const icons = {
      order: <ShoppingOutlined style={{ color: "#1890ff" }} />,
      support: <CustomerServiceOutlined style={{ color: "#faad14" }} />,
      loyalty: <GiftOutlined style={{ color: "#52c41a" }} />,
      marketing: <MailOutlined style={{ color: "#722ed1" }} />,
      account: <UserOutlined style={{ color: "#13c2c2" }} />
    };
    return icons[type as keyof typeof icons] || <HistoryOutlined />;
  };

  const getEventColor = (type: string) => {
    const colors = {
      order: "#1890ff",
      support: "#faad14", 
      loyalty: "#52c41a",
      marketing: "#722ed1",
      account: "#13c2c2"
    };
    return colors[type as keyof typeof colors] || "#d9d9d9";
  };

  const formatEventMetadata = (event: TimelineEvent) => {
    if (!event.metadata) return null;

    const { metadata } = event;
    const items = [];

    if (metadata.amount) {
      items.push(
        <Tag key="amount" color="blue">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(metadata.amount)}
        </Tag>
      );
    }

    if (metadata.points) {
      items.push(
        <Tag key="points" color="green">
          {metadata.points > 0 ? '+' : ''}{metadata.points} {t("admin:customers.360.timeline.points")}
        </Tag>
      );
    }

    if (metadata.status) {
      items.push(
        <Tag key="status" color="orange">
          {t(`admin:customers.360.timeline.status.${metadata.status}`)}
        </Tag>
      );
    }

    return items.length > 0 ? <Space wrap>{items}</Space> : null;
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleFiltersChange = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearFilters = () => {
    setEventTypeFilter([]);
    setDateRange([null, null]);
  };

  const timelineItems = events.map((event) => {
    const isExpanded = expandedEvents.has(event.id);
    const metadata = formatEventMetadata(event);

    return {
      dot: getEventIcon(event.type),
      color: getEventColor(event.type),
      children: (
        <div key={event.id}>
          <Row justify="space-between" align="top">
            <Col flex="auto">
              <Space direction="vertical" size="small">
                <Space wrap>
                  <Text strong style={{ fontSize: isMobile ? "11px" : "13px" }}>
                    {event.title}
                  </Text>
                  <Tag size="small" color={getEventColor(event.type)}>
                    {t(`admin:customers.360.timeline.types.${event.type}`)}
                  </Tag>
                </Space>
                
                <Text 
                  style={{ 
                    fontSize: isMobile ? "10px" : "12px", 
                    color: "#666",
                    display: isExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'none' : (isMobile ? 1 : 2),
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: isMobile ? "1.3" : "1.5"
                  }}
                >
                  {event.description}
                </Text>

                {metadata && (
                  <div style={{ marginTop: 4 }}>
                    {metadata}
                  </div>
                )}

                {event.description.length > 100 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => toggleEventExpansion(event.id)}
                    style={{ padding: 0, height: "auto", fontSize: "11px" }}
                  >
                    {isExpanded ? (
                      <Space>
                        <UpOutlined />
                        {t("admin:customers.360.timeline.showLess")}
                      </Space>
                    ) : (
                      <Space>
                        <DownOutlined />
                        {t("admin:customers.360.timeline.showMore")}
                      </Space>
                    )}
                  </Button>
                )}
              </Space>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: isMobile ? "9px" : "11px" }}>
                {dayjs(event.timestamp).format(isMobile ? "MMM D" : "MMM D, HH:mm")}
              </Text>
            </Col>
          </Row>
        </div>
      ),
    };
  });

  return (
    <Card 
      title={
        <Space>
          <HistoryOutlined />
          {t("admin:customers.360.timeline.title")}
        </Space>
      }
      extra={
        <Button
          type="link"
          size="small"
          icon={<FilterOutlined />}
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          {t("common.filters")}
        </Button>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Filters */}
        {filtersVisible && (
          <Card size="small" style={{ background: "#fafafa" }}>
            <Space direction="vertical" style={{ width: "100%" }} size={isMobile ? "small" : "middle"}>
              <Row gutter={isMobile ? 8 : 16}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <Text strong style={{ fontSize: isMobile ? "11px" : "12px" }}>
                      {t("admin:customers.360.timeline.eventType")}
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder={t("admin:customers.360.timeline.selectEventTypes")}
                      value={eventTypeFilter}
                      onChange={setEventTypeFilter}
                      style={{ width: "100%" }}
                      size="small"
                      options={[
                        { value: 'order', label: t("admin:customers.360.timeline.types.order") },
                        { value: 'support', label: t("admin:customers.360.timeline.types.support") },
                        { value: 'loyalty', label: t("admin:customers.360.timeline.types.loyalty") },
                        { value: 'marketing', label: t("admin:customers.360.timeline.types.marketing") },
                        { value: 'account', label: t("admin:customers.360.timeline.types.account") },
                      ]}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <Text strong style={{ fontSize: isMobile ? "11px" : "12px" }}>
                      {t("admin:customers.360.timeline.dateRange")}
                    </Text>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </Space>
                </Col>
              </Row>
              
              <Row justify="space-between">
                <Col>
                  <Button size="small" onClick={clearFilters}>
                    {t("common.clearFilters")}
                  </Button>
                </Col>
                <Col>
                  <Button type="primary" size="small" onClick={handleFiltersChange}>
                    {t("common.applyFilters")}
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        )}

        {/* Timeline */}
        <div style={{ 
          maxHeight: isMobile ? "300px" : "500px", 
          overflowY: "auto",
          padding: isMobile ? "8px" : "16px"
        }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" />
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Text type="secondary">
                {t("admin:customers.360.timeline.noEvents")}
              </Text>
            </div>
          ) : (
            <>
              <Timeline items={timelineItems} />
              
              {/* Load More Button */}
              {hasNextPage && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Button
                    onClick={() => fetchNextPage()}
                    loading={isFetchingNextPage}
                    size="small"
                  >
                    {isFetchingNextPage
                      ? t("admin:customers.360.timeline.loading")
                      : t("admin:customers.360.timeline.loadMore")
                    }
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Space>
    </Card>
  );
}
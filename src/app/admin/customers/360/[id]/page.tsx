"use client";

import React from "react";
import { use } from "react";
import { Row, Col, Card, Spin, Button, Collapse, Space, Drawer } from "antd";
import { DownloadOutlined, MenuOutlined, UpOutlined, DownOutlined } from "@ant-design/icons";
import { useShow } from "@refinedev/core";
import { ProfileCard } from "@/components/admin/customer-360/profile-card";
import { MetricsCard } from "@/components/admin/customer-360/metrics-card";
import { HealthScoreCard } from "@/components/admin/customer-360/health-score-card";
import { ChurnRiskCard } from "@/components/admin/customer-360/churn-risk-card";
import { OrderHistorySection } from "@/components/admin/customer-360/order-history-section";
import { LoyaltyStatusSection } from "@/components/admin/customer-360/loyalty-status-section";
import { MarketingEngagementSection } from "@/components/admin/customer-360/marketing-engagement-section";
import { SupportTicketSection } from "@/components/admin/customer-360/support-ticket-section";
import { ActivityTimelineSection } from "@/components/admin/customer-360/activity-timeline-section";
import { NotesAndTagsSection } from "@/components/admin/customer-360/notes-and-tags-section";
import { BehavioralAnalyticsSection } from "@/components/admin/customer-360/behavioral-analytics-section";
import { QuickActionsToolbar } from "@/components/admin/customer-360/quick-actions-toolbar";
import { ExportModal } from "@/components/admin/customer-360/export-modal";
import { useTranslation } from "react-i18next";
import { useMediaQuery, useIsMobile, useIsTablet } from "@/hooks/use-media-query";

interface Customer360Data {
  profile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    registrationDate: string;
    accountStatus: string;
    addresses: Array<{
      id: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
    }>;
  };
  metrics: {
    lifetimeValue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalSpent: number;
    daysSinceLastPurchase: number;
    purchaseFrequency: number;
    customerTenure: number;
  };
  healthScore: {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: {
      purchase: number;
      engagement: number;
      support: number;
      recency: number;
    };
    recommendations: string[];
  };
  churnRisk: {
    level: 'low' | 'medium' | 'high';
    score: number;
    factors: {
      daysSinceLastPurchase: number;
      engagementDecline: number;
      supportIssues: number;
    };
    retentionStrategies: string[];
  };
  segments: Array<{
    id: string;
    name: string;
    criteria: any;
    isAutomatic: boolean;
    assignedAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string;
    assignedAt: string;
  }>;
}

export default function Customer360Dashboard({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation(["common", "admin"]);
  const { id } = use(params);
  const [exportModalVisible, setExportModalVisible] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState<string[]>([]);
  const [quickActionsDrawerVisible, setQuickActionsDrawerVisible] = React.useState(false);
  
  // Responsive breakpoints
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  const { query: customer360Query } = useShow<Customer360Data>({
    resource: "admin/customers",
    id: id,
    meta: {
      endpoint: "360"
    }
  });

  const customer360Data = customer360Query.data?.data;
  const isLoading = customer360Query.isLoading;

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!customer360Data) {
    return (
      <div style={{ padding: "24px" }}>
        <Card>
          <p>{t("admin:customers.360.notFound")}</p>
        </Card>
      </div>
    );
  }

  const handleQuickActionComplete = (_action: string, _result: unknown) => {
    // Refresh the customer data after a quick action
    customer360Query.refetch();
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionKey) 
        ? prev.filter(key => key !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const isSectionCollapsed = (sectionKey: string) => collapsedSections.includes(sectionKey);

  const renderCollapsibleSection = (
    key: string,
    title: string,
    children: React.ReactNode,
    defaultCollapsed = false
  ) => {
    const isCollapsed = isSectionCollapsed(key);
    
    if (!isMobile) {
      return children;
    }

    return (
      <Card
        title={
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => toggleSection(key)}
          >
            <span>{title}</span>
            {isCollapsed ? <DownOutlined /> : <UpOutlined />}
          </div>
        }
        style={{ marginBottom: 16 }}
        bodyStyle={{ 
          padding: isCollapsed ? 0 : undefined,
          display: isCollapsed ? 'none' : 'block'
        }}
      >
        {children}
      </Card>
    );
  };

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      {/* Header with Quick Actions and Export */}
      <div style={{ 
        marginBottom: isMobile ? 16 : 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: isMobile ? 8 : 16 
      }}>
        {isMobile ? (
          <>
            <Button
              type="default"
              icon={<MenuOutlined />}
              onClick={() => setQuickActionsDrawerVisible(true)}
              size="large"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              {t("admin:customers.quickActions.title")}
            </Button>
            
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
              size="large"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              {isMobile ? "" : t("admin:customers.export.button")}
            </Button>
          </>
        ) : (
          <>
            <QuickActionsToolbar
              customerId={id}
              customerName={customer360Data.profile.name}
              customerEmail={customer360Data.profile.email}
              onActionComplete={handleQuickActionComplete}
            />
            
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setExportModalVisible(true)}
              size="large"
            >
              {t("admin:customers.export.button")}
            </Button>
          </>
        )}
      </div>

      {isMobile ? (
        // Mobile Layout - Single column with collapsible sections
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Essential Info - Always visible */}
          <ProfileCard profile={customer360Data.profile} />
          
          {renderCollapsibleSection(
            "metrics",
            t("admin:customers.360.metrics.title"),
            <MetricsCard metrics={customer360Data.metrics} />
          )}
          
          {renderCollapsibleSection(
            "health-churn",
            t("admin:customers.360.health.title"),
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <HealthScoreCard healthScore={customer360Data.healthScore} />
              <ChurnRiskCard churnRisk={customer360Data.churnRisk} />
            </Space>
          )}
          
          {renderCollapsibleSection(
            "orders",
            t("admin:customers.360.orders.title"),
            <OrderHistorySection customerId={id} />,
            true
          )}
          
          {renderCollapsibleSection(
            "loyalty",
            t("admin:customers.360.loyalty.title"),
            <LoyaltyStatusSection customerId={id} />,
            true
          )}
          
          {renderCollapsibleSection(
            "marketing",
            t("admin:customers.360.marketing.title"),
            <MarketingEngagementSection customerId={id} />,
            true
          )}
          
          {renderCollapsibleSection(
            "support",
            t("admin:customers.360.support.title"),
            <SupportTicketSection customerId={id} />,
            true
          )}
          
          {renderCollapsibleSection(
            "timeline",
            t("admin:customers.360.timeline.title"),
            <ActivityTimelineSection customerId={id} />,
            true
          )}
          
          {renderCollapsibleSection(
            "notes-tags",
            t("admin:customers.360.notes.title"),
            <NotesAndTagsSection 
              customerId={id} 
              tags={customer360Data.tags}
              segments={customer360Data.segments}
            />,
            true
          )}
          
          {renderCollapsibleSection(
            "analytics",
            t("admin:customers.360.analytics.title"),
            <BehavioralAnalyticsSection customerId={id} />,
            true
          )}
        </Space>
      ) : (
        // Desktop/Tablet Layout - Multi-column grid
        <>
          {/* Top Row - Profile, Metrics, Health Score, Churn Risk */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <ProfileCard profile={customer360Data.profile} />
            </Col>
            <Col xs={24} lg={8}>
              <MetricsCard metrics={customer360Data.metrics} />
            </Col>
            <Col xs={24} lg={8}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <HealthScoreCard healthScore={customer360Data.healthScore} />
                </Col>
                <Col span={24}>
                  <ChurnRiskCard churnRisk={customer360Data.churnRisk} />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Second Row - Order History, Loyalty, Marketing */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <OrderHistorySection customerId={id} />
            </Col>
            <Col xs={24} lg={8}>
              <LoyaltyStatusSection customerId={id} />
            </Col>
            <Col xs={24} lg={8}>
              <MarketingEngagementSection customerId={id} />
            </Col>
          </Row>

          {/* Third Row - Support, Timeline, Analytics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <SupportTicketSection customerId={id} />
            </Col>
            <Col xs={24} lg={16}>
              <ActivityTimelineSection customerId={id} />
            </Col>
          </Row>

          {/* Fourth Row - Notes & Tags, Behavioral Analytics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <NotesAndTagsSection 
                customerId={id} 
                tags={customer360Data.tags}
                segments={customer360Data.segments}
              />
            </Col>
            <Col xs={24} lg={16}>
              <BehavioralAnalyticsSection customerId={id} />
            </Col>
          </Row>
        </>
      )}

      {/* Mobile Quick Actions Drawer */}
      <Drawer
        title={t("admin:customers.quickActions.title")}
        placement="bottom"
        onClose={() => setQuickActionsDrawerVisible(false)}
        open={quickActionsDrawerVisible}
        height="auto"
        styles={{
          body: { padding: 16 }
        }}
      >
        <QuickActionsToolbar
          customerId={id}
          customerName={customer360Data.profile.name}
          customerEmail={customer360Data.profile.email}
          onActionComplete={(action, result) => {
            handleQuickActionComplete(action, result);
            setQuickActionsDrawerVisible(false);
          }}
        />
      </Drawer>

      {/* Export Modal */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        customerId={id}
        customerName={customer360Data.profile.name}
      />
    </div>
  );
}
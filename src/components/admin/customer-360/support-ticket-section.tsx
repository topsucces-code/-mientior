"use client";

import React, { useState } from "react";
import { Card, Table, Space, Tag, Button, Modal, Typography, Row, Col, Statistic, Badge } from "antd";
import { 
  CustomerServiceOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { useTable, useShow } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import Link from "next/link";

const { Text } = Typography;

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  category: string;
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  messages: Array<{
    id: string;
    content: string;
    isFromCustomer: boolean;
    createdAt: string;
    author: {
      name: string;
      avatar?: string;
    };
  }>;
}

interface SupportTicketSectionProps {
  customerId: string;
}

export function SupportTicketSection({ customerId }: SupportTicketSectionProps) {
  const { t } = useTranslation(["common", "admin"]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch support tickets for this customer
  const { tableQuery } = useTable<SupportTicket>({
    resource: `admin/customers/${customerId}/support`,
    pagination: {
      pageSize: 5,
    },
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
  });

  // Fetch ticket details when modal opens
  const { query: ticketDetailQuery } = useShow<TicketDetail>({
    resource: "admin/support-tickets",
    id: selectedTicketId || "",
    queryOptions: {
      enabled: !!selectedTicketId,
    },
  });

  const tickets = tableQuery.data?.data || [];
  const totalTickets = tableQuery.data?.total || 0;
  const isLoading = tableQuery.isLoading;
  const ticketDetail = ticketDetailQuery.data?.data;

  // Calculate support metrics
  const supportMetrics = React.useMemo(() => {
    if (!tickets.length) return { openTickets: 0, averageResolutionTime: 0 };
    
    const openTickets = tickets.filter(ticket => 
      ticket.status === 'open' || ticket.status === 'in_progress'
    ).length;
    
    const resolvedTickets = tickets.filter(ticket => 
      ticket.status === 'resolved' || ticket.status === 'closed'
    );
    
    const averageResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, ticket) => {
          const resolutionTime = dayjs(ticket.updatedAt).diff(dayjs(ticket.createdAt), 'hours');
          return sum + resolutionTime;
        }, 0) / resolvedTickets.length
      : 0;
    
    return { openTickets, averageResolutionTime };
  }, [tickets]);

  const getStatusColor = (status: string) => {
    const colors = {
      open: "red",
      in_progress: "orange",
      resolved: "green",
      closed: "blue"
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      open: <ExclamationCircleOutlined style={{ color: "#f5222d" }} />,
      in_progress: <ClockCircleOutlined style={{ color: "#faad14" }} />,
      resolved: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      closed: <CheckCircleOutlined style={{ color: "#1890ff" }} />
    };
    return icons[status as keyof typeof icons] || <ClockCircleOutlined />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "green",
      medium: "orange",
      high: "red",
      urgent: "magenta"
    };
    return colors[priority as keyof typeof colors] || "default";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <WarningOutlined />;
    }
    return null;
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setModalVisible(true);
  };

  const columns = [
    {
      title: t("admin:support.fields.ticketNumber"),
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      render: (text: string, record: SupportTicket) => (
        <Link href={`/admin/support/tickets/show/${record.id}`}>
          <Text strong style={{ color: "#1890ff" }}>{text}</Text>
        </Link>
      ),
    },
    {
      title: t("admin:support.fields.subject"),
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: t("admin:support.fields.priority"),
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (priority: string) => (
        <Tag 
          color={getPriorityColor(priority)} 
          icon={getPriorityIcon(priority)}
          size="small"
        >
          {t(`admin:support.priority.${priority.toUpperCase()}`)}
        </Tag>
      ),
    },
    {
      title: t("admin:support.fields.status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)} size="small">
            {t(`admin:support.status.${status.toUpperCase()}`)}
          </Tag>
        </Space>
      ),
    },
    {
      title: t("common.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 80,
      render: (date: string) => (
        <Text style={{ fontSize: "12px" }}>
          {dayjs(date).format("MMM D")}
        </Text>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 60,
      render: (_: unknown, record: SupportTicket) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Card 
        title={
          <Space>
            <CustomerServiceOutlined />
            {t("admin:customers.360.support.title")}
            {supportMetrics.openTickets > 0 && (
              <Badge count={supportMetrics.openTickets} style={{ backgroundColor: '#f5222d' }} />
            )}
          </Space>
        }
        extra={
          <Link href={`/admin/support/tickets?customerId=${customerId}`}>
            <Button type="link" size="small">
              {t("admin:customers.360.support.viewAll")}
            </Button>
          </Link>
        }
        style={{ height: "100%" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Support Metrics */}
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.support.totalTickets")}
                value={totalTickets}
                prefix={<CustomerServiceOutlined />}
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.support.openTickets")}
                value={supportMetrics.openTickets}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ 
                  fontSize: "16px", 
                  color: supportMetrics.openTickets > 0 ? "#f5222d" : "#52c41a" 
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("admin:customers.360.support.avgResolution")}
                value={supportMetrics.averageResolutionTime}
                suffix="h"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: "16px" }}
                precision={1}
              />
            </Col>
          </Row>

          {/* Tickets Table */}
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
            rowClassName={(record) => 
              record.status === 'open' || record.status === 'in_progress' 
                ? 'highlight-row' 
                : ''
            }
          />
        </Space>
      </Card>

      {/* Ticket Detail Modal */}
      <Modal
        title={
          <Space>
            <CustomerServiceOutlined />
            {t("admin:customers.360.support.ticketDetails")}
            {ticketDetail && (
              <Tag color="blue">{ticketDetail.ticketNumber}</Tag>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedTicketId(null);
        }}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            {t("common.close")}
          </Button>,
          ticketDetail && (
            <Link key="view" href={`/admin/support/tickets/show/${ticketDetail.id}`}>
              <Button type="primary">
                {t("admin:customers.360.support.viewFullTicket")}
              </Button>
            </Link>
          ),
        ]}
        width={800}
        loading={ticketDetailQuery.isLoading}
      >
        {ticketDetail && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {/* Ticket Summary */}
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:support.fields.subject")}</Text>
                  <Text>{ticketDetail.subject}</Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:support.fields.category")}</Text>
                  <Text>{ticketDetail.category}</Text>
                </Space>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:support.fields.status")}</Text>
                  <Space>
                    {getStatusIcon(ticketDetail.status)}
                    <Tag color={getStatusColor(ticketDetail.status)}>
                      {t(`admin:support.status.${ticketDetail.status.toUpperCase()}`)}
                    </Tag>
                  </Space>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:support.fields.priority")}</Text>
                  <Tag 
                    color={getPriorityColor(ticketDetail.priority)}
                    icon={getPriorityIcon(ticketDetail.priority)}
                  >
                    {t(`admin:support.priority.${ticketDetail.priority.toUpperCase()}`)}
                  </Tag>
                </Space>
              </Col>
              <Col span={8}>
                <Space direction="vertical" size="small">
                  <Text strong>{t("admin:support.fields.created")}</Text>
                  <Text>{dayjs(ticketDetail.createdAt).format("MMM D, YYYY HH:mm")}</Text>
                </Space>
              </Col>
            </Row>

            {/* Assigned To */}
            {ticketDetail.assignedTo && (
              <Row>
                <Col span={12}>
                  <Space direction="vertical" size="small">
                    <Text strong>{t("admin:support.fields.assignedTo")}</Text>
                    <Text>{ticketDetail.assignedTo.name}</Text>
                  </Space>
                </Col>
              </Row>
            )}

            {/* Description */}
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong>{t("admin:support.fields.description")}</Text>
              <div style={{ 
                padding: 12, 
                background: "#f5f5f5", 
                borderRadius: 4,
                whiteSpace: "pre-wrap"
              }}>
                <Text>{ticketDetail.description}</Text>
              </div>
            </Space>

            {/* Recent Messages */}
            {ticketDetail.messages && ticketDetail.messages.length > 0 && (
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Text strong>{t("admin:support.fields.recentMessages")}</Text>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {ticketDetail.messages.slice(0, 3).map((message) => (
                    <div 
                      key={message.id}
                      style={{ 
                        padding: 8, 
                        margin: "4px 0",
                        background: message.isFromCustomer ? "#e6f7ff" : "#f6ffed",
                        borderRadius: 4,
                        borderLeft: `3px solid ${message.isFromCustomer ? "#1890ff" : "#52c41a"}`
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginBottom: 4 
                      }}>
                        <Text strong style={{ fontSize: "12px" }}>
                          {message.author.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {dayjs(message.createdAt).format("MMM D, HH:mm")}
                        </Text>
                      </div>
                      <Text style={{ fontSize: "12px" }}>{message.content}</Text>
                    </div>
                  ))}
                </div>
              </Space>
            )}
          </Space>
        )}
      </Modal>

      <style jsx>{`
        :global(.highlight-row) {
          background-color: #fff2e8 !important;
        }
        :global(.highlight-row:hover) {
          background-color: #ffe7ba !important;
        }
      `}</style>
    </>
  );
}
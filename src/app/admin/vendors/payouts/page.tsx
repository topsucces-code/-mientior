'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Typography, Row, Col, Statistic, Select, DatePicker, InputNumber, Descriptions } from 'antd';
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SendOutlined, EyeOutlined } from '@ant-design/icons';
import { useCreate, useUpdate } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface VendorPayout {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    businessName: string;
    email: string;
    bankDetails?: {
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
    };
  };
  amount: number;
  period: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paidAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'warning', icon: <ClockCircleOutlined /> },
  PROCESSING: { color: 'processing', icon: <ClockCircleOutlined spin /> },
  PAID: { color: 'success', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', icon: <CloseCircleOutlined /> },
};

export default function VendorPayoutsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<VendorPayout>({
    resource: 'vendor-payouts',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: createPayout } = useCreate();
  const { mutate: updatePayout } = useUpdate();

  const handleCreatePayout = () => {
    form.resetFields();
    form.setFieldsValue({ status: 'PENDING', period: dayjs().format('YYYY-MM') });
    setPayoutModalVisible(true);
  };

  const handleViewDetails = (record: VendorPayout) => {
    setSelectedPayout(record);
    setDetailsModalVisible(true);
  };

  const handleMarkAsPaid = (record: VendorPayout) => {
    updatePayout({ resource: 'vendor-payouts', id: record.id, values: { status: 'PAID', paidAt: new Date().toISOString() } }, {
      onSuccess: () => message.success('Payout marked as paid'),
    });
  };

  const handleMarkAsFailed = (record: VendorPayout) => {
    updatePayout({ resource: 'vendor-payouts', id: record.id, values: { status: 'FAILED' } }, {
      onSuccess: () => message.success('Payout marked as failed'),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      createPayout({ resource: 'vendor-payouts', values }, {
        onSuccess: () => {
          message.success('Payout created');
          setPayoutModalVisible(false);
          setSubmitting(false);
        },
        onError: () => setSubmitting(false),
      });
    } catch (error) {
      console.error('Validation failed:', error);
      setSubmitting(false);
    }
  };

  // Calculate stats
  const payouts = tableProps.dataSource || [];
  const totalPending = payouts.filter((p: VendorPayout) => p.status === 'PENDING').reduce((acc: number, p: VendorPayout) => acc + p.amount, 0);
  const totalPaid = payouts.filter((p: VendorPayout) => p.status === 'PAID').reduce((acc: number, p: VendorPayout) => acc + p.amount, 0);
  const pendingCount = payouts.filter((p: VendorPayout) => p.status === 'PENDING').length;

  const columns = [
    {
      title: t('admin:vendors.payouts.vendor', 'Vendor'),
      key: 'vendor',
      render: (_: unknown, record: VendorPayout) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.vendor?.businessName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.vendor?.email}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:vendors.payouts.amount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)}
        </Text>
      ),
    },
    {
      title: t('admin:vendors.payouts.period', 'Period'),
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => <Tag>{period}</Tag>,
    },
    {
      title: t('admin:vendors.payouts.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', icon: null };
        return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
      },
    },
    {
      title: t('admin:vendors.payouts.paidAt', 'Paid At'),
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: t('admin:vendors.payouts.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: VendorPayout) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          {record.status === 'PENDING' && (
            <>
              <Button type="link" size="small" onClick={() => handleMarkAsPaid(record)}>
                Mark Paid
              </Button>
              <Button type="link" size="small" danger onClick={() => handleMarkAsFailed(record)}>
                Failed
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><DollarOutlined /> {t('admin:vendors.payouts.title', 'Vendor Payouts')}</Title>
          <Text type="secondary">{t('admin:vendors.payouts.subtitle', 'Manage vendor commission payouts')}</Text>
        </div>
        <Button type="primary" icon={<SendOutlined />} onClick={handleCreatePayout}>
          {t('admin:vendors.payouts.create', 'Create Payout')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Pending Payouts" 
              value={totalPending} 
              precision={2}
              prefix="€"
              suffix={<Tag color="warning">{pendingCount}</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Total Paid (This Month)" 
              value={totalPaid} 
              precision={2}
              prefix="€"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic 
              title="Processing" 
              value={payouts.filter((p: VendorPayout) => p.status === 'PROCESSING').length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search by vendor..." allowClear />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by status" allowClear style={{ width: '100%' }}>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
              <Select.Option value="PAID">Paid</Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      {/* Create Payout Modal */}
      <Modal
        title="Create Payout"
        open={payoutModalVisible}
        onOk={handleSubmit}
        onCancel={() => setPayoutModalVisible(false)}
        confirmLoading={submitting}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vendorId" label="Vendor" rules={[{ required: true }]}>
            <Select placeholder="Select vendor" showSearch optionFilterProp="children">
              {/* Vendors would be loaded from API */}
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Amount (€)" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="period" label="Period" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM" />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Payout Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPayout && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Vendor">{selectedPayout.vendor?.businessName}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedPayout.vendor?.email}</Descriptions.Item>
            <Descriptions.Item label="Amount">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(selectedPayout.amount)}
            </Descriptions.Item>
            <Descriptions.Item label="Period">{selectedPayout.period}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusConfig[selectedPayout.status]?.color || 'default'}>{selectedPayout.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bank Account">
              {selectedPayout.vendor?.bankDetails?.accountName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Bank">
              {selectedPayout.vendor?.bankDetails?.bankName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedPayout.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            {selectedPayout.paidAt && (
              <Descriptions.Item label="Paid At">
                {dayjs(selectedPayout.paidAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

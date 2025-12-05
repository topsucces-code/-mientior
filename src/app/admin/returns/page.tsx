'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
  Tabs,
  Badge,
  Tooltip,
  Descriptions,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  reasonDetails: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    condition: string;
  }>;
  totalAmount: number;
  refundAmount: number;
  refundMethod: 'ORIGINAL' | 'STORE_CREDIT' | 'BANK_TRANSFER';
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    action: string;
    date: string;
    user: string;
    note?: string;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'blue',
  REJECTED: 'red',
  PROCESSING: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'default',
};

const reasonOptions = [
  { value: 'DEFECTIVE', label: 'Produit défectueux' },
  { value: 'WRONG_ITEM', label: 'Mauvais article reçu' },
  { value: 'NOT_AS_DESCRIBED', label: 'Non conforme à la description' },
  { value: 'CHANGED_MIND', label: 'Changement d\'avis' },
  { value: 'SIZE_ISSUE', label: 'Problème de taille' },
  { value: 'DAMAGED', label: 'Article endommagé' },
  { value: 'OTHER', label: 'Autre' },
];

export default function ReturnsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refund'>('approve');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [form] = Form.useForm();

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/returns?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      message.error(t('admin:returns.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleViewDetails = (record: ReturnRequest) => {
    setSelectedReturn(record);
    setDetailsModalVisible(true);
  };

  const handleAction = (record: ReturnRequest, type: 'approve' | 'reject' | 'refund') => {
    setSelectedReturn(record);
    setActionType(type);
    form.resetFields();
    if (type === 'refund') {
      form.setFieldsValue({ refundAmount: record.totalAmount });
    }
    setActionModalVisible(true);
  };

  const submitAction = async (values: Record<string, unknown>) => {
    if (!selectedReturn) return;

    try {
      const response = await fetch(`/api/admin/returns/${selectedReturn.id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(t(`admin:returns.messages.${actionType}Success`));
        setActionModalVisible(false);
        fetchReturns();
      } else {
        const error = await response.json();
        message.error(error.message || t(`admin:returns.messages.${actionType}Error`));
      }
    } catch (error) {
      console.error('Action error:', error);
      message.error(t(`admin:returns.messages.${actionType}Error`));
    }
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: returns.length,
      PENDING: 0,
      APPROVED: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };
    returns.forEach((r) => {
      const status = r.status as keyof typeof counts;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const columns = [
    {
      title: t('admin:returns.fields.id'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-xs">{id.slice(0, 8)}...</span>,
    },
    {
      title: t('admin:returns.fields.order'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string, record: ReturnRequest) => (
        <Link href={`/admin/orders/show/${record.orderId}`}>
          <Button type="link" size="small">{orderNumber}</Button>
        </Link>
      ),
    },
    {
      title: t('admin:returns.fields.customer'),
      key: 'customer',
      render: (_: unknown, record: ReturnRequest) => (
        <div>
          <div>{record.customerName}</div>
          <div className="text-xs text-gray-500">{record.customerEmail}</div>
        </div>
      ),
    },
    {
      title: t('admin:returns.fields.reason'),
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => {
        const option = reasonOptions.find((o) => o.value === reason);
        return option?.label || reason;
      },
    },
    {
      title: t('admin:returns.fields.items'),
      key: 'items',
      render: (_: unknown, record: ReturnRequest) => (
        <span>{record.items.length} article(s)</span>
      ),
    },
    {
      title: t('admin:returns.fields.amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `€${amount.toFixed(2)}`,
    },
    {
      title: t('admin:returns.fields.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {t(`admin:returns.status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('admin:returns.fields.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
    {
      title: t('common:labels.actions'),
      key: 'actions',
      render: (_: unknown, record: ReturnRequest) => (
        <Space>
          <Tooltip title={t('common:buttons.view')}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title={t('admin:returns.actions.approve')}>
                <Button
                  icon={<CheckOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => handleAction(record, 'approve')}
                />
              </Tooltip>
              <Tooltip title={t('admin:returns.actions.reject')}>
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  danger
                  onClick={() => handleAction(record, 'reject')}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Tooltip title={t('admin:returns.actions.processRefund')}>
              <Button
                icon={<DollarOutlined />}
                size="small"
                type="primary"
                onClick={() => handleAction(record, 'refund')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: '', label: <Badge count={statusCounts.all} showZero>{t('admin:returns.tabs.all')}</Badge> },
    { key: 'PENDING', label: <Badge count={statusCounts.PENDING} color="orange">{t('admin:returns.tabs.pending')}</Badge> },
    { key: 'APPROVED', label: <Badge count={statusCounts.APPROVED} color="blue">{t('admin:returns.tabs.approved')}</Badge> },
    { key: 'PROCESSING', label: <Badge count={statusCounts.PROCESSING} color="cyan">{t('admin:returns.tabs.processing')}</Badge> },
    { key: 'COMPLETED', label: <Badge count={statusCounts.COMPLETED} color="green">{t('admin:returns.tabs.completed')}</Badge> },
    { key: 'REJECTED', label: <Badge count={statusCounts.REJECTED} color="red">{t('admin:returns.tabs.rejected')}</Badge> },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('admin:returns.title')}</h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            {t('admin:returns.subtitle')}
          </p>
        </div>
        <Space>
          <Input
            placeholder={t('admin:returns.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchReturns} loading={loading}>
            {t('common:buttons.refresh')}
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={filters.status}
          onChange={(key) => setFilters({ ...filters, status: key })}
          items={tabItems}
        />

        <Table
          dataSource={returns}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('admin:returns.totalItems', { count: total }),
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={t('admin:returns.detailsTitle')}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReturn && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label={t('admin:returns.fields.id')}>
                {selectedReturn.id}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.status')}>
                <Tag color={statusColors[selectedReturn.status]}>
                  {t(`admin:returns.status.${selectedReturn.status}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.order')}>
                <Link href={`/admin/orders/show/${selectedReturn.orderId}`}>
                  {selectedReturn.orderNumber}
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.customer')}>
                {selectedReturn.customerName}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.reason')} span={2}>
                {reasonOptions.find((o) => o.value === selectedReturn.reason)?.label}
                {selectedReturn.reasonDetails && (
                  <div className="text-gray-500 mt-1">{selectedReturn.reasonDetails}</div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.amount')}>
                €{selectedReturn.totalAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin:returns.fields.refundAmount')}>
                €{selectedReturn.refundAmount.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24 }}>{t('admin:returns.itemsTitle')}</h4>
            <Table
              dataSource={selectedReturn.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: t('admin:returns.fields.product'), dataIndex: 'productName', key: 'productName' },
                { title: t('admin:returns.fields.quantity'), dataIndex: 'quantity', key: 'quantity' },
                { title: t('admin:returns.fields.price'), dataIndex: 'price', key: 'price', render: (p: number) => `€${p.toFixed(2)}` },
                { title: t('admin:returns.fields.condition'), dataIndex: 'condition', key: 'condition' },
              ]}
            />

            <h4 style={{ marginTop: 24 }}>{t('admin:returns.timelineTitle')}</h4>
            <Timeline
              items={selectedReturn.timeline.map((item) => ({
                children: (
                  <div>
                    <strong>{item.action}</strong>
                    <div className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleString('fr-FR')} - {item.user}
                    </div>
                    {item.note && <div className="text-sm mt-1">{item.note}</div>}
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title={
          actionType === 'approve'
            ? t('admin:returns.actions.approveTitle')
            : actionType === 'reject'
            ? t('admin:returns.actions.rejectTitle')
            : t('admin:returns.actions.refundTitle')
        }
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submitAction}>
          {actionType === 'reject' && (
            <Form.Item
              name="reason"
              label={t('admin:returns.fields.rejectReason')}
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          )}

          {actionType === 'refund' && (
            <>
              <Form.Item
                name="refundAmount"
                label={t('admin:returns.fields.refundAmount')}
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  max={selectedReturn?.totalAmount}
                  precision={2}
                  prefix="€"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="refundMethod"
                label={t('admin:returns.fields.refundMethod')}
                rules={[{ required: true }]}
                initialValue="ORIGINAL"
              >
                <Select
                  options={[
                    { value: 'ORIGINAL', label: t('admin:returns.refundMethods.original') },
                    { value: 'STORE_CREDIT', label: t('admin:returns.refundMethods.storeCredit') },
                    { value: 'BANK_TRANSFER', label: t('admin:returns.refundMethods.bankTransfer') },
                  ]}
                />
              </Form.Item>
            </>
          )}

          <Form.Item name="note" label={t('admin:returns.fields.note')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

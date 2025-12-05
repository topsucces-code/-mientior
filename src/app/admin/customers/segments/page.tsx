'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, Popconfirm, Typography, Row, Col, Statistic, Switch, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';

import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, unknown>;
  customerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerSegmentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<CustomerSegment>({
    resource: 'customer-segments',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: createSegment } = useCreate();
  const { mutate: updateSegment } = useUpdate();
  const { mutate: deleteSegment } = useDelete();

  const handleCreate = () => {
    setEditingSegment(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, filters: {} });
    setModalVisible(true);
  };

  const handleEdit = (record: CustomerSegment) => {
    setEditingSegment(record);
    form.setFieldsValue({
      ...record,
      filters: JSON.stringify(record.filters, null, 2),
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteSegment({ resource: 'customer-segments', id }, {
      onSuccess: () => message.success('Segment deleted'),
    });
  };

  const handleToggleActive = (record: CustomerSegment) => {
    updateSegment({ resource: 'customer-segments', id: record.id, values: { isActive: !record.isActive } }, {
      onSuccess: () => message.success(`Segment ${record.isActive ? 'disabled' : 'enabled'}`),
    });
  };

  const handleRefreshCount = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/segments/${id}/refresh`, { method: 'POST' });
      if (response.ok) {
        message.success('Customer count refreshed');
      }
    } catch {
      message.error('Failed to refresh count');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Parse filters JSON
      let filters = {};
      if (values.filters) {
        try {
          filters = typeof values.filters === 'string' ? JSON.parse(values.filters) : values.filters;
        } catch {
          message.error('Invalid JSON in filters');
          return;
        }
      }

      const payload = { ...values, filters };

      setSubmitting(true);
      if (editingSegment) {
        updateSegment({ resource: 'customer-segments', id: editingSegment.id, values: payload }, {
          onSuccess: () => {
            message.success('Segment updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createSegment({ resource: 'customer-segments', values: payload }, {
          onSuccess: () => {
            message.success('Segment created');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setSubmitting(false);
    }
  };

  const segments = tableProps.dataSource || [];
  const totalCustomers = segments.reduce((acc: number, s: CustomerSegment) => acc + s.customerCount, 0);
  const activeSegments = segments.filter((s: CustomerSegment) => s.isActive).length;

  const columns = [
    {
      title: t('admin:segments.name', 'Segment'),
      key: 'segment',
      render: (_: unknown, record: CustomerSegment) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: t('admin:segments.customers', 'Customers'),
      dataIndex: 'customerCount',
      key: 'customerCount',
      render: (count: number, record: CustomerSegment) => (
        <Space>
          <Tag icon={<UserOutlined />} color="blue">{count.toLocaleString()}</Tag>
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={() => handleRefreshCount(record.id)}
          />
        </Space>
      ),
    },
    {
      title: t('admin:segments.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: CustomerSegment) => (
        <Switch checked={isActive} onChange={() => handleToggleActive(record)} size="small" />
      ),
    },
    {
      title: t('admin:segments.updated', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: CustomerSegment) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this segment?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><TeamOutlined /> {t('admin:segments.title', 'Customer Segments')}</Title>
          <Text type="secondary">{t('admin:segments.subtitle', 'Group customers for targeted marketing')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:segments.create', 'Create Segment')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Segments" value={segments.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Active Segments" value={activeSegments} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Customers" value={totalCustomers} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search segments..." allowClear />
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingSegment ? 'Edit Segment' : 'Create Segment'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Segment name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe this segment..." />
          </Form.Item>

          <Form.Item 
            name="filters" 
            label="Filters (JSON)" 
            extra="Define filter criteria in JSON format"
          >
            <TextArea 
              rows={6} 
              placeholder='{"loyaltyLevel": "GOLD", "totalSpent": {"gte": 1000}}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

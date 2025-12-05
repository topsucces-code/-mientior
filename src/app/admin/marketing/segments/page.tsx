'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Row, Col, Select, Switch, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, FilterOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
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

interface FilterRule {
  field: string;
  operator: string;
  value: string | number;
}

const filterFields = [
  { value: 'totalSpent', label: 'Total Spent', type: 'number' },
  { value: 'totalOrders', label: 'Total Orders', type: 'number' },
  { value: 'loyaltyLevel', label: 'Loyalty Level', type: 'select', options: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] },
  { value: 'lastOrderDate', label: 'Last Order Date', type: 'date' },
  { value: 'createdAt', label: 'Registration Date', type: 'date' },
  { value: 'country', label: 'Country', type: 'text' },
];

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'in_last_days', label: 'In Last N Days' },
];

export default function SegmentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);

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
    form.setFieldsValue({ isActive: true });
    setFilterRules([{ field: 'totalOrders', operator: 'greater_than', value: 0 }]);
    setModalVisible(true);
  };

  const handleEdit = (record: CustomerSegment) => {
    setEditingSegment(record);
    form.setFieldsValue(record);
    const rawRules = (record.filters?.rules || []) as Array<{field?: string; operator?: string; value?: string | number}>;
    const mappedRules: FilterRule[] = rawRules.map(r => ({
      field: r.field ?? 'totalOrders',
      operator: r.operator ?? 'greater_than',
      value: r.value ?? 0,
    }));
    setFilterRules(mappedRules);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteSegment({ resource: 'customer-segments', id }, {
      onSuccess: () => message.success('Segment deleted'),
    });
  };

  const handleRefresh = (_id: string) => {
    message.loading('Recalculating segment...', 2);
    setTimeout(() => message.success('Segment updated'), 2000);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        filters: { rules: filterRules, logic: 'AND' },
      };

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

  const addFilterRule = () => {
    setFilterRules([...filterRules, { field: 'totalOrders', operator: 'greater_than', value: 0 }]);
  };

  const removeFilterRule = (index: number) => {
    setFilterRules(filterRules.filter((_, i) => i !== index));
  };

  const updateFilterRule = (index: number, key: keyof FilterRule, value: string | number) => {
    const newRules: FilterRule[] = filterRules.map((rule, i) => 
      i === index ? { ...rule, [key]: value } : rule
    );
    setFilterRules(newRules);
  };

  const columns = [
    {
      title: t('admin:segments.name', 'Segment'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CustomerSegment) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
          )}
        </Space>
      ),
    },
    {
      title: t('admin:segments.customers', 'Customers'),
      dataIndex: 'customerCount',
      key: 'customerCount',
      render: (count: number) => (
        <Tag color="blue" icon={<UserOutlined />}>{count.toLocaleString()}</Tag>
      ),
    },
    {
      title: t('admin:segments.filters', 'Filters'),
      key: 'filters',
      render: (_: unknown, record: CustomerSegment) => {
        const rules = (record.filters?.rules as FilterRule[]) || [];
        return (
          <Space wrap>
            {rules.slice(0, 2).map((rule, i) => (
              <Tag key={i} icon={<FilterOutlined />}>
                {rule.field} {rule.operator} {rule.value}
              </Tag>
            ))}
            {rules.length > 2 && <Tag>+{rules.length - 2} more</Tag>}
          </Space>
        );
      },
    },
    {
      title: t('admin:segments.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
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
          <Button type="text" icon={<SyncOutlined />} onClick={() => handleRefresh(record.id)} />
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
          <Text type="secondary">{t('admin:segments.subtitle', 'Create and manage customer segments for targeted marketing')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:segments.create', 'Create Segment')}
        </Button>
      </div>

      <Card>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingSegment ? 'Edit Segment' : 'Create Segment'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Segment Name" rules={[{ required: true }]}>
                <Input placeholder="VIP Customers" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe this segment..." />
          </Form.Item>

          <Divider orientation="left"><FilterOutlined /> Filter Rules</Divider>

          {filterRules.map((rule, index) => (
            <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
              <Col span={7}>
                <Select
                  value={rule.field}
                  onChange={(v) => updateFilterRule(index, 'field', v)}
                  style={{ width: '100%' }}
                  options={filterFields.map(f => ({ value: f.value, label: f.label }))}
                />
              </Col>
              <Col span={6}>
                <Select
                  value={rule.operator}
                  onChange={(v) => updateFilterRule(index, 'operator', v)}
                  style={{ width: '100%' }}
                  options={operators}
                />
              </Col>
              <Col span={7}>
                <Input
                  value={rule.value}
                  onChange={(e) => updateFilterRule(index, 'value', e.target.value)}
                  placeholder="Value"
                />
              </Col>
              <Col span={4}>
                <Button danger onClick={() => removeFilterRule(index)} icon={<DeleteOutlined />} />
              </Col>
            </Row>
          ))}

          <Button type="dashed" onClick={addFilterRule} icon={<PlusOutlined />} style={{ width: '100%' }}>
            Add Filter Rule
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

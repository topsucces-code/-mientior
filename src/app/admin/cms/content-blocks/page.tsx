'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, Popconfirm, Typography, Row, Col, Statistic, Select, Switch, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BlockOutlined, EyeOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ContentBlock {
  id: string;
  name: string;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  type: string;
  order: number;
  pageId?: string;
  page?: { id: string; title: string; slug: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Match Prisma ContentBlockType enum
const blockTypes = [
  { value: 'HERO', label: 'Hero Section' },
  { value: 'TEXT', label: 'Rich Text' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'CTA', label: 'Call to Action' },
  { value: 'PRODUCT_GRID', label: 'Product Grid' },
  { value: 'CATEGORY_GRID', label: 'Category Grid' },
  { value: 'TESTIMONIALS', label: 'Testimonials' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'NEWSLETTER', label: 'Newsletter Signup' },
  { value: 'CUSTOM_HTML', label: 'Custom HTML' },
];

export default function ContentBlocksPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [previewBlock, setPreviewBlock] = useState<ContentBlock | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<ContentBlock>({
    resource: 'content-blocks',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: createBlock } = useCreate();
  const { mutate: updateBlock } = useUpdate();
  const { mutate: deleteBlock } = useDelete();

  const handleCreate = () => {
    setEditingBlock(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, type: 'text', content: '{}' });
    setModalVisible(true);
  };

  const handleEdit = (record: ContentBlock) => {
    setEditingBlock(record);
    form.setFieldsValue({
      ...record,
      content: JSON.stringify(record.content, null, 2),
    });
    setModalVisible(true);
  };

  const handlePreview = (record: ContentBlock) => {
    setPreviewBlock(record);
    setPreviewVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteBlock({ resource: 'content-blocks', id }, {
      onSuccess: () => message.success(t('admin:contentBlocks.deletedSuccess', 'Block deleted')),
    });
  };

  const handleToggleActive = (record: ContentBlock) => {
    updateBlock({ resource: 'content-blocks', id: record.id, values: { isActive: !record.isActive } }, {
      onSuccess: () => message.success(record.isActive ? t('admin:contentBlocks.disabled', 'Block disabled') : t('admin:contentBlocks.enabled', 'Block enabled')),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      let content = {};
      if (values.content) {
        try {
          content = typeof values.content === 'string' ? JSON.parse(values.content) : values.content;
        } catch {
          message.error(t('admin:contentBlocks.invalidJson', 'Invalid JSON content'));
          return;
        }
      }

      const payload = { ...values, content };

      setSubmitting(true);
      if (editingBlock) {
        updateBlock({ resource: 'content-blocks', id: editingBlock.id, values: payload }, {
          onSuccess: () => {
            message.success(t('admin:contentBlocks.updatedSuccess', 'Block updated'));
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createBlock({ resource: 'content-blocks', values: payload }, {
          onSuccess: () => {
            message.success(t('admin:contentBlocks.createdSuccess', 'Block created'));
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

  const blocks = tableProps.dataSource || [];
  const activeBlocks = blocks.filter((b: ContentBlock) => b.isActive).length;

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hero: 'purple',
      banner: 'blue',
      features: 'cyan',
      testimonials: 'green',
      cta: 'orange',
      gallery: 'magenta',
      text: 'default',
      products: 'gold',
      categories: 'lime',
      newsletter: 'volcano',
      custom: 'geekblue',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: t('admin:contentBlocks.block', 'Block'),
      key: 'block',
      render: (_: unknown, record: ContentBlock) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          {record.page && (
            <Text type="secondary" style={{ fontSize: 11 }}>Page: {record.page.title}</Text>
          )}
        </Space>
      ),
    },
    {
      title: t('admin:contentBlocks.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{blockTypes.find(t => t.value === type)?.label || type}</Tag>
      ),
    },
    {
      title: t('admin:contentBlocks.order', 'Order'),
      dataIndex: 'order',
      key: 'order',
      render: (order: number) => <Tag>{order}</Tag>,
      sorter: true,
    },
    {
      title: t('admin:contentBlocks.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: ContentBlock) => (
        <Switch checked={isActive} onChange={() => handleToggleActive(record)} size="small" />
      ),
    },
    {
      title: t('admin:contentBlocks.lastUpdated', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('common:actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: ContentBlock) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handlePreview(record)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title={t('admin:contentBlocks.confirmDelete', 'Delete this block?')} onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><BlockOutlined /> {t('admin:contentBlocks.title', 'Content Blocks')}</Title>
          <Text type="secondary">{t('admin:contentBlocks.subtitle', 'Reusable content components for your pages')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:contentBlocks.create', 'Create Block')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:contentBlocks.totalBlocks', 'Total Blocks')} value={blocks.length} prefix={<BlockOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:contentBlocks.activeBlocks', 'Active')} value={activeBlocks} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:contentBlocks.inactiveBlocks', 'Inactive')} value={blocks.length - activeBlocks} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder={t('admin:contentBlocks.searchPlaceholder', 'Search blocks...')} allowClear />
          </Col>
          <Col xs={24} md={8}>
            <Select placeholder={t('admin:contentBlocks.filterByType', 'Filter by type')} allowClear style={{ width: '100%' }}>
              {blockTypes.map(type => (
                <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingBlock ? t('admin:contentBlocks.editBlock', 'Edit Block') : t('admin:contentBlocks.createBlock', 'Create Block')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label={t('admin:contentBlocks.name', 'Name')} rules={[{ required: true }]}>
                <Input placeholder="Hero Banner" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="key" label={t('admin:contentBlocks.key', 'Key')} rules={[{ required: true, pattern: /^[a-z0-9_]+$/, message: 'Lowercase letters, numbers, underscores only' }]}>
                <Input placeholder="hero_banner" disabled={!!editingBlock} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={t('admin:contentBlocks.type', 'Type')} rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  {blockTypes.map(type => (
                    <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order" label={t('admin:contentBlocks.order', 'Order')}>
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="content" 
            label={t('admin:contentBlocks.content', 'Content (JSON)')}
            extra={t('admin:contentBlocks.contentHelp', 'Define block content as JSON. Structure depends on block type.')}
          >
            <TextArea 
              rows={10} 
              placeholder='{"title": "Welcome", "subtitle": "Discover our products", "buttonText": "Shop Now", "buttonUrl": "/products"}'
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </Form.Item>

          <Form.Item name="isActive" label={t('admin:contentBlocks.active', 'Active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={t('admin:contentBlocks.preview', 'Preview')}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewBlock && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('admin:contentBlocks.name', 'Name')}:</Text> {previewBlock.name}
              </Col>
              <Col span={12}>
                <Text strong>{t('admin:contentBlocks.order', 'Order')}:</Text> {previewBlock.order}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('admin:contentBlocks.type', 'Type')}:</Text> <Tag color={getTypeColor(previewBlock.type)}>{previewBlock.type}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>{t('admin:contentBlocks.status', 'Status')}:</Text> <Tag color={previewBlock.isActive ? 'green' : 'red'}>{previewBlock.isActive ? 'Active' : 'Inactive'}</Tag>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>{t('admin:contentBlocks.content', 'Content')}:</Text>
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginTop: 8, overflow: 'auto', maxHeight: 400 }}>
                {JSON.stringify(previewBlock.content, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

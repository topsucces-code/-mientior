'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Select, Modal, Form, message, Popconfirm, Typography, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined, CopyOutlined, GlobalOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  SCHEDULED: 'processing',
  ARCHIVED: 'error',
};

const templates = [
  { value: 'default', label: 'Default' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'contact', label: 'Contact' },
  { value: 'about', label: 'About Us' },
  { value: 'faq', label: 'FAQ' },
  { value: 'blank', label: 'Blank' },
];

export default function CmsPagesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [form] = Form.useForm();

  const { tableProps } = useTable<CmsPage>({
    resource: 'cms-pages',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: createPage } = useCreate();
  const { mutate: updatePage } = useUpdate();
  const [submitting, setSubmitting] = useState(false);
  const { mutate: deletePage } = useDelete();

  const handleCreate = () => {
    setEditingPage(null);
    form.resetFields();
    form.setFieldsValue({ status: 'DRAFT', template: 'default' });
    setModalVisible(true);
  };

  const handleEdit = (record: CmsPage) => {
    setEditingPage(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deletePage({ resource: 'cms-pages', id }, {
      onSuccess: () => message.success('Page deleted'),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.slug) {
        values.slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      setSubmitting(true);
      if (editingPage) {
        updatePage({ resource: 'cms-pages', id: editingPage.id, values }, {
          onSuccess: () => {
            message.success('Page updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createPage({ resource: 'cms-pages', values }, {
          onSuccess: () => {
            message.success('Page created');
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

  const handleDuplicate = (record: CmsPage) => {
    form.setFieldsValue({
      ...record,
      title: `${record.title} (Copy)`,
      slug: `${record.slug}-copy`,
      status: 'DRAFT',
    });
    setEditingPage(null);
    setModalVisible(true);
  };

  const columns = [
    {
      title: t('admin:cms.pages.title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: CmsPage) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:cms.pages.template', 'Template'),
      dataIndex: 'template',
      key: 'template',
      render: (template: string) => <Tag>{template}</Tag>,
    },
    {
      title: t('admin:cms.pages.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('admin:cms.pages.publishedAt', 'Published'),
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: t('admin:cms.pages.updatedAt', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: CmsPage) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} href={`/${record.slug}`} target="_blank" />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button type="text" icon={<CopyOutlined />} onClick={() => handleDuplicate(record)} />
          </Tooltip>
          <Popconfirm title="Delete this page?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><FileTextOutlined /> {t('admin:cms.pages.title', 'CMS Pages')}</Title>
          <Text type="secondary">{t('admin:cms.pages.subtitle', 'Manage your website pages')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.pages.create', 'Create Page')}
        </Button>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input prefix={<SearchOutlined />} placeholder="Search pages..." allowClear />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by status" allowClear style={{ width: '100%' }}>
              <Select.Option value="DRAFT">Draft</Select.Option>
              <Select.Option value="PUBLISHED">Published</Select.Option>
              <Select.Option value="SCHEDULED">Scheduled</Select.Option>
              <Select.Option value="ARCHIVED">Archived</Select.Option>
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingPage ? 'Edit Page' : 'Create Page'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="Page title" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="template" label="Template" rules={[{ required: true }]}>
                <Select options={templates} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="slug" label="Slug" extra="Leave empty to auto-generate from title">
            <Input prefix={<GlobalOutlined />} placeholder="page-url-slug" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description for SEO" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="DRAFT">Draft</Select.Option>
                  <Select.Option value="PUBLISHED">Published</Select.Option>
                  <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                  <Select.Option value="ARCHIVED">Archived</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Schedule Publication">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

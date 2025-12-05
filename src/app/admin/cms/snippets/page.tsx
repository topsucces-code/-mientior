'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Switch, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Snippet {
  id: string;
  name: string;
  key: string;
  content: Record<string, unknown>;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const snippetTypes = [
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Text' },
  { value: 'json', label: 'JSON' },
  { value: 'script', label: 'Script' },
];

export default function SnippetsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<Snippet>({
    resource: 'snippets',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
  });

  const { mutate: createSnippet } = useCreate();
  const { mutate: updateSnippet } = useUpdate();
  const { mutate: deleteSnippet } = useDelete();

  const handleCreate = () => {
    setEditingSnippet(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, type: 'html' });
    setModalVisible(true);
  };

  const handleEdit = (record: Snippet) => {
    setEditingSnippet(record);
    form.setFieldsValue({
      ...record,
      content: typeof record.content === 'object' ? JSON.stringify(record.content, null, 2) : record.content,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteSnippet({ resource: 'snippets', id }, {
      onSuccess: () => message.success('Snippet deleted'),
    });
  };

  const handleToggleActive = (record: Snippet) => {
    updateSnippet({ resource: 'snippets', id: record.id, values: { isActive: !record.isActive } }, {
      onSuccess: () => message.success(`Snippet ${record.isActive ? 'disabled' : 'enabled'}`),
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(`{{snippet:${key}}}`);
    message.success('Snippet key copied');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Parse content if JSON type
      let content = values.content;
      if (values.type === 'json') {
        try {
          content = JSON.parse(values.content);
        } catch {
          message.error('Invalid JSON content');
          return;
        }
      } else {
        content = { html: values.content };
      }

      const payload = { ...values, content };

      setSubmitting(true);
      if (editingSnippet) {
        updateSnippet({ resource: 'snippets', id: editingSnippet.id, values: payload }, {
          onSuccess: () => {
            message.success('Snippet updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createSnippet({ resource: 'snippets', values: payload }, {
          onSuccess: () => {
            message.success('Snippet created');
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

  const columns = [
    {
      title: t('admin:cms.snippets.name', 'Snippet'),
      key: 'snippet',
      render: (_: unknown, record: Snippet) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Space>
            <Tag color="blue" icon={<CodeOutlined />}>{record.key}</Tag>
            <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyKey(record.key)}>
              Copy
            </Button>
          </Space>
        </Space>
      ),
    },
    {
      title: t('admin:cms.snippets.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = { html: 'orange', text: 'blue', json: 'green', script: 'purple' };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: t('admin:cms.snippets.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Snippet) => (
        <Switch checked={isActive} onChange={() => handleToggleActive(record)} size="small" />
      ),
    },
    {
      title: t('admin:cms.snippets.updated', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: Snippet) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this snippet?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><CodeOutlined /> {t('admin:cms.snippets.title', 'Snippets')}</Title>
          <Text type="secondary">{t('admin:cms.snippets.subtitle', 'Reusable content blocks')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.snippets.create', 'Create Snippet')}
        </Button>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search snippets..." allowClear />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by type" allowClear style={{ width: '100%' }}>
              {snippetTypes.map(t => (
                <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingSnippet ? 'Edit Snippet' : 'Create Snippet'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Snippet name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="key" label="Key" rules={[{ required: true, pattern: /^[a-z0-9_-]+$/, message: 'Lowercase, numbers, dashes only' }]}>
                <Input placeholder="snippet-key" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Select options={snippetTypes} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <TextArea rows={10} placeholder="Enter snippet content..." style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Text type="secondary">
            Use <Tag>{'{{snippet:your-key}}'}</Tag> in your templates to insert this snippet.
          </Text>
        </Form>
      </Modal>
    </div>
  );
}

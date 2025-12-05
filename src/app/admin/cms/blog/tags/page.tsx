'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
  createdAt: string;
}

export default function BlogTagsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<BlogTag>({
    resource: 'blog-tags',
    pagination: { pageSize: 20 },
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
  });

  const { mutate: createTag } = useCreate();
  const { mutate: updateTag } = useUpdate();
  const { mutate: deleteTag } = useDelete();

  const handleCreate = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: BlogTag) => {
    setEditingTag(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteTag({ resource: 'blog-tags', id }, {
      onSuccess: () => message.success('Tag deleted'),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.slug) {
        values.slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      setSubmitting(true);
      if (editingTag) {
        updateTag({ resource: 'blog-tags', id: editingTag.id, values }, {
          onSuccess: () => {
            message.success('Tag updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createTag({ resource: 'blog-tags', values }, {
          onSuccess: () => {
            message.success('Tag created');
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
      title: t('admin:cms.blogTags.name', 'Tag'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: BlogTag) => (
        <Space>
          <Tag color="blue" icon={<TagsOutlined />}>{name}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:cms.blogTags.posts', 'Posts'),
      key: 'posts',
      render: (_: unknown, record: BlogTag) => (
        <Tag>{record._count?.posts || 0} posts</Tag>
      ),
    },
    {
      title: t('admin:cms.blogTags.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: BlogTag) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this tag?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><TagsOutlined /> {t('admin:cms.blogTags.title', 'Blog Tags')}</Title>
          <Text type="secondary">{t('admin:cms.blogTags.subtitle', 'Manage blog post tags')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.blogTags.create', 'Add Tag')}
        </Button>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search tags..." allowClear />
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingTag ? 'Edit Tag' : 'Add Tag'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Tag name" />
          </Form.Item>

          <Form.Item name="slug" label="Slug" extra="Leave empty to auto-generate">
            <Input placeholder="tag-slug" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

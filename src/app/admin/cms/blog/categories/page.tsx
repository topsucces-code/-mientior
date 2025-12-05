'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Switch, InputNumber, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  _count?: { posts: number };
  createdAt: string;
  updatedAt: string;
}

export default function BlogCategoriesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<BlogCategory>({
    resource: 'blog-categories',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'order', order: 'asc' }] },
  });

  const { mutate: createCategory } = useCreate();
  const { mutate: updateCategory } = useUpdate();
  const { mutate: deleteCategory } = useDelete();

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: BlogCategory) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteCategory({ resource: 'blog-categories', id }, {
      onSuccess: () => message.success('Category deleted'),
    });
  };

  const handleToggleActive = (record: BlogCategory) => {
    updateCategory({ resource: 'blog-categories', id: record.id, values: { isActive: !record.isActive } }, {
      onSuccess: () => message.success(`Category ${record.isActive ? 'disabled' : 'enabled'}`),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.slug) {
        values.slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      setSubmitting(true);
      if (editingCategory) {
        updateCategory({ resource: 'blog-categories', id: editingCategory.id, values }, {
          onSuccess: () => {
            message.success('Category updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createCategory({ resource: 'blog-categories', values }, {
          onSuccess: () => {
            message.success('Category created');
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
      title: t('admin:cms.blogCategories.category', 'Category'),
      key: 'category',
      render: (_: unknown, record: BlogCategory) => (
        <Space>
          {record.image ? (
            <Image src={record.image} alt={record.name} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
          ) : (
            <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOutlined style={{ color: '#999' }} />
            </div>
          )}
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t('admin:cms.blogCategories.posts', 'Posts'),
      key: 'posts',
      render: (_: unknown, record: BlogCategory) => (
        <Tag color="blue">{record._count?.posts || 0} posts</Tag>
      ),
    },
    {
      title: t('admin:cms.blogCategories.order', 'Order'),
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number) => <Tag>{order}</Tag>,
    },
    {
      title: t('admin:cms.blogCategories.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: BlogCategory) => (
        <Switch checked={isActive} onChange={() => handleToggleActive(record)} size="small" />
      ),
    },
    {
      title: t('admin:cms.blogCategories.updated', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: BlogCategory) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><FolderOutlined /> {t('admin:cms.blogCategories.title', 'Blog Categories')}</Title>
          <Text type="secondary">{t('admin:cms.blogCategories.subtitle', 'Organize your blog posts')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.blogCategories.create', 'Add Category')}
        </Button>
      </div>

      <Card>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item name="slug" label="Slug" extra="Leave empty to auto-generate">
            <Input placeholder="category-slug" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Category description..." />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Space size="large">
            <Form.Item name="order" label="Display Order">
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

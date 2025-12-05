'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Select, Modal, Form, message, Popconfirm, Typography, Row, Col, Avatar, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReadOutlined, EyeOutlined, HeartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  publishedAt?: string;
  scheduledAt?: string;
  authorName?: string;
  authorAvatar?: string;
  categoryId?: string;
  readTime?: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  SCHEDULED: 'processing',
  ARCHIVED: 'error',
};

export default function BlogPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories] = useState<BlogCategory[]>([
    { id: '1', name: 'Fashion', slug: 'fashion' },
    { id: '2', name: 'Lifestyle', slug: 'lifestyle' },
    { id: '3', name: 'Tips & Tricks', slug: 'tips' },
    { id: '4', name: 'News', slug: 'news' },
  ]);

  const { tableProps } = useTable<BlogPost>({
    resource: 'blog-posts',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: createPost } = useCreate();
  const { mutate: updatePost } = useUpdate();
  const { mutate: deletePost } = useDelete();

  const handleCreate = () => {
    setEditingPost(null);
    form.resetFields();
    form.setFieldsValue({ status: 'DRAFT' });
    setModalVisible(true);
  };

  const handleEdit = (record: BlogPost) => {
    setEditingPost(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deletePost({ resource: 'blog-posts', id }, {
      onSuccess: () => message.success('Post deleted'),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.slug) {
        values.slug = values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      setSubmitting(true);
      if (editingPost) {
        updatePost({ resource: 'blog-posts', id: editingPost.id, values }, {
          onSuccess: () => {
            message.success('Post updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createPost({ resource: 'blog-posts', values }, {
          onSuccess: () => {
            message.success('Post created');
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
      title: t('admin:cms.blog.post', 'Post'),
      key: 'post',
      render: (_: unknown, record: BlogPost) => (
        <Space>
          {record.featuredImage ? (
            <Image src={record.featuredImage} alt={record.title} width={60} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
          ) : (
            <div style={{ width: 60, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReadOutlined style={{ color: '#999' }} />
            </div>
          )}
          <Space direction="vertical" size={0}>
            <Text strong>{record.title}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t('admin:cms.blog.author', 'Author'),
      key: 'author',
      render: (_: unknown, record: BlogPost) => (
        <Space>
          <Avatar src={record.authorAvatar} size="small">{record.authorName?.[0]}</Avatar>
          <Text>{record.authorName || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:cms.blog.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('admin:cms.blog.stats', 'Stats'),
      key: 'stats',
      render: (_: unknown, record: BlogPost) => (
        <Space size="large">
          <Space size={4}>
            <EyeOutlined style={{ color: '#999' }} />
            <Text type="secondary">{record.views}</Text>
          </Space>
          <Space size={4}>
            <HeartOutlined style={{ color: '#999' }} />
            <Text type="secondary">{record.likes}</Text>
          </Space>
          {record.readTime && (
            <Space size={4}>
              <ClockCircleOutlined style={{ color: '#999' }} />
              <Text type="secondary">{record.readTime} min</Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: t('admin:cms.blog.publishedAt', 'Published'),
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: BlogPost) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} href={`/blog/${record.slug}`} target="_blank" />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this post?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><ReadOutlined /> {t('admin:cms.blog.title', 'Blog Posts')}</Title>
          <Text type="secondary">{t('admin:cms.blog.subtitle', 'Manage your blog content')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.blog.create', 'Create Post')}
        </Button>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search posts..." allowClear />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by status" allowClear style={{ width: '100%' }}>
              <Select.Option value="DRAFT">Draft</Select.Option>
              <Select.Option value="PUBLISHED">Published</Select.Option>
              <Select.Option value="SCHEDULED">Scheduled</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by category" allowClear style={{ width: '100%' }}>
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingPost ? 'Edit Post' : 'Create Post'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Post title" />
          </Form.Item>

          <Form.Item name="slug" label="Slug" extra="Leave empty to auto-generate">
            <Input placeholder="post-url-slug" />
          </Form.Item>

          <Form.Item name="excerpt" label="Excerpt">
            <TextArea rows={3} placeholder="Brief summary of the post" maxLength={300} showCount />
          </Form.Item>

          <Form.Item name="featuredImage" label="Featured Image URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="categoryId" label="Category">
                <Select placeholder="Select category">
                  {categories.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="DRAFT">Draft</Select.Option>
                  <Select.Option value="PUBLISHED">Published</Select.Option>
                  <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="readTime" label="Read Time (min)">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="authorName" label="Author Name">
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="authorAvatar" label="Author Avatar URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="scheduledAt" label="Schedule Publication">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

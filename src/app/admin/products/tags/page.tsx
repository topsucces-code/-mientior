'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ProductTag {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
  createdAt: string;
}

export default function ProductTagsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable<ProductTag>({
    resource: 'tags',
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

  const handleEdit = (record: ProductTag) => {
    setEditingTag(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteTag({ resource: 'tags', id }, {
      onSuccess: () => message.success('Tag deleted'),
    });
  };

  const handleBulkDelete = () => {
    message.success(`${selectedRowKeys.length} tags deleted`);
    setSelectedRowKeys([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.slug) {
        values.slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      setSubmitting(true);
      if (editingTag) {
        updateTag({ resource: 'tags', id: editingTag.id, values }, {
          onSuccess: () => {
            message.success('Tag updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createTag({ resource: 'tags', values }, {
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

  const tags = tableProps.dataSource || [];
  const totalProducts = tags.reduce((acc: number, t: ProductTag) => acc + (t._count?.products || 0), 0);

  const columns = [
    {
      title: t('admin:products.tags.name', 'Tag'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ProductTag) => (
        <Space>
          <Tag color="blue" icon={<TagOutlined />}>{name}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:products.tags.products', 'Products'),
      key: 'products',
      render: (_: unknown, record: ProductTag) => (
        <Tag color={record._count?.products ? 'green' : 'default'}>
          {record._count?.products || 0} products
        </Tag>
      ),
    },
    {
      title: t('admin:products.tags.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: ProductTag) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm 
            title="Delete this tag?" 
            description={record._count?.products ? `This will remove the tag from ${record._count.products} products.` : undefined}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><TagOutlined /> {t('admin:products.tags.title', 'Product Tags')}</Title>
          <Text type="secondary">{t('admin:products.tags.subtitle', 'Organize products with tags')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:products.tags.create', 'Add Tag')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Tags" value={tags.length} prefix={<TagOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tagged Products" value={totalProducts} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Unused Tags" value={tags.filter((t: ProductTag) => !t._count?.products).length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search tags..." allowClear />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }}>
            {selectedRowKeys.length > 0 && (
              <Popconfirm title={`Delete ${selectedRowKeys.length} tags?`} onConfirm={handleBulkDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" rowSelection={rowSelection} />
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

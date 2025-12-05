'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, Typography, Row, Col, Statistic, Select, InputNumber, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  priceModifier: number;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

export default function ProductVariantsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { message } = App.useApp();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('_start', ((pagination.current - 1) * pagination.pageSize).toString());
      params.append('_end', (pagination.current * pagination.pageSize).toString());
      if (searchQuery) params.append('q', searchQuery);
      if (selectedProduct) params.append('productId', selectedProduct);

      const response = await fetch(`/api/admin/products/variants?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVariants(data);
        const total = response.headers.get('x-total-count');
        setPagination(prev => ({ ...prev, total: parseInt(total || '0') }));
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error);
      message.error(t('admin:variants.fetchError', 'Failed to load variants'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?_start=0&_end=100');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchVariants();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchQuery, selectedProduct]);

  const handleCreate = () => {
    setEditingVariant(null);
    form.resetFields();
    form.setFieldsValue({ stock: 0, price: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: ProductVariant) => {
    setEditingVariant(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/variants/${id}`, { method: 'DELETE' });
      if (response.ok) {
        message.success(t('admin:variants.deletedSuccess', 'Variant deleted'));
        fetchVariants();
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      message.error(t('admin:variants.deleteError', 'Failed to delete variant'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      const url = editingVariant 
        ? `/api/admin/products/variants/${editingVariant.id}`
        : '/api/admin/products/variants';
      const method = editingVariant ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(editingVariant 
          ? t('admin:variants.updatedSuccess', 'Variant updated')
          : t('admin:variants.createdSuccess', 'Variant created')
        );
        setModalVisible(false);
        fetchVariants();
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error(t('admin:variants.saveError', 'Failed to save variant'));
    } finally {
      setSubmitting(false);
    }
  };

  const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);
  const lowStockCount = variants.filter(v => v.stock < 10).length;

  const columns = [
    {
      title: t('admin:variants.variant', 'Variant'),
      key: 'variant',
      render: (_: unknown, record: ProductVariant) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.sku}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.product?.name}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:variants.size', 'Size'),
      dataIndex: 'size',
      key: 'size',
      render: (size: string) => size ? <Tag>{size}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: t('admin:variants.color', 'Color'),
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => color ? <Tag color="blue">{color}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: t('admin:variants.priceModifier', 'Price Modifier'),
      dataIndex: 'priceModifier',
      key: 'priceModifier',
      render: (modifier: number) => (
        <Text style={{ color: modifier > 0 ? '#52c41a' : modifier < 0 ? '#ff4d4f' : undefined }}>
          {modifier > 0 ? '+' : ''}{modifier.toFixed(2)} €
        </Text>
      ),
      sorter: true,
    },
    {
      title: t('admin:variants.stock', 'Stock'),
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock === 0 ? 'red' : stock < 10 ? 'orange' : 'green'}>
          {stock}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: t('admin:variants.lastUpdated', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('common:actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: ProductVariant) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title={t('admin:variants.confirmDelete', 'Delete this variant?')} onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><AppstoreOutlined /> {t('admin:variants.title', 'Product Variants')}</Title>
          <Text type="secondary">{t('admin:variants.subtitle', 'Manage product variations (size, color, etc.)')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:variants.create', 'Add Variant')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:variants.totalVariants', 'Total Variants')} value={pagination.total} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:variants.totalStock', 'Total Stock')} value={totalStock} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title={t('admin:variants.lowStock', 'Low Stock (<10)')} value={lowStockCount} valueStyle={{ color: lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search 
              placeholder={t('admin:variants.searchPlaceholder', 'Search by SKU or name...')} 
              allowClear 
              prefix={<SearchOutlined />}
              onSearch={setSearchQuery}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select 
              placeholder={t('admin:variants.filterByProduct', 'Filter by product')} 
              allowClear 
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              onChange={setSelectedProduct}
            >
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>{product.name}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table 
          columns={columns} 
          dataSource={variants} 
          rowKey="id" 
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editingVariant ? t('admin:variants.editVariant', 'Edit Variant') : t('admin:variants.createVariant', 'Create Variant')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label={t('admin:variants.product', 'Product')} rules={[{ required: true }]}>
            <Select placeholder="Select product" showSearch optionFilterProp="children" disabled={!!editingVariant}>
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>{product.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="sku" label={t('admin:variants.sku', 'SKU')} rules={[{ required: true }]}>
            <Input placeholder="PROD-001-RED-L" disabled={!!editingVariant} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="size" label={t('admin:variants.size', 'Size')}>
                <Input placeholder="L, XL, XXL..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label={t('admin:variants.color', 'Color')}>
                <Input placeholder="Red, Blue, Green..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priceModifier" label={t('admin:variants.priceModifier', 'Price Modifier (€)')}>
                <InputNumber step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label={t('admin:variants.stock', 'Stock')} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

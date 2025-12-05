'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Select, Modal, Form, message, Popconfirm, Typography, Row, Col, ColorPicker, Switch, DatePicker, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, NotificationOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import type { Color } from 'antd/es/color-picker';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Banner {
  id: string;
  title: string;
  message: string;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  link?: string;
  linkText?: string;
  position: 'TOP' | 'HERO' | 'SIDEBAR' | 'FOOTER' | 'POPUP';
  priority: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  dismissible: boolean;
  showCountdown: boolean;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  SCHEDULED: 'processing',
  ARCHIVED: 'error',
};

const positionLabels: Record<string, string> = {
  TOP: '🔝 Top Bar',
  HERO: '🖼️ Hero',
  SIDEBAR: '📐 Sidebar',
  FOOTER: '⬇️ Footer',
  POPUP: '💬 Popup',
};

export default function BannersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<Banner>({
    resource: 'banners',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'priority', order: 'asc' }] },
  });

  const { mutate: createBanner } = useCreate();
  const { mutate: updateBanner } = useUpdate();
  const { mutate: deleteBanner } = useDelete();

  const handleCreate = () => {
    setEditingBanner(null);
    form.resetFields();
    form.setFieldsValue({ 
      status: 'DRAFT', 
      position: 'TOP', 
      priority: 0,
      backgroundColor: '#f97316',
      textColor: '#ffffff',
      dismissible: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingBanner(record);
    form.setFieldsValue({
      ...record,
      dateRange: record.startDate && record.endDate 
        ? [dayjs(record.startDate), dayjs(record.endDate)] 
        : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteBanner({ resource: 'banners', id }, {
      onSuccess: () => message.success('Banner deleted'),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { dateRange, ...rest } = values;
      
      const payload = {
        ...rest,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      };

      setSubmitting(true);
      if (editingBanner) {
        updateBanner({ resource: 'banners', id: editingBanner.id, values: payload }, {
          onSuccess: () => {
            message.success('Banner updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createBanner({ resource: 'banners', values: payload }, {
          onSuccess: () => {
            message.success('Banner created');
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

  const handleColorChange = (field: string, color: Color) => {
    form.setFieldValue(field, color.toHexString());
  };

  const columns = [
    {
      title: t('admin:cms.banners.title', 'Banner'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Banner) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>{record.message}</Text>
        </Space>
      ),
    },
    {
      title: t('admin:cms.banners.position', 'Position'),
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => <Tag>{positionLabels[position]}</Tag>,
    },
    {
      title: t('admin:cms.banners.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('admin:cms.banners.period', 'Period'),
      key: 'period',
      render: (_: unknown, record: Banner) => (
        record.startDate && record.endDate ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(record.startDate).format('DD/MM')} - {dayjs(record.endDate).format('DD/MM')}
          </Text>
        ) : '-'
      ),
    },
    {
      title: t('admin:cms.banners.stats', 'Stats'),
      key: 'stats',
      render: (_: unknown, record: Banner) => (
        <Space>
          <Statistic value={record.impressions} suffix="👁️" valueStyle={{ fontSize: 14 }} />
          <Statistic value={record.clicks} suffix="👆" valueStyle={{ fontSize: 14 }} />
        </Space>
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: Banner) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this banner?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><NotificationOutlined /> {t('admin:cms.banners.title', 'Banners')}</Title>
          <Text type="secondary">{t('admin:cms.banners.subtitle', 'Manage promotional banners')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.banners.create', 'Create Banner')}
        </Button>
      </div>

      <Card>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingBanner ? 'Edit Banner' : 'Create Banner'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="Banner title" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="Position" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(positionLabels).map(([key, label]) => (
                    <Select.Option key={key} value={key}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="message" label="Message" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Banner message" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="link" label="Link URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="linkText" label="Link Text">
                <Input placeholder="Shop Now" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="backgroundColor" label="Background">
                <ColorPicker onChange={(c) => handleColorChange('backgroundColor', c)} showText />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="textColor" label="Text Color">
                <ColorPicker onChange={(c) => handleColorChange('textColor', c)} showText />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="backgroundImage" label="Background Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="DRAFT">Draft</Select.Option>
                  <Select.Option value="PUBLISHED">Published</Select.Option>
                  <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                  <Select.Option value="ARCHIVED">Archived</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Priority">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dateRange" label="Active Period">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dismissible" label="Dismissible" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="showCountdown" label="Show Countdown" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

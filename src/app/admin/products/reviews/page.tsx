'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, message, Typography, Row, Col, Statistic, Select, Rate, Avatar, Image, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, StarOutlined, EyeOutlined, UserOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import { useUpdate } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userName: string;
  userAvatar?: string;
  images?: string[];
  videos?: string[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  response?: { text: string; date: string };
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'warning', label: 'Pending' },
  APPROVED: { color: 'success', label: 'Approved' },
  REJECTED: { color: 'error', label: 'Rejected' },
};

export default function ReviewsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');

  const { tableProps } = useTable<Review>({
    resource: 'reviews',
    pagination: { pageSize: 10 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: updateReview } = useUpdate();

  const handleApprove = (record: Review) => {
    updateReview({ resource: 'reviews', id: record.id, values: { status: 'APPROVED' } }, {
      onSuccess: () => message.success('Review approved'),
    });
  };

  const handleReject = (record: Review) => {
    updateReview({ resource: 'reviews', id: record.id, values: { status: 'REJECTED' } }, {
      onSuccess: () => message.success('Review rejected'),
    });
  };

  const handleViewDetails = (record: Review) => {
    setSelectedReview(record);
    setDetailsModalVisible(true);
  };

  const handleOpenResponse = (record: Review) => {
    setSelectedReview(record);
    setResponseText(record.response?.text || '');
    setResponseModalVisible(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedReview) return;
    updateReview({ 
      resource: 'reviews', 
      id: selectedReview.id, 
      values: { response: { text: responseText, date: new Date().toISOString() } } 
    }, {
      onSuccess: () => {
        message.success('Response saved');
        setResponseModalVisible(false);
      },
    });
  };

  // Stats
  const reviews = tableProps.dataSource || [];
  const pendingCount = reviews.filter((r: Review) => r.status === 'PENDING').length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0';

  const columns = [
    {
      title: t('admin:reviews.product', 'Product'),
      key: 'product',
      render: (_: unknown, record: Review) => (
        <Space>
          {record.product?.images?.[0]?.url ? (
            <Image src={record.product.images[0].url} alt={record.product.name} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
          ) : (
            <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4 }} />
          )}
          <Text strong style={{ maxWidth: 150 }} ellipsis={{ tooltip: record.product?.name }}>
            {record.product?.name}
          </Text>
        </Space>
      ),
    },
    {
      title: t('admin:reviews.reviewer', 'Reviewer'),
      key: 'reviewer',
      render: (_: unknown, record: Review) => (
        <Space>
          <Avatar src={record.userAvatar} icon={<UserOutlined />} size="small" />
          <Space direction="vertical" size={0}>
            <Text>{record.userName}</Text>
            {record.verified && <Tag color="blue" style={{ fontSize: 10 }}>Verified</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: t('admin:reviews.rating', 'Rating'),
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: t('admin:reviews.content', 'Content'),
      key: 'content',
      render: (_: unknown, record: Review) => (
        <Space direction="vertical" size={0}>
          {record.title && <Text strong>{record.title}</Text>}
          <Text type="secondary" style={{ maxWidth: 200 }} ellipsis={{ tooltip: record.comment }}>
            {record.comment}
          </Text>
        </Space>
      ),
    },
    {
      title: t('admin:reviews.helpful', 'Helpful'),
      key: 'helpful',
      render: (_: unknown, record: Review) => (
        <Space>
          <Tag icon={<LikeOutlined />} color="green">{record.helpful}</Tag>
          <Tag icon={<DislikeOutlined />} color="red">{record.notHelpful}</Tag>
        </Space>
      ),
    },
    {
      title: t('admin:reviews.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: t('admin:reviews.date', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: Review) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          {record.status === 'PENDING' && (
            <>
              <Button type="text" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={() => handleApprove(record)} />
              <Button type="text" icon={<CloseOutlined />} danger onClick={() => handleReject(record)} />
            </>
          )}
          <Button type="link" size="small" onClick={() => handleOpenResponse(record)}>
            {record.response ? 'Edit Response' : 'Respond'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><StarOutlined /> {t('admin:reviews.title', 'Reviews Moderation')}</Title>
          <Text type="secondary">{t('admin:reviews.subtitle', 'Manage product reviews')}</Text>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Reviews" value={reviews.length} prefix={<StarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Pending" value={pendingCount} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Average Rating" value={avgRating} suffix="/ 5" prefix={<StarOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Approved" value={reviews.filter((r: Review) => r.status === 'APPROVED').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search reviews..." allowClear />
          </Col>
          <Col xs={24} md={4}>
            <Select placeholder="Status" allowClear style={{ width: '100%' }}>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="APPROVED">Approved</Select.Option>
              <Select.Option value="REJECTED">Rejected</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select placeholder="Rating" allowClear style={{ width: '100%' }}>
              {[5, 4, 3, 2, 1].map(r => (
                <Select.Option key={r} value={r}>{r} Stars</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Review Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedReview && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Product">{selectedReview.product?.name}</Descriptions.Item>
              <Descriptions.Item label="Reviewer">
                <Space>
                  <Avatar src={selectedReview.userAvatar} icon={<UserOutlined />} />
                  {selectedReview.userName}
                  {selectedReview.verified && <Tag color="blue">Verified Purchase</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                <Rate disabled value={selectedReview.rating} />
              </Descriptions.Item>
              <Descriptions.Item label="Title">{selectedReview.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="Comment">
                <Paragraph>{selectedReview.comment}</Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusConfig[selectedReview.status]?.color || 'default'}>
                  {statusConfig[selectedReview.status]?.label || selectedReview.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date">{dayjs(selectedReview.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            </Descriptions>

            {selectedReview.images && selectedReview.images.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Images:</Text>
                <Space style={{ marginTop: 8 }}>
                  {selectedReview.images.map((img, i) => (
                    <Image key={i} src={img} alt={`Review image ${i + 1}`} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 4 }} />
                  ))}
                </Space>
              </div>
            )}

            {selectedReview.response && (
              <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <Text strong>Store Response:</Text>
                <Paragraph style={{ marginTop: 8 }}>{selectedReview.response.text}</Paragraph>
                <Text type="secondary">{dayjs(selectedReview.response.date).format('DD/MM/YYYY')}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal
        title="Respond to Review"
        open={responseModalVisible}
        onOk={handleSubmitResponse}
        onCancel={() => setResponseModalVisible(false)}
        okText="Save Response"
      >
        <Input.TextArea
          rows={4}
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Write your response to this review..."
        />
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Row, Col, Image, Select, Upload, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, PictureOutlined, FileOutlined, VideoCameraOutlined, CopyOutlined, UploadOutlined, FolderOutlined } from '@ant-design/icons';
import { useUpdate, useDelete } from '@refinedev/core';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CmsMedia {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  tags?: string[];
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <PictureOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  if (mimeType.startsWith('video/')) return <VideoCameraOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
  return <FileOutlined style={{ fontSize: 24, color: '#999' }} />;
};

export default function MediaLibraryPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedia, setEditingMedia] = useState<CmsMedia | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<CmsMedia | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  const { tableProps } = useTable<CmsMedia>({
    resource: 'cms-media',
    pagination: { pageSize: 24 },
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  });

  const { mutate: updateMedia } = useUpdate();
  const { mutate: deleteMedia } = useDelete();

  const handleEdit = (record: CmsMedia) => {
    setEditingMedia(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteMedia({ resource: 'cms-media', id }, {
      onSuccess: () => message.success('Media deleted'),
    });
  };

  const handlePreview = (record: CmsMedia) => {
    setPreviewMedia(record);
    setPreviewVisible(true);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      if (editingMedia) {
        updateMedia({ resource: 'cms-media', id: editingMedia.id, values }, {
          onSuccess: () => {
            message.success('Media updated');
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

  // Calculate stats
  const mediaList = tableProps.dataSource || [];
  const totalSize = mediaList.reduce((acc: number, m: CmsMedia) => acc + m.size, 0);
  const imageCount = mediaList.filter((m: CmsMedia) => m.mimeType.startsWith('image/')).length;
  const videoCount = mediaList.filter((m: CmsMedia) => m.mimeType.startsWith('video/')).length;

  const columns = [
    {
      title: t('admin:cms.media.file', 'File'),
      key: 'file',
      render: (_: unknown, record: CmsMedia) => (
        <Space>
          {record.mimeType.startsWith('image/') ? (
            <Image 
              src={record.thumbnailUrl || record.url} 
              alt={record.alt || record.filename}
              width={50} 
              height={50} 
              style={{ objectFit: 'cover', borderRadius: 4 }} 
              preview={false}
              onClick={() => handlePreview(record)}
            />
          ) : (
            <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getFileIcon(record.mimeType)}
            </div>
          )}
          <Space direction="vertical" size={0}>
            <Text strong style={{ maxWidth: 200 }} ellipsis={{ tooltip: record.filename }}>{record.filename}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.mimeType}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t('admin:cms.media.size', 'Size'),
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: t('admin:cms.media.dimensions', 'Dimensions'),
      key: 'dimensions',
      render: (_: unknown, record: CmsMedia) => 
        record.width && record.height ? `${record.width} × ${record.height}` : '-',
    },
    {
      title: t('admin:cms.media.folder', 'Folder'),
      dataIndex: 'folder',
      key: 'folder',
      render: (folder: string) => <Tag icon={<FolderOutlined />}>{folder || 'uploads'}</Tag>,
    },
    {
      title: t('admin:cms.media.uploaded', 'Uploaded'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: CmsMedia) => (
        <Space>
          <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopyUrl(record.url)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this file?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><PictureOutlined /> {t('admin:cms.media.title', 'Media Library')}</Title>
          <Text type="secondary">{t('admin:cms.media.subtitle', 'Manage your media files')}</Text>
        </div>
        <Upload
          action="/api/admin/media/upload"
          showUploadList={false}
          onChange={(info) => {
            if (info.file.status === 'done') {
              message.success('File uploaded');
            } else if (info.file.status === 'error') {
              message.error('Upload failed');
            }
          }}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            {t('admin:cms.media.upload', 'Upload Files')}
          </Button>
        </Upload>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Files" value={mediaList.length} prefix={<FileOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Images" value={imageCount} prefix={<PictureOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Videos" value={videoCount} prefix={<VideoCameraOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Size" value={formatFileSize(totalSize)} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Search files..." allowClear />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by type" allowClear style={{ width: '100%' }}>
              <Select.Option value="image">Images</Select.Option>
              <Select.Option value="video">Videos</Select.Option>
              <Select.Option value="document">Documents</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Filter by folder" allowClear style={{ width: '100%' }}>
              <Select.Option value="uploads">Uploads</Select.Option>
              <Select.Option value="products">Products</Select.Option>
              <Select.Option value="blog">Blog</Select.Option>
              <Select.Option value="banners">Banners</Select.Option>
            </Select>
          </Col>
        </Row>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Media"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="alt" label="Alt Text">
            <Input placeholder="Describe the image for accessibility" />
          </Form.Item>

          <Form.Item name="caption" label="Caption">
            <TextArea rows={2} placeholder="Optional caption" />
          </Form.Item>

          <Form.Item name="folder" label="Folder">
            <Select>
              <Select.Option value="uploads">Uploads</Select.Option>
              <Select.Option value="products">Products</Select.Option>
              <Select.Option value="blog">Blog</Select.Option>
              <Select.Option value="banners">Banners</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={previewMedia?.filename}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewMedia && (
          <div style={{ textAlign: 'center' }}>
            {previewMedia.mimeType.startsWith('image/') ? (
              <Image src={previewMedia.url} alt={previewMedia.alt || previewMedia.filename} style={{ maxWidth: '100%' }} />
            ) : previewMedia.mimeType.startsWith('video/') ? (
              <video src={previewMedia.url} controls style={{ maxWidth: '100%' }} />
            ) : (
              <div style={{ padding: 40 }}>
                {getFileIcon(previewMedia.mimeType)}
                <Text style={{ display: 'block', marginTop: 16 }}>{previewMedia.filename}</Text>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button icon={<CopyOutlined />} onClick={() => handleCopyUrl(previewMedia.url)}>
                Copy URL
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

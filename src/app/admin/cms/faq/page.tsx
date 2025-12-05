'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Switch, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, MenuOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FAQPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<FAQ>({
    resource: 'faqs',
    pagination: { pageSize: 20 },
    sorters: { initial: [{ field: 'order', order: 'asc' }] },
  });

  const { mutate: createFaq } = useCreate();
  const { mutate: updateFaq } = useUpdate();
  const { mutate: deleteFaq } = useDelete();

  const handleCreate = () => {
    setEditingFaq(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: FAQ) => {
    setEditingFaq(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteFaq({ resource: 'faqs', id }, {
      onSuccess: () => message.success('FAQ deleted'),
    });
  };

  const handleToggleActive = (record: FAQ) => {
    updateFaq({ resource: 'faqs', id: record.id, values: { isActive: !record.isActive } }, {
      onSuccess: () => message.success(`FAQ ${record.isActive ? 'disabled' : 'enabled'}`),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);
      if (editingFaq) {
        updateFaq({ resource: 'faqs', id: editingFaq.id, values }, {
          onSuccess: () => {
            message.success('FAQ updated');
            setModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createFaq({ resource: 'faqs', values }, {
          onSuccess: () => {
            message.success('FAQ created');
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
      title: '',
      key: 'drag',
      width: 40,
      render: () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: t('admin:cms.faq.order', 'Order'),
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number) => <Tag>{order}</Tag>,
    },
    {
      title: t('admin:cms.faq.question', 'Question'),
      dataIndex: 'question',
      key: 'question',
      render: (question: string) => (
        <Text strong style={{ maxWidth: 400, display: 'block' }} ellipsis={{ tooltip: question }}>
          {question}
        </Text>
      ),
    },
    {
      title: t('admin:cms.faq.answer', 'Answer'),
      dataIndex: 'answer',
      key: 'answer',
      render: (answer: string) => (
        <Text type="secondary" style={{ maxWidth: 300, display: 'block' }} ellipsis={{ tooltip: answer }}>
          {answer}
        </Text>
      ),
    },
    {
      title: t('admin:cms.faq.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: FAQ) => (
        <Switch checked={isActive} onChange={() => handleToggleActive(record)} size="small" />
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: FAQ) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this FAQ?" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0 }}><QuestionCircleOutlined /> {t('admin:cms.faq.title', 'FAQ')}</Title>
          <Text type="secondary">{t('admin:cms.faq.subtitle', 'Manage frequently asked questions')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('admin:cms.faq.create', 'Add FAQ')}
        </Button>
      </div>

      <Card>
        <Table {...tableProps} columns={columns} rowKey="id" />
      </Card>

      <Modal
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="question" label="Question" rules={[{ required: true }]}>
            <Input placeholder="What is your return policy?" />
          </Form.Item>

          <Form.Item name="answer" label="Answer" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="Detailed answer to the question..." />
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

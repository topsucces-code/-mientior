"use client";

import React, { useState } from "react";
import { 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Tooltip 
} from "antd";
import { 
  MailOutlined, 
  CustomerServiceOutlined, 
  GiftOutlined, 
  EditOutlined,
  SendOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNotification } from "@refinedev/core";
import { useIsMobile } from "@/hooks/use-media-query";

const { TextArea } = Input;
const { Option } = Select;

interface QuickActionsToolbarProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  onActionComplete?: (action: string, result: unknown) => void;
}

interface SendEmailFormData {
  subject: string;
  body: string;
  template?: string;
}

interface CreateTicketFormData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface AdjustPointsFormData {
  amount: number;
  reason: string;
  type: 'add' | 'subtract';
}

interface AddNoteFormData {
  content: string;
}

export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  customerId,
  customerName,
  customerEmail,
  onActionComplete,
}) => {
  const { t } = useTranslation(["common", "admin"]);
  const { open } = useNotification();
  const isMobile = useIsMobile();
  
  // Modal states
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  
  // Loading states
  const [emailLoading, setEmailLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  
  // Forms
  const [emailForm] = Form.useForm<SendEmailFormData>();
  const [ticketForm] = Form.useForm<CreateTicketFormData>();
  const [pointsForm] = Form.useForm<AdjustPointsFormData>();
  const [noteForm] = Form.useForm<AddNoteFormData>();

  const performQuickAction = async (action: string, data: unknown) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/quick-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      return result;
    } catch (error) {
      console.error('Quick action error:', error);
      throw error;
    }
  };

  const handleSendEmail = async (values: SendEmailFormData) => {
    setEmailLoading(true);
    try {
      const result = await performQuickAction('send_email', values);
      
      open?.({
        type: 'success',
        message: t('admin:customers.quickActions.email.success'),
        description: t('admin:customers.quickActions.email.successDesc', {
          email: customerEmail,
        }),
      });

      setEmailModalVisible(false);
      emailForm.resetFields();
      onActionComplete?.('send_email', result.result);
    } catch (error) {
      open?.({
        type: 'error',
        message: t('admin:customers.quickActions.email.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCreateTicket = async (values: CreateTicketFormData) => {
    setTicketLoading(true);
    try {
      const result = await performQuickAction('create_ticket', values);
      
      open?.({
        type: 'success',
        message: t('admin:customers.quickActions.ticket.success'),
        description: t('admin:customers.quickActions.ticket.successDesc', {
          subject: values.subject,
        }),
      });

      setTicketModalVisible(false);
      ticketForm.resetFields();
      onActionComplete?.('create_ticket', result.result);
    } catch (error) {
      open?.({
        type: 'error',
        message: t('admin:customers.quickActions.ticket.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTicketLoading(false);
    }
  };

  const handleAdjustPoints = async (values: AdjustPointsFormData) => {
    setPointsLoading(true);
    try {
      const result = await performQuickAction('adjust_points', values);
      
      open?.({
        type: 'success',
        message: t('admin:customers.quickActions.points.success'),
        description: t('admin:customers.quickActions.points.successDesc', {
          type: values.type,
          amount: values.amount,
        }),
      });

      setPointsModalVisible(false);
      pointsForm.resetFields();
      onActionComplete?.('adjust_points', result.result);
    } catch (error) {
      open?.({
        type: 'error',
        message: t('admin:customers.quickActions.points.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPointsLoading(false);
    }
  };

  const handleAddNote = async (values: AddNoteFormData) => {
    setNoteLoading(true);
    try {
      const result = await performQuickAction('add_note', values);
      
      open?.({
        type: 'success',
        message: t('admin:customers.quickActions.note.success'),
        description: t('admin:customers.quickActions.note.successDesc'),
      });

      setNoteModalVisible(false);
      noteForm.resetFields();
      onActionComplete?.('add_note', result.result);
    } catch (error) {
      open?.({
        type: 'error',
        message: t('admin:customers.quickActions.note.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <>
      <div style={{ 
        padding: isMobile ? '12px' : '16px', 
        backgroundColor: '#fafafa', 
        borderRadius: '8px',
        marginBottom: isMobile ? '16px' : '24px'
      }}>
        {!isMobile && (
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
            {t('admin:customers.quickActions.title')}
          </h3>
        )}
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Tooltip title={t('admin:customers.quickActions.email.tooltip')}>
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={() => setEmailModalVisible(true)}
              size={isMobile ? "large" : "middle"}
              style={isMobile ? { minWidth: 44, minHeight: 44 } : {}}
            >
              {isMobile ? "" : t('admin:customers.quickActions.email.button')}
            </Button>
          </Tooltip>
          
          <Tooltip title={t('admin:customers.quickActions.ticket.tooltip')}>
            <Button
              icon={<CustomerServiceOutlined />}
              onClick={() => setTicketModalVisible(true)}
              size={isMobile ? "large" : "middle"}
              style={isMobile ? { minWidth: 44, minHeight: 44 } : {}}
            >
              {isMobile ? "" : t('admin:customers.quickActions.ticket.button')}
            </Button>
          </Tooltip>
          
          <Tooltip title={t('admin:customers.quickActions.points.tooltip')}>
            <Button
              icon={<GiftOutlined />}
              onClick={() => setPointsModalVisible(true)}
              size={isMobile ? "large" : "middle"}
              style={isMobile ? { minWidth: 44, minHeight: 44 } : {}}
            >
              {isMobile ? "" : t('admin:customers.quickActions.points.button')}
            </Button>
          </Tooltip>
          
          <Tooltip title={t('admin:customers.quickActions.note.tooltip')}>
            <Button
              icon={<EditOutlined />}
              onClick={() => setNoteModalVisible(true)}
              size={isMobile ? "large" : "middle"}
              style={isMobile ? { minWidth: 44, minHeight: 44 } : {}}
            >
              {isMobile ? "" : t('admin:customers.quickActions.note.button')}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Send Email Modal */}
      <Modal
        title={t('admin:customers.quickActions.email.modalTitle', { name: customerName })}
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        footer={null}
        width={isMobile ? "100%" : 600}
        style={isMobile ? { top: 20, maxWidth: "calc(100vw - 32px)" } : {}}
      >
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={handleSendEmail}
          initialValues={{
            subject: '',
            body: '',
          }}
        >
          <Form.Item
            name="subject"
            label={t('admin:customers.quickActions.email.subject')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.email.subjectRequired') },
              { max: 200, message: t('admin:customers.quickActions.email.subjectMaxLength') },
            ]}
          >
            <Input placeholder={t('admin:customers.quickActions.email.subjectPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="body"
            label={t('admin:customers.quickActions.email.body')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.email.bodyRequired') },
              { max: 5000, message: t('admin:customers.quickActions.email.bodyMaxLength') },
            ]}
          >
            <TextArea
              rows={8}
              placeholder={t('admin:customers.quickActions.email.bodyPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEmailModalVisible(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={emailLoading}
                icon={<SendOutlined />}
              >
                {t('admin:customers.quickActions.email.send')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        title={t('admin:customers.quickActions.ticket.modalTitle', { name: customerName })}
        open={ticketModalVisible}
        onCancel={() => setTicketModalVisible(false)}
        footer={null}
        width={isMobile ? "100%" : 600}
        style={isMobile ? { top: 20, maxWidth: "calc(100vw - 32px)" } : {}}
      >
        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleCreateTicket}
          initialValues={{
            priority: 'medium',
          }}
        >
          <Form.Item
            name="subject"
            label={t('admin:customers.quickActions.ticket.subject')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.ticket.subjectRequired') },
              { max: 200, message: t('admin:customers.quickActions.ticket.subjectMaxLength') },
            ]}
          >
            <Input placeholder={t('admin:customers.quickActions.ticket.subjectPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="priority"
            label={t('admin:customers.quickActions.ticket.priority')}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="low">{t('admin:customers.quickActions.ticket.priorityLow')}</Option>
              <Option value="medium">{t('admin:customers.quickActions.ticket.priorityMedium')}</Option>
              <Option value="high">{t('admin:customers.quickActions.ticket.priorityHigh')}</Option>
              <Option value="urgent">{t('admin:customers.quickActions.ticket.priorityUrgent')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={t('admin:customers.quickActions.ticket.description')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.ticket.descriptionRequired') },
              { max: 2000, message: t('admin:customers.quickActions.ticket.descriptionMaxLength') },
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t('admin:customers.quickActions.ticket.descriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTicketModalVisible(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={ticketLoading}
                icon={<PlusOutlined />}
              >
                {t('admin:customers.quickActions.ticket.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjust Points Modal */}
      <Modal
        title={t('admin:customers.quickActions.points.modalTitle', { name: customerName })}
        open={pointsModalVisible}
        onCancel={() => setPointsModalVisible(false)}
        footer={null}
        width={isMobile ? "100%" : 500}
        style={isMobile ? { top: 20, maxWidth: "calc(100vw - 32px)" } : {}}
      >
        <Form
          form={pointsForm}
          layout="vertical"
          onFinish={handleAdjustPoints}
          initialValues={{
            type: 'add',
          }}
        >
          <Form.Item
            name="type"
            label={t('admin:customers.quickActions.points.type')}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="add">{t('admin:customers.quickActions.points.typeAdd')}</Option>
              <Option value="subtract">{t('admin:customers.quickActions.points.typeSubtract')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label={t('admin:customers.quickActions.points.amount')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.points.amountRequired') },
              { type: 'number', min: 1, message: t('admin:customers.quickActions.points.amountMin') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={t('admin:customers.quickActions.points.amountPlaceholder')}
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label={t('admin:customers.quickActions.points.reason')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.points.reasonRequired') },
              { max: 500, message: t('admin:customers.quickActions.points.reasonMaxLength') },
            ]}
          >
            <TextArea
              rows={3}
              placeholder={t('admin:customers.quickActions.points.reasonPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPointsModalVisible(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={pointsLoading}
                icon={<GiftOutlined />}
              >
                {t('admin:customers.quickActions.points.adjust')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        title={t('admin:customers.quickActions.note.modalTitle', { name: customerName })}
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        footer={null}
        width={isMobile ? "100%" : 600}
        style={isMobile ? { top: 20, maxWidth: "calc(100vw - 32px)" } : {}}
      >
        <Form
          form={noteForm}
          layout="vertical"
          onFinish={handleAddNote}
        >
          <Form.Item
            name="content"
            label={t('admin:customers.quickActions.note.content')}
            rules={[
              { required: true, message: t('admin:customers.quickActions.note.contentRequired') },
              { max: 5000, message: t('admin:customers.quickActions.note.contentMaxLength') },
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t('admin:customers.quickActions.note.contentPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setNoteModalVisible(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={noteLoading}
                icon={<PlusOutlined />}
              >
                {t('admin:customers.quickActions.note.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
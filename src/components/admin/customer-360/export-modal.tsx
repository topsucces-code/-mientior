"use client";

import React, { useState } from 'react';
import { Modal, Form, Select, Button, Progress, message, Space, Typography, Divider, Checkbox, Alert, Tooltip } from 'antd';
import { DownloadOutlined, FileTextOutlined, FilePdfOutlined, FileExcelOutlined, InfoCircleOutlined, ShieldCheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { Text, Title } = Typography;

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  includeOrders: boolean;
  includeAnalytics: boolean;
  includeNotes: boolean;
  includeTags: boolean;
  dateRange: 'all' | '30d' | '90d' | '1y';
  orderLimit: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  customerId,
  customerName,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const [form] = Form.useForm();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error'>('idle');

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Report',
      icon: <FilePdfOutlined />,
      description: 'Comprehensive formatted report with all customer information'
    },
    {
      value: 'csv',
      label: 'CSV Data',
      icon: <FileTextOutlined />,
      description: 'Raw data in comma-separated values format for analysis'
    },
    {
      value: 'xlsx',
      label: 'Excel Workbook',
      icon: <FileExcelOutlined />,
      description: 'Structured data in Excel format with multiple sheets'
    },
    {
      value: 'json',
      label: 'JSON Data',
      icon: <FileTextOutlined />,
      description: 'Complete data structure in JSON format for developers'
    }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '1y', label: 'Last 12 Months' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const orderLimitOptions = [
    { value: 50, label: '50 orders' },
    { value: 100, label: '100 orders' },
    { value: 250, label: '250 orders' },
    { value: 500, label: '500 orders' },
    { value: 1000, label: '1000 orders' }
  ];

  const handleExport = async (values: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('preparing');

    try {
      // Simulate progress updates
      const progressSteps = [
        { status: 'preparing', progress: 10, message: 'Preparing export...' },
        { status: 'generating', progress: 50, message: 'Generating export file...' },
        { status: 'downloading', progress: 90, message: 'Preparing download...' }
      ];

      for (const step of progressSteps) {
        setExportStatus(step.status as any);
        setExportProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        format: values.format,
        includeOrders: values.includeOrders.toString(),
        includeAnalytics: values.includeAnalytics.toString(),
        includeNotes: values.includeNotes.toString(),
        includeTags: values.includeTags.toString(),
        dateRange: values.dateRange,
        orderLimit: values.orderLimit.toString()
      });

      // Make the export request
      const response = await fetch(`/api/admin/customers/${customerId}/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': getAcceptHeader(values.format),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      // Handle the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `customer-${customerId}-export.${values.format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportStatus('complete');
      
      message.success(t('admin:customers.export.success', { 
        format: values.format.toUpperCase(),
        customer: customerName 
      }));

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        resetExportState();
      }, 1500);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      message.error(t('admin:customers.export.error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      setIsExporting(false);
    }
  };

  const getAcceptHeader = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json'
    };
    return mimeTypes[format] || 'application/octet-stream';
  };

  const resetExportState = () => {
    setExportProgress(0);
    setExportStatus('idle');
    setIsExporting(false);
  };

  const handleCancel = () => {
    if (!isExporting) {
      onClose();
      resetExportState();
    }
  };

  const getProgressStatus = () => {
    switch (exportStatus) {
      case 'error':
        return 'exception';
      case 'complete':
        return 'success';
      default:
        return 'active';
    }
  };

  const getStatusMessage = () => {
    switch (exportStatus) {
      case 'preparing':
        return t('admin:customers.export.preparing');
      case 'generating':
        return t('admin:customers.export.generating');
      case 'downloading':
        return t('admin:customers.export.downloading');
      case 'complete':
        return t('admin:customers.export.complete');
      case 'error':
        return t('admin:customers.export.failed');
      default:
        return '';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          {t('admin:customers.export.title')}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={null}
      maskClosable={!isExporting}
      closable={!isExporting}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          {t('admin:customers.export.description', { customer: customerName })}
        </Text>
      </div>

      {isExporting ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Title level={4}>{getStatusMessage()}</Title>
          <Progress
            percent={exportProgress}
            status={getProgressStatus()}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              {exportStatus === 'complete' 
                ? t('admin:customers.export.downloadStarted')
                : t('admin:customers.export.pleaseWait')
              }
            </Text>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            format: 'pdf',
            includeOrders: true,
            includeAnalytics: true,
            includeNotes: true,
            includeTags: true,
            dateRange: 'all',
            orderLimit: 100
          }}
        >
          <Form.Item
            name="format"
            label={t('admin:customers.export.format')}
            rules={[{ required: true, message: t('admin:customers.export.formatRequired') }]}
          >
            <Select size="large">
              {formatOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    {option.icon}
                    <div>
                      <div>{option.label}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {option.description}
                      </Text>
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>{t('admin:customers.export.dataOptions')}</Divider>

          <Form.Item name="includeOrders" valuePropName="checked">
            <Checkbox>
              {t('admin:customers.export.includeOrders')}
            </Checkbox>
          </Form.Item>

          <Form.Item name="includeAnalytics" valuePropName="checked">
            <Checkbox>
              {t('admin:customers.export.includeAnalytics')}
            </Checkbox>
          </Form.Item>

          <Form.Item name="includeNotes" valuePropName="checked">
            <Checkbox>
              {t('admin:customers.export.includeNotes')}
            </Checkbox>
          </Form.Item>

          <Form.Item name="includeTags" valuePropName="checked">
            <Checkbox>
              {t('admin:customers.export.includeTags')}
            </Checkbox>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label={t('admin:customers.export.dateRange')}
          >
            <Select>
              {dateRangeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="orderLimit"
            label={t('admin:customers.export.orderLimit')}
          >
            <Select>
              {orderLimitOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                {t('common:cancel')}
              </Button>
              <Button type="primary" htmlType="submit" icon={<DownloadOutlined />}>
                {t('admin:customers.export.startExport')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};
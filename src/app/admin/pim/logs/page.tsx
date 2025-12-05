'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Space, Button, Tag, Card, Input, Typography, Row, Col, Statistic, Select, DatePicker, Tooltip, Modal, App } from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ClockCircleOutlined, ReloadOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface PimSyncLog {
  id: string;
  source: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  productId?: string;
  product?: { id: string; name: string; slug: string };
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  metadata?: Record<string, unknown>;
  error?: string;
  duration?: number;
  createdAt: string;
}

export default function PimLogsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { message } = App.useApp();
  const [logs, setLogs] = useState<PimSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PimSyncLog | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    operation: undefined as string | undefined,
    source: undefined as string | undefined,
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('_start', ((pagination.current - 1) * pagination.pageSize).toString());
      params.append('_end', (pagination.current * pagination.pageSize).toString());
      params.append('_sort', 'createdAt');
      params.append('_order', 'desc');
      
      if (filters.status) params.append('status', filters.status);
      if (filters.operation) params.append('operation', filters.operation);
      if (filters.source) params.append('source', filters.source);
      if (filters.dateRange) {
        params.append('from', filters.dateRange[0].toISOString());
        params.append('to', filters.dateRange[1].toISOString());
      }

      const response = await fetch(`/api/admin/pim/logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        const total = response.headers.get('x-total-count');
        setPagination(prev => ({ ...prev, total: parseInt(total || '0') }));
      }
    } catch (error) {
      console.error('Failed to fetch PIM logs:', error);
      message.error(t('admin:pimLogs.fetchError', 'Failed to load sync logs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, filters]);

  const handleViewDetails = (record: PimSyncLog) => {
    setSelectedLog(record);
    setDetailsVisible(true);
  };

  const handleRetrySync = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/pim/logs/${logId}/retry`, { method: 'POST' });
      if (response.ok) {
        message.success(t('admin:pimLogs.retrySuccess', 'Sync retry initiated'));
        fetchLogs();
      } else {
        throw new Error('Retry failed');
      }
    } catch {
      message.error(t('admin:pimLogs.retryError', 'Failed to retry sync'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FAILED': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'PARTIAL': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'PENDING': return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'PARTIAL': return 'warning';
      case 'PENDING': return 'processing';
      default: return 'default';
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE': return 'green';
      case 'UPDATE': return 'blue';
      case 'DELETE': return 'red';
      default: return 'default';
    }
  };

  // Stats
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;
  const avgDuration = logs.length > 0 
    ? Math.round(logs.filter(l => l.duration).reduce((acc, l) => acc + (l.duration || 0), 0) / logs.filter(l => l.duration).length)
    : 0;

  const columns = [
    {
      title: t('admin:pimLogs.timestamp', 'Timestamp'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
          <Text>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin:pimLogs.source', 'Source'),
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => <Tag>{source}</Tag>,
    },
    {
      title: t('admin:pimLogs.operation', 'Operation'),
      dataIndex: 'operation',
      key: 'operation',
      render: (operation: string) => (
        <Tag color={getOperationColor(operation)}>{operation}</Tag>
      ),
    },
    {
      title: t('admin:pimLogs.product', 'Product'),
      key: 'product',
      render: (_: unknown, record: PimSyncLog) => (
        record.product ? (
          <Text>{record.product.name}</Text>
        ) : record.productId ? (
          <Text type="secondary">{record.productId}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: t('admin:pimLogs.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: t('admin:pimLogs.duration', 'Duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: t('common:actions', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: PimSyncLog) => (
        <Space>
          <Tooltip title={t('admin:pimLogs.viewDetails', 'View Details')}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          {record.status === 'FAILED' && (
            <Tooltip title={t('admin:pimLogs.retry', 'Retry')}>
              <Button type="text" icon={<ReloadOutlined />} onClick={() => handleRetrySync(record.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><HistoryOutlined /> {t('admin:pimLogs.title', 'PIM Sync Logs')}</Title>
          <Text type="secondary">{t('admin:pimLogs.subtitle', 'Monitor product synchronization with Akeneo PIM')}</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
          {t('admin:pimLogs.refresh', 'Refresh')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title={t('admin:pimLogs.totalSyncs', 'Total Syncs')} 
              value={pagination.total} 
              prefix={<SyncOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title={t('admin:pimLogs.successful', 'Successful')} 
              value={successCount} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title={t('admin:pimLogs.failed', 'Failed')} 
              value={failedCount} 
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title={t('admin:pimLogs.avgDuration', 'Avg Duration')} 
              value={avgDuration} 
              suffix="ms"
              prefix={<ClockCircleOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}>
            <Select 
              placeholder={t('admin:pimLogs.filterByStatus', 'Filter by status')} 
              allowClear 
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Select.Option value="SUCCESS">Success</Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
              <Select.Option value="PARTIAL">Partial</Select.Option>
              <Select.Option value="PENDING">Pending</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select 
              placeholder={t('admin:pimLogs.filterByOperation', 'Filter by operation')} 
              allowClear 
              style={{ width: '100%' }}
              value={filters.operation}
              onChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
            >
              <Select.Option value="CREATE">Create</Select.Option>
              <Select.Option value="UPDATE">Update</Select.Option>
              <Select.Option value="DELETE">Delete</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Input 
              placeholder={t('admin:pimLogs.filterBySource', 'Filter by source')} 
              allowClear 
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value || undefined }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <RangePicker 
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
            />
          </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={logs} 
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

      {/* Details Modal */}
      <Modal
        title={t('admin:pimLogs.syncDetails', 'Sync Details')}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('admin:pimLogs.timestamp', 'Timestamp')}:</Text>
                <br />
                <Text>{dayjs(selectedLog.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('admin:pimLogs.status', 'Status')}:</Text>
                <br />
                <Tag icon={getStatusIcon(selectedLog.status)} color={getStatusColor(selectedLog.status)}>
                  {selectedLog.status}
                </Tag>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>{t('admin:pimLogs.source', 'Source')}:</Text>
                <br />
                <Tag>{selectedLog.source}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>{t('admin:pimLogs.operation', 'Operation')}:</Text>
                <br />
                <Tag color={getOperationColor(selectedLog.operation)}>{selectedLog.operation}</Tag>
              </Col>
            </Row>

            {selectedLog.product && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Text strong>{t('admin:pimLogs.product', 'Product')}:</Text>
                  <br />
                  <Text>{selectedLog.product.name} ({selectedLog.product.slug})</Text>
                </Col>
              </Row>
            )}

            {selectedLog.duration && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Text strong>{t('admin:pimLogs.duration', 'Duration')}:</Text>
                  <br />
                  <Text>{selectedLog.duration}ms</Text>
                </Col>
              </Row>
            )}

            {selectedLog.error && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Text strong type="danger">{t('admin:pimLogs.error', 'Error')}:</Text>
                  <pre style={{ background: '#fff2f0', padding: 12, borderRadius: 4, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {selectedLog.error}
                  </pre>
                </Col>
              </Row>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <Row gutter={16}>
                <Col span={24}>
                  <Text strong>{t('admin:pimLogs.metadata', 'Metadata')}:</Text>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 8, overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

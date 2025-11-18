'use client';

// Vendor Commissions Management Page
import React from 'react';
import { Table, Card, Space, Button, Tag, Statistic, Row, Col, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DollarOutlined, DownloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs, { Dayjs } from 'dayjs';
import type { Key } from 'react';

const { RangePicker } = DatePicker;

interface VendorCommission {
  id: string;
  vendorId: string;
  vendorName: string;
  orderId: string;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
}

export default function VendorCommissionsPage() {
  const [dateRange, setDateRange] = React.useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  // Mock data for display
  const mockCommissions: VendorCommission[] = [
    {
      id: '1',
      vendorId: 'v1',
      vendorName: 'Tech Supplies Co.',
      orderId: 'ORD-001',
      orderTotal: 1500,
      commissionRate: 15,
      commissionAmount: 225,
      status: 'PAID',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    },
    {
      id: '2',
      vendorId: 'v2',
      vendorName: 'Fashion Hub',
      orderId: 'ORD-002',
      orderTotal: 850,
      commissionRate: 12,
      commissionAmount: 102,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      vendorId: 'v3',
      vendorName: 'Home Essentials',
      orderId: 'ORD-003',
      orderTotal: 2200,
      commissionRate: 10,
      commissionAmount: 220,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'orange',
      PAID: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'default';
  };

  // Calculate statistics
  const totalCommissions = mockCommissions.reduce(
    (sum, comm) => sum + comm.commissionAmount,
    0
  );
  const pendingCommissions = mockCommissions
    .filter(comm => comm.status === 'PENDING')
    .reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const paidCommissions = mockCommissions
    .filter(comm => comm.status === 'PAID')
    .reduce((sum, comm) => sum + comm.commissionAmount, 0);

  const columns: ColumnsType<VendorCommission> = [
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (name: string, record: VendorCommission) => (
        <Link href={`/admin/vendors/show/${record.vendorId}`} style={{ color: '#1890ff' }}>
          {name}
        </Link>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string, record: VendorCommission) => (
        <Link href={`/admin/orders/show/${record.orderId}`} style={{ color: '#1890ff' }}>
          {orderId}
        </Link>
      ),
    },
    {
      title: 'Order Total',
      dataIndex: 'orderTotal',
      key: 'orderTotal',
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      title: 'Commission Rate',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'Commission Amount',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      render: (amount: number) => (
        <strong style={{ color: '#52c41a' }}>${amount.toFixed(2)}</strong>
      ),
      sorter: (a: VendorCommission, b: VendorCommission) =>
        a.commissionAmount - b.commissionAmount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Paid', value: 'PAID' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value: boolean | Key, record: VendorCommission) => {
        if (typeof value === 'string') {
          return record.status === value;
        }
        return false;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: VendorCommission, b: VendorCommission) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (date?: string) =>
        date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>Vendor Commissions</h1>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={dates => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="MMM DD, YYYY"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Commissions"
              value={totalCommissions}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Commissions"
              value={pendingCommissions}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Paid Commissions"
              value={paidCommissions}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Commissions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={mockCommissions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} commissions`,
          }}
        />
      </Card>
    </div>
  );
}

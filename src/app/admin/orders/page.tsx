"use client";

import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function OrdersList() {
  const { tableProps } = useTable({
    resource: "orders",
    pagination: {
      pageSize: 10,
    },
  });

  return (
    <div style={{ padding: "24px" }}>
      <h1>Orders</h1>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="Order ID" />
        <Table.Column dataIndex="userId" title="User ID" />
        <Table.Column dataIndex="total" title="Total" render={(value) => `$${value}`} />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(status) => (
            <Tag color={status === "DELIVERED" ? "green" : status === "PENDING" ? "orange" : "blue"}>
              {status}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Created At"
          render={(date) => new Date(date).toLocaleDateString()}
        />
        <Table.Column
          title="Actions"
          render={(_, record: { id: string }) => (
            <Space>
              <Link href={`/admin/orders/show/${record.id}`}>
                <Button icon={<EyeOutlined />} size="small">
                  View
                </Button>
              </Link>
            </Space>
          )}
        />
      </Table>
    </div>
  );
}

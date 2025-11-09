"use client";

import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function UsersList() {
  const { tableProps } = useTable({
    resource: "users",
    pagination: {
      pageSize: 10,
    },
  });

  return (
    <div style={{ padding: "24px" }}>
      <h1>Users</h1>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column
          title="Name"
          render={(_, record: any) =>
            record.firstName || record.lastName
              ? `${record.firstName || ""} ${record.lastName || ""}`.trim()
              : "—"
          }
        />
        <Table.Column
          dataIndex="loyaltyLevel"
          title="Loyalty Level"
          render={(level) => {
            const colors: Record<string, string> = {
              BRONZE: "orange",
              SILVER: "default",
              GOLD: "gold",
              PLATINUM: "purple",
            };
            return <Tag color={colors[level] || "default"}>{level}</Tag>;
          }}
        />
        <Table.Column
          dataIndex="totalOrders"
          title="Orders"
          render={(total) => total || 0}
        />
        <Table.Column
          dataIndex="totalSpent"
          title="Total Spent"
          render={(spent) => `$${(spent || 0).toFixed(2)}`}
        />
        <Table.Column
          title="Actions"
          render={(_, record: { id: string }) => (
            <Space>
              <Link href={`/admin/users/show/${record.id}`}>
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

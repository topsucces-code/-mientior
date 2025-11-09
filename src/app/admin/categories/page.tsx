"use client";

import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EyeOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function CategoriesList() {
  const { tableProps } = useTable({
    resource: "categories",
    pagination: {
      pageSize: 10,
    },
  });

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Categories</h1>
        <Link href="/admin/categories/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Create Category
          </Button>
        </Link>
      </div>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="slug" title="Slug" />
        <Table.Column dataIndex="description" title="Description" />
        <Table.Column
          title="Active"
          dataIndex="isActive"
          render={(isActive) => (
            <Tag color={isActive ? "green" : "red"}>
              {isActive ? "Active" : "Inactive"}
            </Tag>
          )}
        />
        <Table.Column
          title="Actions"
          render={(_, record: { id: string }) => (
            <Space>
              <Link href={`/admin/categories/show/${record.id}`}>
                <Button icon={<EyeOutlined />} size="small">
                  View
                </Button>
              </Link>
              <Link href={`/admin/categories/edit/${record.id}`}>
                <Button icon={<EditOutlined />} size="small">
                  Edit
                </Button>
              </Link>
            </Space>
          )}
        />
      </Table>
    </div>
  );
}

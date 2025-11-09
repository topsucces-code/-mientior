"use client";

import { useTable } from "@refinedev/antd";
import { Table, Space, Button } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function ProductsList() {
  const { tableProps } = useTable({
    resource: "products",
    pagination: {
      pageSize: 10,
    },
  });

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Products</h1>
        <Link href="/admin/products/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Create Product
          </Button>
        </Link>
      </div>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="price" title="Price" render={(value) => `$${value}`} />
        <Table.Column dataIndex="stock" title="Stock" />
        <Table.Column dataIndex="status" title="Status" />
        <Table.Column
          title="Actions"
          render={(_, record: { id: string }) => (
            <Space>
              <Link href={`/admin/products/show/${record.id}`}>
                <Button icon={<EyeOutlined />} size="small">
                  View
                </Button>
              </Link>
              <Link href={`/admin/products/edit/${record.id}`}>
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

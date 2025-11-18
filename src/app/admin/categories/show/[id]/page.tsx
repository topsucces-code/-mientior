"use client";

import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Tag, Image, Table } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { use } from "react";

const { Title } = Typography;

export default function CategoryShow({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { query } = useShow({
    resource: "categories",
    id: id,
  });

  const { data, isLoading } = query;
  const record = data?.data;

  const childrenColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? (
          <CheckCircleOutlined style={{ color: "green" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "red" }} />
        ),
    },
  ];

  return (
    <Show isLoading={isLoading}>
      <Descriptions title="Category Details" bordered column={2}>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="Slug">{record?.slug}</Descriptions.Item>
        <Descriptions.Item label="Name" span={2}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {record?.description || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Display Order">{record?.order || 0}</Descriptions.Item>
        <Descriptions.Item label="Active">
          {record?.isActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag color="red">Inactive</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Parent Category" span={2}>
          {record?.parent?.name || "None (Top-level category)"}
        </Descriptions.Item>
        <Descriptions.Item label="Product Count" span={2}>
          {record?._count?.products || 0} products
        </Descriptions.Item>
      </Descriptions>

      {record?.image && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Category Image</Title>
          <Image src={record.image} alt={record.name} width={200} />
        </div>
      )}

      {record?.children && record.children.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Child Categories</Title>
          <Table
            dataSource={record.children}
            columns={childrenColumns}
            rowKey="id"
            pagination={false}
          />
        </div>
      )}
    </Show>
  );
}

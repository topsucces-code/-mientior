"use client";

import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Table, Tag, Image, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ProductShow({ params }: { params: { id: string } }) {
  const { query } = useShow({
    resource: "products",
    id: params.id,
  });

  const { data, isLoading } = query;
  const record = data?.data;

  const variantColumns = [
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "Price Modifier",
      dataIndex: "priceModifier",
      key: "priceModifier",
      render: (val: number) => (val ? `$${val.toFixed(2)}` : "—"),
    },
  ];

  const imageColumns = [
    {
      title: "Preview",
      dataIndex: "url",
      key: "preview",
      render: (url: string) => <Image src={url} alt="Product" width={50} />,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "Alt Text",
      dataIndex: "alt",
      key: "alt",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "IMAGE" ? "blue" : type === "VIDEO" ? "green" : "purple"}>
          {type}
        </Tag>
      ),
    },
  ];

  return (
    <Show isLoading={isLoading}>
      <Descriptions title="Product Details" bordered column={2}>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="Slug">{record?.slug}</Descriptions.Item>
        <Descriptions.Item label="Name" span={2}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>
          {record?.description || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Price">${record?.price?.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Compare At Price">
          {record?.compareAtPrice ? `$${record.compareAtPrice.toFixed(2)}` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Stock">{record?.stock}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={record?.status === "ACTIVE" ? "green" : record?.status === "DRAFT" ? "orange" : "red"}>
            {record?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Rating">{record?.rating || 0} / 5</Descriptions.Item>
        <Descriptions.Item label="Review Count">{record?.reviewCount || 0}</Descriptions.Item>
        <Descriptions.Item label="Featured">
          {record?.featured ? (
            <CheckCircleOutlined style={{ color: "green" }} />
          ) : (
            <CloseCircleOutlined style={{ color: "red" }} />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="On Sale">
          {record?.onSale ? (
            <CheckCircleOutlined style={{ color: "green" }} />
          ) : (
            <CloseCircleOutlined style={{ color: "red" }} />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Badge">{record?.badge || "—"}</Descriptions.Item>
        <Descriptions.Item label="Category">
          {record?.category?.name || "—"}
        </Descriptions.Item>
      </Descriptions>

      {record?.variants && record.variants.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Variants</Title>
          <Table
            dataSource={record.variants}
            columns={variantColumns}
            rowKey="id"
            pagination={false}
          />
        </div>
      )}

      {record?.images && record.images.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Images</Title>
          <Table
            dataSource={record.images}
            columns={imageColumns}
            rowKey="id"
            pagination={false}
          />
        </div>
      )}

      {record?.tags && record.tags.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Tags</Title>
          <Space>
            {record.tags.map((tag: { id: string; name: string }) => (
              <Tag key={tag.id} color="blue">
                {tag.name}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </Show>
  );
}

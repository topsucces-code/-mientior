"use client";

import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Table, Tag, Image, Space, Alert, Button } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, CloudOutlined, ExportOutlined } from "@ant-design/icons";
import { use } from "react";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function ProductShow({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation(["admin", "common"]);
  const { query } = useShow({
    resource: "products",
    id: id,
  });

  const { data, isLoading } = query;
  const record = data?.data as {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    status: string;
    rating: number;
    reviewCount: number;
    featured: boolean;
    onSale: boolean;
    badge?: string;
    category?: { name: string };
    variants?: Array<{ id: string; size?: string; color?: string; sku: string; stock: number; priceModifier?: number }>;
    images?: Array<{ id: string; url: string; alt: string; type: string }>;
    tags?: Array<{ id: string; name: string }>;
    pimMapping?: {
      akeneoProductId: string;
      akeneoSku: string;
      lastSyncedAt: Date | null;
      syncStatus: string;
    };
  };

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
      {record?.pimMapping && (
        <Alert
          message={t("products.managedByAkeneo", "This product is managed by Akeneo PIM")}
          description={
            <Space>
              <span>{t("products.syncedFromAkeneo", "Changes should be made in Akeneo and will be synchronized automatically.")}</span>
              {process.env.NEXT_PUBLIC_AKENEO_API_URL && (
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  href={`${process.env.NEXT_PUBLIC_AKENEO_API_URL}/enrich/product/identifier/${record.pimMapping.akeneoProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("products.viewInAkeneo", "View in Akeneo")}
                </Button>
              )}
            </Space>
          }
          type="info"
          showIcon
          icon={<CloudOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

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
        <Descriptions.Item label={t("products.fields.source", "Source")}>
          {record?.pimMapping ? (
            <Tag color="blue" icon={<CloudOutlined />}>
              {t("products.sourceAkeneo", "Akeneo")}
            </Tag>
          ) : (
            <Tag color="default">
              {t("products.sourceManual", "Manual")}
            </Tag>
          )}
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

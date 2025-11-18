"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined, FilterOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AdvancedFilters } from "@/components/admin/advanced-filters";
import { ColumnSelector, ColumnConfig } from "@/components/admin/column-selector";
import { SavedViewsSelector } from "@/components/admin/saved-views-selector";
import { BulkActions } from "@/components/admin/bulk-actions";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  categoryId?: string;
  featured?: boolean;
  onSale?: boolean;
}

export default function ProductsList() {
  const { t } = useTranslation(["admin", "common"]);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [columns, setColumns] = React.useState<ColumnConfig[]>([
    { key: "id", title: t("admin:products.fields.id"), visible: true, fixed: true },
    { key: "name", title: t("admin:products.fields.name"), visible: true },
    { key: "price", title: t("admin:products.fields.price"), visible: true },
    { key: "stock", title: t("admin:products.fields.stock"), visible: true },
    { key: "status", title: t("admin:products.fields.status"), visible: true },
    { key: "actions", title: t("common:labels.actions"), visible: true, fixed: true },
  ]);

  const { tableProps } = useTable({
    resource: "products",
    pagination: {
      pageSize: 10,
    },
    filters: {
      permanent: Object.entries(filters).map(([field, value]) => ({
        field,
        operator: "eq",
        value,
      })),
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "green",
      DRAFT: "orange",
      ARCHIVED: "red",
    };
    return colors[status] || "default";
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
  };

  const handleViewSelect = (viewFilters: Record<string, unknown>) => {
    setFilters(viewFilters);
  };

  const statusOptions = [
    { label: t("admin:products.status.ACTIVE"), value: "ACTIVE" },
    { label: t("admin:products.status.DRAFT"), value: "DRAFT" },
    { label: t("admin:products.status.ARCHIVED"), value: "ARCHIVED" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1>{t("admin:resources.products")}</h1>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(true)}
          >
            {t("common:buttons.filter")}
          </Button>
          <ColumnSelector columns={columns} onColumnsChange={setColumns} />
          <SavedViewsSelector
            resource="products"
            onViewSelect={handleViewSelect}
          />
          <Link href="/admin/products/create">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("admin:actions.create")}
            </Button>
          </Link>
        </Space>
      </div>

      <AdvancedFilters
        resource="products"
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      <Table {...tableProps} rowKey="id" rowSelection={rowSelection}>
        {visibleColumns.map((col) => {
          if (col.key === "id") {
            return <Table.Column key="id" dataIndex="id" title={col.title} />;
          }
          if (col.key === "name") {
            return <Table.Column key="name" dataIndex="name" title={col.title} />;
          }
          if (col.key === "price") {
            return (
              <Table.Column
                key="price"
                dataIndex="price"
                title={col.title}
                render={(value: number) => `$${value}`}
              />
            );
          }
          if (col.key === "stock") {
            return <Table.Column key="stock" dataIndex="stock" title={col.title} />;
          }
          if (col.key === "status") {
            return (
              <Table.Column
                key="status"
                dataIndex="status"
                title={col.title}
                render={(status: string) => (
                  <Tag color={getStatusColor(status)}>
                    {t(`admin:products.status.${status}`)}
                  </Tag>
                )}
              />
            );
          }
          if (col.key === "actions") {
            return (
              <Table.Column
                key="actions"
                title={col.title}
                render={(_, record: Product) => (
                  <Space>
                    <Link href={`/admin/products/show/${record.id}`}>
                      <Button icon={<EyeOutlined />} size="small">
                        {t("common:buttons.view")}
                      </Button>
                    </Link>
                    <Link href={`/admin/products/edit/${record.id}`}>
                      <Button icon={<EditOutlined />} size="small">
                        {t("common:buttons.edit")}
                      </Button>
                    </Link>
                  </Space>
                )}
              />
            );
          }
          return null;
        })}
      </Table>

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        resource="products"
        onClearSelection={() => setSelectedRowKeys([])}
        statusOptions={statusOptions}
      />
    </div>
  );
}

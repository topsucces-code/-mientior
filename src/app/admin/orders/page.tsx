"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AdvancedFilters } from "@/components/admin/advanced-filters";
import { ColumnSelector, ColumnConfig } from "@/components/admin/column-selector";
import { SavedViewsSelector } from "@/components/admin/saved-views-selector";
import { BulkActions } from "@/components/admin/bulk-actions";

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersList() {
  const { t } = useTranslation(["admin", "common"]);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [columns, setColumns] = React.useState<ColumnConfig[]>([
    { key: "id", title: t("admin:orders.fields.orderId"), visible: true, fixed: true },
    { key: "userId", title: t("admin:orders.fields.customer"), visible: true },
    { key: "total", title: t("admin:orders.fields.total"), visible: true },
    { key: "status", title: t("admin:orders.fields.status"), visible: true },
    { key: "createdAt", title: t("admin:orders.fields.createdAt"), visible: true },
    { key: "actions", title: t("common:labels.actions"), visible: true, fixed: true },
  ]);
  
  const { tableProps } = useTable({
    resource: "orders",
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
      DELIVERED: "green",
      SHIPPED: "blue",
      PROCESSING: "cyan",
      PENDING: "orange",
      CANCELLED: "red",
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
    { label: t("admin:orders.status.PENDING"), value: "PENDING" },
    { label: t("admin:orders.status.PROCESSING"), value: "PROCESSING" },
    { label: t("admin:orders.status.SHIPPED"), value: "SHIPPED" },
    { label: t("admin:orders.status.DELIVERED"), value: "DELIVERED" },
    { label: t("admin:orders.status.CANCELLED"), value: "CANCELLED" },
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
        <h1>{t("admin:resources.orders")}</h1>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(true)}
          >
            {t("common:buttons.filter")}
          </Button>
          <ColumnSelector columns={columns} onColumnsChange={setColumns} />
          <SavedViewsSelector
            resource="orders"
            onViewSelect={handleViewSelect}
          />
        </Space>
      </div>

      <AdvancedFilters
        resource="orders"
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
          if (col.key === "userId") {
            return <Table.Column key="userId" dataIndex="userId" title={col.title} />;
          }
          if (col.key === "total") {
            return (
              <Table.Column
                key="total"
                dataIndex="total"
                title={col.title}
                render={(value: number) => `$${value}`}
              />
            );
          }
          if (col.key === "status") {
            return (
              <Table.Column
                key="status"
                dataIndex="status"
                title={col.title}
                render={(status: string) => (
                  <Tag color={getStatusColor(status)}>
                    {t(`admin:orders.status.${status}`)}
                  </Tag>
                )}
              />
            );
          }
          if (col.key === "createdAt") {
            return (
              <Table.Column
                key="createdAt"
                dataIndex="createdAt"
                title={col.title}
                render={(date: string) => new Date(date).toLocaleDateString()}
              />
            );
          }
          if (col.key === "actions") {
            return (
              <Table.Column
                key="actions"
                title={col.title}
                render={(_, record: Order) => (
                  <Space>
                    <Link href={`/admin/orders/show/${record.id}`}>
                      <Button icon={<EyeOutlined />} size="small">
                        {t("common:buttons.view")}
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
        resource="orders"
        onClearSelection={() => setSelectedRowKeys([])}
        statusOptions={statusOptions}
      />
    </div>
  );
}

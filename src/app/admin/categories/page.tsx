"use client";

import { useTable } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EyeOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function CategoriesList() {
  const { t } = useTranslation(["admin", "common"]);
  const { tableProps } = useTable({
    resource: "categories",
    pagination: {
      pageSize: 10,
    },
  });

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>{t("admin:resources.categories")}</h1>
        <Link href="/admin/categories/create">
          <Button type="primary" icon={<PlusOutlined />}>
            {t("admin:actions.create")}
          </Button>
        </Link>
      </div>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title={t("admin:categories.fields.id")} />
        <Table.Column dataIndex="name" title={t("admin:categories.fields.name")} />
        <Table.Column dataIndex="slug" title={t("admin:categories.fields.slug")} />
        <Table.Column dataIndex="description" title={t("admin:categories.fields.description")} />
        <Table.Column
          title={t("admin:categories.fields.isActive")}
          dataIndex="isActive"
          render={(isActive) => (
            <Tag color={isActive ? "green" : "red"}>
              {isActive ? t("common:status.active") : t("common:status.inactive")}
            </Tag>
          )}
        />
        <Table.Column
          title={t("common:labels.actions")}
          render={(_, record: { id: string }) => (
            <Space>
              <Link href={`/admin/categories/show/${record.id}`}>
                <Button icon={<EyeOutlined />} size="small">
                  {t("common:buttons.view")}
                </Button>
              </Link>
              <Link href={`/admin/categories/edit/${record.id}`}>
                <Button icon={<EditOutlined />} size="small">
                  {t("common:buttons.edit")}
                </Button>
              </Link>
            </Space>
          )}
        />
      </Table>
    </div>
  );
}

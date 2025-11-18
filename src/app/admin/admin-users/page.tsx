"use client";

import React from "react";
import { useList } from "@refinedev/core";
import { Table, Button, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersList() {
  const { t } = useTranslation(["admin", "common"]);
  
  const { query } = useList<AdminUser>({
    resource: "admin-users",
  });

  const adminUsers = query.data?.data || [];
  const isLoading = query.isLoading;

  const columns: ColumnsType<AdminUser> = [
    {
      title: t("admin:adminUsers.fields.name"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: AdminUser) => (
        <Link href={`/admin/admin-users/show/${record.id}`}>
          <strong>{text}</strong>
        </Link>
      ),
    },
    {
      title: t("admin:adminUsers.fields.email"),
      dataIndex: "email",
      key: "email",
    },
    {
      title: t("admin:adminUsers.fields.role"),
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "SUPER_ADMIN" ? "red" : role === "ADMIN" ? "blue" : "green"}>
          {t(`admin:roles.${role}`)}
        </Tag>
      ),
    },
    {
      title: t("admin:adminUsers.fields.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {t(`admin:adminUsers.status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t("admin:common.actions"),
      key: "actions",
      render: (_: unknown, record: AdminUser) => (
        <Space size="small">
          <Link href={`/admin/admin-users/show/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              {t("common:common.view")}
            </Button>
          </Link>
          <Link href={`/admin/admin-users/edit/${record.id}`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              {t("common:common.edit")}
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h2>{t("admin:adminUsers.title")}</h2>
        <Link href="/admin/admin-users/create">
          <Button type="primary" icon={<PlusOutlined />}>
            {t("admin:adminUsers.create")}
          </Button>
        </Link>
      </div>
      
      <Table
        dataSource={adminUsers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => t("common:common.totalItems", { total }),
        }}
      />
    </div>
  );
}

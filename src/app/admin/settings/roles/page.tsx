"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import { useUpdate } from "@refinedev/core";
import {
  Table,
  Tag,
  Switch,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Space,
  Card,
  Checkbox,
  Tooltip,
} from "antd";
import { PlusOutlined, CheckOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

// RBAC types - matching backend
const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT", "VIEWER"] as const;
const PERMISSIONS = [
  "PRODUCTS_READ",
  "PRODUCTS_WRITE",
  "PRODUCTS_DELETE",
  "ORDERS_READ",
  "ORDERS_WRITE",
  "ORDERS_DELETE",
  "USERS_READ",
  "USERS_WRITE",
  "USERS_DELETE",
  "ANALYTICS_READ",
  "SETTINGS_WRITE",
] as const;

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: typeof ROLES[number];
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
}

export default function RolesPage() {
  const { t } = useTranslation(["common", "admin"]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [form] = Form.useForm();

  const { tableProps } = useTable<AdminUser>({
    resource: "admin-users",
    pagination: {
      pageSize: 20,
    },
  });

  const { mutate: updateUser } = useUpdate();

  const handleToggleActive = (record: AdminUser) => {
    updateUser({
      resource: "admin-users",
      id: record.id,
      values: {
        isActive: !record.isActive,
      },
    });
  };

  const handleAddAdmin = async (values: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setModalVisible(false);
        form.resetFields();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "red",
      ADMIN: "blue",
      MANAGER: "green",
      SUPPORT: "orange",
      VIEWER: "default",
    };
    return colors[role] || "default";
  };

  const getRolePermissions = (role: string): string[] => {
    // Role-based permissions hierarchy
    const rolePermissions: Record<string, string[]> = {
      SUPER_ADMIN: [...PERMISSIONS],
      ADMIN: [
        "PRODUCTS_READ",
        "PRODUCTS_WRITE",
        "PRODUCTS_DELETE",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "USERS_READ",
        "ANALYTICS_READ",
      ],
      MANAGER: [
        "PRODUCTS_READ",
        "PRODUCTS_WRITE",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "ANALYTICS_READ",
      ],
      SUPPORT: ["PRODUCTS_READ", "ORDERS_READ", "ORDERS_WRITE", "USERS_READ"],
      VIEWER: ["PRODUCTS_READ", "ORDERS_READ", "USERS_READ"],
    };
    return rolePermissions[role] || [];
  };

  const hasPermission = (role: string, permission: string): boolean => {
    return getRolePermissions(role).includes(permission);
  };

  const getPermissionDescription = (permission: string): string => {
    const descriptions: Record<string, string> = {
      PRODUCTS_READ: "View products",
      PRODUCTS_WRITE: "Create/Edit products",
      PRODUCTS_DELETE: "Delete products",
      ORDERS_READ: "View orders",
      ORDERS_WRITE: "Edit orders",
      ORDERS_DELETE: "Delete orders",
      USERS_READ: "View users",
      USERS_WRITE: "Edit users",
      USERS_DELETE: "Delete users",
      ANALYTICS_READ: "View analytics",
      SETTINGS_WRITE: "Modify settings",
    };
    return descriptions[permission] || permission;
  };

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
        <h1>{t("admin.roles")}</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Admin
        </Button>
      </div>

      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="email" title="Email" width={200} />
        <Table.Column
          title="Name"
          render={(_, record: AdminUser) =>
            `${record.firstName} ${record.lastName}`
          }
          width={150}
        />
        <Table.Column
          dataIndex="role"
          title={t("admin.role")}
          render={(role: string) => <Tag color={getRoleColor(role)}>{role}</Tag>}
          width={130}
        />
        <Table.Column
          dataIndex="permissions"
          title={t("admin.permissions")}
          render={(_, record: AdminUser) => (
            <Space>
              <Badge count={getRolePermissions(record.role).length} showZero />
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setSelectedUser(record);
                  setPermissionsModalVisible(true);
                }}
              >
                View
              </Button>
            </Space>
          )}
          width={150}
        />
        <Table.Column
          dataIndex="lastLoginAt"
          title="Last Login"
          render={(date: string | null) =>
            date ? dayjs(date).format("MMM DD, YYYY HH:mm") : "Never"
          }
          width={170}
        />
        <Table.Column
          dataIndex="isActive"
          title="Active"
          render={(isActive: boolean, record: AdminUser) => (
            <Switch
              checked={isActive}
              onChange={() => handleToggleActive(record)}
            />
          )}
          width={80}
        />
      </Table>

      {/* Permissions Matrix */}
      <Card
        title="Permissions Matrix"
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={PERMISSIONS.map((perm) => ({ permission: perm }))}
          rowKey="permission"
          pagination={false}
          size="small"
        >
          <Table.Column
            dataIndex="permission"
            title="Permission"
            render={(perm: string) => (
              <Tooltip title={getPermissionDescription(perm)}>
                <span>{perm}</span>
              </Tooltip>
            )}
            width={200}
          />
          {ROLES.map((role) => (
            <Table.Column
              key={role}
              title={<Tag color={getRoleColor(role)}>{role}</Tag>}
              render={(_, record: { permission: string }) =>
                hasPermission(role, record.permission) ? (
                  <CheckOutlined style={{ color: "#52c41a" }} />
                ) : (
                  "—"
                )
              }
              align="center"
              width={120}
            />
          ))}
        </Table>
      </Card>

      {/* Add Admin Modal */}
      <Modal
        title="Add Admin User"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={handleAddAdmin}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true }]}
          >
            <Select
              options={ROLES.map((role) => ({
                label: role,
                value: role,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permissions View Modal */}
      <Modal
        title={`Permissions for ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        open={permissionsModalVisible}
        onCancel={() => setPermissionsModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setPermissionsModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        {selectedUser && (
          <div>
            <p>
              <strong>Role:</strong>{" "}
              <Tag color={getRoleColor(selectedUser.role)}>
                {selectedUser.role}
              </Tag>
            </p>
            <p>
              <strong>Permissions:</strong>
            </p>
            <Space direction="vertical" style={{ width: "100%" }}>
              {getRolePermissions(selectedUser.role).map((perm) => (
                <Checkbox key={perm} checked disabled>
                  <Tooltip title={getPermissionDescription(perm)}>
                    {perm}
                  </Tooltip>
                </Checkbox>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}

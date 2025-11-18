"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import { useUpdate, useCreate, useInvalidate } from "@refinedev/core";
import {
  Table,
  Tag,
  Switch,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  Select,
  Tooltip,
  Typography,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Text } = Typography;

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT", "VIEWER"] as const;

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  roles: string[];
}

export default function FeatureFlagsPage() {
  const { t } = useTranslation(["common", "admin"]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [form] = Form.useForm();

  const { tableProps } = useTable<FeatureFlag>({
    resource: "feature-flags",
    pagination: {
      pageSize: 20,
    },
  });

  const { mutate: updateFlag } = useUpdate();
  const { mutate: createFlag } = useCreate();
  const invalidate = useInvalidate();

  const handleToggleEnabled = (record: FeatureFlag) => {
    Modal.confirm({
      title: record.enabled ? "Disable Feature Flag" : "Enable Feature Flag",
      content: `Are you sure you want to ${
        record.enabled ? "disable" : "enable"
      } the feature "${record.name}"?`,
      onOk: () => {
        updateFlag({
          resource: "feature-flags",
          id: record.id,
          values: {
            enabled: !record.enabled,
          },
        });
      },
    });
  };

  const handleAddFlag = async (values: Record<string, unknown>) => {
    createFlag(
      {
        resource: "feature-flags",
        values,
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          form.resetFields();
          invalidate({
            resource: "feature-flags",
            invalidates: ["list"],
          });
        },
      }
    );
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
        <h1>{t("admin.featureFlags")}</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Feature Flag
        </Button>
      </div>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="key"
          title="Key"
          render={(key: string) => (
            <Text code copyable>
              {key}
            </Text>
          )}
          width={200}
        />
        <Table.Column dataIndex="name" title="Name" width={150} />
        <Table.Column
          dataIndex="description"
          title="Description"
          render={(desc: string) => (
            <Tooltip title={desc}>
              <Text ellipsis style={{ maxWidth: 300 }}>
                {desc}
              </Text>
            </Tooltip>
          )}
          width={300}
        />
        <Table.Column
          dataIndex="enabled"
          title={t("admin.enabled")}
          render={(enabled: boolean, record: FeatureFlag) => (
            <Switch
              checked={enabled}
              onChange={() => handleToggleEnabled(record)}
            />
          )}
          width={100}
        />
        <Table.Column
          dataIndex="roles"
          title="Roles"
          render={(roles: string[]) => (
            <Space wrap>
              {roles.map((role) => (
                <Tag key={role} color={getRoleColor(role)}>
                  {role}
                </Tag>
              ))}
            </Space>
          )}
          width={250}
        />
      </Table>

      {/* Add Feature Flag Modal */}
      <Modal
        title="Add Feature Flag"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Add"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddFlag}>
          <Form.Item
            name="key"
            label="Key"
            rules={[
              { required: true, message: "Key is required" },
              {
                pattern: /^[a-z0-9_]+$/,
                message: "Key must be lowercase with underscores only",
              },
            ]}
            tooltip="Unique identifier (e.g., advanced_search, new_dashboard)"
          >
            <Input placeholder="feature_key" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Readable name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what this feature flag controls"
            />
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked" initialValue={false}>
            <Checkbox>Enabled by default</Checkbox>
          </Form.Item>
          <Form.Item
            name="roles"
            label="Allowed Roles"
            rules={[{ required: true, message: "Select at least one role" }]}
            tooltip="Which roles can access this feature when enabled"
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={ROLES.map((role) => ({
                label: role,
                value: role,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

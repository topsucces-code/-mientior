"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Tooltip,
  Typography,
  message,
  Card,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface Synonym {
  key: string;
  terms: string[];
}

export default function SynonymsPage() {
  const { t } = useTranslation("admin");
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Load synonyms on mount
  React.useEffect(() => {
    loadSynonyms();
  }, []);

  const loadSynonyms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/search/synonyms");
      if (!response.ok) {
        throw new Error("Failed to load synonyms");
      }
      const data = await response.json();
      setSynonyms(data.data.synonyms || []);
      setLastUpdated(data.data.lastUpdated || null);
    } catch (error: any) {
      message.error(t("synonyms.addError"));
      console.error("Load synonyms error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ terms: ["", ""] }); // Start with 2 empty terms
    setIsModalVisible(true);
  };

  const handleEdit = (record: Synonym) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      key: record.key,
      terms: record.terms,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: t("synonyms.deleteConfirm"),
      content: t("synonyms.deleteWarning"),
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(
            `/api/admin/search/synonyms/${encodeURIComponent(key)}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            throw new Error("Failed to delete synonym");
          }
          message.success(t("synonyms.deleteSuccess"));
          loadSynonyms();
        } catch (error: any) {
          message.error(t("synonyms.deleteError"));
          console.error("Delete synonym error:", error);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const { key, terms } = values;

      // Normalize and filter empty terms
      const normalizedTerms = terms
        .map((t: string) => t.toLowerCase().trim())
        .filter((t: string) => t.length > 0);

      if (normalizedTerms.length < 2) {
        message.error(t("synonyms.validation.termsMin"));
        return;
      }

      // Check for duplicates
      const uniqueTerms = new Set(normalizedTerms);
      if (uniqueTerms.size !== normalizedTerms.length) {
        message.error(t("synonyms.validation.termDuplicate"));
        return;
      }

      if (editingKey) {
        // Update existing synonym
        const response = await fetch(
          `/api/admin/search/synonyms/${encodeURIComponent(editingKey)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ terms: normalizedTerms }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to update synonym");
        }
        message.success(t("synonyms.updateSuccess"));
      } else {
        // Add new synonym
        const normalizedKey = key.toLowerCase().trim();
        const response = await fetch("/api/admin/search/synonyms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: normalizedKey, terms: normalizedTerms }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to add synonym");
        }
        message.success(t("synonyms.addSuccess"));
      }

      setIsModalVisible(false);
      form.resetFields();
      loadSynonyms();
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        message.error(t("synonyms.validation.keyExists"));
      } else {
        message.error(editingKey ? t("synonyms.updateError") : t("synonyms.addError"));
      }
      console.error("Modal submit error:", error);
    }
  };


  const columns = [
    {
      title: t("synonyms.key"),
      dataIndex: "key",
      key: "key",
      width: "30%",
      render: (key: string) => (
        <Text code copyable>
          {key}
        </Text>
      ),
    },
    {
      title: t("synonyms.terms"),
      dataIndex: "terms",
      key: "terms",
      width: "50%",
      render: (terms: string[]) => (
        <Space wrap>
          {terms.map((term, index) => (
            <Tag key={index} color="blue">
              {term}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t("synonyms.actions"),
      key: "actions",
      width: "20%",
      render: (_: any, record: Synonym) => (
        <Space>
          <Tooltip title={t("synonyms.edit")}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t("synonyms.delete")}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.key)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <Title level={2}>{t("synonyms.title")}</Title>
            <Text type="secondary">{t("synonyms.description")}</Text>
            {lastUpdated && (
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </Text>
              </div>
            )}
          </div>
          <Space>
            <Tooltip title={t("synonyms.help.title")}>
              <Button icon={<QuestionCircleOutlined />} />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t("synonyms.add")}
            </Button>
          </Space>
        </div>

        {synonyms.length === 0 && !loading ? (
          <Empty
            description={
              <div>
                <Text>{t("synonyms.empty.title")}</Text>
                <br />
                <Text type="secondary">{t("synonyms.empty.description")}</Text>
              </div>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t("synonyms.empty.action")}
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={synonyms}
            rowKey="key"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => t("synonyms.count", { count: total }),
            }}
          />
        )}
      </Card>

      <Modal
        title={editingKey ? t("synonyms.edit") : t("synonyms.add")}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("synonyms.key")}
            name="key"
            rules={[
              { required: true, message: t("synonyms.validation.keyRequired") },
              {
                pattern: /^[a-zà-ÿ0-9\s-]+$/,
                message: t("synonyms.validation.keyFormat"),
              },
              {
                max: 50,
                message: t("synonyms.validation.keyLength"),
              },
            ]}
            help={t("synonyms.keyHelp")}
          >
            <Input
              placeholder={t("synonyms.keyPlaceholder")}
              disabled={!!editingKey}
            />
          </Form.Item>

          <Form.Item
            label={t("synonyms.terms")}
            help={t("synonyms.termsHelp")}
          >
            <Form.List name="terms">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Space key={field.key} style={{ display: "flex", marginBottom: 8 }}>
                      <Form.Item
                        {...field}
                        rules={[
                          { required: true, message: t("synonyms.validation.termsRequired") },
                          {
                            max: 50,
                            message: t("synonyms.validation.termLength"),
                          },
                        ]}
                        noStyle
                      >
                        <Input
                          placeholder={t("synonyms.termsPlaceholder")}
                          style={{ width: 400 }}
                        />
                      </Form.Item>
                      {fields.length > 2 && (
                        <Button
                          type="link"
                          danger
                          onClick={() => remove(field.name)}
                        >
                          {t("synonyms.removeTerm")}
                        </Button>
                      )}
                    </Space>
                  ))}
                  {fields.length < 20 && (
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      {t("synonyms.addTerm")}
                    </Button>
                  )}
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

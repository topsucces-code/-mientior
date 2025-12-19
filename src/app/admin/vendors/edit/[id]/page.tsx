"use client";

import { useForm } from "@refinedev/antd";
import { useShow, useDelete } from "@refinedev/core";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Tabs,
  Card,
  Row,
  Col,
  Space,
  Rate,
  message,
  Alert,
  Popconfirm,
  Spin,
  Modal,
} from "antd";
import {
  DeleteOutlined,
  CheckOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploadGallery, ProductImage } from "@/components/admin/image-upload-gallery";
import { DocumentUploader, VendorDocument } from "@/components/admin/document-uploader";

interface PageProps {
  params: { id: string };
}

export default function VendorEdit({ params }: PageProps) {
  const { id } = params;
  const { t } = useTranslation(["admin", "common"]);
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<ProductImage[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  // Fetch vendor data
  const { query } = useShow({
    resource: "vendors",
    id,
  });

  const { data, isLoading } = query;
  const vendor = data?.data;

  const { mutate: deleteVendor } = useDelete();

  const { formProps, form, onFinish } = useForm({
    resource: "vendors",
    id,
    action: "edit",
    redirect: false,
  });

  // Populate form when data loads
  useEffect(() => {
    if (vendor) {
      form.setFieldsValue({
        businessName: vendor.businessName,
        slug: vendor.slug,
        email: vendor.email,
        phone: vendor.phone,
        commissionRate: vendor.commissionRate,
        status: vendor.status,
        // Bank details
        accountName: vendor.bankDetails?.accountName,
        accountNumber: vendor.bankDetails?.accountNumber,
        bankName: vendor.bankDetails?.bankName,
        swiftCode: vendor.bankDetails?.swiftCode,
        iban: vendor.bankDetails?.iban,
        mobileMoneyProvider: vendor.bankDetails?.mobileMoneyProvider,
        mobileMoneyNumber: vendor.bankDetails?.mobileMoneyNumber,
      });

      setDescription(vendor.description || "");
      
      if (vendor.logo) {
        setLogo([{ url: vendor.logo, order: 0, isMain: true }]);
      }
      
      if (vendor.documents) {
        setDocuments(vendor.documents);
      }

      // Check if vendor has active orders
      if (vendor._count?.orders > 0) {
        setHasActiveOrders(true);
      }
    }
  }, [vendor, form]);

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        message.success(
          newStatus === "ACTIVE"
            ? t("admin:vendors.messages.approveSuccess")
            : t("admin:vendors.messages.suspendSuccess")
        );
        query.refetch();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      message.error(t("admin:vendors.messages.statusUpdateError"));
    }
  };

  // Handle document approval/rejection
  const handleDocumentApprove = async (doc: VendorDocument) => {
    const updatedDocs = documents.map((d) =>
      d.url === doc.url
        ? { ...d, status: "APPROVED" as const, reviewedAt: new Date().toISOString() }
        : d
    );
    setDocuments(updatedDocs);

    try {
      await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: updatedDocs }),
      });
      message.success(t("admin:vendors.documents.approveSuccess"));
    } catch (error) {
      message.error(t("admin:vendors.documents.approveError"));
    }
  };

  const handleDocumentReject = async (doc: VendorDocument, reason: string) => {
    const updatedDocs = documents.map((d) =>
      d.url === doc.url
        ? {
            ...d,
            status: "REJECTED" as const,
            rejectionReason: reason,
            reviewedAt: new Date().toISOString(),
          }
        : d
    );
    setDocuments(updatedDocs);

    try {
      await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: updatedDocs }),
      });
      message.success(t("admin:vendors.documents.rejectSuccess"));
    } catch (error) {
      message.error(t("admin:vendors.documents.rejectError"));
    }
  };

  // Handle delete
  const handleDelete = () => {
    Modal.confirm({
      title: t("admin:vendors.messages.deleteConfirm"),
      icon: <ExclamationCircleOutlined />,
      content: t("admin:vendors.messages.deleteWarning"),
      okText: t("common:buttons.delete"),
      okType: "danger",
      cancelText: t("common:buttons.cancel"),
      onOk: () => {
        deleteVendor(
          {
            resource: "vendors",
            id,
          },
          {
            onSuccess: () => {
              message.success(t("admin:vendors.messages.deleteSuccess"));
              router.push("/admin/vendors");
            },
            onError: () => {
              message.error(t("admin:vendors.messages.deleteError"));
            },
          }
        );
      },
    });
  };

  // Custom submit handler
  const handleSubmit = async (values: Record<string, unknown>) => {
    // Extract bank fields
    const {
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      iban,
      mobileMoneyProvider,
      mobileMoneyNumber,
      ...restValues
    } = values;

    const formData = {
      ...restValues,
      description,
      logo: logo[0]?.url || null,
      documents,
      bankDetails: {
        accountName,
        accountNumber,
        bankName,
        swiftCode,
        iban,
        mobileMoneyProvider,
        mobileMoneyNumber,
      },
    };

    try {
      await onFinish?.(formData);
      message.success(t("admin:vendors.messages.updateSuccess"));
      query.refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`${t("admin:vendors.messages.updateError")}: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <Alert
          message={t("admin:vendors.messages.notFound")}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isReadOnly = vendor.status === "BANNED";

  return (
    <div style={{ padding: "24px", maxWidth: "1400px" }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t("admin:vendors.edit")}: {vendor.businessName}
        </h1>
        <Space>
          {vendor.status === "PENDING" && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleStatusChange("ACTIVE")}
            >
              {t("admin:vendors.actions.approve")}
            </Button>
          )}
          {vendor.status === "ACTIVE" && (
            <Popconfirm
              title={t("admin:vendors.messages.suspendConfirm")}
              onConfirm={() => handleStatusChange("SUSPENDED")}
              okText={t("common:buttons.yes")}
              cancelText={t("common:buttons.no")}
            >
              <Button danger icon={<StopOutlined />}>
                {t("admin:vendors.actions.suspend")}
              </Button>
            </Popconfirm>
          )}
          {vendor.status === "SUSPENDED" && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleStatusChange("ACTIVE")}
            >
              {t("admin:vendors.actions.reactivate")}
            </Button>
          )}
        </Space>
      </div>

      {hasActiveOrders && (
        <Alert
          message={t("admin:vendors.messages.hasActiveOrders")}
          description={t("admin:vendors.messages.hasActiveOrdersDesc")}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {isReadOnly && (
        <Alert
          message={t("admin:vendors.messages.vendorBanned")}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <Form {...formProps} form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={24}>
          {/* Main Content */}
          <Col xs={24} lg={18}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "general",
                  label: t("admin:vendors.tabs.general"),
                  children: (
                    <Card>
                      <Form.Item
                        label={t("admin:vendors.fields.businessName")}
                        name="businessName"
                        rules={[{ required: true, message: t("admin:vendors.messages.businessNameRequired") }]}
                      >
                        <Input
                          placeholder={t("admin:vendors.placeholders.businessName")}
                          size="large"
                          disabled={isReadOnly}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("admin:vendors.fields.slug")}
                        name="slug"
                        help={t("admin:vendors.help.slugReadOnly")}
                      >
                        <Input disabled />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.email")}
                            name="email"
                            rules={[
                              { required: true, message: t("admin:vendors.messages.emailRequired") },
                              { type: "email", message: t("admin:vendors.messages.emailInvalid") },
                            ]}
                          >
                            <Input
                              placeholder="vendor@example.com"
                              disabled={hasActiveOrders || isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.phone")}
                            name="phone"
                            rules={[{ required: true, message: t("admin:vendors.messages.phoneRequired") }]}
                          >
                            <Input
                              placeholder="+221 77 123 45 67"
                              disabled={isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={t("admin:vendors.fields.logo")}
                        help={t("admin:vendors.help.logo")}
                      >
                        <ImageUploadGallery
                          images={logo}
                          onChange={setLogo}
                          maxImages={1}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("admin:vendors.fields.description")}
                        help={t("admin:vendors.help.description")}
                      >
                        <RichTextEditor
                          value={description}
                          onChange={setDescription}
                          placeholder={t("admin:vendors.placeholders.description")}
                          disabled={isReadOnly}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("admin:vendors.fields.commissionRate")}
                        name="commissionRate"
                        rules={[{ required: true, message: t("admin:vendors.messages.commissionRequired") }]}
                        help={t("admin:vendors.help.commissionRate")}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.5}
                          style={{ width: "100%" }}
                          addonAfter="%"
                          disabled={isReadOnly}
                        />
                      </Form.Item>
                    </Card>
                  ),
                },
                {
                  key: "documents",
                  label: t("admin:vendors.tabs.documents"),
                  children: (
                    <Card>
                      <p className="mb-4 text-gray-600">
                        {t("admin:vendors.documents.description")}
                      </p>
                      <DocumentUploader
                        documents={documents}
                        onChange={setDocuments}
                        documentTypes={[
                          "Business Registration",
                          "Tax ID",
                          "Bank Statement",
                          "ID Proof",
                          "Address Proof",
                          "Trade License",
                        ]}
                        showActions={true}
                        onApprove={handleDocumentApprove}
                        onReject={handleDocumentReject}
                        readOnly={isReadOnly}
                      />
                    </Card>
                  ),
                },
                {
                  key: "banking",
                  label: t("admin:vendors.tabs.banking"),
                  children: (
                    <Card>
                      <h3 className="text-lg font-medium mb-4">
                        {t("admin:vendors.banking.bankAccount")}
                      </h3>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.accountName")}
                            name="accountName"
                          >
                            <Input
                              placeholder={t("admin:vendors.placeholders.accountName")}
                              disabled={isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.accountNumber")}
                            name="accountNumber"
                          >
                            <Input
                              placeholder={t("admin:vendors.placeholders.accountNumber")}
                              disabled={isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.bankName")}
                            name="bankName"
                          >
                            <Input
                              placeholder={t("admin:vendors.placeholders.bankName")}
                              disabled={isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.swiftCode")}
                            name="swiftCode"
                          >
                            <Input placeholder="XXXXXXXX" disabled={isReadOnly} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={t("admin:vendors.fields.iban")}
                        name="iban"
                        help={t("admin:vendors.help.iban")}
                      >
                        <Input
                          placeholder="SN00 0000 0000 0000 0000 0000 0000"
                          disabled={isReadOnly}
                        />
                      </Form.Item>

                      <h3 className="text-lg font-medium mb-4 mt-8">
                        {t("admin:vendors.banking.mobileMoney")}
                      </h3>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.mobileMoneyProvider")}
                            name="mobileMoneyProvider"
                          >
                            <Select
                              placeholder={t("admin:vendors.placeholders.mobileMoneyProvider")}
                              allowClear
                              disabled={isReadOnly}
                            >
                              <Select.Option value="ORANGE_MONEY">Orange Money</Select.Option>
                              <Select.Option value="MTN_MOMO">MTN MoMo</Select.Option>
                              <Select.Option value="WAVE">Wave</Select.Option>
                              <Select.Option value="MOOV_MONEY">Moov Money</Select.Option>
                              <Select.Option value="MPESA">M-Pesa</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.mobileMoneyNumber")}
                            name="mobileMoneyNumber"
                          >
                            <Input
                              placeholder="+221 77 123 45 67"
                              disabled={isReadOnly}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ),
                },
              ]}
            />
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {/* Status Card */}
              <Card title={t("admin:vendors.sidebar.status")} size="small">
                <Form.Item
                  label={t("admin:vendors.fields.status")}
                  name="status"
                >
                  <Select disabled={isReadOnly}>
                    <Select.Option value="PENDING">{t("admin:vendors.status.PENDING")}</Select.Option>
                    <Select.Option value="ACTIVE">{t("admin:vendors.status.ACTIVE")}</Select.Option>
                    <Select.Option value="SUSPENDED">{t("admin:vendors.status.SUSPENDED")}</Select.Option>
                    <Select.Option value="BANNED">{t("admin:vendors.status.BANNED")}</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label={t("admin:vendors.fields.rating")}>
                  <Rate disabled value={vendor.rating || 0} />
                  <span className="ml-2 text-gray-500">
                    ({vendor.rating?.toFixed(1) || "0.0"})
                  </span>
                </Form.Item>

                <div className="text-sm text-gray-500">
                  <div>{t("admin:vendors.fields.products")}: {vendor._count?.products || 0}</div>
                  <div>{t("admin:vendors.fields.orders")}: {vendor._count?.orders || 0}</div>
                  <div>
                    {t("admin:vendors.fields.createdAt")}:{" "}
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card size="small">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    disabled={isReadOnly}
                  >
                    {t("common:buttons.save")}
                  </Button>
                  <Button
                    onClick={() => router.push(`/admin/vendors/show/${id}`)}
                    block
                  >
                    {t("common:buttons.view")}
                  </Button>
                  <Button onClick={() => router.push("/admin/vendors")} block>
                    {t("common:buttons.cancel")}
                  </Button>
                  <Popconfirm
                    title={t("admin:vendors.messages.deleteConfirm")}
                    description={t("admin:vendors.messages.deleteWarning")}
                    onConfirm={handleDelete}
                    okText={t("common:buttons.delete")}
                    okType="danger"
                    cancelText={t("common:buttons.cancel")}
                  >
                    <Button danger icon={<DeleteOutlined />} block>
                      {t("common:buttons.delete")}
                    </Button>
                  </Popconfirm>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

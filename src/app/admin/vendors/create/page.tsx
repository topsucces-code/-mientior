"use client";

import { useForm } from "@refinedev/antd";
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
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploadGallery, ProductImage } from "@/components/admin/image-upload-gallery";
import { DocumentUploader, VendorDocument } from "@/components/admin/document-uploader";

export default function VendorCreate() {
  const { t } = useTranslation(["admin", "common"]);
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<ProductImage[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const { formProps, form, onFinish } = useForm({
    resource: "vendors",
    redirect: false,
  });

  // Auto-generate slug from business name
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    form.setFieldsValue({ slug });
  };

  // Check email uniqueness
  const checkEmailUniqueness = async (email: string) => {
    if (!email) return;
    
    setCheckingEmail(true);
    try {
      const response = await fetch(`/api/vendors/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists);
      if (data.exists) {
        form.setFields([
          {
            name: "email",
            errors: [t("admin:vendors.messages.emailExists")],
          },
        ]);
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Custom submit handler
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (emailExists) {
      message.error(t("admin:vendors.messages.emailExists"));
      return;
    }

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
      const result = await onFinish?.(formData);
      message.success(t("admin:vendors.messages.createSuccess"));
      
      // Redirect to show page
      if (result?.data?.id) {
        router.push(`/admin/vendors/show/${result.data.id}`);
      } else {
        router.push("/admin/vendors");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      message.error(`${t("admin:vendors.messages.createError")}: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px" }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("admin:vendors.create")}</h1>
      </div>

      <Form {...formProps} layout="vertical" onFinish={handleSubmit}>
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
                          onChange={handleBusinessNameChange}
                          placeholder={t("admin:vendors.placeholders.businessName")}
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("admin:vendors.fields.slug")}
                        name="slug"
                        rules={[{ required: true, message: t("admin:vendors.messages.slugRequired") }]}
                        help={t("admin:vendors.help.slug")}
                      >
                        <Input placeholder={t("admin:vendors.placeholders.slug")} disabled />
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
                            validateStatus={emailExists ? "error" : checkingEmail ? "validating" : undefined}
                          >
                            <Input
                              placeholder="vendor@example.com"
                              onBlur={(e) => checkEmailUniqueness(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.phone")}
                            name="phone"
                            rules={[{ required: true, message: t("admin:vendors.messages.phoneRequired") }]}
                          >
                            <Input placeholder="+221 77 123 45 67" />
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
                        />
                      </Form.Item>

                      <Form.Item
                        label={t("admin:vendors.fields.commissionRate")}
                        name="commissionRate"
                        rules={[{ required: true, message: t("admin:vendors.messages.commissionRequired") }]}
                        initialValue={10}
                        help={t("admin:vendors.help.commissionRate")}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.5}
                          style={{ width: "100%" }}
                          addonAfter="%"
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
                            <Input placeholder={t("admin:vendors.placeholders.accountName")} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.accountNumber")}
                            name="accountNumber"
                          >
                            <Input placeholder={t("admin:vendors.placeholders.accountNumber")} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.bankName")}
                            name="bankName"
                          >
                            <Input placeholder={t("admin:vendors.placeholders.bankName")} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={t("admin:vendors.fields.swiftCode")}
                            name="swiftCode"
                          >
                            <Input placeholder="XXXXXXXX" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={t("admin:vendors.fields.iban")}
                        name="iban"
                        help={t("admin:vendors.help.iban")}
                      >
                        <Input placeholder="SN00 0000 0000 0000 0000 0000 0000" />
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
                            <Input placeholder="+221 77 123 45 67" />
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
              {/* Publish Card */}
              <Card title={t("admin:vendors.sidebar.publish")} size="small">
                <Form.Item
                  label={t("admin:vendors.fields.status")}
                  name="status"
                  initialValue="PENDING"
                >
                  <Select>
                    <Select.Option value="PENDING">{t("admin:vendors.status.PENDING")}</Select.Option>
                    <Select.Option value="ACTIVE">{t("admin:vendors.status.ACTIVE")}</Select.Option>
                    <Select.Option value="SUSPENDED">{t("admin:vendors.status.SUSPENDED")}</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label={t("admin:vendors.fields.rating")}>
                  <Rate disabled value={0} />
                  <span className="ml-2 text-gray-500">
                    {t("admin:vendors.help.ratingDisabled")}
                  </span>
                </Form.Item>
              </Card>

              {/* Actions */}
              <Card size="small">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button type="primary" htmlType="submit" block size="large">
                    {t("admin:vendors.actions.create")}
                  </Button>
                  <Button onClick={() => router.push("/admin/vendors")} block>
                    {t("common:buttons.cancel")}
                  </Button>
                </Space>
              </Card>

              {/* Help Card */}
              <Card title={t("admin:vendors.sidebar.help")} size="small">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• {t("admin:vendors.help.tip1")}</li>
                  <li>• {t("admin:vendors.help.tip2")}</li>
                  <li>• {t("admin:vendors.help.tip3")}</li>
                </ul>
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

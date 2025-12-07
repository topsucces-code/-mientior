"use client";

import React, { useState } from "react";
import {
  Upload,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  FileOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useTranslation } from "react-i18next";

export interface VendorDocument {
  id?: string;
  type: string;
  url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface DocumentUploaderProps {
  documents: VendorDocument[];
  onChange: (documents: VendorDocument[]) => void;
  documentTypes?: string[];
  readOnly?: boolean;
  showActions?: boolean;
  onApprove?: (doc: VendorDocument) => void;
  onReject?: (doc: VendorDocument, reason: string) => void;
}

const DEFAULT_DOCUMENT_TYPES = [
  "Business Registration",
  "Tax ID",
  "Bank Statement",
  "ID Proof",
  "Address Proof",
  "Trade License",
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onChange,
  documentTypes = DEFAULT_DOCUMENT_TYPES,
  readOnly = false,
  showActions = false,
  onApprove,
  onReject,
}) => {
  const { t } = useTranslation(["admin", "common"]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(documentTypes[0]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingDoc, setRejectingDoc] = useState<VendorDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      APPROVED: "green",
      REJECTED: "red",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckOutlined />;
      case "REJECTED":
        return <CloseOutlined />;
      default:
        return null;
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "document");

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      const newDocument: VendorDocument = {
        type: selectedType,
        url: data.url,
        status: "PENDING",
        uploadedAt: new Date().toISOString(),
      };

      onChange([...documents, newDocument]);
      message.success(t("admin:vendors.documents.uploadSuccess"));
    } catch (error) {
      message.error(t("admin:vendors.documents.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isValidType =
        file.type === "application/pdf" ||
        file.type.startsWith("image/");
      if (!isValidType) {
        message.error(t("admin:vendors.documents.invalidType"));
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(t("admin:vendors.documents.fileTooLarge"));
        return false;
      }

      handleUpload(file);
      return false;
    },
    showUploadList: false,
    accept: ".pdf,.jpg,.jpeg,.png,.webp",
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: t("common:messages.confirm"),
      content: t("admin:vendors.documents.deleteConfirm"),
      okText: t("common:buttons.delete"),
      okType: "danger",
      onOk: () => {
        const newDocuments = documents.filter((_, idx) => idx !== index);
        onChange(newDocuments);
        message.success(t("admin:vendors.documents.deleteSuccess"));
      },
    });
  };

  const handleApprove = (doc: VendorDocument, index: number) => {
    if (onApprove) {
      onApprove(doc);
    } else {
      const newDocuments = [...documents];
      newDocuments[index] = {
        ...doc,
        status: "APPROVED",
        reviewedAt: new Date().toISOString(),
      };
      onChange(newDocuments);
      message.success(t("admin:vendors.documents.approveSuccess"));
    }
  };

  const handleRejectClick = (doc: VendorDocument) => {
    setRejectingDoc(doc);
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectingDoc) return;

    if (onReject) {
      onReject(rejectingDoc, rejectionReason);
    } else {
      const index = documents.findIndex((d) => d.url === rejectingDoc.url);
      if (index !== -1) {
        const newDocuments = [...documents];
        newDocuments[index] = {
          ...rejectingDoc,
          status: "REJECTED",
          rejectionReason,
          reviewedAt: new Date().toISOString(),
        };
        onChange(newDocuments);
        message.success(t("admin:vendors.documents.rejectSuccess"));
      }
    }

    setRejectModalVisible(false);
    setRejectingDoc(null);
  };

  const handleApproveAll = () => {
    const newDocuments = documents.map((doc) => ({
      ...doc,
      status: "APPROVED" as const,
      reviewedAt: new Date().toISOString(),
    }));
    onChange(newDocuments);
    message.success(t("admin:vendors.documents.approveAllSuccess"));
  };

  const handleDownloadAll = async () => {
    message.info(t("admin:vendors.documents.downloadStarted"));
    // In production, this would trigger a ZIP download
    for (const doc of documents) {
      window.open(doc.url, "_blank");
    }
  };

  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <Tag color="orange">
          {t("admin:vendors.documents.pending")}: {pendingCount}
        </Tag>
        <Tag color="green">
          {t("admin:vendors.documents.approved")}: {approvedCount}
        </Tag>
        <Tag color="red">
          {t("admin:vendors.documents.rejected")}: {rejectedCount}
        </Tag>
      </div>

      {/* Bulk Actions */}
      {showActions && documents.length > 0 && (
        <Space className="mb-4">
          <Button
            icon={<CheckOutlined />}
            onClick={handleApproveAll}
            disabled={pendingCount === 0}
          >
            {t("admin:vendors.documents.approveAll")}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadAll}>
            {t("admin:vendors.documents.downloadAll")}
          </Button>
        </Space>
      )}

      {/* Upload Section */}
      {!readOnly && (
        <Card size="small" className="mb-4">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <span>{t("admin:vendors.documents.documentType")}:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {t("admin:vendors.documents.upload")}
              </Button>
            </Upload>
            <span className="text-gray-500 text-sm">
              {t("admin:vendors.documents.uploadHint")}
            </span>
          </Space>
        </Card>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <Empty description={t("admin:vendors.documents.noDocuments")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, index) => (
            <Card
              key={`${doc.type}-${index}`}
              size="small"
              className={`border-l-4 ${
                doc.status === "APPROVED"
                  ? "border-l-green-500"
                  : doc.status === "REJECTED"
                  ? "border-l-red-500"
                  : "border-l-orange-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileOutlined className="text-2xl text-gray-400" />
                  <div>
                    <div className="font-medium">{doc.type}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                    <Tag
                      color={getStatusColor(doc.status)}
                      icon={getStatusIcon(doc.status)}
                      className="mt-1"
                    >
                      {doc.status}
                    </Tag>
                    {doc.rejectionReason && (
                      <div className="text-sm text-red-500 mt-1">
                        {t("admin:vendors.documents.reason")}: {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
                <Space>
                  <Tooltip title={t("common:buttons.view")}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(doc.url)}
                    />
                  </Tooltip>
                  {showActions && doc.status === "PENDING" && (
                    <>
                      <Tooltip title={t("admin:vendors.documents.approve")}>
                        <Button
                          type="text"
                          icon={<CheckOutlined />}
                          className="text-green-500"
                          onClick={() => handleApprove(doc, index)}
                        />
                      </Tooltip>
                      <Tooltip title={t("admin:vendors.documents.reject")}>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          className="text-red-500"
                          onClick={() => handleRejectClick(doc)}
                        />
                      </Tooltip>
                    </>
                  )}
                  {!readOnly && (
                    <Tooltip title={t("common:buttons.delete")}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(index)}
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title={t("admin:vendors.documents.preview")}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewUrl.endsWith(".pdf") ? (
          <iframe
            src={previewUrl}
            style={{ width: "100%", height: "600px" }}
            title="Document Preview"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Document Preview"
            style={{ width: "100%", maxHeight: "600px", objectFit: "contain" }}
          />
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectModalVisible}
        title={t("admin:vendors.documents.rejectTitle")}
        onOk={handleRejectConfirm}
        onCancel={() => setRejectModalVisible(false)}
        okText={t("admin:vendors.documents.reject")}
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          <p>{t("admin:vendors.documents.rejectMessage")}</p>
          <Input.TextArea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("admin:vendors.documents.rejectionReasonPlaceholder")}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DocumentUploader;

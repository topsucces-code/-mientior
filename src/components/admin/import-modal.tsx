"use client";

import { useState } from "react";
import { Modal, Upload, Button, Progress, Alert, Space, Typography } from "antd";
import { UploadOutlined, DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useTranslate } from "@refinedev/core";

const { Dragger } = Upload;
const { Text, Link } = Typography;

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  resource: string;
  onSuccess?: () => void;
}

interface ImportResult {
  total: number;
  imported: number;
  errorsCount: number;
  errorReportUrl?: string;
  success: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onClose,
  resource,
  onSuccess,
}) => {
  const translate = useTranslate();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<"create" | "upsert">("upsert");

  const handleUpload = async () => {
    if (fileList.length === 0) return;

    const formData = new FormData();
    formData.append("file", fileList[0] as any);
    formData.append("resource", resource);
    formData.append("mode", mode);

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }

      const data: ImportResult = await response.json();
      setResult(data);

      if (data.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      Modal.error({
        title: translate("import.error", "Import Error"),
        content: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFileList([]);
    setProgress(0);
    setResult(null);
    setMode("upsert");
    onClose();
  };

  const uploadProps: UploadProps = {
    accept: ".csv,.xlsx,.xls",
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isValidType =
        file.type === "text/csv" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (!isValidType) {
        Modal.error({
          title: translate("import.invalidFileType", "Invalid File Type"),
          content: translate(
            "import.invalidFileTypeMessage",
            "Please upload a CSV or Excel file"
          ),
        });
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        Modal.error({
          title: translate("import.fileTooLarge", "File Too Large"),
          content: translate(
            "import.fileTooLargeMessage",
            "File must be smaller than 10MB"
          ),
        });
        return false;
      }

      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/import/template?resource=${resource}`);
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resource}-template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      Modal.error({
        title: translate("import.templateError", "Template Download Error"),
        content: error.message,
      });
    }
  };

  return (
    <Modal
      title={translate(`import.title.${resource}`, `Import ${resource}`)}
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={uploading}>
          {translate("buttons.cancel", "Cancel")}
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0}
          loading={uploading}
          icon={<UploadOutlined />}
        >
          {translate("import.upload", "Upload & Import")}
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Template Download */}
        <Alert
          message={
            <Space>
              <Text>
                {translate(
                  "import.templateInfo",
                  "Download the template to ensure proper formatting"
                )}
              </Text>
              <Link onClick={downloadTemplate}>
                <DownloadOutlined /> {translate("import.downloadTemplate", "Download Template")}
              </Link>
            </Space>
          }
          type="info"
        />

        {/* Mode Selection */}
        <Space>
          <Text strong>{translate("import.mode", "Import Mode")}:</Text>
          <Button.Group>
            <Button
              type={mode === "upsert" ? "primary" : "default"}
              onClick={() => setMode("upsert")}
            >
              {translate("import.mode.upsert", "Create or Update")}
            </Button>
            <Button
              type={mode === "create" ? "primary" : "default"}
              onClick={() => setMode("create")}
            >
              {translate("import.mode.create", "Create Only")}
            </Button>
          </Button.Group>
        </Space>

        {/* File Upload */}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {translate("import.dragText", "Click or drag file to this area to upload")}
          </p>
          <p className="ant-upload-hint">
            {translate(
              "import.dragHint",
              "Support for CSV and Excel files (max 10MB)"
            )}
          </p>
        </Dragger>

        {/* Progress */}
        {uploading && (
          <Progress
            percent={progress}
            status="active"
            format={(percent) =>
              `${percent}% ${translate("import.processing", "Processing...")}`
            }
          />
        )}

        {/* Results */}
        {result && (
          <Alert
            message={translate("import.results", "Import Results")}
            description={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text>
                  {translate("import.total", "Total Rows")}: <strong>{result.total}</strong>
                </Text>
                <Text type="success">
                  {translate("import.imported", "Successfully Imported")}:{" "}
                  <strong>{result.imported}</strong>
                </Text>
                {result.errorsCount > 0 && (
                  <>
                    <Text type="danger">
                      {translate("import.errors", "Errors")}: <strong>{result.errorsCount}</strong>
                    </Text>
                    {result.errorReportUrl && (
                      <Link href={result.errorReportUrl} target="_blank">
                        <DownloadOutlined />{" "}
                        {translate("import.downloadErrorReport", "Download Error Report")}
                      </Link>
                    )}
                  </>
                )}
              </Space>
            }
            type={result.errorsCount > 0 ? "warning" : "success"}
          />
        )}
      </Space>
    </Modal>
  );
};

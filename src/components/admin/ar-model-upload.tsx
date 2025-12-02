"use client";

import React, { useState } from "react";
import {
  Upload,
  Button,
  Space,
  message,
  Modal,
  Alert,
  Card,
  Tabs,
  Progress,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  AppleOutlined,
  AndroidOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

interface ARModel {
  ios?: {
    url: string;
    fileName: string;
    size: number;
  };
  android?: {
    url: string;
    fileName: string;
    size: number;
  };
}

interface ARModelUploadProps {
  productId?: string;
  initialModel?: ARModel;
  onChange?: (model: ARModel | null) => void;
}

export const ARModelUpload: React.FC<ARModelUploadProps> = ({
  productId,
  initialModel,
  onChange,
}) => {
  const [model, setModel] = useState<ARModel>(initialModel || {});
  const [uploading, setUploading] = useState<"ios" | "android" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<"ios" | "android">("ios");

  const handleUpload = (platform: "ios" | "android"): UploadProps["customRequest"] => {
    return async (options) => {
      const { file, onSuccess, onError } = options;

      try {
        setUploading(platform);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file as File);
        formData.append("platform", platform);
        if (productId) {
          formData.append("productId", productId);
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        const response = await fetch("/api/admin/media/upload-ar-model", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        const updatedModel = {
          ...model,
          [platform]: {
            url: data.url,
            fileName: data.fileName,
            size: data.size,
          },
        };

        setModel(updatedModel);
        onChange?.(updatedModel);

        setUploadProgress(100);
        onSuccess?.(data);
        message.success(`${platform === "ios" ? "USDZ" : "GLB"} model uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        onError?.(error as Error);
        message.error("Failed to upload AR model");
      } finally {
        setUploading(null);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    };
  };

  const handleDelete = (platform: "ios" | "android") => {
    Modal.confirm({
      title: "Delete AR Model",
      content: `Are you sure you want to delete the ${platform === "ios" ? "iOS (USDZ)" : "Android (GLB)"} model?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const updatedModel = { ...model };
        delete updatedModel[platform];

        setModel(updatedModel);
        onChange?.(Object.keys(updatedModel).length > 0 ? updatedModel : null);
        message.success("AR model deleted");
      },
    });
  };

  const handlePreview = (platform: "ios" | "android") => {
    setPreviewPlatform(platform);
    setPreviewVisible(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">AR Preview Models</h3>
      </div>

      <Alert
        message="AR Model Requirements"
        description={
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>iOS: USDZ format (Apple AR Quick Look)</li>
            <li>Android: GLB format (Google Scene Viewer)</li>
            <li>Maximum file size: 50MB per model</li>
            <li>Models should be optimized for mobile devices</li>
            <li>Include both formats for cross-platform support</li>
          </ul>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
      />

      <Tabs
        items={[
          {
            key: "ios",
            label: (
              <span>
                <AppleOutlined /> iOS (USDZ)
              </span>
            ),
            children: (
              <div className="space-y-4">
                {!model.ios ? (
                  <>
                    <Upload
                      customRequest={handleUpload("ios")}
                      accept=".usdz"
                      showUploadList={false}
                      disabled={uploading === "ios"}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading === "ios"}
                        block
                      >
                        {uploading === "ios" ? "Uploading..." : "Upload USDZ Model"}
                      </Button>
                    </Upload>

                    {uploading === "ios" && uploadProgress > 0 && (
                      <Progress percent={uploadProgress} status="active" />
                    )}

                    <div className="text-sm text-gray-500">
                      <p>• USDZ format for iOS AR Quick Look</p>
                      <p>• Supported on iOS 12+ devices</p>
                      <p>• Recommended for iPhone and iPad</p>
                    </div>
                  </>
                ) : (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{model.ios.fileName}</h4>
                        <p className="text-sm text-gray-500">
                          Size: {formatFileSize(model.ios.size)}
                        </p>
                      </div>
                      <Space>
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview("ios")}
                        >
                          Preview
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete("ios")}
                        >
                          Delete
                        </Button>
                      </Space>
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: "android",
            label: (
              <span>
                <AndroidOutlined /> Android (GLB)
              </span>
            ),
            children: (
              <div className="space-y-4">
                {!model.android ? (
                  <>
                    <Upload
                      customRequest={handleUpload("android")}
                      accept=".glb,.gltf"
                      showUploadList={false}
                      disabled={uploading === "android"}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading === "android"}
                        block
                      >
                        {uploading === "android" ? "Uploading..." : "Upload GLB Model"}
                      </Button>
                    </Upload>

                    {uploading === "android" && uploadProgress > 0 && (
                      <Progress percent={uploadProgress} status="active" />
                    )}

                    <div className="text-sm text-gray-500">
                      <p>• GLB format for Android Scene Viewer</p>
                      <p>• Supported on ARCore-compatible devices</p>
                      <p>• Recommended for Android phones and tablets</p>
                    </div>
                  </>
                ) : (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{model.android.fileName}</h4>
                        <p className="text-sm text-gray-500">
                          Size: {formatFileSize(model.android.size)}
                        </p>
                      </div>
                      <Space>
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview("android")}
                        >
                          Preview
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete("android")}
                        >
                          Delete
                        </Button>
                      </Space>
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title={`AR Model Preview (${previewPlatform === "ios" ? "iOS" : "Android"})`}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <div className="space-y-4">
          <Alert
            message="AR Preview"
            description={
              previewPlatform === "ios"
                ? "To preview this model in AR, open this page on an iOS device with AR Quick Look support."
                : "To preview this model in AR, open this page on an Android device with ARCore support."
            }
            type="info"
            showIcon
          />

          {model[previewPlatform] && (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">
                {previewPlatform === "ios" ? "📱" : "🤖"}
              </div>
              <p className="text-gray-600 mb-2">
                {model[previewPlatform]!.fileName}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(model[previewPlatform]!.size)}
              </p>
              <Button
                type="primary"
                className="mt-4"
                href={model[previewPlatform]!.url}
                target="_blank"
              >
                Download Model
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p className="font-medium mb-2">Testing Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download the model file to your device</li>
              <li>
                {previewPlatform === "ios"
                  ? "Open the file in Safari or Files app"
                  : "Open the file in Chrome or a compatible browser"}
              </li>
              <li>Tap the AR icon to launch the AR viewer</li>
              <li>Point your camera at a flat surface to place the model</li>
            </ol>
          </div>
        </div>
      </Modal>
    </div>
  );
};

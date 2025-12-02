"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Button,
  Space,
  message,
  Modal,
  Input,
  Form,
  Progress,
  Card,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

interface VideoMetadata {
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
}

interface VideoItem {
  id: string;
  url: string;
  metadata: VideoMetadata;
  posterUrl?: string;
}

interface ProductVideoUploadProps {
  productId?: string;
  initialVideos?: VideoItem[];
  onChange?: (videos: VideoItem[]) => void;
  maxVideos?: number;
}

export const ProductVideoUpload: React.FC<ProductVideoUploadProps> = ({
  productId,
  initialVideos = [],
  onChange,
  maxVideos = 5,
}) => {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [form] = Form.useForm();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("type", "product-video");
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
      }, 200);

      const response = await fetch("/api/admin/media/upload-video", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Generate video thumbnail
      const thumbnailResponse = await fetch("/api/admin/media/video-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: data.url }),
      });

      const thumbnailData = await thumbnailResponse.json();

      const newVideo: VideoItem = {
        id: `video-${Date.now()}`,
        url: data.url,
        posterUrl: thumbnailData.thumbnailUrl,
        metadata: {
          title: (file as File).name.replace(/\.[^/.]+$/, ""),
          duration: data.duration,
        },
      };

      const updatedVideos = [...videos, newVideo];
      setVideos(updatedVideos);
      onChange?.(updatedVideos);

      setUploadProgress(100);
      onSuccess?.(data);
      message.success("Video uploaded successfully");

      // Open edit modal to add metadata
      setEditingVideo(newVideo);
      form.setFieldsValue(newVideo.metadata);
      setEditModalVisible(true);
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error as Error);
      message.error("Failed to upload video");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Delete Video",
      content: "Are you sure you want to delete this video?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const updatedVideos = videos.filter((v) => v.id !== id);
        setVideos(updatedVideos);
        onChange?.(updatedVideos);
        message.success("Video deleted");
      },
    });
  };

  const handlePreview = (video: VideoItem) => {
    setPreviewVideo(video);
    setPreviewVisible(true);
  };

  const handleEdit = (video: VideoItem) => {
    setEditingVideo(video);
    form.setFieldsValue(video.metadata);
    setEditModalVisible(true);
  };

  const handleMetadataSave = () => {
    form.validateFields().then((values) => {
      if (!editingVideo) return;

      const updatedVideos = videos.map((v) =>
        v.id === editingVideo.id
          ? { ...v, metadata: { ...v.metadata, ...values } }
          : v
      );

      setVideos(updatedVideos);
      onChange?.(updatedVideos);
      setEditModalVisible(false);
      setEditingVideo(null);
      form.resetFields();
      message.success("Video metadata updated");
    });
  };

  const canUploadMore = videos.length < maxVideos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Product Videos</h3>
        <span className="text-sm text-gray-500">
          {videos.length} / {maxVideos} videos
        </span>
      </div>

      {canUploadMore && (
        <>
          <Upload
            customRequest={handleUpload}
            accept="video/*"
            showUploadList={false}
            disabled={uploading || !canUploadMore}
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={!canUploadMore}
              block
            >
              {uploading ? "Uploading..." : "Upload Product Video"}
            </Button>
          </Upload>

          {uploading && uploadProgress > 0 && (
            <Progress percent={uploadProgress} status="active" />
          )}
        </>
      )}

      <div className="text-sm text-gray-500">
        <p>• Supported formats: MP4, WebM, MOV</p>
        <p>• Maximum file size: 100MB</p>
        <p>• Recommended resolution: 1920x1080 (Full HD)</p>
        <p>• Videos will be automatically compressed for web delivery</p>
      </div>

      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              cover={
                <div className="relative aspect-video bg-gray-100">
                  {video.posterUrl ? (
                    <img
                      src={video.posterUrl}
                      alt={video.metadata.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PlayCircleOutlined className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handlePreview(video)}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              }
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(video)}
                >
                  Edit
                </Button>,
                <Button
                  key="preview"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(video)}
                >
                  Preview
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(video.id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <Card.Meta
                title={video.metadata.title}
                description={
                  <div className="space-y-1">
                    {video.metadata.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {video.metadata.description}
                      </p>
                    )}
                    {video.metadata.duration && (
                      <p className="text-xs text-gray-500">
                        Duration: {Math.floor(video.metadata.duration / 60)}:
                        {String(Math.floor(video.metadata.duration % 60)).padStart(
                          2,
                          "0"
                        )}
                      </p>
                    )}
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewVideo?.metadata.title}
        footer={null}
        onCancel={() => {
          setPreviewVisible(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }}
        width={900}
      >
        {previewVideo && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              src={previewVideo.url}
              poster={previewVideo.posterUrl}
              controls
              className="w-full rounded"
              style={{ maxHeight: "500px" }}
            />
            {previewVideo.metadata.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{previewVideo.metadata.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Metadata Modal */}
      <Modal
        open={editModalVisible}
        title="Edit Video Metadata"
        onOk={handleMetadataSave}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingVideo(null);
          form.resetFields();
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Video Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="Enter video title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={4}
              placeholder="Enter video description (optional)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

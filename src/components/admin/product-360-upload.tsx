"use client";

import React, { useState } from "react";
import { Upload, Button, Space, message, Modal, Spin, Progress } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Product360UploadProps {
  productId?: string;
  initialFrames?: string[];
  onChange?: (frames: string[]) => void;
}

interface FrameItem {
  id: string;
  url: string;
  order: number;
}

const SortableFrame: React.FC<{
  frame: FrameItem;
  onDelete: (id: string) => void;
  onPreview: (url: string) => void;
}> = ({ frame, onDelete, onPreview }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg mb-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        <SortAscendingOutlined />
      </div>
      <img
        src={frame.url}
        alt={`Frame ${frame.order + 1}`}
        className="w-16 h-16 object-cover rounded"
      />
      <span className="flex-1 text-sm">Frame {frame.order + 1}</span>
      <Space>
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onPreview(frame.url)}
        />
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(frame.id)}
        />
      </Space>
    </div>
  );
};

export const Product360Upload: React.FC<Product360UploadProps> = ({
  productId,
  initialFrames = [],
  onChange,
}) => {
  const [frames, setFrames] = useState<FrameItem[]>(
    initialFrames.map((url, index) => ({
      id: `frame-${index}`,
      url,
      order: index,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("type", "360-frame");
      if (productId) {
        formData.append("productId", productId);
      }

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Generate thumbnail
      const thumbnailResponse = await fetch("/api/admin/media/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      });

      const thumbnailData = await thumbnailResponse.json();

      const newFrame: FrameItem = {
        id: `frame-${Date.now()}`,
        url: data.url,
        order: frames.length,
      };

      const updatedFrames = [...frames, newFrame];
      setFrames(updatedFrames);
      onChange?.(updatedFrames.map((f) => f.url));

      onSuccess?.(data);
      message.success("Frame uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error as Error);
      message.error("Failed to upload frame");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = frames.findIndex((f) => f.id === active.id);
      const newIndex = frames.findIndex((f) => f.id === over.id);

      const reorderedFrames = arrayMove(frames, oldIndex, newIndex).map(
        (frame, index) => ({
          ...frame,
          order: index,
        })
      );

      setFrames(reorderedFrames);
      onChange?.(reorderedFrames.map((f) => f.url));
      message.success("Frame order updated");
    }
  };

  const handleDelete = (id: string) => {
    const updatedFrames = frames
      .filter((f) => f.id !== id)
      .map((frame, index) => ({
        ...frame,
        order: index,
      }));

    setFrames(updatedFrames);
    onChange?.(updatedFrames.map((f) => f.url));
    message.success("Frame deleted");
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const start360Preview = () => {
    if (frames.length === 0) return;

    setIsRotating(true);
    setCurrentFrame(0);

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= frames.length - 1) {
          clearInterval(interval);
          setIsRotating(false);
          return 0;
        }
        return prev + 1;
      });
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">360° Product Images</h3>
        {frames.length > 0 && (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={start360Preview}
            disabled={isRotating}
          >
            Preview 360° View
          </Button>
        )}
      </div>

      <Upload
        customRequest={handleUpload}
        multiple
        accept="image/*"
        showUploadList={false}
        disabled={uploading}
      >
        <Button icon={<UploadOutlined />} loading={uploading} block>
          {uploading ? "Uploading..." : "Upload 360° Frames"}
        </Button>
      </Upload>

      {uploading && uploadProgress > 0 && (
        <Progress percent={uploadProgress} status="active" />
      )}

      <div className="text-sm text-gray-500">
        <p>• Upload multiple images to create a 360° view</p>
        <p>• Drag and drop frames to reorder them</p>
        <p>• Recommended: 24-36 frames for smooth rotation</p>
        <p>• Images should be taken at equal intervals around the product</p>
      </div>

      {frames.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {frames.length} frame{frames.length !== 1 ? "s" : ""} uploaded
            </span>
            <span className="text-sm text-gray-500">
              Drag to reorder
            </span>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={frames.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-96 overflow-y-auto">
                {frames.map((frame) => (
                  <SortableFrame
                    key={frame.id}
                    frame={frame}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Modal
        open={previewVisible}
        title="Frame Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[600px] object-contain"
          />
        </div>
      </Modal>

      <Modal
        open={isRotating}
        title="360° Preview"
        footer={null}
        onCancel={() => setIsRotating(false)}
        width={800}
      >
        <div className="flex flex-col items-center gap-4">
          {frames[currentFrame] && (
            <img
              src={frames[currentFrame].url}
              alt={`Frame ${currentFrame + 1}`}
              className="max-w-full max-h-[600px] object-contain"
            />
          )}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Frame {currentFrame + 1} of {frames.length}
            </p>
            <p className="text-sm text-gray-500">
              Rotation: {Math.round((currentFrame / frames.length) * 360)}°
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

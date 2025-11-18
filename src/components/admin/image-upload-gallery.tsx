"use client";

import { useState } from "react";
import {
  Upload,
  Modal,
  Button,
  Input,
  Space,
  Card,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";

const { Dragger } = Upload;
const { TextArea } = Input;

export interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
  order: number;
  isMain: boolean;
}

interface ImageUploadGalleryProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  productId?: string;
}

interface SortableImageProps {
  image: ProductImage;
  index: number;
  onSetMain: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableImage: React.FC<SortableImageProps> = ({
  image,
  onSetMain,
  onEdit,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group"
    >
      <Card
        hoverable
        cover={
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <img
              src={image.url}
              alt={image.alt || "Product image"}
              className="w-full h-full object-cover"
            />
            {image.isMain && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                Main
              </div>
            )}
          </div>
        }
        className="border-2 border-gray-200 hover:border-orange-500 transition-colors"
        bodyStyle={{ padding: "8px" }}
      >
        <Space className="w-full justify-between">
          <Button
            type="text"
            icon={image.isMain ? <StarFilled className="text-orange-500" /> : <StarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onSetMain();
            }}
            size="small"
          />
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              size="small"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              size="small"
            />
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export const ImageUploadGallery: React.FC<ImageUploadGalleryProps> = ({
  images,
  onChange,
  maxImages = 10,
  productId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        order: idx,
      }));

      onChange(newImages);
    }
  };

  const handleSetMain = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      isMain: idx === index,
    }));
    onChange(newImages);
  };

  const handleEdit = (image: ProductImage) => {
    setEditingImage(image);
    setEditModalVisible(true);
  };

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: "Delete Image",
      content: "Are you sure you want to delete this image?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const newImages = images
          .filter((_, idx) => idx !== index)
          .map((img, idx) => ({
            ...img,
            order: idx,
            isMain: idx === 0 ? true : img.isMain,
          }));
        onChange(newImages);
      },
    });
  };

  const handleSaveEdit = () => {
    if (editingImage) {
      const newImages = images.map((img) =>
        img.url === editingImage.url ? editingImage : img
      );
      onChange(newImages);
      setEditModalVisible(false);
      setEditingImage(null);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: "image/webp",
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Error compressing image:", error);
      return file;
    }
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    if (productId) {
      formData.append("productId", productId);
    }

    const response = await fetch("/api/media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const handleUpload = async (files: File[]) => {
    if (images.length + files.length > maxImages) {
      message.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const compressed = await compressImage(file);
        const url = await uploadImageToServer(compressed);
        return {
          url,
          alt: "",
          caption: "",
          order: images.length,
          isMain: images.length === 0,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...newImages].map((img, idx) => ({
        ...img,
        order: idx,
      }));

      onChange(updatedImages);
      message.success(`${files.length} image(s) uploaded successfully`);
    } catch (error: any) {
      message.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxImages - images.length,
    onDrop: handleUpload,
    disabled: images.length >= maxImages,
  });

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-gray-400"
          } ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <InboxOutlined className="text-4xl text-gray-400 mb-2" />
          <p className="text-gray-600">
            {isDragActive
              ? "Drop images here..."
              : "Drag and drop images here, or click to select"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {images.length} / {maxImages} images uploaded
          </p>
        </div>
      )}

      {/* Image Gallery */}
      {uploading ? (
        <div className="text-center py-12">
          <Spin size="large" tip="Uploading images..." />
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.url)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <SortableImage
                  key={image.url}
                  image={image}
                  index={index}
                  onSetMain={() => handleSetMain(index)}
                  onEdit={() => handleEdit(image)}
                  onDelete={() => handleDelete(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Modal */}
      <Modal
        title="Edit Image Details"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingImage(null);
        }}
        okText="Save"
      >
        {editingImage && (
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <img
                src={editingImage.url}
                alt={editingImage.alt || "Preview"}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <Input
                value={editingImage.alt}
                onChange={(e) =>
                  setEditingImage({ ...editingImage, alt: e.target.value })
                }
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caption (Optional)</label>
              <TextArea
                value={editingImage.caption}
                onChange={(e) =>
                  setEditingImage({ ...editingImage, caption: e.target.value })
                }
                placeholder="Add a caption for this image"
                rows={3}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

"use client";

import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Checkbox, Button, Space, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useDelete } from "@refinedev/core";

const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryEdit({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [categories, setCategories] = useState<Category[]>([]);

  const { formProps, saveButtonProps, form, query } = useForm({
    resource: "categories",
    id: id,
    redirect: "list",
  });

  const { mutate: deleteCategory } = useDelete();

  // Fetch parent categories (excluding self)
  useEffect(() => {
    fetch("http://localhost:3000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.filter((cat: Category) => cat.id !== id)))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, [id]);

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    form.setFieldsValue({ slug });
  };

  const handleDelete = () => {
    deleteCategory(
      {
        resource: "categories",
        id: id,
      },
      {
        onSuccess: () => {
          router.push("/admin/categories");
        },
      }
    );
  };

  const isLoading = query?.isLoading;

  if (isLoading) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Edit Category</h1>
        <Popconfirm
          title="Delete Category"
          description="Are you sure you want to delete this category?"
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete Category
          </Button>
        </Popconfirm>
      </div>

      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input onChange={handleNameChange} placeholder="Category name" />
        </Form.Item>

        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input placeholder="Auto-generated from name" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} placeholder="Category description" />
        </Form.Item>

        <Form.Item label="Image URL" name="image">
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item label="Parent Category" name="parentId">
          <Select
            placeholder="Select parent category (optional)"
            allowClear
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="Display Order" name="order">
          <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Active</Checkbox>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" {...saveButtonProps}>
              Save Changes
            </Button>
            <Button onClick={() => router.push("/admin/categories")}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

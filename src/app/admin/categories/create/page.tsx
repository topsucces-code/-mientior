"use client";

import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Checkbox, Button, Space } from "antd";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const { TextArea } = Input;

export default function CategoryCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);

  const { formProps, saveButtonProps, form } = useForm({
    resource: "categories",
    redirect: "list",
  });

  // Fetch parent categories
  useEffect(() => {
    fetch("http://localhost:3000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    form.setFieldsValue({ slug });
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <h1>Create Category</h1>
      <Form {...formProps} form={form} layout="vertical">
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

        <Form.Item label="Display Order" name="order" initialValue={0}>
          <InputNumber min={0} placeholder="0" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked" initialValue={true}>
          <Checkbox>Active</Checkbox>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" {...saveButtonProps}>
              Create Category
            </Button>
            <Button onClick={() => router.push("/admin/categories")}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

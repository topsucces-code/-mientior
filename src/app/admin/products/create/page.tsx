"use client";

import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Upload, Button, Checkbox, Space } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const { TextArea } = Input;

export default function ProductCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  const { formProps, saveButtonProps, form } = useForm({
    resource: "products",
    redirect: "list",
  });

  // Fetch categories
  useEffect(() => {
    fetch("http://localhost:3000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // Fetch tags
  useEffect(() => {
    fetch("http://localhost:3000/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch((err) => console.error("Failed to fetch tags:", err));
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
    <div style={{ padding: "24px", maxWidth: "1200px" }}>
      <h1>Create Product</h1>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter product name" }]}
        >
          <Input onChange={handleNameChange} placeholder="Product name" />
        </Form.Item>

        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input placeholder="Auto-generated from name" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} placeholder="Product description" />
        </Form.Item>

        <Space style={{ width: "100%", marginBottom: 16 }}>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Price is required" }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              min={0}
              step={0.01}
              placeholder="0.00"
              style={{ width: 150 }}
            />
          </Form.Item>

          <Form.Item label="Compare At Price" name="compareAtPrice" style={{ marginBottom: 0 }}>
            <InputNumber
              min={0}
              step={0.01}
              placeholder="0.00"
              style={{ width: 150 }}
            />
          </Form.Item>

          <Form.Item
            label="Stock"
            name="stock"
            rules={[{ required: true, message: "Stock is required" }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber min={0} placeholder="0" style={{ width: 150 }} />
          </Form.Item>
        </Space>

        <Form.Item
          label="Category"
          name="categoryId"
          rules={[{ required: true, message: "Category is required" }]}
        >
          <Select
            placeholder="Select category"
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="Tags" name="tagIds">
          <Select
            mode="multiple"
            placeholder="Select tags"
            options={tags.map((tag) => ({
              label: tag.name,
              value: tag.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="Status" name="status" initialValue="ACTIVE">
          <Select>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="DRAFT">Draft</Select.Option>
            <Select.Option value="ARCHIVED">Archived</Select.Option>
          </Select>
        </Form.Item>

        <Space style={{ marginBottom: 16 }}>
          <Form.Item name="featured" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>Featured</Checkbox>
          </Form.Item>

          <Form.Item name="onSale" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>On Sale</Checkbox>
          </Form.Item>
        </Space>

        <Form.Item label="Badge" name="badge">
          <Input placeholder="e.g., New, Limited, Exclusive" />
        </Form.Item>

        <h3>Variants</h3>
        <Form.List name="variants">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "size"]}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder="Size (e.g., M, L)" style={{ width: 100 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "color"]}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder="Color" style={{ width: 120 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "sku"]}
                    rules={[{ required: true, message: "SKU required" }]}
                  >
                    <Input placeholder="SKU" style={{ width: 150 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "stock"]}
                    rules={[{ required: true, message: "Stock required" }]}
                  >
                    <InputNumber placeholder="Stock" min={0} style={{ width: 100 }} />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, "priceModifier"]}>
                    <InputNumber
                      placeholder="Price ±"
                      step={0.01}
                      style={{ width: 100 }}
                    />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Variant
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <h3>Images</h3>
        <Form.List name="images">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "url"]}
                    rules={[{ required: true, message: "Image URL required" }]}
                  >
                    <Input placeholder="Image URL" style={{ width: 300 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "alt"]}
                    rules={[{ required: true, message: "Alt text required" }]}
                  >
                    <Input placeholder="Alt text" style={{ width: 200 }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "type"]}
                    initialValue="IMAGE"
                  >
                    <Select style={{ width: 120 }}>
                      <Select.Option value="IMAGE">Image</Select.Option>
                      <Select.Option value="VIDEO">Video</Select.Option>
                      <Select.Option value="THREE_SIXTY">360°</Select.Option>
                    </Select>
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Image
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Space>
            <Button type="primary" {...saveButtonProps}>
              Create Product
            </Button>
            <Button onClick={() => router.push("/admin/products")}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

"use client";

import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Button, Checkbox, Space, Popconfirm, Alert } from "antd";
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined, CloudOutlined, ExportOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useDelete } from "@refinedev/core";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function ProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { t } = useTranslation(["admin", "common"]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const { formProps, saveButtonProps, form, query } = useForm({
    resource: "products",
    id: id,
    redirect: "list",
  });

  const { mutate: deleteProduct } = useDelete();

  // Check if product is managed by Akeneo PIM
  const productData = query?.data?.data as any;
  const hasPimMapping = !!productData?.pimMapping;

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  // Fetch tags
  useEffect(() => {
    fetch("/api/tags")
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

  const handleDelete = () => {
    deleteProduct(
      {
        resource: "products",
        id: id,
      },
      {
        onSuccess: () => {
          router.push("/admin/products");
        },
      }
    );
  };

  const isLoading = query?.isLoading;

  if (isLoading) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1>Edit Product</h1>
        <Popconfirm
          title="Delete Product"
          description="Are you sure you want to delete this product?"
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete Product
          </Button>
        </Popconfirm>
      </div>

      {hasPimMapping && (
        <Alert
          message={t("products.managedByAkeneo", "This product is managed by Akeneo PIM")}
          description={
            <Space direction="vertical">
              <span>{t("products.syncedFromAkeneo", "Changes should be made in Akeneo and will be synchronized automatically.")}</span>
              <span>
                {t("products.akeneoFieldsReadOnly", "Core product fields (name, description, price, images) are read-only in this form. Only inventory and metadata can be updated here.")}
              </span>
              {process.env.NEXT_PUBLIC_AKENEO_API_URL && (
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  href={`${process.env.NEXT_PUBLIC_AKENEO_API_URL}/enrich/product/identifier/${productData?.pimMapping?.akeneoProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ paddingLeft: 0 }}
                >
                  {t("products.viewInAkeneo", "View in Akeneo")}
                </Button>
              )}
            </Space>
          }
          type="warning"
          showIcon
          icon={<CloudOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter product name" }]}
          tooltip={hasPimMapping ? t("products.managedInAkeneo", "This field is managed in Akeneo") : undefined}
        >
          <Input onChange={handleNameChange} placeholder="Product name" disabled={hasPimMapping} />
        </Form.Item>

        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
          tooltip={hasPimMapping ? t("products.managedInAkeneo", "This field is managed in Akeneo") : undefined}
        >
          <Input placeholder="Auto-generated from name" disabled={hasPimMapping} />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          tooltip={hasPimMapping ? t("products.managedInAkeneo", "This field is managed in Akeneo") : undefined}
        >
          <TextArea rows={4} placeholder="Product description" disabled={hasPimMapping} />
        </Form.Item>

        <Space style={{ width: "100%", marginBottom: 16 }}>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Price is required" }]}
            style={{ marginBottom: 0 }}
            tooltip={hasPimMapping ? t("products.managedInAkeneo", "This field is managed in Akeneo") : undefined}
          >
            <InputNumber
              min={0}
              step={0.01}
              placeholder="0.00"
              style={{ width: 150 }}
              disabled={hasPimMapping}
            />
          </Form.Item>

          <Form.Item
            label="Compare At Price"
            name="compareAtPrice"
            style={{ marginBottom: 0 }}
            tooltip={hasPimMapping ? t("products.managedInAkeneo", "This field is managed in Akeneo") : undefined}
          >
            <InputNumber
              min={0}
              step={0.01}
              placeholder="0.00"
              style={{ width: 150 }}
              disabled={hasPimMapping}
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

        <Form.Item label="Status" name="status">
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

        <h3>
          Variants
          {hasPimMapping && <span style={{ fontSize: "14px", color: "#888", marginLeft: "8px" }}>({t("products.managedInAkeneo", "Managed in Akeneo")})</span>}
        </h3>
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
                    <Input placeholder="Size (e.g., M, L)" style={{ width: 100 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "color"]}
                    rules={[{ required: false }]}
                  >
                    <Input placeholder="Color" style={{ width: 120 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "sku"]}
                    rules={[{ required: true, message: "SKU required" }]}
                  >
                    <Input placeholder="SKU" style={{ width: 150 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "stock"]}
                    rules={[{ required: true, message: "Stock required" }]}
                  >
                    <InputNumber placeholder="Stock" min={0} style={{ width: 100 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, "priceModifier"]}>
                    <InputNumber
                      placeholder="Price ±"
                      step={0.01}
                      style={{ width: 100 }}
                      disabled={hasPimMapping}
                    />
                  </Form.Item>

                  {!hasPimMapping && <MinusCircleOutlined onClick={() => remove(name)} />}
                </Space>
              ))}
              {!hasPimMapping && (
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
              )}
            </>
          )}
        </Form.List>

        <h3>
          Images
          {hasPimMapping && <span style={{ fontSize: "14px", color: "#888", marginLeft: "8px" }}>({t("products.managedInAkeneo", "Managed in Akeneo")})</span>}
        </h3>
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
                    <Input placeholder="Image URL" style={{ width: 300 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "alt"]}
                    rules={[{ required: true, message: "Alt text required" }]}
                  >
                    <Input placeholder="Alt text" style={{ width: 200 }} disabled={hasPimMapping} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "type"]}
                    initialValue="IMAGE"
                  >
                    <Select style={{ width: 120 }} disabled={hasPimMapping}>
                      <Select.Option value="IMAGE">Image</Select.Option>
                      <Select.Option value="VIDEO">Video</Select.Option>
                      <Select.Option value="THREE_SIXTY">360°</Select.Option>
                    </Select>
                  </Form.Item>

                  {!hasPimMapping && <MinusCircleOutlined onClick={() => remove(name)} />}
                </Space>
              ))}
              {!hasPimMapping && (
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
              )}
            </>
          )}
        </Form.List>

        <Form.Item>
          <Space>
            <Button type="primary" {...saveButtonProps}>
              Save Changes
            </Button>
            <Button onClick={() => router.push("/admin/products")}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

"use client";

import { useForm } from "@refinedev/antd";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Checkbox,
  Space,
  Tabs,
  Card,
  Row,
  Col,
  DatePicker,
  Radio,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploadGallery, ProductImage } from "@/components/admin/image-upload-gallery";
import {
  VariantMatrixGenerator,
  VariantAttribute,
  ProductVariant,
} from "@/components/admin/variant-matrix-generator";
import { Category, Tag } from "@/types";

const { TextArea } = Input;

export default function ProductCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [attributes, setAttributes] = useState<VariantAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  const { formProps, form, onFinish } = useForm({
    resource: "products",
    redirect: "list",
  });

  // Fetch categories and tags
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ])
      .then(([categoriesData, tagsData]) => {
        // Ensure we're setting arrays
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        // Set empty arrays on error
        setCategories([]);
        setTags([]);
      });
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

  // Custom submit handler to aggregate all tabs
  const handleSubmit = async (values: Record<string, unknown>) => {
    const formData = {
      ...values,
      description,
      longDescription,
      images: images.map((img, idx) => ({
        ...img,
        order: idx,
      })),
      variants: variants
        .filter((v) => v.enabled)
        .map((v) => ({
          sku: v.sku,
          size: v.combination.split(" / ")[0] || null,
          color: v.combination.split(" / ")[1] || null,
          stock: v.stock,
          priceModifier: v.priceMod,
          imageUrl: v.imageUrl || null,
        })),
      // SEO fields
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      focusKeyword: values.focusKeyword,
      canonicalUrl: values.canonicalUrl,
      // Shipping fields
      weight: values.weight,
      dimensions: values.dimensions,
      shippingClass: values.shippingClass,
    };

    try {
      await onFinish?.(formData);
      message.success("Product created successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      message.error(`Failed to create product: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px" }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Product</h1>
      </div>

      <Form {...formProps} form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={24}>
          {/* Main Content */}
          <Col xs={24} lg={18}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "general",
                  label: "General",
                  children: (
                    <Card>
                      <Form.Item
                        label="Product Name"
                        name="name"
                        rules={[{ required: true, message: "Please enter product name" }]}
                      >
                        <Input
                          onChange={handleNameChange}
                          placeholder="Enter product name"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Slug"
                        name="slug"
                        rules={[{ required: true, message: "Slug is required" }]}
                        help="URL-friendly version of the name"
                      >
                        <Input placeholder="Auto-generated from name" />
                      </Form.Item>

                      <Form.Item label="Short Description" help="Brief product summary">
                        <RichTextEditor
                          value={description}
                          onChange={setDescription}
                          placeholder="Enter a brief product description..."
                        />
                      </Form.Item>

                      <Form.Item
                        label="Detailed Description"
                        help="Full product details and specifications"
                      >
                        <RichTextEditor
                          value={longDescription}
                          onChange={setLongDescription}
                          placeholder="Enter detailed product information..."
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            label="Price"
                            name="price"
                            rules={[{ required: true, message: "Price is required" }]}
                          >
                            <InputNumber
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              prefix="$"
                              style={{ width: "100%" }}
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Compare At Price"
                            name="compareAtPrice"
                            help="Original price before discount"
                          >
                            <InputNumber
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              prefix="$"
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            label="Stock"
                            name="stock"
                            rules={[{ required: true, message: "Stock is required" }]}
                          >
                            <InputNumber
                              min={0}
                              placeholder="0"
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="SKU" name="sku" help="Stock Keeping Unit">
                            <Input placeholder="e.g., PRD-001" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Barcode" name="barcode">
                            <Input placeholder="e.g., 123456789012" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Category"
                        name="categoryId"
                        rules={[{ required: true, message: "Category is required" }]}
                      >
                        <Select
                          placeholder="Select category"
                          showSearch
                          optionFilterProp="label"
                          options={categories.map((cat) => ({
                            label: cat.name,
                            value: cat.id,
                          }))}
                          size="large"
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

                      <Form.Item label="Badge Text" name="badge">
                        <Input placeholder="e.g., New, Limited Edition, Best Seller" />
                      </Form.Item>
                    </Card>
                  ),
                },
                {
                  key: "media",
                  label: "Media",
                  children: (
                    <Card>
                      <ImageUploadGallery
                        images={images}
                        onChange={setImages}
                        maxImages={10}
                      />
                    </Card>
                  ),
                },
                {
                  key: "variants",
                  label: "Variants",
                  children: (
                    <Card>
                      <VariantMatrixGenerator
                        attributes={attributes}
                        variants={variants}
                        onChange={(data) => {
                          setAttributes(data.attributes);
                          setVariants(data.variants);
                        }}
                        productSlug={form.getFieldValue("slug") || "PRD"}
                      />
                    </Card>
                  ),
                },
                {
                  key: "seo",
                  label: "SEO",
                  children: (
                    <Card>
                      <Form.Item
                        label="Meta Title"
                        name="metaTitle"
                        help="Recommended length: 50-60 characters"
                      >
                        <Input
                          placeholder="Enter SEO title"
                          maxLength={60}
                          showCount
                        />
                      </Form.Item>

                      <Form.Item
                        label="Meta Description"
                        name="metaDescription"
                        help="Recommended length: 150-160 characters"
                      >
                        <TextArea
                          placeholder="Enter SEO description"
                          rows={3}
                          maxLength={160}
                          showCount
                        />
                      </Form.Item>

                      <Form.Item
                        label="Focus Keyword"
                        name="focusKeyword"
                        help="Main keyword for this product"
                      >
                        <Input placeholder="e.g., wireless headphones" />
                      </Form.Item>

                      <Form.Item label="Canonical URL" name="canonicalUrl">
                        <Input placeholder="https://example.com/products/..." />
                      </Form.Item>

                      <Form.Item label="Robots Meta" name="robotsMeta">
                        <Checkbox.Group
                          options={[
                            { label: "No Index", value: "noindex" },
                            { label: "No Follow", value: "nofollow" },
                          ]}
                        />
                      </Form.Item>

                      <Card
                        title="Google Preview"
                        size="small"
                        className="mt-4 bg-gray-50"
                      >
                        <div className="font-semibold text-blue-600 text-lg">
                          {form.getFieldValue("metaTitle") ||
                            form.getFieldValue("name") ||
                            "Product Title"}
                        </div>
                        <div className="text-green-700 text-sm">
                          https://example.com/products/
                          {form.getFieldValue("slug") || "product-slug"}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {form.getFieldValue("metaDescription") ||
                            "Product description will appear here..."}
                        </div>
                      </Card>
                    </Card>
                  ),
                },
                {
                  key: "shipping",
                  label: "Shipping",
                  children: (
                    <Card>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Weight (kg)"
                            name="weight"
                            help="Product weight for shipping calculations"
                          >
                            <InputNumber
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Dimensions (cm)">
                        <Space>
                          <Form.Item
                            name={["dimensions", "length"]}
                            noStyle
                          >
                            <InputNumber placeholder="Length" min={0} />
                          </Form.Item>
                          <span>×</span>
                          <Form.Item
                            name={["dimensions", "width"]}
                            noStyle
                          >
                            <InputNumber placeholder="Width" min={0} />
                          </Form.Item>
                          <span>×</span>
                          <Form.Item
                            name={["dimensions", "height"]}
                            noStyle
                          >
                            <InputNumber placeholder="Height" min={0} />
                          </Form.Item>
                        </Space>
                      </Form.Item>

                      <Form.Item label="Shipping Class" name="shippingClass">
                        <Select placeholder="Select shipping class">
                          <Select.Option value="standard">Standard</Select.Option>
                          <Select.Option value="express">Express</Select.Option>
                          <Select.Option value="overnight">Overnight</Select.Option>
                          <Select.Option value="free">Free Shipping</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Preparation Time"
                        name="prepTime"
                        help="Time needed to prepare product for shipping"
                      >
                        <Select placeholder="Select prep time">
                          <Select.Option value="1-2">1-2 business days</Select.Option>
                          <Select.Option value="3-5">3-5 business days</Select.Option>
                          <Select.Option value="5-7">5-7 business days</Select.Option>
                          <Select.Option value="custom">Custom</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Special Handling"
                        name="specialHandling"
                        valuePropName="checked"
                      >
                        <Checkbox>Requires special handling</Checkbox>
                      </Form.Item>
                    </Card>
                  ),
                },
              ]}
            />
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={6}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {/* Publish Card */}
              <Card title="Publish" size="small">
                <Form.Item label="Status" name="status" initialValue="DRAFT">
                  <Select>
                    <Select.Option value="DRAFT">Draft</Select.Option>
                    <Select.Option value="ACTIVE">Active</Select.Option>
                    <Select.Option value="ARCHIVED">Archived</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Visibility" name="visibility" initialValue="PUBLIC">
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value="PUBLIC">Public</Radio>
                      <Radio value="PRIVATE">Private</Radio>
                      <Radio value="PASSWORD">Password Protected</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="Publish Date"
                  name="publishedAt"
                  help="Leave empty to publish immediately"
                >
                  <DatePicker showTime style={{ width: "100%" }} />
                </Form.Item>
              </Card>

              {/* Options Card */}
              <Card title="Options" size="small">
                <Space direction="vertical">
                  <Form.Item name="featured" valuePropName="checked" noStyle>
                    <Checkbox>Featured Product</Checkbox>
                  </Form.Item>
                  <Form.Item name="onSale" valuePropName="checked" noStyle>
                    <Checkbox>On Sale</Checkbox>
                  </Form.Item>
                  <Form.Item name="allowReviews" valuePropName="checked" noStyle initialValue={true}>
                    <Checkbox>Allow Reviews</Checkbox>
                  </Form.Item>
                  <Form.Item name="showOnHomepage" valuePropName="checked" noStyle>
                    <Checkbox>Show on Homepage</Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              {/* Actions */}
              <Card size="small">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button type="primary" htmlType="submit" block size="large">
                    Create Product
                  </Button>
                  <Button onClick={() => router.push("/admin/products")} block>
                    Cancel
                  </Button>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

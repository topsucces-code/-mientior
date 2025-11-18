"use client";

import { useState } from "react";
import {
  Button,
  Table,
  Modal,
  Input,
  Select,
  Space,
  Tag,
  InputNumber,
  Switch,
  Upload,
  Popconfirm,
  Alert,
  Card,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

export interface VariantAttribute {
  type: string;
  values: string[];
}

export interface ProductVariant {
  id?: string;
  sku: string;
  combination: string;
  stock: number;
  priceMod: number;
  imageUrl?: string;
  enabled: boolean;
}

interface VariantMatrixGeneratorProps {
  attributes: VariantAttribute[];
  variants: ProductVariant[];
  onChange: (data: { attributes: VariantAttribute[]; variants: ProductVariant[] }) => void;
  productSlug?: string;
}

interface EditableCellProps {
  title: string;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: string;
  record: ProductVariant;
  handleSave: (record: ProductVariant) => void;
}

const AttributeTypeOptions = [
  { label: "Size", value: "size" },
  { label: "Color", value: "color" },
  { label: "Material", value: "material" },
  { label: "Style", value: "style" },
  { label: "Pattern", value: "pattern" },
  { label: "Custom", value: "custom" },
];

export const VariantMatrixGenerator: React.FC<VariantMatrixGeneratorProps> = ({
  attributes,
  variants,
  onChange,
  productSlug = "PRD",
}) => {
  const [attributeModalVisible, setAttributeModalVisible] = useState(false);
  const [newAttributeType, setNewAttributeType] = useState("");
  const [newAttributeValues, setNewAttributeValues] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [bulkStock, setBulkStock] = useState<number | null>(null);
  const [bulkPriceMod, setBulkPriceMod] = useState<number | null>(null);

  // Generate all possible combinations from attributes
  const generateVariants = () => {
    if (attributes.length === 0) {
      message.warning("Please add at least one attribute first");
      return;
    }

    const cartesianProduct = (arrays: string[][]): string[][] => {
      return arrays.reduce(
        (acc, curr) => {
          return acc.flatMap((a) => curr.map((b) => [...a, b]));
        },
        [[]] as string[][]
      );
    };

    const attributeValueArrays = attributes.map((attr) => attr.values);
    const combinations = cartesianProduct(attributeValueArrays);

    const newVariants: ProductVariant[] = combinations.map((combo) => {
      const combination = combo.join(" / ");
      const existingVariant = variants.find((v) => v.combination === combination);

      if (existingVariant) {
        return existingVariant;
      }

      // Generate SKU
      const slug = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, "-");
      const comboSlug = combo.join("-").toUpperCase().replace(/[^A-Z0-9]/g, "-");
      const sku = `${slug}-${comboSlug}`;

      return {
        sku,
        combination,
        stock: 0,
        priceMod: 0,
        enabled: true,
      };
    });

    onChange({ attributes, variants: newVariants });
    message.success(`Generated ${newVariants.length} variants`);
  };

  // Add new attribute
  const handleAddAttribute = () => {
    if (!newAttributeType || newAttributeValues.length === 0) {
      message.error("Please select a type and add at least one value");
      return;
    }

    const newAttributes = [
      ...attributes,
      { type: newAttributeType, values: newAttributeValues },
    ];

    onChange({ attributes: newAttributes, variants });
    setAttributeModalVisible(false);
    setNewAttributeType("");
    setNewAttributeValues([]);
    message.success("Attribute added successfully");
  };

  // Remove attribute
  const handleRemoveAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, idx) => idx !== index);
    onChange({ attributes: newAttributes, variants: [] });
    message.success("Attribute removed. Please regenerate variants.");
  };

  // Handle value input
  const handleInputConfirm = () => {
    if (inputValue && !newAttributeValues.includes(inputValue)) {
      setNewAttributeValues([...newAttributeValues, inputValue]);
    }
    setInputValue("");
  };

  // Remove value tag
  const handleRemoveValue = (value: string) => {
    setNewAttributeValues(newAttributeValues.filter((v) => v !== value));
  };

  // Save variant changes
  const handleSave = (updatedVariant: ProductVariant) => {
    const newVariants = variants.map((variant) =>
      variant.combination === updatedVariant.combination ? updatedVariant : variant
    );
    onChange({ attributes, variants: newVariants });
  };

  // Bulk edit selected variants
  const handleBulkEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select variants to edit");
      return;
    }

    const newVariants = variants.map((variant) => {
      if (selectedRowKeys.includes(variant.combination)) {
        return {
          ...variant,
          ...(bulkStock !== null && { stock: bulkStock }),
          ...(bulkPriceMod !== null && { priceMod: bulkPriceMod }),
        };
      }
      return variant;
    });

    onChange({ attributes, variants: newVariants });
    setBulkEditModalVisible(false);
    setBulkStock(null);
    setBulkPriceMod(null);
    setSelectedRowKeys([]);
    message.success(`Updated ${selectedRowKeys.length} variants`);
  };

  // Toggle variant enabled
  const handleToggleEnabled = (combination: string) => {
    const newVariants = variants.map((variant) =>
      variant.combination === combination
        ? { ...variant, enabled: !variant.enabled }
        : variant
    );
    onChange({ attributes, variants: newVariants });
  };

  // Delete variant
  const handleDeleteVariant = (combination: string) => {
    const newVariants = variants.filter((v) => v.combination !== combination);
    onChange({ attributes, variants: newVariants });
    message.success("Variant deleted");
  };

  // Table columns
  const columns: ColumnsType<ProductVariant> = [
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      width: 80,
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleEnabled(record.combination)}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
      ),
    },
    {
      title: "Combination",
      dataIndex: "combination",
      key: "combination",
      width: 200,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 200,
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleSave({ ...record, sku: e.target.value })}
          size="small"
        />
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 120,
      render: (value: number, record) => (
        <InputNumber
          value={value}
          onChange={(val) => handleSave({ ...record, stock: val || 0 })}
          min={0}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Price Modifier ($)",
      dataIndex: "priceMod",
      key: "priceMod",
      width: 150,
      render: (value: number, record) => (
        <InputNumber
          value={value}
          onChange={(val) => handleSave({ ...record, priceMod: val || 0 })}
          prefix="$"
          step={0.01}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 120,
      render: (url: string | undefined, record) => (
        <Upload
          listType="picture-card"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={(info) => {
            if (info.file) {
              // In a real scenario, upload to server
              const reader = new FileReader();
              reader.onload = (e) => {
                handleSave({ ...record, imageUrl: e.target?.result as string });
              };
              reader.readAsDataURL(info.file as any);
            }
          }}
        >
          {url ? (
            <img src={url} alt="variant" className="w-full h-full object-cover" />
          ) : (
            <div>
              <UploadOutlined />
              <div className="mt-2">Upload</div>
            </div>
          )}
        </Upload>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete this variant?"
          onConfirm={() => handleDeleteVariant(record.combination)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  // Calculate statistics
  const totalVariants = variants.length;
  const enabledVariants = variants.filter((v) => v.enabled).length;
  const totalStock = variants.reduce((sum, v) => sum + (v.enabled ? v.stock : 0), 0);

  return (
    <div className="space-y-4">
      {/* Attributes Section */}
      <Card title="Product Attributes" size="small">
        <Space direction="vertical" className="w-full">
          {attributes.length > 0 ? (
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <strong className="text-sm uppercase">{attr.type}:</strong>
                    <div className="mt-1">
                      {attr.values.map((value) => (
                        <Tag key={value} color="blue" className="mb-1">
                          {value}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <Popconfirm
                    title="Remove this attribute? This will clear all variants."
                    onConfirm={() => handleRemoveAttribute(index)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </div>
              ))}
            </div>
          ) : (
            <Alert
              message="No attributes added yet"
              description="Add attributes like Size, Color, Material to create product variants"
              type="info"
              showIcon
            />
          )}

          <Space className="mt-4">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAttributeModalVisible(true)}
            >
              Add Attribute
            </Button>
            {attributes.length > 0 && (
              <Button type="primary" onClick={generateVariants}>
                Generate Variants
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* Variants Table */}
      {variants.length > 0 && (
        <>
          {/* Summary Statistics */}
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Variants"
                  value={totalVariants}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Enabled Variants"
                  value={enabledVariants}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Stock (Enabled)"
                  value={totalStock}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Bulk Actions */}
          <Card size="small">
            <Space>
              <span className="text-sm text-gray-600">
                {selectedRowKeys.length > 0
                  ? `${selectedRowKeys.length} selected`
                  : "Select rows for bulk actions"}
              </span>
              <Button
                size="small"
                disabled={selectedRowKeys.length === 0}
                onClick={() => setBulkEditModalVisible(true)}
              >
                Bulk Edit
              </Button>
            </Space>
          </Card>

          {/* Variants Table */}
          <Table
            columns={columns}
            dataSource={variants}
            rowKey="combination"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1200 }}
            size="small"
          />
        </>
      )}

      {/* Add Attribute Modal */}
      <Modal
        title="Add Product Attribute"
        open={attributeModalVisible}
        onOk={handleAddAttribute}
        onCancel={() => {
          setAttributeModalVisible(false);
          setNewAttributeType("");
          setNewAttributeValues([]);
        }}
        okText="Add Attribute"
      >
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <label className="block text-sm font-medium mb-2">Attribute Type</label>
            <Select
              className="w-full"
              placeholder="Select attribute type"
              value={newAttributeType}
              onChange={setNewAttributeType}
              options={AttributeTypeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Values</label>
            <Space className="w-full flex-wrap mb-2">
              {newAttributeValues.map((value) => (
                <Tag
                  key={value}
                  closable
                  onClose={() => handleRemoveValue(value)}
                  color="blue"
                >
                  {value}
                </Tag>
              ))}
            </Space>
            <Input
              placeholder="Type a value and press Enter"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleInputConfirm}
              onBlur={handleInputConfirm}
            />
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to add each value
            </div>
          </div>
        </Space>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        title="Bulk Edit Variants"
        open={bulkEditModalVisible}
        onOk={handleBulkEdit}
        onCancel={() => {
          setBulkEditModalVisible(false);
          setBulkStock(null);
          setBulkPriceMod(null);
        }}
        okText="Apply Changes"
      >
        <Space direction="vertical" className="w-full" size="large">
          <Alert
            message={`Editing ${selectedRowKeys.length} selected variant(s)`}
            type="info"
            showIcon
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Stock Quantity (leave empty to keep current)
            </label>
            <InputNumber
              className="w-full"
              value={bulkStock}
              onChange={setBulkStock}
              min={0}
              placeholder="Enter stock quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Price Modifier $ (leave empty to keep current)
            </label>
            <InputNumber
              className="w-full"
              value={bulkPriceMod}
              onChange={setBulkPriceMod}
              prefix="$"
              step={0.01}
              placeholder="Enter price modifier"
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

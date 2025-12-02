"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Space,
  Modal,
  Select,
  message,
  Card,
  Tabs,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";

interface SizeMeasurement {
  size: string;
  chest?: number;
  waist?: number;
  hips?: number;
  length?: number;
  inseam?: number;
  shoulder?: number;
}

interface FitRecommendation {
  size: string;
  bodyType: string;
  recommendation: string;
}

interface SizeGuideData {
  categoryId: string;
  categoryName?: string;
  measurements: SizeMeasurement[];
  fitRecommendations: FitRecommendation[];
  instructions?: string;
  unit: "cm" | "in";
}

interface SizeGuideEditorProps {
  categoryId: string;
  categoryName?: string;
  initialData?: SizeGuideData;
  onSave?: (data: SizeGuideData) => Promise<void>;
}

export const SizeGuideEditor: React.FC<SizeGuideEditorProps> = ({
  categoryId,
  categoryName,
  initialData,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [measurements, setMeasurements] = useState<SizeMeasurement[]>(
    initialData?.measurements || []
  );
  const [fitRecommendations, setFitRecommendations] = useState<FitRecommendation[]>(
    initialData?.fitRecommendations || []
  );
  const [unit, setUnit] = useState<"cm" | "in">(initialData?.unit || "cm");
  const [editingMeasurement, setEditingMeasurement] = useState<SizeMeasurement | null>(
    null
  );
  const [editingFit, setEditingFit] = useState<FitRecommendation | null>(null);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [fitModalVisible, setFitModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const bodyTypeOptions = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];

  const measurementColumns = [
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: `Chest (${unit})`,
      dataIndex: "chest",
      key: "chest",
      render: (value: number) => value || "-",
    },
    {
      title: `Waist (${unit})`,
      dataIndex: "waist",
      key: "waist",
      render: (value: number) => value || "-",
    },
    {
      title: `Hips (${unit})`,
      dataIndex: "hips",
      key: "hips",
      render: (value: number) => value || "-",
    },
    {
      title: `Length (${unit})`,
      dataIndex: "length",
      key: "length",
      render: (value: number) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: SizeMeasurement) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMeasurement(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMeasurement(record.size)}
          />
        </Space>
      ),
    },
  ];

  const fitColumns = [
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: "Body Type",
      dataIndex: "bodyType",
      key: "bodyType",
      width: 120,
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: FitRecommendation) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditFit(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFit(record)}
          />
        </Space>
      ),
    },
  ];

  const handleAddMeasurement = () => {
    setEditingMeasurement(null);
    form.resetFields();
    setMeasurementModalVisible(true);
  };

  const handleEditMeasurement = (measurement: SizeMeasurement) => {
    setEditingMeasurement(measurement);
    form.setFieldsValue(measurement);
    setMeasurementModalVisible(true);
  };

  const handleSaveMeasurement = () => {
    form.validateFields().then((values) => {
      if (editingMeasurement) {
        // Update existing
        setMeasurements(
          measurements.map((m) =>
            m.size === editingMeasurement.size ? values : m
          )
        );
      } else {
        // Add new
        if (measurements.some((m) => m.size === values.size)) {
          message.error("Size already exists");
          return;
        }
        setMeasurements([...measurements, values]);
      }
      setMeasurementModalVisible(false);
      form.resetFields();
      message.success("Measurement saved");
    });
  };

  const handleDeleteMeasurement = (size: string) => {
    Modal.confirm({
      title: "Delete Measurement",
      content: `Are you sure you want to delete size ${size}?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setMeasurements(measurements.filter((m) => m.size !== size));
        message.success("Measurement deleted");
      },
    });
  };

  const handleAddFit = () => {
    setEditingFit(null);
    form.resetFields();
    setFitModalVisible(true);
  };

  const handleEditFit = (fit: FitRecommendation) => {
    setEditingFit(fit);
    form.setFieldsValue(fit);
    setFitModalVisible(true);
  };

  const handleSaveFit = () => {
    form.validateFields().then((values) => {
      if (editingFit) {
        // Update existing
        setFitRecommendations(
          fitRecommendations.map((f) =>
            f.size === editingFit.size && f.bodyType === editingFit.bodyType
              ? values
              : f
          )
        );
      } else {
        // Add new
        if (
          fitRecommendations.some(
            (f) => f.size === values.size && f.bodyType === values.bodyType
          )
        ) {
          message.error("Fit recommendation already exists for this size and body type");
          return;
        }
        setFitRecommendations([...fitRecommendations, values]);
      }
      setFitModalVisible(false);
      form.resetFields();
      message.success("Fit recommendation saved");
    });
  };

  const handleDeleteFit = (fit: FitRecommendation) => {
    Modal.confirm({
      title: "Delete Fit Recommendation",
      content: `Are you sure you want to delete this recommendation?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setFitRecommendations(
          fitRecommendations.filter(
            (f) => !(f.size === fit.size && f.bodyType === fit.bodyType)
          )
        );
        message.success("Fit recommendation deleted");
      },
    });
  };

  const handleSaveGuide = async () => {
    if (measurements.length === 0) {
      message.error("Please add at least one size measurement");
      return;
    }

    try {
      setSaving(true);

      const guideData: SizeGuideData = {
        categoryId,
        categoryName,
        measurements,
        fitRecommendations,
        instructions: form.getFieldValue("instructions"),
        unit,
      };

      if (onSave) {
        await onSave(guideData);
      } else {
        // Default save to API
        const response = await fetch(`/api/size-guides/${categoryId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(guideData),
        });

        if (!response.ok) {
          throw new Error("Failed to save size guide");
        }
      }

      message.success("Size guide saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      message.error("Failed to save size guide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Size Guide Editor</h2>
            {categoryName && (
              <p className="text-gray-500">Category: {categoryName}</p>
            )}
          </div>
          <Space>
            <Select
              value={unit}
              onChange={setUnit}
              style={{ width: 100 }}
              options={[
                { label: "Centimeters", value: "cm" },
                { label: "Inches", value: "in" },
              ]}
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveGuide}
              loading={saving}
            >
              Save Guide
            </Button>
          </Space>
        </div>

        <Tabs
          items={[
            {
              key: "measurements",
              label: "Measurements",
              children: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      Define size measurements for this category
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddMeasurement}
                    >
                      Add Size
                    </Button>
                  </div>
                  <Table
                    dataSource={measurements}
                    columns={measurementColumns}
                    rowKey="size"
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: "fit",
              label: "Fit Recommendations",
              children: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      Provide fit recommendations based on body type
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddFit}
                    >
                      Add Recommendation
                    </Button>
                  </div>
                  <Table
                    dataSource={fitRecommendations}
                    columns={fitColumns}
                    rowKey={(record) => `${record.size}-${record.bodyType}`}
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: "instructions",
              label: "Instructions",
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="instructions"
                    label="Measurement Instructions"
                    initialValue={initialData?.instructions}
                  >
                    <Input.TextArea
                      rows={8}
                      placeholder="Provide instructions on how to measure for this category..."
                    />
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>

      {/* Measurement Modal */}
      <Modal
        open={measurementModalVisible}
        title={editingMeasurement ? "Edit Measurement" : "Add Measurement"}
        onOk={handleSaveMeasurement}
        onCancel={() => {
          setMeasurementModalVisible(false);
          form.resetFields();
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="size"
            label="Size"
            rules={[{ required: true, message: "Please select a size" }]}
          >
            <Select
              options={sizeOptions.map((s) => ({ label: s, value: s }))}
              disabled={!!editingMeasurement}
            />
          </Form.Item>
          <Form.Item name="chest" label={`Chest (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="waist" label={`Waist (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="hips" label={`Hips (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="length" label={`Length (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="inseam" label={`Inseam (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="shoulder" label={`Shoulder (${unit})`}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Fit Recommendation Modal */}
      <Modal
        open={fitModalVisible}
        title={editingFit ? "Edit Fit Recommendation" : "Add Fit Recommendation"}
        onOk={handleSaveFit}
        onCancel={() => {
          setFitModalVisible(false);
          form.resetFields();
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="size"
            label="Size"
            rules={[{ required: true, message: "Please select a size" }]}
          >
            <Select
              options={sizeOptions.map((s) => ({ label: s, value: s }))}
              disabled={!!editingFit}
            />
          </Form.Item>
          <Form.Item
            name="bodyType"
            label="Body Type"
            rules={[{ required: true, message: "Please select a body type" }]}
          >
            <Select
              options={bodyTypeOptions.map((b) => ({ label: b, value: b }))}
              disabled={!!editingFit}
            />
          </Form.Item>
          <Form.Item
            name="recommendation"
            label="Recommendation"
            rules={[{ required: true, message: "Please enter a recommendation" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="e.g., This size fits true to size for athletic body types"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

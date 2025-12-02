"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Space, message, Modal, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface SizeGuide {
  id: string;
  categoryId: string;
  categoryName: string;
  measurementCount: number;
  fitRecommendationCount: number;
  updatedAt: string;
}

export default function SizeGuidesPage() {
  const router = useRouter();
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchSizeGuides();
    fetchCategories();
  }, []);

  const fetchSizeGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/size-guides");
      if (response.ok) {
        const data = await response.json();
        setSizeGuides(data);
      }
    } catch (error) {
      console.error("Failed to fetch size guides:", error);
      message.error("Failed to load size guides");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleCreate = () => {
    if (!selectedCategory) {
      message.error("Please select a category");
      return;
    }
    router.push(`/admin/size-guides/create?categoryId=${selectedCategory}`);
  };

  const handleEdit = (categoryId: string) => {
    router.push(`/admin/size-guides/edit/${categoryId}`);
  };

  const handleDelete = (guide: SizeGuide) => {
    Modal.confirm({
      title: "Delete Size Guide",
      content: `Are you sure you want to delete the size guide for ${guide.categoryName}?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/size-guides/${guide.categoryId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Size guide deleted");
            fetchSizeGuides();
          } else {
            throw new Error("Delete failed");
          }
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete size guide");
        }
      },
    });
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Measurements",
      dataIndex: "measurementCount",
      key: "measurementCount",
      render: (count: number) => `${count} sizes`,
    },
    {
      title: "Fit Recommendations",
      dataIndex: "fitRecommendationCount",
      key: "fitRecommendationCount",
      render: (count: number) => `${count} recommendations`,
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: SizeGuide) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/size-guides/view/${record.categoryId}`)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.categoryId)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const availableCategories = categories.filter(
    (cat) => !sizeGuides.some((guide) => guide.categoryId === cat.id)
  );

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1>Size Guides</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Create Size Guide
        </Button>
      </div>

      <Table
        dataSource={sizeGuides}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        open={createModalVisible}
        title="Create Size Guide"
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedCategory("");
        }}
        okText="Create"
      >
        <div className="space-y-4">
          <p>Select a category to create a size guide for:</p>
          <Select
            style={{ width: "100%" }}
            placeholder="Select category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={availableCategories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
          {availableCategories.length === 0 && (
            <p className="text-sm text-gray-500">
              All categories already have size guides
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

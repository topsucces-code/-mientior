"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Spin } from "antd";
import { SizeGuideEditor } from "@/components/admin/size-guide-editor";

export default function EditSizeGuidePage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const [loading, setLoading] = useState(true);
  const [guideData, setGuideData] = useState<any>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    fetchSizeGuide();
  }, [categoryId]);

  const fetchSizeGuide = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/size-guides/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setGuideData(data);
        setCategoryName(data.categoryName);
      } else {
        message.error("Failed to load size guide");
      }
    } catch (error) {
      console.error("Failed to fetch size guide:", error);
      message.error("Failed to load size guide");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response = await fetch(`/api/size-guides/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      message.success("Size guide updated successfully");
      router.push("/admin/size-guides");
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <SizeGuideEditor
        categoryId={categoryId}
        categoryName={categoryName}
        initialData={guideData}
        onSave={handleSave}
      />
    </div>
  );
}

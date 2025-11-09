"use client";

import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Tag, Card, Table, Form, InputNumber, Button } from "antd";
import { useState } from "react";

const { Title } = Typography;

export default function UserShow({ params }: { params: { id: string } }) {
  const { queryResult } = useShow({
    resource: "users",
    id: params.id,
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const addressColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => type || "Default",
    },
    {
      title: "Address",
      key: "address",
      render: (_: any, addr: any) => (
        <>
          {addr.line1}
          {addr.line2 ? `, ${addr.line2}` : ""}
          <br />
          {addr.city}, {addr.postalCode}
          <br />
          {addr.country}
        </>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_: any, addr: any) => (
        <>
          {addr.firstName} {addr.lastName}
          <br />
          {addr.phone}
          {addr.email && (
            <>
              <br />
              {addr.email}
            </>
          )}
        </>
      ),
    },
  ];

  const getLoyaltyColor = (level: string) => {
    const colors: Record<string, string> = {
      BRONZE: "orange",
      SILVER: "default",
      GOLD: "gold",
      PLATINUM: "purple",
    };
    return colors[level] || "default";
  };

  return (
    <Show isLoading={isLoading}>
      <Descriptions title="User Details" bordered column={2}>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label="Email">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="First Name">
          {record?.firstName || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Last Name">
          {record?.lastName || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Loyalty Level">
          <Tag color={getLoyaltyColor(record?.loyaltyLevel)}>
            {record?.loyaltyLevel}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Loyalty Points">
          {record?.loyaltyPoints || 0} points
        </Descriptions.Item>
        <Descriptions.Item label="Total Orders">
          {record?.totalOrders || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Total Spent">
          ${(record?.totalSpent || 0).toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : "—"}
        </Descriptions.Item>
      </Descriptions>

      {record?.addresses && record.addresses.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Addresses</Title>
          <Table
            dataSource={Array.isArray(record.addresses) ? record.addresses : []}
            columns={addressColumns}
            rowKey={(addr, index) => `addr-${index}`}
            pagination={false}
          />
        </div>
      )}

      {record?.recentlyViewed && record.recentlyViewed.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Recently Viewed Products</Title>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {record.recentlyViewed.slice(0, 10).map((productId: string) => (
              <Tag key={productId}>{productId}</Tag>
            ))}
          </div>
        </div>
      )}

      {record?.searchHistory && record.searchHistory.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Recent Searches</Title>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {record.searchHistory.slice(0, 10).map((search: string, index: number) => (
              <Tag key={`search-${index}`}>{search}</Tag>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Update Loyalty Points</Title>
        <Form
          layout="inline"
          onFinish={(values) => {
            // This would need to call an API endpoint to update loyalty points
            console.log("Update loyalty points:", values);
          }}
        >
          <Form.Item name="points" label="Points to Add/Subtract">
            <InputNumber placeholder="Enter points (negative to subtract)" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Points
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Show>
  );
}

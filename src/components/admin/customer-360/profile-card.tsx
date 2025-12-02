"use client";

import React from "react";
import { Card, Avatar, Space, Tag, Typography, Row, Col, Divider } from "antd";
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CheckCircleOutlined,
  HomeOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useIsMobile } from "@/hooks/use-media-query";

const { Text, Title } = Typography;

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  registrationDate: string;
  accountStatus: string;
  addresses: Address[];
}

interface ProfileCardProps {
  profile: ProfileData;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = useTranslation(["common", "admin"]);
  const isMobile = useIsMobile();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "green",
      inactive: "orange",
      suspended: "red",
      pending: "blue"
    };
    return colors[status.toLowerCase()] || "default";
  };

  const primaryAddress = profile.addresses.find(addr => addr.isDefault) || profile.addresses[0];

  return (
    <Card 
      title={
        <Space>
          <UserOutlined />
          {t("admin:customers.360.profile.title")}
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Avatar and Basic Info */}
        <Row align="middle" gutter={isMobile ? 12 : 16}>
          <Col>
            <Avatar
              src={profile.avatar}
              icon={<UserOutlined />}
              size={isMobile ? 48 : 64}
            />
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                {profile.name}
              </Title>
              <Tag color={getStatusColor(profile.accountStatus)} size={isMobile ? "small" : "default"}>
                {profile.accountStatus.toUpperCase()}
              </Tag>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }} />

        {/* Contact Information */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Space wrap>
            <MailOutlined style={{ color: "#1890ff" }} />
            <Text style={{ fontSize: isMobile ? "12px" : "14px", wordBreak: "break-all" }}>
              {profile.email}
            </Text>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          </Space>
          
          {profile.phone && (
            <Space>
              <PhoneOutlined style={{ color: "#1890ff" }} />
              <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>{profile.phone}</Text>
            </Space>
          )}

          <Space wrap>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Text type="secondary" style={{ fontSize: isMobile ? "11px" : "14px" }}>
              {t("admin:customers.360.profile.memberSince")}: {dayjs(profile.registrationDate).format(isMobile ? "MMM D, YY" : "MMM D, YYYY")}
            </Text>
          </Space>
        </Space>

        {/* Primary Address */}
        {primaryAddress && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Space>
                <HomeOutlined style={{ color: "#1890ff" }} />
                <Text strong>{t("admin:customers.360.profile.primaryAddress")}</Text>
                {primaryAddress.isDefault && (
                  <Tag size="small" color="blue">{t("common.default")}</Tag>
                )}
              </Space>
              <Text style={{ 
                fontSize: isMobile ? "10px" : "12px", 
                color: "#666", 
                paddingLeft: isMobile ? "16px" : "20px",
                lineHeight: isMobile ? "1.3" : "1.5"
              }}>
                {primaryAddress.addressLine1}
                {primaryAddress.addressLine2 && <><br />{primaryAddress.addressLine2}</>}
                <br />
                {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
                <br />
                {primaryAddress.country}
              </Text>
            </Space>
          </>
        )}

        {/* Additional Addresses Count */}
        {profile.addresses.length > 1 && (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            +{profile.addresses.length - 1} {t("admin:customers.360.profile.moreAddresses")}
          </Text>
        )}
      </Space>
    </Card>
  );
}
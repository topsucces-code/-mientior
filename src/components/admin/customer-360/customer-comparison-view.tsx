"use client";

import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Space,
  Button,
  Typography,
  Divider,
  Alert,
  Badge,
  Progress,
  Tooltip,
  Empty,
} from "antd";
import {
  UserOutlined,
  CloseOutlined,
  TrophyOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import type { CustomerComparison } from "@/types/customer-360";

const { Title, Text } = Typography;

// French labels for better UX and consistency
const LABELS = {
  // Headers
  comparison_title: "Comparaison de {count} clients",
  exit_comparison: "Quitter la comparaison",
  
  // Segments
  common_segments: "Segments communs",
  common_segments_desc: "Ces clients appartiennent aux mêmes groupes :",
  no_shared_segments: "Aucun segment partagé",
  no_shared_segments_desc: "Ces clients n'appartiennent à aucun groupe commun.",
  
  // Metrics
  metrics_comparison: "Comparaison des métriques",
  lifetime_value: "Valeur client (LTV)",
  total_orders: "Total des commandes",
  average_order_value: "Panier moyen",
  total_spent: "Montant total dépensé",
  days_since_last_purchase: "Jours depuis le dernier achat",
  customer_tenure: "Ancienneté client",
  differences_analysis: "Analyse des différences",
  
  // Status
  registration: "Inscription :",
  phone: "Téléphone :",
  status: "Statut :",
  active: "Actif",
  inactive: "Inactif",
  
  // Variance
  variance: "Écart",
  identical: "identique",
  similar: "similaire", 
  different: "différent",
  days: "jours",
  
  // Tooltips
  ltv_tooltip: "Valeur totale générée par le client sur toute sa relation avec votre entreprise",
  variance_tooltip: "Plus l'écart est faible, plus les clients ont des comportements similaires",
  metrics_tooltip: "Comparez les performances et comportements d'achat de vos clients pour identifier des opportunités de croissance",
  total_orders_tooltip: "Nombre total de commandes passées par le client",
  avg_order_tooltip: "Montant moyen dépensé par commande",
  total_spent_tooltip: "Montant total dépensé par le client depuis son inscription",
  last_purchase_tooltip: "Nombre de jours écoulés depuis la dernière commande",
  tenure_tooltip: "Nombre de jours depuis l'inscription du client",
  
  // Empty state
  no_customers_selected: "Aucun client sélectionné pour la comparaison",
  return_to_list: "Retourner à la liste des clients",
  
  // Accessibility
  close_comparison_aria: "Fermer la comparaison de clients",
  identical_aria: "Identique",
  similar_aria: "Similaire", 
  different_aria: "Différent",
};

interface CustomerComparisonViewProps {
  comparison: CustomerComparison;
  onExit: () => void;
}

export default function CustomerComparisonView({
  comparison,
  onExit,
}: CustomerComparisonViewProps) {
  const { customers, metrics, segmentOverlap, differences } = comparison;

  // Handle empty state
  if (!customers || customers.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={LABELS.no_customers_selected}
        >
          <Button type="primary" onClick={onExit}>
            {LABELS.return_to_list}
          </Button>
        </Empty>
      </div>
    );
  }

  const getLoyaltyColor = (level: string) => {
    const colors: Record<string, string> = {
      BRONZE: "#CD7F32",
      SILVER: "#C0C0C0",
      GOLD: "#FFD700",
      PLATINUM: "#E5E4E2",
    };
    return colors[level] || "default";
  };

  const getLoyaltyIcon = (level: string) => {
    return (
      <Tooltip title={`Niveau de fidélité : ${level}`}>
        <TrophyOutlined style={{ color: getLoyaltyColor(level) }} />
      </Tooltip>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getVarianceIndicator = (variance: number) => {
    if (variance === 0) {
      return <MinusOutlined style={{ color: "#999" }} aria-label={LABELS.identical_aria} />;
    }
    if (variance < 50) {
      return <ArrowUpOutlined style={{ color: "#52c41a" }} aria-label={LABELS.similar_aria} />;
    }
    return <ArrowDownOutlined style={{ color: "#ff4d4f" }} aria-label={LABELS.different_aria} />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return "#999";
    if (variance < 50) return "#52c41a";
    return "#ff4d4f";
  };

  const getVarianceText = (variance: number) => {
    if (variance === 0) return LABELS.identical;
    if (variance < 50) return LABELS.similar;
    return LABELS.different;
  };

  const getCustomerLabel = (index: number, customer?: { name: string }) => {
    if (!customer?.name) {
      return `Client ${String.fromCharCode(65 + index)}`;
    }
    const initials = customer.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
    return `Client ${String.fromCharCode(65 + index)} (${initials})`;
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            {LABELS.comparison_title.replace('{count}', customers.length.toString())}
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<CloseOutlined />}
            onClick={onExit}
            size="large"
            aria-label={LABELS.close_comparison_aria}
          >
            {LABELS.exit_comparison}
          </Button>
        </Col>
      </Row>

      {/* Segment Overlap Alert */}
      {segmentOverlap.length > 0 ? (
        <Alert
          message={LABELS.common_segments}
          description={
            <Space wrap>
              <Text>{LABELS.common_segments_desc}</Text>
              {segmentOverlap.map((segment) => (
                <Tag key={segment} color="blue">
                  {segment}
                </Tag>
              ))}
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      ) : (
        <Alert
          message={LABELS.no_shared_segments}
          description={LABELS.no_shared_segments_desc}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Customer Profile Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {customers.map((customer, _index) => (
          <Col key={customer.id} xs={24} md={24 / customers.length}>
            <Card
              title={
                <Space>
                  <Avatar
                    size="large"
                    icon={<UserOutlined />}
                    src={customer.avatar}
                  />
                  <div>
                    <div>
                      <Link href={`/admin/customers/360/${customer.id}`}>
                        <strong>{customer.name}</strong>
                      </Link>
                    </div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <MailOutlined /> {customer.email}
                    </Text>
                  </div>
                </Space>
              }
              extra={
                <Tag
                  color={getLoyaltyColor(customer.loyaltyLevel)}
                  icon={getLoyaltyIcon(customer.loyaltyLevel)}
                >
                  {customer.loyaltyLevel}
                </Tag>
              }
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>{LABELS.registration}</Text>
                  <br />
                  <Text>
                    <CalendarOutlined />{" "}
                    {dayjs(customer.registrationDate).format("DD MMM YYYY")}
                  </Text>
                </div>
                {customer.phone && (
                  <div>
                    <Text strong>{LABELS.phone}</Text>
                    <br />
                    <Text>
                      <PhoneOutlined /> {customer.phone}
                    </Text>
                  </div>
                )}
                <div>
                  <Text strong>{LABELS.status}</Text>
                  <br />
                  <Badge
                    status={customer.accountStatus === "active" ? "success" : "default"}
                    text={customer.accountStatus === "active" ? LABELS.active : LABELS.inactive}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Metrics Comparison */}
      <Card 
        title={
          <Space>
            <span>{LABELS.metrics_comparison}</span>
            <Tooltip title={LABELS.metrics_tooltip}>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          {/* Lifetime Value */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.ltv_tooltip}>
                  <span>{LABELS.lifetime_value}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.lifetimeValue}
                      formatter={(value) => formatCurrency(Number(value))}
                      prefix={<DollarOutlined />}
                      aria-label={`Valeur client pour ${customers[index]?.name}: ${formatCurrency(metric.lifetimeValue)}`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "lifetimeValue") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "lifetimeValue")?.variance}% 
                      ({getVarianceText(differences.find((d) => d.metric === "lifetimeValue")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "lifetimeValue")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>

          {/* Total Orders */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.total_orders_tooltip}>
                  <span>{LABELS.total_orders}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.totalOrders}
                      prefix={<ShoppingOutlined />}
                      aria-label={`Total des commandes pour ${customers[index]?.name}: ${metric.totalOrders}`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "totalOrders") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "totalOrders")?.variance}%
                      ({getVarianceText(differences.find((d) => d.metric === "totalOrders")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "totalOrders")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>

          {/* Average Order Value */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.avg_order_tooltip}>
                  <span>{LABELS.average_order_value}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.averageOrderValue}
                      formatter={(value) => formatCurrency(Number(value))}
                      prefix={<DollarOutlined />}
                      aria-label={`Panier moyen pour ${customers[index]?.name}: ${formatCurrency(metric.averageOrderValue)}`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "averageOrderValue") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "averageOrderValue")?.variance}%
                      ({getVarianceText(differences.find((d) => d.metric === "averageOrderValue")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "averageOrderValue")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          {/* Total Spent */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.total_spent_tooltip}>
                  <span>{LABELS.total_spent}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.totalSpent}
                      formatter={(value) => formatCurrency(Number(value))}
                      prefix={<DollarOutlined />}
                      aria-label={`Montant total dépensé par ${customers[index]?.name}: ${formatCurrency(metric.totalSpent)}`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "totalSpent") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "totalSpent")?.variance}%
                      ({getVarianceText(differences.find((d) => d.metric === "totalSpent")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "totalSpent")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>

          {/* Days Since Last Purchase */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.last_purchase_tooltip}>
                  <span>{LABELS.days_since_last_purchase}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.daysSinceLastPurchase}
                      suffix={LABELS.days}
                      prefix={<CalendarOutlined />}
                      aria-label={`Jours depuis le dernier achat pour ${customers[index]?.name}: ${metric.daysSinceLastPurchase} jours`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "daysSinceLastPurchase") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "daysSinceLastPurchase")?.variance}%
                      ({getVarianceText(differences.find((d) => d.metric === "daysSinceLastPurchase")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "daysSinceLastPurchase")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>

          {/* Customer Tenure */}
          <Col xs={24} lg={8}>
            <Card 
              size="small" 
              title={
                <Tooltip title={LABELS.tenure_tooltip}>
                  <span>{LABELS.customer_tenure}</span>
                </Tooltip>
              }
            >
              <Row gutter={8}>
                {metrics.map((metric, index) => (
                  <Col key={index} span={24 / metrics.length}>
                    <Statistic
                      title={getCustomerLabel(index, customers[index])}
                      value={metric.customerTenure}
                      suffix={LABELS.days}
                      prefix={<CalendarOutlined />}
                      aria-label={`Ancienneté client pour ${customers[index]?.name}: ${metric.customerTenure} jours`}
                    />
                  </Col>
                ))}
              </Row>
              {differences.find((d) => d.metric === "customerTenure") && (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  <Tooltip title={LABELS.variance_tooltip}>
                    <Text type="secondary">
                      {LABELS.variance} : {differences.find((d) => d.metric === "customerTenure")?.variance}%
                      ({getVarianceText(differences.find((d) => d.metric === "customerTenure")?.variance || 0)})
                      {getVarianceIndicator(
                        differences.find((d) => d.metric === "customerTenure")?.variance || 0
                      )}
                    </Text>
                  </Tooltip>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Detailed Differences */}
      <Card title={LABELS.differences_analysis}>
        <Row gutter={16}>
          {differences.map((diff, _diffIndex) => {
            // Convert camelCase metric names to French
            const getMetricTitle = (metric: string) => {
              const metricTitles: Record<string, string> = {
                lifetimeValue: LABELS.lifetime_value,
                totalOrders: LABELS.total_orders,
                averageOrderValue: LABELS.average_order_value,
                totalSpent: LABELS.total_spent,
                daysSinceLastPurchase: LABELS.days_since_last_purchase,
                customerTenure: LABELS.customer_tenure,
              };
              return metricTitles[metric] || metric.replace(/([A-Z])/g, " $1").trim();
            };

            return (
              <Col key={diff.metric} xs={24} md={12} lg={8} style={{ marginBottom: 16 }}>
                <Card size="small" title={getMetricTitle(diff.metric)}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {diff.values.map((value, valueIndex) => (
                      <div key={valueIndex}>
                        <Text>{getCustomerLabel(valueIndex, customers[valueIndex])}: </Text>
                        <Text strong>
                          {diff.metric.includes("Value") || diff.metric.includes("Spent")
                            ? formatCurrency(value)
                            : diff.metric.includes("Days") || diff.metric.includes("Tenure")
                            ? `${value.toLocaleString()} ${LABELS.days}`
                            : value.toLocaleString()}
                        </Text>
                      </div>
                    ))}
                    <Divider style={{ margin: "8px 0" }} />
                    <div style={{ textAlign: "center" }}>
                      <Tooltip title={LABELS.variance_tooltip}>
                        <Text
                          type="secondary"
                          style={{ color: getVarianceColor(diff.variance) }}
                        >
                          {LABELS.variance}: {diff.variance}%
                          {getVarianceIndicator(diff.variance)}
                        </Text>
                      </Tooltip>
                      <br />
                      <Progress
                        percent={Math.min(diff.variance, 100)}
                        strokeColor={getVarianceColor(diff.variance)}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}
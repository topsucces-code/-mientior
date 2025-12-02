"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  Space,
  Tag,
  Avatar,
  Badge,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Typography,
  Divider,
  Tooltip,
  Checkbox,
  message,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  ShoppingOutlined,
  DashboardOutlined,
  ReloadOutlined,
  SwapOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import { useDebounce } from "@/hooks/use-debounce";
import CustomerComparisonView from "@/components/admin/customer-360/customer-comparison-view";
import type { CustomerComparison } from "@/types/customer-360";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface CustomerSearchResult {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastPurchaseDate: string | null;
  segments: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
}

interface SearchFilters {
  q: string;
  segment: string | undefined;
  tier: string | undefined;
  tag: string | undefined;
  registrationFrom: string | undefined;
  registrationTo: string | undefined;
  lastPurchaseFrom: string | undefined;
  lastPurchaseTo: string | undefined;
  clvMin: number | undefined;
  clvMax: number | undefined;
  orderCountMin: number | undefined;
  orderCountMax: number | undefined;
}

interface SearchResponse {
  customers: CustomerSearchResult[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta: {
    searchQuery: string;
    filtersApplied: Record<string, boolean>;
    performance: {
      executionTime: number;
      cacheHit: boolean;
      queryComplexity: string;
    };
  };
}

interface Segment {
  id: string;
  name: string;
  customerCount: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  customerCount: number;
}

export default function CustomerSearchPage() {
  const { t } = useTranslation(["common", "admin"]);
  
  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    segment: undefined,
    tier: undefined,
    tag: undefined,
    registrationFrom: undefined,
    registrationTo: undefined,
    lastPurchaseFrom: undefined,
    lastPurchaseTo: undefined,
    clvMin: undefined,
    clvMax: undefined,
    orderCountMin: undefined,
    orderCountMax: undefined,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Data state
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CustomerComparison | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  
  // Debounce search query
  const debouncedQuery = useDebounce(filters.q, 300);
  
  // Load segments and tags on mount
  useEffect(() => {
    loadSegments();
    loadTags();
  }, []);
  
  // Perform search when filters change
  useEffect(() => {
    if (debouncedQuery !== filters.q) return; // Wait for debounce
    performSearch();
  }, [debouncedQuery, filters.segment, filters.tier, filters.tag, 
      filters.registrationFrom, filters.registrationTo,
      filters.lastPurchaseFrom, filters.lastPurchaseTo,
      filters.clvMin, filters.clvMax, filters.orderCountMin, filters.orderCountMax,
      currentPage, pageSize, sortBy, sortOrder]);
  
  const loadSegments = async () => {
    try {
      const response = await fetch("/api/admin/segments");
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      console.error("Failed to load segments:", error);
    }
  };
  
  const loadTags = async () => {
    try {
      const response = await fetch("/api/admin/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };
  
  const performSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      if (filters.q) params.append("q", filters.q);
      if (filters.segment) params.append("segment", filters.segment);
      if (filters.tier) params.append("tier", filters.tier);
      if (filters.tag) params.append("tag", filters.tag);
      if (filters.registrationFrom) params.append("registrationFrom", filters.registrationFrom);
      if (filters.registrationTo) params.append("registrationTo", filters.registrationTo);
      if (filters.lastPurchaseFrom) params.append("lastPurchaseFrom", filters.lastPurchaseFrom);
      if (filters.lastPurchaseTo) params.append("lastPurchaseTo", filters.lastPurchaseTo);
      if (filters.clvMin !== undefined) params.append("clvMin", filters.clvMin.toString());
      if (filters.clvMax !== undefined) params.append("clvMax", filters.clvMax.toString());
      if (filters.orderCountMin !== undefined) params.append("orderCountMin", filters.orderCountMin.toString());
      if (filters.orderCountMax !== undefined) params.append("orderCountMax", filters.orderCountMax.toString());
      
      // Add pagination and sorting
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      
      const response = await fetch(`/api/admin/customers/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);
  
  const handleDateRangeChange = useCallback((
    type: "registration" | "lastPurchase",
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (type === "registration") {
      setFilters(prev => ({
        ...prev,
        registrationFrom: dates?.[0]?.toISOString(),
        registrationTo: dates?.[1]?.toISOString(),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        lastPurchaseFrom: dates?.[0]?.toISOString(),
        lastPurchaseTo: dates?.[1]?.toISOString(),
      }));
    }
    setCurrentPage(1);
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({
      q: "",
      segment: undefined,
      tier: undefined,
      tag: undefined,
      registrationFrom: undefined,
      registrationTo: undefined,
      lastPurchaseFrom: undefined,
      lastPurchaseTo: undefined,
      clvMin: undefined,
      clvMax: undefined,
      orderCountMin: undefined,
      orderCountMax: undefined,
    });
    setCurrentPage(1);
  }, []);
  
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
    return <TrophyOutlined style={{ color: getLoyaltyColor(level) }} />;
  };
  
  const columns = [
    ...(comparisonMode ? [{
      title: "Select",
      key: "select",
      width: 60,
      render: (_: unknown, record: CustomerSearchResult) => (
        <Checkbox
          checked={selectedCustomers.includes(record.id)}
          onChange={(e) => handleCustomerSelection(record.id, e.target.checked)}
          disabled={!selectedCustomers.includes(record.id) && selectedCustomers.length >= 3}
        />
      ),
    }] : []),
    {
      title: t("admin:customers.fields.customer"),
      dataIndex: "name",
      key: "customer",
      render: (_: string, record: CustomerSearchResult) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="large" />
          <div>
            <Link href={`/admin/customers/360/${record.id}`}>
              <strong>
                {record.firstName && record.lastName
                  ? `${record.firstName} ${record.lastName}`
                  : record.name || record.email}
              </strong>
            </Link>
            <div style={{ fontSize: "12px", color: "#999" }}>
              <MailOutlined /> {record.email}
              <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 4 }} />
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t("admin:customers.fields.loyaltyLevel"),
      dataIndex: "loyaltyLevel",
      key: "loyaltyLevel",
      render: (level: string) => (
        <Tag color={getLoyaltyColor(level)} icon={getLoyaltyIcon(level)}>
          {level}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.loyaltyPoints"),
      dataIndex: "loyaltyPoints",
      key: "loyaltyPoints",
      render: (points: number) => (
        <Badge count={points} showZero style={{ backgroundColor: "#52c41a" }} />
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.totalOrders"),
      dataIndex: "totalOrders",
      key: "totalOrders",
      render: (count: number) => (
        <Space>
          <ShoppingOutlined />
          {count || 0}
        </Space>
      ),
      sorter: true,
    },
    {
      title: t("admin:customers.fields.totalSpent"),
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (amount: number) => (
        <Space>
          <DollarOutlined />
          €{(amount || 0).toFixed(2)}
        </Space>
      ),
      sorter: true,
    },
    {
      title: "Segments",
      dataIndex: "segments",
      key: "segments",
      render: (segments: Array<{ id: string; name: string }>) => (
        <Space wrap>
          {segments.slice(0, 2).map((segment) => (
            <Tag key={segment.id} color="blue" size="small">
              {segment.name}
            </Tag>
          ))}
          {segments.length > 2 && (
            <Tooltip title={segments.slice(2).map(s => s.name).join(", ")}>
              <Tag size="small">+{segments.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: Array<{ id: string; name: string; color: string }>) => (
        <Space wrap>
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag.id} color={tag.color} size="small">
              {tag.name}
            </Tag>
          ))}
          {tags.length > 2 && (
            <Tooltip title={tags.slice(2).map(t => t.name).join(", ")}>
              <Tag size="small">+{tags.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t("admin:customers.fields.lastOrder"),
      dataIndex: "lastPurchaseDate",
      key: "lastPurchaseDate",
      render: (date: string | null) =>
        date ? dayjs(date).format("MMM D, YYYY") : t("common.never"),
      sorter: true,
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      render: (_: unknown, record: CustomerSearchResult) => (
        <Space>
          <Link href={`/admin/customers/360/${record.id}`}>
            <Button type="link" size="small" icon={<DashboardOutlined />}>
              360 View
            </Button>
          </Link>
        </Space>
      ),
    },
  ];
  
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== "" && value !== null
    ).length;
  }, [filters]);
  
  // Comparison functionality
  const toggleComparisonMode = useCallback(() => {
    setComparisonMode(!comparisonMode);
    setSelectedCustomers([]);
    setComparisonData(null);
  }, [comparisonMode]);
  
  const handleCustomerSelection = useCallback((customerId: string, selected: boolean) => {
    setSelectedCustomers(prev => {
      if (selected) {
        if (prev.length >= 3) {
          message.warning("Maximum 3 customers can be compared");
          return prev;
        }
        return [...prev, customerId];
      } else {
        return prev.filter(id => id !== customerId);
      }
    });
  }, []);
  
  const performComparison = useCallback(async () => {
    if (selectedCustomers.length < 2) {
      message.error("Please select at least 2 customers to compare");
      return;
    }
    
    setLoadingComparison(true);
    try {
      const response = await fetch(
        `/api/admin/customers/compare?customerIds=${selectedCustomers.join(",")}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Comparison failed");
      }
      
      const data = await response.json();
      setComparisonData(data.data);
    } catch (error) {
      console.error("Comparison error:", error);
      message.error(error instanceof Error ? error.message : "Comparison failed");
    } finally {
      setLoadingComparison(false);
    }
  }, [selectedCustomers]);
  
  const exitComparison = useCallback(() => {
    setComparisonData(null);
    setComparisonMode(false);
    setSelectedCustomers([]);
  }, []);
  
  // If showing comparison view, render it instead
  if (comparisonData) {
    return (
      <CustomerComparisonView
        comparison={comparisonData}
        onExit={exitComparison}
      />
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>
            <SearchOutlined /> Customer Search
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              type={comparisonMode ? "primary" : "default"}
              icon={<SwapOutlined />}
              onClick={toggleComparisonMode}
            >
              {comparisonMode ? "Exit Comparison Mode" : "Compare Customers"}
            </Button>
          </Space>
        </Col>
      </Row>
      
      {/* Comparison Mode Alert */}
      {comparisonMode && (
        <Alert
          message="Comparison Mode Active"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                Select 2-3 customers to compare. Selected: {selectedCustomers.length}/3
              </Text>
              <Space>
                <Button
                  type="primary"
                  onClick={performComparison}
                  disabled={selectedCustomers.length < 2}
                  loading={loadingComparison}
                >
                  Compare Selected ({selectedCustomers.length})
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedCustomers([])}
                  disabled={selectedCustomers.length === 0}
                >
                  Clear Selection
                </Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Search Results Summary */}
      {searchResults && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Results"
                value={searchResults.pagination.totalCount}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Search Time"
                value={searchResults.meta.performance.executionTime}
                suffix="ms"
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Cache Hit"
                value={searchResults.meta.performance.cacheHit ? "Yes" : "No"}
                valueStyle={{ 
                  color: searchResults.meta.performance.cacheHit ? "#3f8600" : "#cf1322" 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Query Complexity"
                value={searchResults.meta.performance.queryComplexity}
                valueStyle={{ 
                  color: searchResults.meta.performance.queryComplexity === "simple" ? "#3f8600" : 
                        searchResults.meta.performance.queryComplexity === "moderate" ? "#d46b08" : "#cf1322"
                }}
              />
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Search and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Main Search */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Input
                size="large"
                placeholder="Search by name, email, phone, or order number..."
                prefix={<SearchOutlined />}
                value={filters.q}
                onChange={(e) => handleFilterChange("q", e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={12}>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  type={activeFiltersCount > 0 ? "primary" : "default"}
                >
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Clear All
                </Button>
              </Space>
            </Col>
          </Row>
          
          {/* Advanced Filters */}
          {filtersVisible && (
            <>
              <Divider />
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Text strong>Loyalty Tier</Text>
                  <Select
                    placeholder="Select loyalty tier"
                    value={filters.tier}
                    onChange={(value) => handleFilterChange("tier", value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                  >
                    <Select.Option value="BRONZE">Bronze</Select.Option>
                    <Select.Option value="SILVER">Silver</Select.Option>
                    <Select.Option value="GOLD">Gold</Select.Option>
                    <Select.Option value="PLATINUM">Platinum</Select.Option>
                  </Select>
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>Segment</Text>
                  <Select
                    placeholder="Select segment"
                    value={filters.segment}
                    onChange={(value) => handleFilterChange("segment", value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {segments.map((segment) => (
                      <Select.Option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.customerCount})
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>Tag</Text>
                  <Select
                    placeholder="Select tag"
                    value={filters.tag}
                    onChange={(value) => handleFilterChange("tag", value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {tags.map((tag) => (
                      <Select.Option key={tag.id} value={tag.id}>
                        <Tag color={tag.color} size="small">{tag.name}</Tag>
                        ({tag.customerCount})
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Text strong>Registration Date Range</Text>
                  <RangePicker
                    style={{ width: "100%", marginTop: 4 }}
                    value={[
                      filters.registrationFrom ? dayjs(filters.registrationFrom) : null,
                      filters.registrationTo ? dayjs(filters.registrationTo) : null,
                    ]}
                    onChange={(dates) => handleDateRangeChange("registration", dates)}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Last Purchase Date Range</Text>
                  <RangePicker
                    style={{ width: "100%", marginTop: 4 }}
                    value={[
                      filters.lastPurchaseFrom ? dayjs(filters.lastPurchaseFrom) : null,
                      filters.lastPurchaseTo ? dayjs(filters.lastPurchaseTo) : null,
                    ]}
                    onChange={(dates) => handleDateRangeChange("lastPurchase", dates)}
                  />
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Text strong>Customer Lifetime Value (€)</Text>
                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Min CLV"
                        value={filters.clvMin}
                        onChange={(value) => handleFilterChange("clvMin", value)}
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(value) => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/€\s?|(,*)/g, '')}
                      />
                    </Col>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Max CLV"
                        value={filters.clvMax}
                        onChange={(value) => handleFilterChange("clvMax", value)}
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(value) => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/€\s?|(,*)/g, '')}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Order Count</Text>
                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Min Orders"
                        value={filters.orderCountMin}
                        onChange={(value) => handleFilterChange("orderCountMin", value)}
                        style={{ width: "100%" }}
                        min={0}
                      />
                    </Col>
                    <Col span={12}>
                      <InputNumber
                        placeholder="Max Orders"
                        value={filters.orderCountMax}
                        onChange={(value) => handleFilterChange("orderCountMax", value)}
                        style={{ width: "100%" }}
                        min={0}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </>
          )}
        </Space>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Alert
          message="Search Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Results Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={searchResults?.customers || []}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: searchResults?.pagination.totalCount || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} customers`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 20);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              },
            }}
            onChange={(pagination, filters, sorter) => {
              if (Array.isArray(sorter)) return;
              if (sorter.field && sorter.order) {
                setSortBy(sorter.field as string);
                setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
              }
            }}
            scroll={{ x: 1400 }}
          />
        </Spin>
      </Card>
    </div>
  );
}
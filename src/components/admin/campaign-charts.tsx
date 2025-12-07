"use client";

import React from "react";
import { Card, Row, Col, Table, Empty, Tag } from "antd";
import { useTranslation } from "react-i18next";

export interface TimeSeriesData {
  date: string;
  opens: number;
  clicks: number;
}

export interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

export interface LocationData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

export interface LinkData {
  url: string;
  clicks: number;
  uniqueClicks: number;
}

interface CampaignChartsProps {
  timeSeriesData: TimeSeriesData[];
  deviceData: DeviceData[];
  locationData: LocationData[];
  linkData: LinkData[];
}

export const CampaignCharts: React.FC<CampaignChartsProps> = ({
  timeSeriesData,
  deviceData,
  locationData,
  linkData,
}) => {
  const { t } = useTranslation(["admin", "common"]);

  // Device colors
  const deviceColors: Record<string, string> = {
    desktop: "#0891B2",
    mobile: "#F97316",
    tablet: "#10B981",
    other: "#6B7280",
  };

  // Simple bar chart using CSS
  const maxOpens = Math.max(...timeSeriesData.map((d) => d.opens), 1);
  const maxClicks = Math.max(...timeSeriesData.map((d) => d.clicks), 1);

  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <Card title={t("admin:campaigns.charts.performance")}>
        {timeSeriesData.length === 0 ? (
          <Empty description={t("admin:campaigns.charts.noData")} />
        ) : (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex gap-4 justify-end">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#6366F1]" />
                <span className="text-sm">{t("admin:campaigns.stats.opens")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#F97316]" />
                <span className="text-sm">{t("admin:campaigns.stats.clicks")}</span>
              </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-1 h-48 border-b border-l border-gray-200 p-4">
              {timeSeriesData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex gap-0.5 items-end h-full">
                    <div
                      className="w-3 bg-[#6366F1] rounded-t transition-all"
                      style={{ height: `${(data.opens / maxOpens) * 100}%` }}
                      title={`Opens: ${data.opens}`}
                    />
                    <div
                      className="w-3 bg-[#F97316] rounded-t transition-all"
                      style={{ height: `${(data.clicks / maxClicks) * 100}%` }}
                      title={`Clicks: ${data.clicks}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 rotate-45 origin-left">
                    {new Date(data.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Row gutter={16}>
        {/* Device Breakdown */}
        <Col xs={24} md={12}>
          <Card title={t("admin:campaigns.charts.devices")}>
            {deviceData.length === 0 ? (
              <Empty description={t("admin:campaigns.charts.noData")} />
            ) : (
              <div className="space-y-4">
                {/* Pie chart representation using CSS */}
                <div className="flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {deviceData.reduce(
                        (acc, device, index) => {
                          const startAngle = acc.currentAngle;
                          const angle = (device.percentage / 100) * 360;
                          const endAngle = startAngle + angle;

                          const startRad = (startAngle - 90) * (Math.PI / 180);
                          const endRad = (endAngle - 90) * (Math.PI / 180);

                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);

                          const largeArc = angle > 180 ? 1 : 0;

                          acc.paths.push(
                            <path
                              key={device.device}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={deviceColors[device.device.toLowerCase()] || "#6B7280"}
                            />
                          );

                          acc.currentAngle = endAngle;
                          return acc;
                        },
                        { paths: [] as React.ReactNode[], currentAngle: 0 }
                      ).paths}
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {deviceData.map((device) => (
                    <div
                      key={device.device}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor:
                              deviceColors[device.device.toLowerCase()] || "#6B7280",
                          }}
                        />
                        <span className="capitalize">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{device.count}</span>
                        <span className="text-gray-500 ml-2">
                          ({device.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Location Breakdown */}
        <Col xs={24} md={12}>
          <Card title={t("admin:campaigns.charts.locations")}>
            {locationData.length === 0 ? (
              <Empty description={t("admin:campaigns.charts.noData")} />
            ) : (
              <Table
                dataSource={locationData}
                columns={[
                  {
                    title: t("admin:campaigns.charts.country"),
                    dataIndex: "country",
                    key: "country",
                    render: (country: string, record: LocationData) => (
                      <span>
                        <span className="mr-2">{getFlagEmoji(record.countryCode)}</span>
                        {country}
                      </span>
                    ),
                  },
                  {
                    title: t("admin:campaigns.charts.opens"),
                    dataIndex: "count",
                    key: "count",
                    align: "right" as const,
                  },
                  {
                    title: "%",
                    dataIndex: "percentage",
                    key: "percentage",
                    align: "right" as const,
                    render: (p: number) => `${p.toFixed(1)}%`,
                  },
                ]}
                rowKey="countryCode"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Link Performance */}
      <Card title={t("admin:campaigns.charts.links")}>
        {linkData.length === 0 ? (
          <Empty description={t("admin:campaigns.charts.noLinks")} />
        ) : (
          <Table
            dataSource={linkData}
            columns={[
              {
                title: t("admin:campaigns.charts.url"),
                dataIndex: "url",
                key: "url",
                ellipsis: true,
                render: (url: string) => (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {url}
                  </a>
                ),
              },
              {
                title: t("admin:campaigns.charts.totalClicks"),
                dataIndex: "clicks",
                key: "clicks",
                align: "right" as const,
                sorter: (a: LinkData, b: LinkData) => a.clicks - b.clicks,
              },
              {
                title: t("admin:campaigns.charts.uniqueClicks"),
                dataIndex: "uniqueClicks",
                key: "uniqueClicks",
                align: "right" as const,
                sorter: (a: LinkData, b: LinkData) => a.uniqueClicks - b.uniqueClicks,
              },
              {
                title: t("admin:campaigns.charts.clickRate"),
                key: "rate",
                align: "right" as const,
                render: (_: unknown, record: LinkData) => {
                  const totalClicks = linkData.reduce((sum, l) => sum + l.clicks, 0);
                  const rate = totalClicks > 0 ? (record.clicks / totalClicks) * 100 : 0;
                  return (
                    <Tag color={rate > 20 ? "green" : rate > 10 ? "blue" : "default"}>
                      {rate.toFixed(1)}%
                    </Tag>
                  );
                },
              },
            ]}
            rowKey="url"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
};

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default CampaignCharts;

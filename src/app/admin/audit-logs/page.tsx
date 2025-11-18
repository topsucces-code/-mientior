"use client";

import React from "react";
import { useTable } from "@refinedev/antd";
import { Table, Tag, Tooltip, Popover, Button, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import ReactDiffViewer from "react-diff-viewer-continued";
import { AdvancedFilters } from "@/components/admin/advanced-filters";

const { Text } = Typography;

interface AuditLog {
  id: string;
  createdAt: string;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId: string;
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  ipAddress: string;
}

export default function AuditLogsPage() {
  const { t } = useTranslation(["common", "admin"]);
  const [filters, setFilters] = React.useState({});
  const [filtersVisible, setFiltersVisible] = React.useState(false);

  const { tableProps } = useTable<AuditLog>({
    resource: "audit-logs",
    pagination: {
      pageSize: 20,
    },
    filters: {
      permanent: Object.entries(filters).map(([field, value]) => ({
        field,
        operator: "eq",
        value,
      })),
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resource: "audit-logs",
          filters: filters,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${dayjs().format("YYYY-MM-DD")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "green",
      UPDATE: "blue",
      DELETE: "red",
    };
    return colors[action] || "default";
  };

  const getResourceColor = (resource: string) => {
    const colors: Record<string, string> = {
      products: "blue",
      orders: "green",
      users: "purple",
      categories: "orange",
    };
    return colors[resource] || "default";
  };

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
        <h1>{t("admin:auditLogs.title")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => setFiltersVisible(true)}>
            {t("common:buttons.filter")}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            type="primary"
          >
            {t("common:buttons.export")}
          </Button>
        </div>
      </div>

      <AdvancedFilters
        resource="audit-logs"
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onFiltersChange={setFilters}
      />

      <Table {...tableProps} rowKey="id" style={{ marginTop: 16 }}>
        <Table.Column
          dataIndex="createdAt"
          title={t("admin:auditLogs.fields.timestamp")}
          render={(date: string) => dayjs(date).format("MMM DD, YYYY HH:mm:ss")}
          width={180}
        />
        <Table.Column
          dataIndex="adminUser"
          title={t("admin:auditLogs.fields.adminUser")}
          render={(user: AuditLog["adminUser"]) => (
            <Tooltip title={user.email}>
              <Text>{`${user.firstName} ${user.lastName}`}</Text>
            </Tooltip>
          )}
          width={150}
        />
        <Table.Column
          dataIndex="action"
          title={t("admin:auditLogs.fields.action")}
          render={(action: string) => (
            <Tag color={getActionColor(action)}>{action}</Tag>
          )}
          width={100}
        />
        <Table.Column
          dataIndex="resource"
          title={t("admin:auditLogs.fields.resource")}
          render={(resource: string) => (
            <Tag color={getResourceColor(resource)}>{resource}</Tag>
          )}
          width={120}
        />
        <Table.Column
          dataIndex="resourceId"
          title={t("admin:auditLogs.fields.resourceId")}
          width={120}
        />
        <Table.Column
          dataIndex="changes"
          title={t("admin:auditLogs.fields.changes")}
          render={(changes: AuditLog["changes"]) => {
            if (!changes || !changes.before || !changes.after) {
              return "—";
            }

            const oldCode = JSON.stringify(changes.before, null, 2);
            const newCode = JSON.stringify(changes.after, null, 2);

            return (
              <Popover
                content={
                  <div style={{ width: 600, maxHeight: 400, overflow: "auto" }}>
                    <ReactDiffViewer
                      oldValue={oldCode}
                      newValue={newCode}
                      splitView={true}
                      leftTitle="Before"
                      rightTitle="After"
                      styles={{
                        variables: {
                          light: {
                            diffViewerBackground: "#fff",
                            addedBackground: "#e6ffed",
                            removedBackground: "#ffeef0",
                          },
                        },
                      }}
                    />
                  </div>
                }
                title={t("admin:auditLogs.fields.changes")}
                trigger="click"
                placement="left"
              >
                <Button size="small" type="link">
                  {t("common:buttons.view")}
                </Button>
              </Popover>
            );
          }}
          width={100}
        />
        <Table.Column
          dataIndex="ipAddress"
          title={t("admin:auditLogs.fields.ipAddress")}
          render={(ip: string) => (
            <Tooltip title="Click to copy">
              <Text
                copyable
                style={{ cursor: "pointer" }}
              >
                {ip}
              </Text>
            </Tooltip>
          )}
          width={120}
        />
      </Table>
    </div>
  );
}

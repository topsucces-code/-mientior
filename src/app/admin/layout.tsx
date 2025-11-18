"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { RefineThemes, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import dataProvider from "@refinedev/simple-rest";
import { ConfigProvider, App as AntdApp, Layout } from "antd";
import { authProvider } from "@/providers/auth-provider";
import { accessControlProvider } from "@/providers/access-control-provider";
import { refineI18nProvider } from "@/lib/i18n";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { GlobalSearch } from "@/components/admin/global-search";
import { I18nReady } from "@/components/admin/i18n-ready";
import "@refinedev/antd/dist/reset.css";

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => {
    // Load collapse state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Save collapse state to localStorage
  React.useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Listen for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ConfigProvider theme={RefineThemes.Blue}>
      <AntdApp>
        <I18nReady>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider("/api")}
            notificationProvider={useNotificationProvider()}
            authProvider={authProvider}
            accessControlProvider={accessControlProvider}
            i18nProvider={refineI18nProvider}
          resources={[
            {
              name: "products",
              list: "/admin/products",
              create: "/admin/products/create",
              edit: "/admin/products/edit/:id",
              show: "/admin/products/show/:id",
              meta: {
                label: "Products",
              },
            },
            {
              name: "categories",
              list: "/admin/categories",
              create: "/admin/categories/create",
              edit: "/admin/categories/edit/:id",
              show: "/admin/categories/show/:id",
              meta: {
                label: "Categories",
              },
            },
            {
              name: "orders",
              list: "/admin/orders",
              show: "/admin/orders/show/:id",
              meta: {
                label: "Orders",
              },
            },
            {
              name: "users",
              list: "/admin/users",
              show: "/admin/users/show/:id",
              meta: {
                label: "Users",
              },
            },
            {
              name: "vendors",
              list: "/admin/vendors",
              create: "/admin/vendors/create",
              edit: "/admin/vendors/edit/:id",
              show: "/admin/vendors/show/:id",
              meta: {
                label: "Vendors",
              },
            },
            {
              name: "campaigns",
              list: "/admin/marketing/campaigns",
              create: "/admin/marketing/campaigns/create",
              edit: "/admin/marketing/campaigns/edit/:id",
              show: "/admin/marketing/campaigns/show/:id",
              meta: {
                label: "Campaigns",
              },
            },
            {
              name: "promo-codes",
              list: "/admin/marketing/promo-codes",
              create: "/admin/marketing/promo-codes/create",
              edit: "/admin/marketing/promo-codes/edit/:id",
              meta: {
                label: "Promo Codes",
              },
            },
            {
              name: "segments",
              list: "/admin/customers/segments",
              create: "/admin/customers/segments/create",
              edit: "/admin/customers/segments/edit/:id",
              meta: {
                label: "Customer Segments",
              },
            },
            {
              name: "media",
              list: "/admin/media",
              meta: {
                label: "Media",
              },
            },
            {
              name: "audit-logs",
              list: "/admin/audit-logs",
              show: "/admin/audit-logs/show/:id",
              meta: {
                label: "Audit Logs",
                parent: "settings",
              },
            },
            {
              name: "admin-users",
              list: "/admin/admin-users",
              create: "/admin/admin-users/create",
              edit: "/admin/admin-users/edit/:id",
              show: "/admin/admin-users/show/:id",
              meta: {
                label: "Admin Users",
                parent: "settings",
              },
            },
            {
              name: "roles",
              list: "/admin/roles",
              show: "/admin/roles/show/:id",
              meta: {
                label: "Roles",
                parent: "settings",
              },
            },
            {
              name: "feature-flags",
              list: "/admin/feature-flags",
              meta: {
                label: "Feature Flags",
                parent: "settings",
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          {/* Professional Admin Layout with Sidebar */}
          <Layout style={{ minHeight: "100vh" }}>
            <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: "margin-left 0.3s" }}>
              <AdminHeader onSearchOpen={() => setSearchOpen(true)} />
              <Content
                style={{
                  margin: "24px",
                  padding: "24px",
                  background: "#fff",
                  borderRadius: "8px",
                  minHeight: "calc(100vh - 112px)",
                }}
              >
                {children}
              </Content>
            </Layout>
          </Layout>
          <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Refine>
        </I18nReady>
      </AntdApp>
    </ConfigProvider>
  );
}

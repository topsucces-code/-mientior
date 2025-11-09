"use client";

import { Refine } from "@refinedev/core";
import { RefineThemes, ThemedLayout, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import dataProvider from "@refinedev/simple-rest";
import { ConfigProvider, App as AntdApp } from "antd";

// @ts-expect-error - CSS import without type declarations
import "@refinedev/antd/dist/reset.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={RefineThemes.Blue}>
      <AntdApp>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider("http://localhost:3000/api")}
          notificationProvider={useNotificationProvider}
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
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <ThemedLayout>{children}</ThemedLayout>
        </Refine>
      </AntdApp>
    </ConfigProvider>
  );
}

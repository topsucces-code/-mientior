"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";

interface I18nReadyProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures translations are loaded before rendering children.
 * This prevents displaying raw translation keys during the initial load.
 */
export function I18nReady({ children }: I18nReadyProps) {
  const { ready } = useTranslation(["common", "admin"], { useSuspense: false });

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";

interface I18nReadyProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures translations are loaded before rendering children.
 * This prevents displaying raw translation keys during the initial load.
 * Uses mounted state to avoid hydration mismatch.
 */
export function I18nReady({ children }: I18nReadyProps) {
  const { ready } = useTranslation(["common", "admin"], { useSuspense: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render the same structure on server and initial client render
  // to avoid hydration mismatch
  if (!mounted || !ready) {
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

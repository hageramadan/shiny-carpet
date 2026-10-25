"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: 96 }}
      toastOptions={{
        duration: 4000,
        style: {
          direction: "rtl",
          fontFamily: "var(--font-cairo), sans-serif",
          background: "#fff",
          color: "#14383B",
          border: "1px solid #d5eeed",
          borderRadius: 16,
          padding: "14px 20px",
          boxShadow: "0 12px 36px rgba(20,56,59,0.14)",
          gap: 10,
          maxWidth: 360,
        },
        success: { iconTheme: { primary: "#20A9B0", secondary: "#fff" } },
      }}
    />
  );
}

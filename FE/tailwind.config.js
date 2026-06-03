/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#f6f8fb",
        surface: "#ffffff",
        "surface-dim": "#eef2f7",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f9fafb",
        "surface-container": "#ffffff",
        "surface-container-high": "#f1f5f9",
        "surface-container-highest": "#e2e8f0",
        "surface-variant": "#edf2f7",
        "surface-tint": "#0f766e",
        "inverse-surface": "#172033",
        "inverse-on-surface": "#f8fafc",
        "on-background": "#172033",
        "on-surface": "#111827",
        "on-surface-variant": "#526173",
        outline: "#64748b",
        "outline-variant": "#d5dde8",
        primary: "#0f766e",
        "on-primary": "#ffffff",
        "primary-container": "#0f766e",
        "on-primary-container": "#ffffff",
        "primary-fixed": "#dff5f2",
        "primary-fixed-dim": "#99ded6",
        "on-primary-fixed": "#063b37",
        "on-primary-fixed-variant": "#0f5f66",
        "inverse-primary": "#6ee7d8",
        secondary: "#2563eb",
        "on-secondary": "#ffffff",
        "secondary-container": "#dbeafe",
        "on-secondary-container": "#1e3a8a",
        "secondary-fixed": "#dbeafe",
        "secondary-fixed-dim": "#93c5fd",
        "on-secondary-fixed": "#172554",
        "on-secondary-fixed-variant": "#1d4ed8",
        tertiary: "#b45309",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#fef3c7",
        "on-tertiary-container": "#92400e",
        "tertiary-fixed": "#fef3c7",
        "tertiary-fixed-dim": "#fcd34d",
        "on-tertiary-fixed": "#78350f",
        "on-tertiary-fixed-variant": "#b45309",
        error: "#dc2626",
        "on-error": "#ffffff",
        "error-container": "#fee2e2",
        "on-error-container": "#991b1b",
        ai: "#7c3aed"
      },
      fontFamily: {
        geist: ['"Geist"', "system-ui", "sans-serif"],
        inter: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"Geist"', "ui-monospace", "monospace"]
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        unit: "4px",
        gutter: "16px",
        "page": "16px",
        "margin-desktop": "32px"
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "0", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "0", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "0", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0", fontWeight: "600" }],
        "mono-data": ["14px", { lineHeight: "20px", letterSpacing: "0", fontWeight: "400" }]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "9999px"
      },
      maxWidth: {
        workspace: "1400px"
      },
      animation: {
        "spin-slow": "spin 3s linear infinite"
      }
    }
  },
  plugins: []
};

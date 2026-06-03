/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0b1326",
        surface: "#0b1326",
        "surface-dim": "#0b1326",
        "surface-bright": "#31394d",
        "surface-container-lowest": "#060e20",
        "surface-container-low": "#131b2e",
        "surface-container": "#171f33",
        "surface-container-high": "#222a3d",
        "surface-container-highest": "#2d3449",
        "surface-variant": "#2d3449",
        "surface-tint": "#adc6ff",
        "inverse-surface": "#dae2fd",
        "inverse-on-surface": "#283044",
        "on-background": "#dae2fd",
        "on-surface": "#dae2fd",
        "on-surface-variant": "#c2c6d6",
        outline: "#8c909f",
        "outline-variant": "#424754",
        primary: "#adc6ff",
        "on-primary": "#002e6a",
        "primary-container": "#4d8eff",
        "on-primary-container": "#00285d",
        "primary-fixed": "#d8e2ff",
        "primary-fixed-dim": "#adc6ff",
        "on-primary-fixed": "#001a42",
        "on-primary-fixed-variant": "#004395",
        "inverse-primary": "#005ac2",
        secondary: "#4edea3",
        "on-secondary": "#003824",
        "secondary-container": "#00a572",
        "on-secondary-container": "#00311f",
        "secondary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",
        tertiary: "#ffb786",
        "on-tertiary": "#502400",
        "tertiary-container": "#df7412",
        "on-tertiary-container": "#461f00",
        "tertiary-fixed": "#ffdcc6",
        "tertiary-fixed-dim": "#ffb786",
        "on-tertiary-fixed": "#311400",
        "on-tertiary-fixed-variant": "#723600",
        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        ai: "#6366f1"
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
        "margin-mobile": "16px",
        "margin-desktop": "32px"
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "0", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "0", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "0", fontWeight: "600" }],
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
        command: "1400px"
      },
      animation: {
        "spin-slow": "spin 3s linear infinite"
      }
    }
  },
  plugins: []
};

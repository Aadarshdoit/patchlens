/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Carbon-inspired palette
        "ibm-blue": {
          DEFAULT: "#0f62fe",
          hover:   "#0050e6",
          light:   "#edf5ff",
        },
        border: {
          DEFAULT: "#e0e0e0",
          strong:  "#c6c6c6",
        },
        ink: {
          DEFAULT:   "#161616",
          secondary: "#525252",
          muted:     "#8d8d8d",
        },
        // Semantic verdict colors
        verified: {
          bg:     "#defbe6",
          text:   "#044317",
          border: "#a7f0ba",
          icon:   "#24a148",
        },
        notfixed: {
          bg:     "#fff1f1",
          text:   "#750e13",
          border: "#ffb3b8",
          icon:   "#da1e28",
        },
        inconclusive: {
          bg:     "#fdf4e3",
          text:   "#5c3d11",
          border: "#f1c21b",
          icon:   "#f1c21b",
        },
      },
      fontFamily: {
        sans: [
          "'IBM Plex Sans'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          "'IBM Plex Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        sm:      "2px",
        DEFAULT: "2px",
        md:      "2px",
        lg:      "4px",
        xl:      "4px",
      },
      boxShadow: {
        card:    "0 1px 2px rgba(0,0,0,0.08)",
        "card-sm": "0 1px 2px rgba(0,0,0,0.05)",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

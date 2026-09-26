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
        // PatchLens warm cream palette
        cream: {
          50: "#FAFAF7",
          100: "#F7F6F2",
          200: "#F2F1ED",
          300: "#E8E6DF",
          400: "#D8D5CC",
        },
        border: {
          DEFAULT: "#E4E1DA",
          strong: "#C8C5BC",
        },
        ink: {
          DEFAULT: "#202124",
          secondary: "#5F6368",
          muted: "#858585",
        },
        // Semantic verdict colors – muted, professional
        verified: {
          bg: "#F0F7F2",
          text: "#2F7D4A",
          border: "#B8D9C4",
        },
        notfixed: {
          bg: "#FDF2F2",
          text: "#B54747",
          border: "#F0C0C0",
        },
        inconclusive: {
          bg: "#FDF8F0",
          text: "#A66A1F",
          border: "#EDD9A3",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
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
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-sm": "0 1px 2px rgba(0,0,0,0.05)",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

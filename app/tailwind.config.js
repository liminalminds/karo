/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Each step is nudged up so text is easier to read without needing
      // individual overrides at every call site.
      fontSize: {
        "2xs": ["11px", "16px"],
        xs: ["13px", "18px"],
        sm: ["15px", "21px"],
        base: ["17px", "24px"],
        lg: ["20px", "28px"],
        xl: ["24px", "32px"],
        "2xl": ["30px", "36px"],
        "3xl": ["36px", "40px"],
        "4xl": ["44px", "48px"],
      },
    },
  },
  plugins: [],
};

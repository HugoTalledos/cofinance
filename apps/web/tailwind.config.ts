import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      "colors": {
        "secondary-fixed": "#d5e3fd",
        "secondary-container": "#d5e3fd",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#c9e6ff",
        "inverse-on-surface": "#eaf1ff",
        "surface-container-low": "#eff4ff",
        "surface-bright": "#f8f9ff",
        "surface-tint": "#565e74",
        "error": "#ba1a1a",
        "background": "#f8f9ff",
        "surface": "#f8f9ff",
        "on-tertiary-fixed": "#001e2f",
        "primary-container": "#131b2e",
        "tertiary-fixed-dim": "#89ceff",
        "on-primary": "#ffffff",
        "on-tertiary-container": "#008cc7",
        "on-tertiary": "#ffffff",
        "outline-variant": "#c6c6cd",
        "surface-container-highest": "#d3e4fe",
        "secondary-fixed-dim": "#b9c7e0",
        "surface-container-lowest": "#ffffff",
        "primary-fixed-dim": "#bec6e0",
        "tertiary-container": "#001e2f",
        "on-tertiary-fixed-variant": "#004c6e",
        "error-container": "#ffdad6",
        "surface-variant": "#d3e4fe",
        "on-error": "#ffffff",
        "surface-container-high": "#dce9ff",
        "secondary": "#515f74",
        "on-surface": "#0b1c30",
        "on-primary-container": "#7c839b",
        "outline": "#76777d",
        "surface-dim": "#cbdbf5",
        "on-secondary-container": "#57657b",
        "on-secondary-fixed": "#0d1c2f",
        "primary": "#000000",
        "on-primary-fixed-variant": "#3f465c",
        "surface-container": "#e5eeff",
        "on-background": "#0b1c30",
        "on-secondary-fixed-variant": "#3a485c",
        "on-surface-variant": "#45464d",
        "primary-fixed": "#dae2fd",
        "on-secondary": "#ffffff",
        "tertiary": "#000000",
        "inverse-primary": "#bec6e0",
        "inverse-surface": "#213145",
        "on-primary-fixed": "#131b2e"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-md": "0.75rem",
        "space-xl": "2rem",
        "margin": "1rem",
        "space-lg": "1.25rem",
        "space-xs": "0.25rem",
        "gutter": "1.25rem",
        "margin-desktop": "3rem",
        "gutter-desktop": "1.5rem",
        "space-sm": "0.5rem",
        "margin-tablet": "2rem"
      },
      "fontFamily": {
        "headline-md": [
          "Geist"
        ],
        "headline-lg": [
          "Geist"
        ],
        "display-mobile": [
          "Geist"
        ],
        "display": [
          "Geist"
        ],
        "body-lg": [
          "Geist"
        ],
        "body-sm": [
          "Geist"
        ],
        "numeric-md": [
          "JetBrains Mono"
        ],
        "numeric-lg": [
          "JetBrains Mono"
        ],
        "body-md": [
          "Geist"
        ],
        "label-sm": [
          "JetBrains Mono"
        ],
        "headline-lg-mobile": [
          "Geist"
        ],
        "headline-sm": [
          "Geist"
        ],
        "label-md": [
          "JetBrains Mono"
        ]
      },
      "fontSize": {
        "headline-md": [
          "22px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.015em",
            "fontWeight": "500"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ],
        "display-mobile": [
          "36px",
          {
            "lineHeight": "44px",
            "letterSpacing": "-0.025em",
            "fontWeight": "600"
          }
        ],
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.03em",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.005em",
            "fontWeight": "400"
          }
        ],
        "body-sm": [
          "13px",
          {
            "lineHeight": "18px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "numeric-md": [
          "15px",
          {
            "lineHeight": "20px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
          }
        ],
        "numeric-lg": [
          "24px",
          {
            "lineHeight": "30px",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ],
        "body-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "label-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.05em",
            "fontWeight": "500"
          }
        ],
        "headline-lg-mobile": [
          "26px",
          {
            "lineHeight": "34px",
            "letterSpacing": "-0.015em",
            "fontWeight": "500"
          }
        ],
        "headline-sm": [
          "18px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.04em",
            "fontWeight": "500"
          }
        ]
      }
    }
  }
} satisfies Config

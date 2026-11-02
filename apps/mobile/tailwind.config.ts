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
      // Tokens del diseño "Minimalist Finance Tracker" de Stitch
      colors: {
        surface: '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#45464d',
        outline: '#76777d',
        'outline-variant': '#c6c6cd',
        'primary-container': '#131b2e',
        'on-primary-container': '#7c839b',
        secondary: '#006c4a',
        'secondary-fixed': '#85f8c4',
        'secondary-container': '#82f5c1',
        'on-secondary-container': '#00714e',
        error: '#ba1a1a',
        debt: '#920028'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif']
      },
      fontSize: {
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '22px' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'currency-display': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }]
      }
    }
  },
  plugins: []
} satisfies Config

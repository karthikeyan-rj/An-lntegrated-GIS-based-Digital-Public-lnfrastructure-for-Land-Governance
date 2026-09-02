/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fb',
          100: '#dce6f5',
          200: '#bccdea',
          300: '#92aad9',
          400: '#6384c4',
          500: '#4466ac',
          600: '#344f8f',
          700: '#2c4174',
          800: '#283a61',
          900: '#1d2b49',
          950: '#141d33'
        },
        gov: {
          50: '#eef4ff',
          100: '#dce7fd',
          200: '#c0d5fc',
          300: '#94b8f9',
          400: '#628ff4',
          500: '#3f6bee',
          600: '#2a4de3',
          700: '#223cd0',
          800: '#2133a9',
          900: '#1f2f85'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.1)',
        lift: '0 4px 12px rgba(16,24,40,0.12)'
      }
    }
  },
  plugins: []
}

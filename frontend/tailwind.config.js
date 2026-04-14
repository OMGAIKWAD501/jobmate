/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          secondary: '#6366F1',
          accent: '#22C55E',
          cta: '#F97316',
          bg: '#F9FAFB',
          card: '#FFFFFF',
          text: '#111827',
          muted: '#6B7280'
        }
      },
      borderRadius: {
        xl2: '16px'
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.08)'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
      }
    }
  },
  plugins: []
};

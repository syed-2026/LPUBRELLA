/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FDF6EC',
        brand: {
          DEFAULT: '#B19976',
          dark: '#8F7959',
        },
        surface: {
          DEFAULT: '#F8F0E4',
          secondary: '#E5D8C6',
        },
        border: {
          DEFAULT: '#D8CBB6',
        },
        text: {
          primary: '#3F382F',
          secondary: '#7A6E5F',
        },
        status: {
          available: '#8EB176',
          limited: '#B19976',
          unavailable: '#A39B90',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(63 56 47 / 0.06), 0 1px 3px 0 rgb(63 56 47 / 0.08)',
        elevated: '0 4px 12px -2px rgb(63 56 47 / 0.10), 0 2px 6px -2px rgb(63 56 47 / 0.06)',
      },
    },
  },
  plugins: [],
};

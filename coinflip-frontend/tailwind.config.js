/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
    fontSize: {
      'xm': '13px',
      'sm': '14px',
      'md': '18px',
      'lg': '21px',

    },
    colors: {
      'bg-strong': '#0E1420',
      'bg-light': '#111827',
      'purple': '#7D52F4',
      'white': '#fff',
      'grey': '#888',
      'green': '#1daf61'
    }
  },
  plugins: [],
}


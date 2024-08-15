import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Include all files in pages directory
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Include all files in components directory
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Include all files in app directory
    './node_modules/primereact/**/*.{js,ts,jsx,tsx}', // Include PrimeReact components
  ],
  theme: {
    extend: {
      colors: {
        terminalGreen: '#00FF00', // Custom color for your theme
      },
    },
  },
  daisyui: {
    themes: ['light', 'dark'], // Set the default themes here
    darkTheme: 'light', // Set light mode as the default theme
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    require('tailwindcss-animate'),
  ],
};

export default config;

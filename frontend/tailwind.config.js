import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dnd: {
          bg: {
            root: '#0d0d12',
            surface: '#14141a',
            elevated: '#1a1a24',
            hover: '#24243d',
            active: '#2a2a40',
            input: '#0a0a0f',
          },
          border: {
            DEFAULT: '#2a1f1f',
            light: '#3d2a2a',
            focus: '#c50009',
          },
          text: {
            DEFAULT: '#e8e0d8',
            muted: '#9a8e86',
            dim: '#6b5f57',
          },
          red: {
            DEFAULT: '#c50009',
            hover: '#a00008',
          },
          blue: '#5b8def',
          green: '#00b87a',
          gold: {
            DEFAULT: '#c9a94e',
            dim: '#a8882e',
          },
          purple: '#a855f7',
          pact: '#7c3aed',
        },
      },
      fontFamily: {
        body: ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Tiamat Condensed SC', 'Georgia', 'serif'],
        label: ['Roboto Condensed', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        red: '0 2px 12px rgba(197,0,9,0.15)',
        'red-lg': '0 4px 16px rgba(197,0,9,0.1)',
        gold: '0 0 0 1px #c9a94e, 0 4px 16px rgba(201,169,78,0.15)',
        green: '0 4px 16px rgba(0,184,122,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
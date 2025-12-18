import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f172a',
        'bg-secondary': '#1e293b',
        'bg-card': '#1e293b',
        'accent-blue': '#3b82f6',
        'accent-cyan': '#06b6d4',
        'accent-green': '#10b981',
        'text-primary': '#f8fafc',
        'text-secondary': '#cbd5e1',
        'text-muted': '#64748b',
        border: '#334155',
        'score-eagle': '#10b981',
        'score-birdie': '#22d3ee',
        'score-par': '#64748b',
        'score-bogey': '#f59e0b',
        'score-double': '#f97316',
        'score-triple': '#ef4444',
      },
    },
  },
  plugins: [],
};
export default config;

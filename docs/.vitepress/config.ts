import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Mero Patro',
  description: 'Documentation for mero-patro',
  base: '/mero-patro/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Limits', link: '/guide/limits-and-guarantees' },
      { text: 'Playground', link: '/guide/playground' },
      { text: 'Validation', link: '/guide/validation-and-trust' },
      { text: 'API', link: '/api/reference/README' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Bikram Sambat?', link: '/guide/what-is-bs' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Limits and Guarantees', link: '/guide/limits-and-guarantees' },
            { text: 'Interactive Playground', link: '/guide/playground' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Date Conversion', link: '/guide/date-conversion' },
            { text: 'Calendar Grid', link: '/guide/calendar-grid' },
            { text: 'Panchang & Events', link: '/guide/panchang-and-events' },
            { text: 'Developer Journey', link: '/guide/developer-journey' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Validation & Trust', link: '/guide/validation-and-trust' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [{ text: 'Generated Reference', link: '/api/reference/README' }],
        },
      ],
    },
  },
})

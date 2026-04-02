import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'حياتي - نظام تشغيل حياتك',
    short_name: 'حياتي',
    description: 'نظام متكامل لإدارة اللياقة، المهام، الدراسة، والمالية',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8faff',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

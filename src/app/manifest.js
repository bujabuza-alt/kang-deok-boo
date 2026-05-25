export default function manifest() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return {
    name: '강덕부',
    short_name: '강덕부',
    description: '좋아하는 모든 것을 기록하고 평가하는 노트',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#6366F1',
    orientation: 'portrait',
    icons: [
      {
        src: `${basePath}/icon.svg`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}

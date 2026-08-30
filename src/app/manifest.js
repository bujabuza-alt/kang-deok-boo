export default function manifest() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return {
    name: '강덕부',
    short_name: '강덕부',
    description: '일정과 식사메뉴, 지출을 기록하고 관리하는 앱',
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

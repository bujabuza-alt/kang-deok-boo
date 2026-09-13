import './globals.css';
import { ServiceWorkerUpdater } from '@/components/ServiceWorkerUpdater';
import { VersionWatermark } from '@/components/VersionWatermark';
import { SyncGate } from '@/components/SyncGate';
import { ThemeProvider } from '@/expense/context/ThemeContext';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

export const metadata = {
  title: '강덕부',
  description: '일정과 식사메뉴, 지출을 기록하고 관리하는 앱',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '강덕부',
  },
};

export const viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
      </head>
      <body>
        {/* 앱 전체 라이트/다크 테마 컨텍스트 (원래 지출 탭 전용이었으나 전역으로 확장) */}
        <ThemeProvider>
          {/* 다른 기기와 동기화 코드가 연결되어 있으면, 화면을 그리기 전에
              클라우드의 최신 데이터를 먼저 내려받습니다. */}
          <SyncGate>{children}</SyncGate>
          {/* SW 등록 + 새 버전 감지 배너 */}
          <ServiceWorkerUpdater swPath={`${basePath}/sw.js`} />
          {/* 빌드 ID 워터마크 (하단 좌측, 클릭 시 SW 버전 대조) */}
          <VersionWatermark buildId={buildId} />
        </ThemeProvider>
      </body>
    </html>
  );
}

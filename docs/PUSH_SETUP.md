# 타임박스 푸시 알림 설정 가이드

아이폰은 웹앱이 "몇 시에 알림을 띄워 줘"라고 스스로 예약할 수 없습니다.
그래서 작은 알림 서버(Cloudflare Worker, 무료)가 1분마다 예약된 알림을 확인해
그 시각에 Web Push를 보내 줍니다.

## 동작 방식 요약

- 앱(타임박스 탭 ⚙ → 알림)에서 **이 기기에서 알림 켜기**를 누르면 기기별 푸시 구독이 만들어집니다.
- 앱이 열릴 때마다, 그리고 타임박스를 고칠 때마다 앞으로 36시간의 알림 목록을
  알림 서버에 올립니다(`worker/`). 서버는 시각이 된 알림을 보냅니다.
  - 칸 시작 알림(정시/5분 전/10분 전), 미완료 반복(칸이 끝날 때까지 N분마다),
    정기 체크인(표시 시간 동안 N분마다)
- 완료 체크를 하면 목록이 다시 올라가 해당 칸의 반복 알림이 빠집니다.
  단, **36시간 넘게 앱을 한 번도 열지 않으면** 그 이후 알림은 오지 않습니다.
- 아이폰은 **iOS 16.4 이상**에서, Safari 공유 버튼 → **"홈 화면에 추가"** 로 설치한
  앱에서만 알림을 받을 수 있습니다(Safari 탭에서는 불가).

## 1. VAPID 키 만들기 (한 번만)

푸시 메시지에 서명하는 키입니다. 아무 컴퓨터에서나:

```bash
npx web-push generate-vapid-keys
```

출력되는 `Public Key`, `Private Key`를 메모해 둡니다. (Private Key는 남에게 보이지 마세요.)

## 2. Cloudflare 준비

1. https://dash.cloudflare.com 에서 무료 가입
2. 오른쪽 위 계정 메뉴 → **계정 ID** 복사(Workers & Pages 화면 오른쪽에도 표시)
3. 내 프로필 → API 토큰 → **토큰 생성** → "Cloudflare Workers 편집" 템플릿 선택 →
   권한에 **계정 · D1 · 편집** 추가 → 생성된 토큰 복사
4. D1 데이터베이스 만들기: Workers & Pages → D1 → **데이터베이스 생성** →
   이름 `kang-deok-boo-push` → 만들어진 **데이터베이스 ID** 복사

## 3. GitHub Secrets 등록

레포 Settings → Secrets and variables → Actions → New repository secret:

| 이름 | 값 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 2-3의 API 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | 2-2의 계정 ID |
| `D1_DATABASE_ID` | 2-4의 데이터베이스 ID |
| `VAPID_PUBLIC_KEY` | 1의 Public Key |
| `VAPID_PRIVATE_KEY` | 1의 Private Key |
| `VAPID_SUBJECT` | `mailto:내이메일주소` |

## 4. 알림 서버 배포

Actions 탭 → **알림 서버(Cloudflare Worker) 배포** → Run workflow.
성공하면 Cloudflare 대시보드 → Workers & Pages → `kang-deok-boo-push` 에서
주소(`https://kang-deok-boo-push.<내 서브도메인>.workers.dev`)를 확인합니다.

이 주소를 GitHub Secret **`PUSH_SERVER_URL`** 로 등록한 뒤,
Actions → **GitHub Pages 배포** → Run workflow로 앱을 다시 배포합니다.

> 앱 주소가 `https://bujabuza-alt.github.io`가 아니라면 `worker/wrangler.toml`의
> `ALLOWED_ORIGINS`를 바꿔 주세요.

## 5. 아이폰에서 켜기

1. Safari로 앱 접속 → 공유 버튼 → **홈 화면에 추가** (이미 했다면 생략)
2. 홈 화면 아이콘으로 앱 실행 → 타임박스 탭 → ⚙ → **이 기기에서 알림 켜기** → 허용
3. 칸 시작 / 미완료 반복 / 정기 체크인 간격을 고릅니다(간격 설정은 동기화된 기기끼리 공유).

알림이 안 오면: 설정 앱 → 알림 → 강덕부 허용 여부, 집중 모드, 그리고
그 시각 전에 앱을 한 번 열어 일정이 올라갔는지 확인하세요.

# 기기 동기화 설정 가이드

강덕부는 원래 각 기기(브라우저)의 `localStorage`에만 데이터를 저장하는
정적 앱이라, 모바일과 데스크탑이 서로 다른 데이터를 가지고 있었습니다.
이 문서는 Firebase(Firestore)를 이용해 모바일/데스크탑이 같은 데이터를
공유하도록 설정하는 절차입니다.

## 동작 방식 요약

- 로그인 없이, **동기화 코드**(임의의 긴 문자열) 하나로 기기들을 연결합니다.
- 같은 코드를 입력한 기기들은 `syncs/{코드}/keys/{키}` 라는 Firestore
  문서를 함께 씁니다.
- 앱을 열면(설정에서 동기화 코드가 연결돼 있는 경우) 클라우드의 데이터가
  로컬보다 최신이면 자동으로 받아와 반영합니다. 데이터를 바꿀 때마다
  자동으로 클라우드에도 올립니다.
- **주의**: 로그인이 없으므로 코드를 아는 사람은 누구나 그 데이터에
  접근할 수 있습니다. 개인용으로 코드를 아무에게도 공유하지 마세요.
  코드는 추측하기 어렵도록 긴 랜덤 문자열로 자동 생성됩니다.

## 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 후 "프로젝트 추가"
2. 프로젝트 이름은 자유롭게 입력 (예: `kang-deok-boo`)
3. Google Analytics는 꺼도 무방합니다.

## 2. Firestore Database 활성화

1. 왼쪽 메뉴 → Build → Firestore Database → "데이터베이스 만들기"
2. 위치는 가까운 리전(예: `asia-northeast3`, 서울) 선택
3. 보안 규칙은 아래 [Firestore 보안 규칙](#3-firestore-보안-규칙-설정) 섹션
   내용으로 교체합니다.

## 3. Firestore 보안 규칙 설정

Firestore Database → 규칙 탭에서 아래 내용으로 저장합니다. (로그인 기능이
없어 서버에서 사용자를 구분할 수 없으므로, 동기화 코드 자체가 비밀번호
역할을 합니다.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /syncs/{code}/keys/{key} {
      allow read, write: if true;
    }
    // 그 외 경로는 모두 차단
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 4. 웹 앱 등록 후 설정값 확인

1. 프로젝트 설정(톱니바퀴) → "내 앱" → 웹 앱 추가(`</>` 아이콘)
2. 앱 닉네임 입력 후 등록 (Firebase Hosting은 사용하지 않으므로 체크 해제)
3. 표시되는 `firebaseConfig` 값 중 다음 4가지를 확인:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

## 5. GitHub Actions 배포에 설정값 등록

이 저장소 → Settings → Secrets and variables → Actions → "New repository
secret"에서 아래 4개를 각각 등록합니다.

| Secret 이름 | 값 |
|---|---|
| `FIREBASE_API_KEY` | 위에서 확인한 `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | 위에서 확인한 `authDomain` |
| `FIREBASE_PROJECT_ID` | 위에서 확인한 `projectId` |
| `FIREBASE_APP_ID` | 위에서 확인한 `appId` |

등록 후 `main` 브랜치에 새 커밋을 푸시하거나, Actions 탭에서 "GitHub Pages
배포" 워크플로우를 수동 실행(workflow_dispatch)하면 다음 빌드부터 동기화
기능이 활성화됩니다.

> 이 값들은 브라우저에 그대로 노출되는 클라이언트 설정값이라 비밀값은
> 아니지만, 실제 접근 제어는 3번의 Firestore 보안 규칙 + 동기화 코드가
> 담당합니다.

## 6. 로컬 개발 환경에서 사용하기 (선택)

`.env.local.example`을 복사해 `.env.local`을 만들고 같은 4개 값을
채워 넣으면 `npm run dev`에서도 동기화가 동작합니다.

## 7. 기기 연결하기

1. 배포가 끝난 뒤 한 기기(예: 모바일)에서 앱을 열고 **설정 → 기기 동기화 →
   "이 기기로 동기화 코드 만들기"**를 누릅니다. 현재 데이터가 클라우드에
   올라가고, 화면에 동기화 코드가 표시됩니다.
2. 다른 기기(예: 데스크탑)에서 같은 앱 주소를 열고 **설정 → 기기 동기화 →
   코드 입력란에 위 코드를 붙여넣고 "연결"**을 누릅니다.
3. 이후 두 기기 모두 앱을 열 때마다 서로의 최신 데이터를 자동으로
   반영합니다.

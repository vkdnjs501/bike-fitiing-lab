# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.5.1

현장 정비사가 빠르게 사용할 수 있도록 만든 안장 높이 피팅 웹앱입니다.

## Beta 1.5.1 핵심 업데이트

- 승인된 **안장 + 세로 싯포스트 줄자** 아이콘 적용
- iPhone / iPad 홈 화면용 Apple Touch Icon 세트 추가
- `manifest.webmanifest` 추가: 홈 화면 실행 이름, 테마, standalone 모드 정의
- `service-worker.js` 추가: 앱 셸 오프라인 캐시 및 업데이트 캐시 정리
- iOS Safari 홈 화면 설치 안내 배너 추가
- `viewport-fit=cover` + safe-area 대응 유지/보강
- iOS 입력창 자동 확대 방지를 위한 모바일 숫자 입력 16px 처리
- Safari standalone 실행 상태 감지 및 레이아웃 미세 조정
- favicon / PWA icon 16, 32, 48, 192, 512, 1024px 세트 추가

## 기존 Beta 1.5 기능

- Bike Pressure Lab 계열의 딥 블랙/네이비 UI + 형광 오렌지 포인트
- `made by. HyunSeock.Son` 시그니처 스타일
- Current → Target → Change 정비사 대시보드
- MINI VELO / ROAD / GRAVEL / HYBRID & CITY / MTB 프리셋
- COMMUTE / ENDURANCE / SPORT 주행 목적
- 카메라 촬영 + 갤러리 불러오기
- 정수리 → 가랑이 → 발끝 3점 인심 측정 및 드래그 미세 보정
- 측정 품질 표시(GOOD / CHECK / LOW)
- 라이딩 증상 체크 및 단계별 Adjustment Plan
- 결과 사진 저장

## 계산 기준

기본 안장 높이는 LeMond 방식의 `인심 × 0.883`을 사용하며, 결과 단위는 **BB 중심 → 안장 상단**입니다.

크랭크 길이를 입력한 경우 170 mm를 중립 기준으로 페달 최하점 도달거리 차이를 현장 참고용으로 보정합니다.

> 이 계산기는 전문 동적 피팅이나 의료적 진단을 대체하지 않습니다.

## GitHub Pages 배포

ZIP의 내용물을 저장소 루트에 그대로 업로드/덮어쓰기 합니다. `icons` 폴더 구조도 유지해야 합니다.

필수 배포 파일:

- `index.html`
- `style.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `apple-touch-icon.png`
- `favicon.ico`
- `icons/` 전체

서비스 워커 업데이트는 `bike-fitting-lab-v1.5.1` 캐시명을 사용하며 이전 Bike Fitting Lab 캐시는 자동 정리됩니다.

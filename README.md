# YEONGDEUNGPO BIKE FITTING LAB — Beta 1.5.0

현장 정비사가 빠르게 사용할 수 있도록 정리한 안장 높이 피팅 웹앱입니다.

## 핵심 업데이트

- Bike Pressure Lab 계열의 딥 블랙/네이비 UI + 형광 오렌지 포인트
- `made by. HyunSeock.Son` 시그니처 스타일
- Current → Target → Change 정비사 대시보드
- MINI VELO / ROAD / GRAVEL / HYBRID & CITY / MTB 프리셋
- COMMUTE / ENDURANCE / SPORT 주행 목적
- 카메라 촬영 + 갤러리 불러오기
- 정수리 → 가랑이 → 발끝 3점 인심 측정
- 3점 완료 후 드래그 미세 보정
- 측정 품질 표시(GOOD / CHECK / LOW)
- 라이딩 증상 체크 및 높은/낮은 안장 가능성 보조 안내
- 5 mm 이하 단계별 Adjustment Plan
- 결과 사진 저장: 3점 선·날짜·인심·Current/Target/Change 포함
- iOS/iPadOS Web Share 지원 시 공유 시트, 미지원 브라우저는 JPG 다운로드

## 계산 기준

기본 안장 높이는 LeMond 방식의 `인심 × 0.883`을 사용하며, 결과 단위는 **BB 중심 → 안장 상단**입니다.

크랭크 길이를 입력한 경우 170 mm를 중립 기준으로 페달 최하점 도달거리 차이를 현장 참고용으로 보정합니다.

> 이 계산기는 전문 동적 피팅이나 의료적 진단을 대체하지 않습니다.

## GitHub Pages 배포

저장소 루트의 `index.html`, `style.css`, `app.js`를 본 폴더 파일로 교체하면 됩니다.

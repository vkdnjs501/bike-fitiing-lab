# Beta 1.5.0 — Field Mechanic Dashboard Update

## 한 줄 요약

**계산기에서 현장형 피팅 어시스턴트로. Current → Target → Change를 중심으로 실제 정비 조정 흐름을 한 화면에 묶었습니다.**

## 주요 변경

- UI 전면 개편: Bike Pressure Lab 톤앤매너 + 형광 오렌지
- 정비사형 Result Dashboard 신설
- Current / Target / Change 3분할 핵심 결과
- 목표 범위 게이지와 RAISE / LOWER / HOLD 판정
- 자전거 타입 + 주행 목적 분리
- RIDER CHECK 증상 보조 분석
- 5 mm 이하 단계별 조정 가이드
- 10–15분 Field Check 안내
- 카메라 + 갤러리 3점 측정 유지 및 드래그 보정 추가
- 측정 품질 GOOD / CHECK / LOW 표시
- 결과 사진 저장물에 Current / Target / Change 추가
- 기존 1.1 설정값 자동 마이그레이션
- 재계산 요청을 requestAnimationFrame으로 묶어 불필요한 연속 계산 감소
- 사진 인심 조회와 상태 메시지 갱신을 분리해 중복 부작용 제거
- LeMond 0.883 기본값 중심으로 계산 로직 단순화
- 선택적 크랭크 길이 보정 추가

## 배포

GitHub Pages 저장소 루트에 `index.html`, `style.css`, `app.js`를 덮어쓰면 됩니다.

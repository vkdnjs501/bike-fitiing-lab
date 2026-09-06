(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const dom = {
    height: $('heightCm'), manualInseam: $('manualInseam'), bb: $('bbHeight'), current: $('currentSaddle'), crank: $('crankLength'),
    analogMode: $('analogMode'), quickFitMode: $('quickFitMode'), photoSection: $('photoSection'), bbField: $('bbField'), currentField: $('currentField'),
    bikeChoices: $('bikeChoices'), purposeChoices: $('purposeChoices'), symptomGrid: $('symptomGrid'),
    video: $('video'), photoCanvas: $('photoCanvas'), sourceCanvas: $('sourceCanvas'), exportCanvas: $('exportCanvas'),
    cameraStage: $('cameraStage'), stageBadge: $('stageBadge'), measureStatus: $('measureStatus'), qualityPill: $('qualityPill'), qualityText: $('qualityText'),
    galleryInput: $('galleryInput'), btnStartCamera: $('btnStartCamera'), btnGallery: $('btnGallery'), btnSwitchCamera: $('btnSwitchCamera'), btnCapture: $('btnCapture'), btnRetake: $('btnRetake'), btnUndoPoint: $('btnUndoPoint'), btnCalculate: $('btnCalculate'), btnSavePhoto: $('btnSavePhoto'), saveHint: $('saveHint'),
    installTip: $('installTip'), btnDismissInstallTip: $('btnDismissInstallTip'),
    resultBikeLine: $('resultBikeLine'), resultMeta: $('resultMeta'), resultState: $('resultState'), targetSaddle: $('targetSaddle'), targetRange: $('targetRange'),
    heroCurrent: $('heroCurrent'), heroTarget: $('heroTarget'), heroChange: $('heroChange'), fitGauge: $('fitGauge'), gaugeCurrent: $('gaugeCurrent'), gaugeCaption: $('gaugeCaption'),
    metricInseam: $('metricInseam'), metricSource: $('metricSource'), metricCrank: $('metricCrank'), metricFloor: $('metricFloor'),
    verdictBadge: $('verdictBadge'), verdictText: $('verdictText'), adjustPlan: $('adjustPlan'), fitAnalysis: $('fitAnalysis'), symptomAnalysis: $('symptomAnalysis'), fieldGuide: $('fieldGuide'),
    quickBadge: $('quickBadge'), quickResultLine: $('quickResultLine'), resultShell: document.querySelector('.result-shell')
  };

  const pctx = dom.photoCanvas.getContext('2d');
  const sctx = dom.sourceCanvas.getContext('2d');
  const ectx = dom.exportCanvas.getContext('2d');
  const tapSteps = [...document.querySelectorAll('#tapSteps li')];

  const BIKE = {
    minivelo: { label: 'MINI VELO', ko: '미니벨로', bb: 281 },
    road: { label: 'ROAD', ko: '로드', bb: 270 },
    gravel: { label: 'GRAVEL', ko: '그래블', bb: 280 },
    hybrid: { label: 'HYBRID & CITY', ko: '하이브리드 · 생활형', bb: 260 },
    mtb: { label: 'MTB', ko: '산악자전거', bb: 300 }
  };
  const PURPOSE = {
    commute: { label: 'COMMUTE', ko: '생활 · 출퇴근', test: '편안한 페달링과 정차 안정감을 함께 확인하세요.' },
    endurance: { label: 'ENDURANCE', ko: '장거리 · 균형', test: '케이던스를 유지하며 무릎과 골반이 자연스럽게 움직이는지 확인하세요.' },
    sport: { label: 'SPORT', ko: '운동 · 빠른 주행', test: '높은 케이던스에서도 골반 흔들림과 발끝 과신전이 없는지 확인하세요.' }
  };
  const POINT_LABELS = ['정수리', '가랑이', '발끝'];
  const BASE_COEFF = 0.883;
  const CRANK_REFERENCE = 170;
  const RANGE_MM = 5;
  const STORE_KEY = 'bfl_1_6_settings';
  const LEGACY_KEY = 'bfl_1_5_settings';

  const state = {
    stream: null,
    facingMode: 'environment',
    hasImage: false,
    points: [],
    dragIndex: -1,
    bike: 'road',
    purpose: 'endurance',
    photoInseam: null,
    result: null,
    sourceName: null,
    recalcFrame: 0,
    analogMode: false,
    quickFit: false
  };

  const num = (el) => {
    const value = Number.parseFloat(el.value);
    return Number.isFinite(value) ? value : null;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const round = (value) => Math.round(value);
  const signed = (value) => `${value >= 0 ? '+' : ''}${round(value)}`;
  const IOS_INSTALL_DISMISS_KEY = 'bfl_ios_install_tip_dismissed';

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isIOSSafari() {
    const ua = navigator.userAgent;
    return isIOSDevice() && /Safari/i.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua);
  }

  function isStandaloneMode() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  function syncIOSAppMode() {
    const standalone = isStandaloneMode();
    document.documentElement.classList.toggle('standalone', standalone);
    if (!dom.installTip) return;
    let dismissed = false;
    try { dismissed = localStorage.getItem(IOS_INSTALL_DISMISS_KEY) === '1'; } catch (_) {}
    dom.installTip.hidden = !(isIOSSafari() && !standalone && !dismissed);
  }

  async function registerServiceWorker() {
    const secureOrigin = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!('serviceWorker' in navigator) || !secureOrigin) return;
    try {
      await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
    } catch (_) {
      // The core fitting tool remains fully usable if service-worker registration is unavailable.
    }
  }

  function setStatus(text, badge) {
    dom.measureStatus.textContent = text;
    if (badge) dom.stageBadge.textContent = badge;
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        height: dom.height.value,
        manualInseam: dom.manualInseam.value,
        analogMode: state.analogMode,
        quickFit: state.quickFit,
        bb: dom.bb.value,
        current: dom.current.value,
        crank: dom.crank.value,
        bike: state.bike,
        purpose: state.purpose
      }));
    } catch (_) {}
  }

  function restoreSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (!raw) { syncChoices(); syncMeasurementModes(); return; }
      const saved = JSON.parse(raw);
      if (saved.height || saved.heightCm) dom.height.value = saved.height || saved.heightCm;
      if (saved.manualInseam) dom.manualInseam.value = saved.manualInseam;
      state.analogMode = saved.analogMode === true;
      state.quickFit = saved.quickFit === true;
      if (saved.bb || saved.bbHeight) dom.bb.value = saved.bb || saved.bbHeight;
      if (saved.current || saved.currentSaddle) dom.current.value = saved.current || saved.currentSaddle;
      if (saved.crank) dom.crank.value = saved.crank;
      if (saved.bike && BIKE[saved.bike]) state.bike = saved.bike;
      if (saved.purpose && PURPOSE[saved.purpose]) state.purpose = saved.purpose;
      else if (saved.fit === 'comfort') state.purpose = 'commute';
      else if (saved.fit === 'sport') state.purpose = 'sport';
    } catch (_) {}
    syncChoices();
    syncMeasurementModes();
  }

  function syncMeasurementModes() {
    dom.analogMode.checked = state.analogMode;
    dom.quickFitMode.checked = state.quickFit;

    dom.photoSection.classList.toggle('mode-disabled', state.analogMode);
    dom.btnStartCamera.disabled = state.analogMode;
    dom.btnGallery.disabled = state.analogMode;
    dom.galleryInput.disabled = state.analogMode;
    if (state.analogMode) {
      stopCamera();
      dom.btnSwitchCamera.disabled = true;
      dom.btnCapture.disabled = true;
      dom.btnRetake.disabled = true;
      dom.btnUndoPoint.disabled = true;
      setStatus('아날로그 측정 활성화: 신장과 줄자로 잰 인심을 직접 입력하고 사진 단계는 건너뜁니다.', 'ANALOG');
    } else {
      dom.btnRetake.disabled = !state.hasImage;
      dom.btnUndoPoint.disabled = !state.points.length;
      if (state.hasImage) setStatus(state.points.length === 3 ? '3점 측정이 준비되었습니다.' : `사진 위에서 ${POINT_LABELS[state.points.length]} 위치를 터치하세요.`, state.points.length === 3 ? 'MEASURED' : `POINT ${state.points.length + 1}/3`);
      else setStatus('사진을 준비한 뒤 정수리 → 가랑이 → 발끝 순서로 터치하세요.', 'READY');
    }

    dom.bb.disabled = state.quickFit;
    dom.current.disabled = state.quickFit;
    dom.bbField.classList.toggle('quick-disabled', state.quickFit);
    dom.currentField.classList.toggle('quick-disabled', state.quickFit);
    dom.resultShell.classList.toggle('quick-mode', state.quickFit);
    dom.quickBadge.hidden = !state.quickFit;
    dom.quickResultLine.hidden = !state.quickFit || !state.result;
    dom.btnCalculate.textContent = state.quickFit ? '간이 피팅값 계산' : '권장 안장 높이 계산';
    updateSaveState();
  }

  function syncChoices() {
    dom.bikeChoices.querySelectorAll('.choice').forEach((button) => button.classList.toggle('active', button.dataset.bike === state.bike));
    dom.purposeChoices.querySelectorAll('.choice').forEach((button) => button.classList.toggle('active', button.dataset.purpose === state.purpose));
    dom.resultBikeLine.textContent = `${BIKE[state.bike].label} · ${PURPOSE[state.purpose].label}`;
  }

  function scheduleRecalc() {
    cancelAnimationFrame(state.recalcFrame);
    state.recalcFrame = requestAnimationFrame(() => {
      if (state.result || num(dom.manualInseam)) calculateFit(false);
      updateSaveState();
    });
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
    dom.btnSwitchCamera.disabled = true;
    dom.btnCapture.disabled = true;
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('이 브라우저에서는 카메라 API를 사용할 수 없습니다. 갤러리 사진을 불러와 주세요.', 'NO CAMERA');
      return;
    }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      state.stream = stream;
      dom.video.srcObject = stream;
      await dom.video.play();
      dom.cameraStage.classList.add('has-media', 'video-mode');
      dom.cameraStage.classList.remove('canvas-mode');
      dom.btnSwitchCamera.disabled = false;
      dom.btnCapture.disabled = false;
      dom.btnRetake.disabled = false;
      setStatus('전신이 프레임 안에 들어오면 촬영하세요.', 'LIVE');
    } catch (_) {
      setStatus('카메라 권한을 확인하거나 갤러리에서 사진을 불러와 주세요.', 'BLOCKED');
    }
  }

  function sizeCanvases(width, height) {
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.max(1, round(width * scale));
    const h = Math.max(1, round(height * scale));
    dom.sourceCanvas.width = dom.photoCanvas.width = w;
    dom.sourceCanvas.height = dom.photoCanvas.height = h;
  }

  function commitSource(draw, name) {
    state.points = [];
    state.photoInseam = null;
    state.hasImage = true;
    state.sourceName = name || 'photo';
    draw();
    dom.cameraStage.classList.add('has-media', 'canvas-mode');
    dom.cameraStage.classList.remove('video-mode');
    dom.btnRetake.disabled = false;
    stopCamera();
    redrawPhoto();
    updateTapSteps();
    updateQuality();
    setStatus('사진 위에서 정수리 위치를 터치하세요.', 'POINT 1/3');
    updateSaveState();
  }

  function captureFrame() {
    if (!dom.video.videoWidth || !dom.video.videoHeight) return;
    sizeCanvases(dom.video.videoWidth, dom.video.videoHeight);
    commitSource(() => sctx.drawImage(dom.video, 0, 0, dom.sourceCanvas.width, dom.sourceCanvas.height), 'camera');
  }

  async function loadGalleryFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('이미지 파일을 선택해 주세요.', 'FILE ERROR');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      sizeCanvases(img.naturalWidth, img.naturalHeight);
      commitSource(() => sctx.drawImage(img, 0, 0, dom.sourceCanvas.width, dom.sourceCanvas.height), file.name || 'gallery');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus('사진을 불러오지 못했습니다. 다른 이미지를 선택해 주세요.', 'FILE ERROR');
    };
    img.src = url;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawOverlay(ctx, points, width, height, exportMode = false) {
    if (!points.length) return;
    const scale = clamp(Math.min(width, height) / 650, 0.8, 2.5);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = `800 ${round(13 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.strokeStyle = 'rgba(255,107,0,.97)';
      ctx.lineWidth = 4 * scale;
      ctx.stroke();
    }

    points.forEach((point, index) => {
      ctx.save();
      ctx.setLineDash([8 * scale, 7 * scale]);
      ctx.strokeStyle = 'rgba(255,176,111,.52)';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, point.y);
      ctx.lineTo(width, point.y);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(point.x, point.y, 11 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b00';
      ctx.fill();
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = '#071018';
      ctx.stroke();

      const label = `${String(index + 1).padStart(2, '0')} ${POINT_LABELS[index]}`;
      const padX = 8 * scale;
      const boxH = 27 * scale;
      const textW = ctx.measureText(label).width;
      let x = point.x + 16 * scale;
      let y = point.y - boxH - 8 * scale;
      if (x + textW + padX * 2 > width) x = point.x - textW - padX * 2 - 16 * scale;
      if (y < 4) y = point.y + 14 * scale;
      ctx.fillStyle = 'rgba(4,10,14,.9)';
      roundedRect(ctx, x, y, textW + padX * 2, boxH, 8 * scale);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + padX, y + 18 * scale);
    });

    if (exportMode && points.length === 3) {
      ctx.fillStyle = 'rgba(4,10,14,.8)';
      roundedRect(ctx, 16 * scale, 16 * scale, 214 * scale, 34 * scale, 9 * scale);
      ctx.fill();
      ctx.fillStyle = '#ffb06f';
      ctx.font = `900 ${round(11 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
      ctx.fillText('3-POINT INSEAM MEASURE', 28 * scale, 38 * scale);
    }
    ctx.restore();
  }

  function redrawPhoto() {
    if (!state.hasImage) return;
    pctx.clearRect(0, 0, dom.photoCanvas.width, dom.photoCanvas.height);
    pctx.drawImage(dom.sourceCanvas, 0, 0);
    drawOverlay(pctx, state.points, dom.photoCanvas.width, dom.photoCanvas.height);
  }

  function updateTapSteps() {
    tapSteps.forEach((item, index) => {
      item.classList.toggle('done', index < state.points.length);
      item.classList.toggle('active', index === state.points.length && state.hasImage && state.points.length < 3);
    });
    dom.btnUndoPoint.disabled = state.points.length === 0;
  }

  function canvasPoint(event) {
    const rect = dom.photoCanvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) * (dom.photoCanvas.width / rect.width), 0, dom.photoCanvas.width),
      y: clamp((event.clientY - rect.top) * (dom.photoCanvas.height / rect.height), 0, dom.photoCanvas.height)
    };
  }

  function nearestPointIndex(point) {
    if (state.points.length !== 3) return -1;
    const rect = dom.photoCanvas.getBoundingClientRect();
    const screenScale = dom.photoCanvas.width / Math.max(rect.width, 1);
    const threshold = 28 * screenScale;
    let best = -1;
    let bestDistance = threshold;
    state.points.forEach((existing, index) => {
      const d = dist(point, existing);
      if (d <= bestDistance) {
        best = index;
        bestDistance = d;
      }
    });
    return best;
  }

  function onCanvasPointerDown(event) {
    if (!state.hasImage) return;
    if (state.points.length === 3) {
      const index = nearestPointIndex(canvasPoint(event));
      if (index >= 0) {
        state.dragIndex = index;
        dom.photoCanvas.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }
    }
  }

  function onCanvasPointerMove(event) {
    if (state.dragIndex < 0) return;
    state.points[state.dragIndex] = canvasPoint(event);
    redrawPhoto();
    event.preventDefault();
  }

  function onCanvasPointerUp(event) {
    if (!state.hasImage) return;
    if (state.dragIndex >= 0) {
      state.dragIndex = -1;
      dom.photoCanvas.releasePointerCapture?.(event.pointerId);
      computePhotoInseam(true);
      updateQuality();
      calculateFit(false);
      event.preventDefault();
      return;
    }
    if (state.points.length >= 3) return;
    state.points.push(canvasPoint(event));
    redrawPhoto();
    updateTapSteps();
    updateQuality();
    if (state.points.length < 3) {
      setStatus(`다음: ${POINT_LABELS[state.points.length]} 위치를 터치하세요.`, `POINT ${state.points.length + 1}/3`);
    } else {
      computePhotoInseam(true);
      calculateFit(false);
    }
    updateSaveState();
  }

  function computeQuality() {
    if (state.points.length !== 3) return { level: 'idle', text: '—' };
    const [head, crotch, toe] = state.points;
    if (!(head.y < crotch.y && crotch.y < toe.y)) return { level: 'poor', text: 'POINT CHECK' };
    const vertical = Math.max(1, toe.y - head.y);
    const xSpread = Math.max(head.x, crotch.x, toe.x) - Math.min(head.x, crotch.x, toe.x);
    const alignment = xSpread / vertical;
    const coverage = vertical / Math.max(dom.photoCanvas.height, 1);
    if (coverage >= 0.55 && alignment <= 0.10) return { level: 'good', text: 'GOOD' };
    if (coverage >= 0.38 && alignment <= 0.20) return { level: 'check', text: 'CHECK' };
    return { level: 'poor', text: 'LOW' };
  }

  function updateQuality() {
    const quality = computeQuality();
    dom.qualityPill.dataset.level = quality.level;
    dom.qualityText.textContent = quality.text;
  }

  function computePhotoInseam(announce = false) {
    if (state.points.length !== 3) return null;
    const height = num(dom.height);
    if (!height || height < 100 || height > 230) {
      state.photoInseam = null;
      if (announce) setStatus('3점은 기록되었습니다. 신장을 입력하면 인심을 계산합니다.', 'NEED HEIGHT');
      return null;
    }
    const [head, crotch, toe] = state.points;
    const fullPx = dist(head, toe);
    const inseamPx = dist(crotch, toe);
    if (fullPx < 20 || inseamPx < 10 || inseamPx >= fullPx || !(head.y < crotch.y && crotch.y < toe.y)) {
      state.photoInseam = null;
      if (announce) setStatus('점 위치를 확인해 주세요. 정수리 → 가랑이 → 발끝 순서가 필요합니다.', 'POINT ERROR');
      return null;
    }
    state.photoInseam = height * 10 * (inseamPx / fullPx);
    if (announce) {
      setStatus(`사진 인심 ${round(state.photoInseam)} mm 측정 완료. 오렌지 점을 드래그해 미세 보정할 수 있습니다.`, 'MEASURED');
    }
    return state.photoInseam;
  }

  function resolveInseam() {
    const manual = num(dom.manualInseam);
    if (manual && manual >= 450 && manual <= 1100) {
      if (state.analogMode) return { value: manual, source: 'ANALOG', sourceKo: '아날로그 줄자 실측' };
      return { value: manual, source: 'MANUAL', sourceKo: '직접 입력' };
    }
    const photo = computePhotoInseam(false);
    if (photo) return { value: photo, source: 'PHOTO', sourceKo: '사진 3점 측정' };
    return null;
  }

  function crankCorrection() {
    const crank = num(dom.crank);
    if (!crank || crank < 140 || crank > 190) return { value: 0, crank: null, applied: false };
    return { value: CRANK_REFERENCE - crank, crank, applied: true };
  }

  function symptomAdvice() {
    const checked = [...dom.symptomGrid.querySelectorAll('input:checked')].map((input) => input.value);
    if (!checked.length) return '선택된 증상이 없습니다. 결과값을 시작점으로 두고 실제 페달링과 골반 안정성을 확인하세요.';
    const highSignals = checked.filter((value) => ['hip-rock', 'toe-reach', 'back-knee'].includes(value));
    const lowSignals = checked.filter((value) => ['front-knee', 'quad-fatigue'].includes(value));
    const unstable = checked.includes('stop-unstable');
    let text;
    if (highSignals.length >= 2 && highSignals.length > lowSignals.length) {
      text = '<strong>높은 안장 가능성 신호가 우세합니다.</strong> 골반 흔들림·발끝 과신전·무릎 뒤쪽 당김이 함께 나타나면 현재 높이를 낮추는 방향으로 재확인하세요.';
    } else if (lowSignals.length >= 2 && lowSignals.length > highSignals.length) {
      text = '<strong>낮은 안장 가능성 신호가 우세합니다.</strong> 무릎 앞쪽 압박과 대퇴부 피로가 함께 나타나면 현재 높이를 조금씩 올리는 방향으로 재확인하세요.';
    } else {
      text = '<strong>증상 신호가 혼합되어 있습니다.</strong> 안장 높이만으로 원인을 단정하지 말고 안장 전후 위치, 페달/클릿, 자세와 주행량도 함께 확인하세요.';
    }
    if (unstable) text += ' 정차 불안은 안장 높이 외에도 프레임 크기와 숙련도 영향을 받습니다.';
    return text;
  }

  function buildAdjustmentPlan(target, current) {
    if (!current) return '현재 안장 높이를 <strong>BB 중심 → 안장 상단</strong> 기준으로 입력하면 목표값까지 단계별 조정량을 표시합니다.';
    const delta = round(target - current);
    if (Math.abs(delta) <= 3) return `<span class="orange">현재 ${round(current)} mm → 목표 ${round(target)} mm</span><br>차이가 ${Math.abs(delta)} mm라 우선 현재 세팅을 유지하고 주행감만 확인하세요.`;
    const symbol = delta > 0 ? '↑' : '↓';
    const direction = delta > 0 ? '올리기' : '내리기';
    const total = Math.abs(delta);
    const rows = [];
    let remaining = total;
    let step = 1;
    while (remaining > 0 && step <= 6) {
      const amount = Math.min(5, remaining);
      rows.push(`<div class="step-row"><span class="step-no">${String(step).padStart(2, '0')}</span><strong>${symbol} ${amount} mm ${direction}</strong><span class="muted">조정 후 짧은 테스트 라이딩</span></div>`);
      remaining -= amount;
      step += 1;
    }
    if (remaining > 0) rows.push(`<div class="step-row"><span class="step-no">…</span><strong>남은 ${remaining} mm</strong><span class="muted">한 번에 바꾸지 말고 여러 회차로 나누어 조정</span></div>`);
    return `<div><span class="orange">CURRENT ${round(current)} → TARGET ${round(target)} mm (${symbol}${total} mm)</span></div>${rows.join('')}`;
  }

  function verdict(target, current) {
    if (!current) return { code: 'idle', label: 'NEED CURRENT', text: '현재 안장 높이를 입력하면 올리기/내리기/유지 판정을 표시합니다.' };
    const delta = round(target - current);
    if (Math.abs(delta) <= 3) return { code: 'hold', label: 'HOLD', text: `현재값 ${round(current)} mm이 목표 ${round(target)} mm와 매우 가깝습니다. 먼저 그대로 테스트하세요.` };
    if (delta > 0) return { code: 'raise', label: 'RAISE', text: `현재 안장을 총 ${Math.abs(delta)} mm 올리는 방향입니다. 한 번에 크게 바꾸지 말고 5 mm 이하로 나누어 확인하세요.` };
    return { code: 'lower', label: 'LOWER', text: `현재 안장을 총 ${Math.abs(delta)} mm 내리는 방향입니다. 한 번에 크게 바꾸지 말고 5 mm 이하로 나누어 확인하세요.` };
  }

  function updateGauge(target, current) {
    if (state.quickFit) {
      dom.fitGauge.dataset.state = 'idle';
      dom.gaugeCaption.textContent = '간이피팅에서는 CURRENT 비교를 생략하고 TARGET 값만 제공합니다.';
      return;
    }
    if (!current) {
      dom.fitGauge.dataset.state = 'idle';
      dom.gaugeCaption.textContent = '현재 안장 높이를 입력하면 목표 대비 위치가 표시됩니다.';
      return;
    }
    const delta = current - target;
    const position = clamp(50 + (delta / 25) * 46, 4, 96);
    dom.fitGauge.dataset.state = 'ready';
    dom.gaugeCurrent.style.left = `${position}%`;
    if (Math.abs(delta) <= RANGE_MM) dom.gaugeCaption.textContent = `현재값은 권장 확인 범위 안에 있습니다. (${signed(-delta)} mm to target)`;
    else if (delta < 0) dom.gaugeCaption.textContent = `현재 안장이 목표보다 ${round(Math.abs(delta))} mm 낮습니다.`;
    else dom.gaugeCaption.textContent = `현재 안장이 목표보다 ${round(Math.abs(delta))} mm 높습니다.`;
  }

  function updateFieldGuide() {
    const purpose = PURPOSE[state.purpose];
    dom.fieldGuide.innerHTML = `<div><b>01</b><span>5 mm 이하 작은 폭으로 조정</span></div><div><b>02</b><span>10–15분 테스트 라이딩</span></div><div><b>03</b><span>${purpose.test}</span></div>`;
  }

  function calculateFit(scroll = true) {
    if (state.analogMode) {
      const height = num(dom.height);
      const manual = num(dom.manualInseam);
      if (!height || height < 100 || height > 230 || !manual || manual < 450 || manual > 1100) {
        state.result = null;
        dom.resultState.textContent = 'NEED ANALOG';
        dom.fitAnalysis.textContent = '아날로그 측정에서는 신장(cm)과 줄자로 측정한 인심(mm)을 모두 입력해 주세요.';
        dom.quickResultLine.hidden = true;
        return false;
      }
    }
    const inseam = resolveInseam();
    if (!inseam) {
      state.result = null;
      dom.resultState.textContent = 'NEED MEASURE';
      dom.fitAnalysis.textContent = '신장과 3점 사진 측정을 완료하거나 인심을 직접 입력해 주세요.';
      return false;
    }

    const bb = state.quickFit ? null : (num(dom.bb) || 0);
    const current = state.quickFit ? null : num(dom.current);
    const crank = crankCorrection();
    const baseTarget = inseam.value * BASE_COEFF;
    const target = baseTarget + crank.value;
    const floor = bb == null ? null : target + bb;
    const delta = current ? target - current : null;
    const judgement = verdict(target, current);

    state.result = { inseam: inseam.value, source: inseam.source, sourceKo: inseam.sourceKo, target, baseTarget, floor, current, delta, bb, bike: state.bike, purpose: state.purpose, crank, quickFit: state.quickFit, analogMode: state.analogMode };

    dom.resultState.textContent = state.quickFit ? 'QUICK FIT' : 'CALCULATED';
    dom.targetSaddle.textContent = round(target);
    dom.targetRange.textContent = `권장 확인 범위 ${round(target - RANGE_MM)}–${round(target + RANGE_MM)} mm`;
    dom.heroCurrent.textContent = state.quickFit ? 'SKIP' : (current ? round(current) : '—');
    dom.heroTarget.textContent = round(target);
    dom.heroChange.textContent = state.quickFit ? 'SKIP' : (delta == null ? '—' : signed(delta));
    dom.resultBikeLine.textContent = `${BIKE[state.bike].label} · ${PURPOSE[state.purpose].label}`;
    dom.resultMeta.textContent = state.quickFit
      ? (crank.applied ? `QUICK · LeMond 0.883 · CRANK ${crank.crank} mm corrected` : 'QUICK · LeMond 0.883 · BB CENTER → SADDLE TOP')
      : (crank.applied ? `LeMond 0.883 · CRANK ${crank.crank} mm corrected` : 'LeMond 0.883 · BB CENTER → SADDLE TOP');
    dom.metricInseam.textContent = round(inseam.value);
    dom.metricSource.textContent = inseam.source;
    dom.metricCrank.textContent = crank.applied ? crank.crank : '—';
    dom.metricFloor.textContent = floor == null ? 'SKIP' : round(floor);
    if (state.quickFit) {
      dom.verdictBadge.dataset.verdict = 'idle';
      dom.verdictBadge.textContent = 'QUICK FIT';
      dom.verdictText.textContent = `현재 안장 실측을 생략한 간이 결과입니다. BB 중심 → 안장 상단 ${round(target)} mm를 현장 시작값으로 적용한 뒤 3–5 mm 범위에서 주행감으로 미세 조정하세요.`;
      dom.adjustPlan.innerHTML = `<span class="orange">간이 측정값 ${round(target)} mm</span><br>현재 안장값이 없어 RAISE / LOWER 단계 계산은 생략합니다. 목표값 부근으로 맞춘 뒤 짧은 테스트 라이딩으로 확인하세요.`;
    } else {
      dom.verdictBadge.dataset.verdict = judgement.code;
      dom.verdictBadge.textContent = judgement.label;
      dom.verdictText.textContent = judgement.text;
      dom.adjustPlan.innerHTML = buildAdjustmentPlan(target, current);
    }
    dom.symptomAnalysis.innerHTML = symptomAdvice();
    updateGauge(target, current);
    dom.quickBadge.hidden = !state.quickFit;
    dom.quickResultLine.hidden = !state.quickFit;
    if (state.quickFit) dom.quickResultLine.innerHTML = `간이 측정값: <strong>${round(target)} mm</strong>`;
    updateFieldGuide();

    const crankText = crank.applied
      ? ` 선택 크랭크 ${crank.crank} mm에 대해 170 mm 기준 대비 <strong>${signed(crank.value)} mm</strong> 보정을 적용했습니다.`
      : ' 크랭크 길이는 미입력되어 별도 보정을 적용하지 않았습니다.';
    const floorText = floor == null ? ' 간이피팅에서는 BB 지면 높이를 생략해 FLOOR REF.를 계산하지 않습니다.' : ` 지면 참고값은 ${round(floor)} mm입니다.`;
    const modeText = state.quickFit ? ' <strong>QUICK MEASUREMENT</strong> 모드로 현재 안장과 BB 지면 입력을 생략했습니다.' : '';
    dom.fitAnalysis.innerHTML = `<strong>${inseam.sourceKo}</strong> 인심 <span class="orange">${round(inseam.value)} mm</span> × 0.883 = 기본 <strong>${round(baseTarget)} mm</strong>.${crankText} 최종 BB 기준 목표는 <span class="orange">${round(target)} mm</span>.${floorText}${modeText}`;

    updateSaveState();
    saveSettings();
    if (scroll && window.innerWidth < 861) document.querySelector('.result-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  function updateSaveState() {
    const ready = !state.analogMode && state.hasImage && state.points.length === 3 && !!resolveInseam();
    dom.btnSavePhoto.disabled = !ready;
    if (state.analogMode) dom.saveHint.textContent = '아날로그 측정은 사진을 사용하지 않으므로 결과 사진 저장 기능이 비활성화됩니다.';
    else if (ready) dom.saveHint.textContent = '저장 이미지에는 3개 기준점·연결선·날짜·인심·Current→Target→Change가 함께 기록됩니다.';
    else dom.saveHint.textContent = '사진 3점 측정을 완료하면 측정 기준선과 피팅 결과를 이미지로 저장할 수 있습니다.';
  }

  function formatDate() {
    const d = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function drawExport() {
    if (!state.hasImage || state.points.length !== 3) return false;
    if (!state.result && !calculateFit(false)) return false;
    const result = state.result;
    if (!result) return false;

    const width = dom.sourceCanvas.width;
    const photoHeight = dom.sourceCanvas.height;
    const footerHeight = Math.max(260, round(width * 0.28));
    dom.exportCanvas.width = width;
    dom.exportCanvas.height = photoHeight + footerHeight;

    ectx.fillStyle = '#071018';
    ectx.fillRect(0, 0, width, dom.exportCanvas.height);
    ectx.drawImage(dom.sourceCanvas, 0, 0);
    drawOverlay(ectx, state.points, width, photoHeight, true);

    const scale = clamp(width / 1100, 0.7, 1.55);
    const y = photoHeight;
    const pad = round(34 * scale);
    ectx.fillStyle = '#08131b';
    ectx.fillRect(0, y, width, footerHeight);
    ectx.fillStyle = '#ff6b00';
    ectx.fillRect(0, y, width, Math.max(4, round(5 * scale)));

    ectx.textBaseline = 'alphabetic';
    ectx.fillStyle = '#ffb06f';
    ectx.font = `800 ${round(15 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText('YEONGDEUNGPO BIKE FITTING LAB', pad, y + round(40 * scale));
    ectx.fillStyle = '#91a5af';
    ectx.font = `500 ${round(13 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText(`${formatDate()}  ·  ${BIKE[result.bike].label} / ${PURPOSE[result.purpose].label}`, pad, y + round(66 * scale));

    ectx.fillStyle = '#edf4f7';
    ectx.font = `900 ${round(39 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText(`INSEAM  ${round(result.inseam)} mm`, pad, y + round(118 * scale));

    ectx.fillStyle = '#cbd6db';
    ectx.font = `800 ${round(19 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    const current = result.current ? `${round(result.current)} mm` : '—';
    const change = result.delta == null ? '—' : `${signed(result.delta)} mm`;
    ectx.fillText(`CURRENT ${current}   →   TARGET ${round(result.target)} mm   ·   CHANGE ${change}`, pad, y + round(158 * scale));

    ectx.fillStyle = '#ff9a51';
    ectx.font = `800 ${round(15 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText(`TARGET RANGE ${round(result.target - RANGE_MM)}–${round(result.target + RANGE_MM)} mm`, pad, y + round(191 * scale));

    ectx.fillStyle = '#738995';
    ectx.font = `500 ${round(12 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText('BB CENTER → SADDLE TOP · LeMond 0.883 field reference', pad, y + round(222 * scale));
    return true;
  }

  async function saveResultPhoto() {
    if (!drawExport()) return;
    dom.saveHint.textContent = '결과 이미지를 생성 중입니다.';
    dom.exportCanvas.toBlob(async (blob) => {
      if (!blob) {
        dom.saveHint.textContent = '이미지 생성에 실패했습니다. 다시 시도해 주세요.';
        return;
      }
      const now = new Date();
      const pad = (value) => String(value).padStart(2, '0');
      const filename = `bike-fitting-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });
      try {
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
          await navigator.share({ files: [file], title: 'Bike Fitting Lab 결과 사진', text: '피팅 측정 결과 이미지' });
          dom.saveHint.textContent = '공유 시트가 열렸습니다. iPhone/iPad에서는 “이미지 저장”을 선택하면 사진 앱에 보관할 수 있습니다.';
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          dom.saveHint.textContent = '저장이 취소되었습니다. 버튼을 누르면 다시 시도할 수 있습니다.';
          return;
        }
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      dom.saveHint.textContent = '결과 이미지를 저장했습니다. 브라우저에 따라 다운로드 폴더 또는 이미지 저장 메뉴에서 확인하세요.';
    }, 'image/jpeg', 0.92);
  }

  function resetPhoto() {
    stopCamera();
    state.points = [];
    state.photoInseam = null;
    state.hasImage = false;
    state.result = null;
    dom.sourceCanvas.width = dom.sourceCanvas.height = dom.photoCanvas.width = dom.photoCanvas.height = 1;
    dom.cameraStage.classList.remove('has-media', 'canvas-mode', 'video-mode');
    dom.stageBadge.textContent = 'READY';
    updateTapSteps();
    updateQuality();
    updateSaveState();
    setStatus('새로 촬영하거나 갤러리에서 사진을 불러오세요.', 'READY');
  }

  dom.bikeChoices.addEventListener('click', (event) => {
    const button = event.target.closest('.choice');
    if (!button) return;
    state.bike = button.dataset.bike;
    dom.bb.value = button.dataset.bb || BIKE[state.bike].bb;
    if (state.bike === 'minivelo' || state.bike === 'hybrid') state.purpose = 'commute';
    else if (state.bike === 'road' || state.bike === 'gravel') state.purpose = 'endurance';
    syncChoices();
    saveSettings();
    scheduleRecalc();
  });

  dom.purposeChoices.addEventListener('click', (event) => {
    const button = event.target.closest('.choice');
    if (!button) return;
    state.purpose = button.dataset.purpose;
    syncChoices();
    updateFieldGuide();
    saveSettings();
    scheduleRecalc();
  });

  dom.analogMode.addEventListener('change', () => {
    state.analogMode = dom.analogMode.checked;
    syncMeasurementModes();
    saveSettings();
    scheduleRecalc();
  });

  dom.quickFitMode.addEventListener('change', () => {
    state.quickFit = dom.quickFitMode.checked;
    syncMeasurementModes();
    saveSettings();
    scheduleRecalc();
  });

  [dom.height, dom.manualInseam, dom.bb, dom.current, dom.crank].forEach((input) => input.addEventListener('input', () => {
    if (input === dom.height && state.points.length === 3) computePhotoInseam(true);
    saveSettings();
    scheduleRecalc();
  }));

  dom.symptomGrid.addEventListener('change', () => {
    if (state.result) dom.symptomAnalysis.innerHTML = symptomAdvice();
  });

  dom.btnStartCamera.addEventListener('click', startCamera);
  dom.btnSwitchCamera.addEventListener('click', async () => {
    state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
    await startCamera();
  });
  dom.btnCapture.addEventListener('click', captureFrame);
  dom.btnGallery.addEventListener('click', () => dom.galleryInput.click());
  dom.galleryInput.addEventListener('change', () => loadGalleryFile(dom.galleryInput.files?.[0]));
  dom.btnRetake.addEventListener('click', resetPhoto);
  dom.btnUndoPoint.addEventListener('click', () => {
    if (!state.points.length) return;
    state.points.pop();
    state.photoInseam = null;
    redrawPhoto();
    updateTapSteps();
    updateQuality();
    setStatus(`${POINT_LABELS[state.points.length]} 위치를 다시 터치하세요.`, `POINT ${state.points.length + 1}/3`);
    updateSaveState();
  });
  dom.photoCanvas.addEventListener('pointerdown', onCanvasPointerDown);
  dom.photoCanvas.addEventListener('pointermove', onCanvasPointerMove);
  dom.photoCanvas.addEventListener('pointerup', onCanvasPointerUp);
  dom.photoCanvas.addEventListener('pointercancel', () => { state.dragIndex = -1; });
  dom.btnCalculate.addEventListener('click', () => calculateFit(true));
  dom.btnSavePhoto.addEventListener('click', saveResultPhoto);
  dom.btnDismissInstallTip?.addEventListener('click', () => {
    try { localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1'); } catch (_) {}
    dom.installTip.hidden = true;
  });
  window.addEventListener('pagehide', stopCamera);
  window.addEventListener('pageshow', syncIOSAppMode);
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', syncIOSAppMode);
  window.addEventListener('load', registerServiceWorker, { once: true });

  syncIOSAppMode();
  restoreSettings();
  syncMeasurementModes();
  updateTapSteps();
  updateQuality();
  updateFieldGuide();
})();

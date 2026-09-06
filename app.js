(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const dom = {
    height: $('heightCm'), manualInseam: $('manualInseam'), bb: $('bbHeight'), current: $('currentSaddle'), crank: $('crankLength'),
    analogMode: $('analogMode'), quickFitMode: $('quickFitMode'), photoSection: $('photoSection'), bbField: $('bbField'), currentField: $('currentField'), crankField: $('crankField'),
    bikeChoices: $('bikeChoices'), purposeChoices: $('purposeChoices'), symptomGrid: $('symptomGrid'),
    video: $('video'), photoCanvas: $('photoCanvas'), sourceCanvas: $('sourceCanvas'), exportCanvas: $('exportCanvas'),
    cameraStage: $('cameraStage'), stageBadge: $('stageBadge'), measureStatus: $('measureStatus'), qualityPill: $('qualityPill'), qualityText: $('qualityText'),
    galleryInput: $('galleryInput'), btnStartCamera: $('btnStartCamera'), btnGallery: $('btnGallery'), btnSwitchCamera: $('btnSwitchCamera'), btnCapture: $('btnCapture'), btnRetake: $('btnRetake'), btnUndoPoint: $('btnUndoPoint'), btnCalculate: $('btnCalculate'), btnSavePhoto: $('btnSavePhoto'), saveHint: $('saveHint'),
    installTip: $('installTip'), btnDismissInstallTip: $('btnDismissInstallTip'),
    resultBikeLine: $('resultBikeLine'), resultMeta: $('resultMeta'), resultState: $('resultState'), targetSaddle: $('targetSaddle'), targetRange: $('targetRange'),
    heroCurrent: $('heroCurrent'), heroTarget: $('heroTarget'), heroChange: $('heroChange'), fitGauge: $('fitGauge'), gaugeCurrent: $('gaugeCurrent'), gaugeCaption: $('gaugeCaption'),
    metricInseam: $('metricInseam'), metricSource: $('metricSource'), metricCrank: $('metricCrank'), metricFloor: $('metricFloor'),
    verdictBadge: $('verdictBadge'), verdictText: $('verdictText'), adjustPlan: $('adjustPlan'), fitAnalysis: $('fitAnalysis'), symptomAnalysis: $('symptomAnalysis'), fieldGuide: $('fieldGuide'),
    quickBadge: $('quickBadge'), quickResultLine: $('quickResultLine'), proBadge: $('proBadge'), proResultLine: $('proResultLine'), resultShell: document.querySelector('.result-shell'),
    usageErrorCard: $('usageErrorCard'), usageErrorState: $('usageErrorState'), usageErrorList: $('usageErrorList')
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
    commute: { label: 'COMMUTE', ko: '생활 · 출퇴근', quickTrim: -3, test: '편안한 페달링과 정차 안정감을 함께 확인하세요.' },
    endurance: { label: 'ENDURANCE', ko: '장거리 · 균형', quickTrim: 0, test: '케이던스를 유지하며 무릎과 골반이 자연스럽게 움직이는지 확인하세요.' },
    sport: { label: 'SPORT', ko: '운동 · 빠른 주행', quickTrim: 3, test: '높은 케이던스에서도 골반 흔들림과 발끝 과신전이 없는지 확인하세요.' }
  };
  const POINT_LABELS = ['정수리', '가랑이', '발끝'];
  const BASE_COEFF = 0.883;
  const CRANK_REFERENCE = 170;
  const RANGE_MM = 5; // internal millimeters; UI is centimeters
  const STORE_KEY = 'bfl_1_6_6_cm_settings';
  const LEGACY_KEYS = ['bfl_1_6_5_settings', 'bfl_1_6_4_settings', 'bfl_1_6_3_settings', 'bfl_1_6_2_settings', 'bfl_1_6_1_cm_settings', 'bfl_1_6_1_settings', 'bfl_1_6_settings', 'bfl_1_5_settings'];

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
  const cmToMm = (value) => Number.isFinite(value) ? value * 10 : null;
  const formatCm = (valueMm) => Number.isFinite(valueMm) ? (valueMm / 10).toFixed(1) : '—';
  const signedCm = (valueMm) => Number.isFinite(valueMm) ? `${valueMm >= 0 ? '+' : ''}${(valueMm / 10).toFixed(1)}` : '—';
  const inputCmToMm = (el) => cmToMm(num(el));
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
      await navigator.serviceWorker.register('./service-worker.js?v=1.6.6-cm-ui1', { scope: './', updateViaCache: 'none' });
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
        manualInseamCm: dom.manualInseam.value,
        analogMode: state.analogMode,
        quickFit: state.quickFit,
        bbCm: dom.bb.value,
        currentCm: dom.current.value,
        crankCm: dom.crank.value,
        bike: state.bike,
        purpose: state.purpose
      }));
    } catch (_) {}
  }

  function restoreSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!raw) { syncChoices(); syncMeasurementModes(); return; }
      const saved = JSON.parse(raw);
      if (saved.height || saved.heightCm) dom.height.value = saved.height || saved.heightCm;
      if (saved.manualInseamCm) {
        dom.manualInseam.value = saved.manualInseamCm;
      } else if (saved.manualInseam) {
        // Beta 1.6.1 and earlier stored direct inseam input in millimeters.
        // Migrate it to the new centimeter UI without changing the internal fitting calculation.
        const legacyInseam = Number.parseFloat(saved.manualInseam);
        if (Number.isFinite(legacyInseam)) dom.manualInseam.value = legacyInseam > 110 ? (legacyInseam / 10).toFixed(1) : legacyInseam;
      }
      state.analogMode = saved.analogMode === true;
      state.quickFit = saved.quickFit === true;
      if (state.analogMode) state.quickFit = false;
      const migrateLengthCm = (value, threshold) => {
        const n = Number.parseFloat(value);
        if (!Number.isFinite(n)) return '';
        return n > threshold ? (n / 10).toFixed(1) : String(n);
      };
      if (saved.bbCm != null) dom.bb.value = saved.bbCm;
      else if (saved.bb != null || saved.bbHeight != null) dom.bb.value = migrateLengthCm(saved.bb ?? saved.bbHeight, 100);
      if (saved.currentCm != null) dom.current.value = saved.currentCm;
      else if (saved.current != null || saved.currentSaddle != null) dom.current.value = migrateLengthCm(saved.current ?? saved.currentSaddle, 200);
      if (saved.crankCm != null) dom.crank.value = saved.crankCm;
      else if (saved.crank != null) dom.crank.value = migrateLengthCm(saved.crank, 50);
      if (saved.bike && BIKE[saved.bike]) state.bike = saved.bike;
      if (saved.purpose && PURPOSE[saved.purpose]) state.purpose = saved.purpose;
      else if (saved.fit === 'comfort') state.purpose = 'commute';
      else if (saved.fit === 'sport') state.purpose = 'sport';
    } catch (_) {}
    syncChoices();
    syncMeasurementModes();
  }

  function enforceModeInvariants() {
    // ANALOG numeric fitting and QUICK fitting are mutually exclusive.
    // Direct numeric / analog measurement always has PRO priority.
    if (state.analogMode) state.quickFit = false;
  }

  function measurementMode() {
    enforceModeInvariants();
    if (state.analogMode) return 'professional';
    if (state.quickFit) return 'quick';
    return 'standard';
  }

  function resultMode() {
    // Once calculated, render badges from the mode that produced that result.
    // This prevents stale UI state from reclassifying a PRO result as QUICK.
    return state.result?.measurementMode || measurementMode();
  }

  function syncResultModeBadges() {
    const mode = resultMode();
    const hasResult = !!state.result;
    dom.quickBadge.hidden = !(hasResult && mode === 'quick');
    dom.proBadge.hidden = !(hasResult && mode === 'professional');
    dom.resultShell.classList.toggle('quick-mode', hasResult && mode === 'quick');
    dom.resultShell.classList.toggle('professional-mode', hasResult && mode === 'professional');
    dom.resultState.dataset.mode = hasResult ? mode : 'idle';
    if (!hasResult) {
      dom.quickResultLine.hidden = true;
      dom.proResultLine.hidden = true;
    }
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

    // Prevent any stale/conflicting ANALOG + QUICK state.
    enforceModeInvariants();
    dom.quickFitMode.checked = state.quickFit;
    dom.quickFitMode.disabled = state.analogMode;
    dom.quickFitMode.closest('.mode-switch')?.classList.toggle('is-disabled', state.analogMode);

    const isQuick = !state.analogMode && state.quickFit;
    dom.bb.disabled = isQuick;
    dom.current.disabled = isQuick;
    dom.crank.disabled = isQuick;
    dom.bbField.classList.toggle('quick-disabled', isQuick);
    dom.currentField.classList.toggle('quick-disabled', isQuick);
    dom.crankField.classList.toggle('quick-disabled', isQuick);
    syncResultModeBadges();
    dom.quickResultLine.hidden = measurementMode() !== 'quick' || !state.result;
    dom.proResultLine.hidden = measurementMode() !== 'professional' || !state.result;
    dom.btnCalculate.textContent = state.analogMode ? '전문가 피팅값 계산' : (isQuick ? '간이 피팅값 계산' : '권장 안장 높이 계산');
    updateSaveState();
    updateUsagePanel();
  }

  function syncChoices() {
    dom.bikeChoices.querySelectorAll('.choice').forEach((button) => button.classList.toggle('active', button.dataset.bike === state.bike));
    dom.purposeChoices.querySelectorAll('.choice').forEach((button) => button.classList.toggle('active', button.dataset.purpose === state.purpose));
    dom.resultBikeLine.textContent = `${BIKE[state.bike].label} · ${PURPOSE[state.purpose].label}`;
  }

  function scheduleRecalc() {
    cancelAnimationFrame(state.recalcFrame);
    state.recalcFrame = requestAnimationFrame(() => {
      updateUsagePanel();
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
      setStatus(`사진 인심 ${formatCm(state.photoInseam)} cm 측정 완료. 오렌지 점을 드래그해 미세 보정할 수 있습니다.`, 'MEASURED');
    }
    return state.photoInseam;
  }

  function resolveInseam() {
    const manualCm = num(dom.manualInseam);
    if (manualCm && manualCm >= 45 && manualCm <= 110) {
      const manualMm = manualCm * 10;
      if (state.analogMode) return { value: manualMm, source: 'ANALOG', sourceKo: '아날로그 줄자 실측' };
      return { value: manualMm, source: 'MANUAL', sourceKo: '직접 입력' };
    }
    const photo = computePhotoInseam(false);
    if (photo) return { value: photo, source: 'PHOTO', sourceKo: '사진 3점 측정' };
    return null;
  }

  function crankCorrection(skip = false) {
    // Quick Fitting intentionally omits crank input/correction. A value saved from a previous full-fit session must not affect the quick result.
    if (skip) return { value: 0, crank: null, applied: false };
    const crank = inputCmToMm(dom.crank);
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
    if (Math.abs(delta) <= 3) return `<span class="orange">현재 ${formatCm(current)} cm → 목표 ${formatCm(target)} cm</span><br>차이가 ${formatCm(Math.abs(delta))} cm라 우선 현재 세팅을 유지하고 주행감만 확인하세요.`;
    const symbol = delta > 0 ? '↑' : '↓';
    const direction = delta > 0 ? '올리기' : '내리기';
    const total = Math.abs(delta);
    const rows = [];
    let remaining = total;
    let step = 1;
    while (remaining > 0 && step <= 6) {
      const amount = Math.min(5, remaining);
      rows.push(`<div class="step-row"><span class="step-no">${String(step).padStart(2, '0')}</span><strong>${symbol} ${formatCm(amount)} cm ${direction}</strong><span class="muted">조정 후 짧은 테스트 라이딩</span></div>`);
      remaining -= amount;
      step += 1;
    }
    if (remaining > 0) rows.push(`<div class="step-row"><span class="step-no">…</span><strong>남은 ${formatCm(remaining)} cm</strong><span class="muted">한 번에 바꾸지 말고 여러 회차로 나누어 조정</span></div>`);
    return `<div><span class="orange">CURRENT ${formatCm(current)} → TARGET ${formatCm(target)} cm (${symbol}${formatCm(total)} cm)</span></div>${rows.join('')}`;
  }

  function verdict(target, current) {
    if (!current) return { code: 'idle', label: 'NEED CURRENT', text: '현재 안장 높이를 입력하면 올리기/내리기/유지 판정을 표시합니다.' };
    const delta = round(target - current);
    if (Math.abs(delta) <= 3) return { code: 'hold', label: 'HOLD', text: `현재값 ${formatCm(current)} cm이 목표 ${formatCm(target)} cm와 매우 가깝습니다. 먼저 그대로 테스트하세요.` };
    if (delta > 0) return { code: 'raise', label: 'RAISE', text: `현재 안장을 총 ${formatCm(Math.abs(delta))} cm 올리는 방향입니다. 한 번에 크게 바꾸지 말고 0.5 cm 이하로 나누어 확인하세요.` };
    return { code: 'lower', label: 'LOWER', text: `현재 안장을 총 ${formatCm(Math.abs(delta))} cm 내리는 방향입니다. 한 번에 크게 바꾸지 말고 0.5 cm 이하로 나누어 확인하세요.` };
  }

  function updateGauge(target, current) {
    if (measurementMode() === 'quick') {
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
    if (Math.abs(delta) <= RANGE_MM) dom.gaugeCaption.textContent = `현재값은 권장 확인 범위 안에 있습니다. (${signedCm(-delta)} cm to target)`;
    else if (delta < 0) dom.gaugeCaption.textContent = `현재 안장이 목표보다 ${formatCm(Math.abs(delta))} cm 낮습니다.`;
    else dom.gaugeCaption.textContent = `현재 안장이 목표보다 ${formatCm(Math.abs(delta))} cm 높습니다.`;
  }

  function updateFieldGuide() {
    const purpose = PURPOSE[state.purpose];
    dom.fieldGuide.innerHTML = `<div><b>01</b><span>0.5 cm 이하 작은 폭으로 조정</span></div><div><b>02</b><span>10–15분 테스트 라이딩</span></div><div><b>03</b><span>${purpose.test}</span></div>`;
  }

  function collectUsageErrors() {
    const errors = [];
    const height = num(dom.height);
    const manualCm = num(dom.manualInseam);

    if (state.analogMode) {
      if (!height || height < 100 || height > 230) errors.push({ field: '신장', reason: '아날로그 측정에서는 100–230 cm 범위의 신장 직접 입력이 필요합니다.' });
      if (!manualCm || manualCm < 45 || manualCm > 110) errors.push({ field: '인심 직접입력', reason: '줄자로 잰 인심을 45.0–110.0 cm 범위로 입력해 주세요.' });
    } else {
      if (dom.height.value && (!height || height < 100 || height > 230)) {
        errors.push({ field: '신장', reason: '100–230 cm 범위로 입력해 주세요.' });
      }
      if (dom.manualInseam.value && (!manualCm || manualCm < 45 || manualCm > 110)) {
        errors.push({ field: '인심 직접입력', reason: '45.0–110.0 cm 범위로 입력해 주세요.' });
      }
    }

    if (!state.analogMode && !manualCm) {
      if (!state.hasImage || state.points.length !== 3) {
        errors.push({ field: '인심 측정', reason: '인심을 직접 입력하거나 사진 3점 측정을 완료해 주세요.' });
      } else if (!height || height < 100 || height > 230) {
        errors.push({ field: '신장', reason: '사진 3점 측정값 환산에는 신장(cm)이 필요합니다.' });
      } else if (!computePhotoInseam(false)) {
        errors.push({ field: '현장 3점 측정', reason: '정수리 → 가랑이 → 발끝 점 위치와 순서를 확인해 주세요.' });
      }
    }

    if (state.analogMode) {
      const bb = num(dom.bb);
      const current = num(dom.current);
      const crank = num(dom.crank);
      if (!bb || bb < 20 || bb > 40) errors.push({ field: 'BB 지면 높이', reason: 'PRO 아날로그 측정에는 20.0–40.0 cm 범위의 BB 지면 높이가 필요합니다.' });
      if (!current || current < 45 || current > 100) errors.push({ field: '현재 안장', reason: 'PRO 아날로그 측정에는 BB 중심 → 안장 상단 45.0–100.0 cm 값이 필요합니다.' });
      if (dom.crank.value && (!crank || crank < 14 || crank > 19)) errors.push({ field: '크랭크', reason: '크랭크는 선택 입력입니다. 입력할 경우 14.0–19.0 cm 범위로 입력해 주세요.' });
    } else if (!state.quickFit) {
      const bb = num(dom.bb);
      const current = num(dom.current);
      const crank = num(dom.crank);
      if (dom.bb.value && (!bb || bb < 20 || bb > 40)) errors.push({ field: 'BB 지면 높이', reason: '20.0–40.0 cm 범위로 입력해 주세요.' });
      if (dom.current.value && (!current || current < 45 || current > 100)) errors.push({ field: '현재 안장', reason: 'BB 중심 → 안장 상단을 45.0–100.0 cm 범위로 입력해 주세요.' });
      if (dom.crank.value && (!crank || crank < 14 || crank > 19)) errors.push({ field: '크랭크', reason: '14.0–19.0 cm 범위로 입력해 주세요.' });
    }

    if (!BIKE[state.bike]) errors.push({ field: '자전거 타입', reason: '자전거 타입을 선택해 주세요.' });
    if (!PURPOSE[state.purpose]) errors.push({ field: '주행 목적', reason: 'COMMUTE / ENDURANCE / SPORT 중 하나를 선택해 주세요.' });

    const unique = [];
    const seen = new Set();
    for (const item of errors) {
      const key = `${item.field}|${item.reason}`;
      if (!seen.has(key)) { seen.add(key); unique.push(item); }
    }
    return unique;
  }

  function updateUsagePanel(errors = collectUsageErrors()) {
    if (!dom.usageErrorCard || !dom.usageErrorList) return errors;
    const hasError = errors.length > 0;
    dom.usageErrorCard.dataset.state = hasError ? 'error' : 'ready';
    dom.usageErrorState.textContent = hasError ? `${errors.length} ERROR${errors.length > 1 ? 'S' : ''}` : 'READY';
    dom.usageErrorList.innerHTML = hasError
      ? errors.map((item) => `<li><strong>${item.field}</strong><span>${item.reason}</span></li>`).join('')
      : '<li class="usage-ok"><strong>READY</strong><span>현재 선택한 측정 모드에서 계산에 필요한 입력이 준비되었습니다.</span></li>';
    return errors;
  }

  function renderInputError(code, message) {
    state.result = null;
    dom.resultState.textContent = code;
    dom.targetSaddle.textContent = '—';
    dom.heroTarget.textContent = '—';
    dom.targetRange.textContent = message;
    dom.fitAnalysis.textContent = message;
    dom.quickResultLine.hidden = true;
    dom.proResultLine.hidden = true;
    syncResultModeBadges();
    updateUsagePanel();
    if (dom.usageErrorCard) dom.usageErrorCard.open = true;
    if (measurementMode() === 'quick') {
      dom.verdictBadge.dataset.verdict = 'idle';
      dom.verdictBadge.textContent = 'INPUT CHECK';
      dom.verdictText.textContent = message;
    }
    return false;
  }

  function calculateFit(scroll = true) {
    const usageErrors = updateUsagePanel();
    if (usageErrors.length) {
      const first = usageErrors[0];
      return renderInputError('USAGE ERROR', `${first.field}: ${first.reason}`);
    }

    const inseam = resolveInseam();
    if (!inseam) return renderInputError('NEED MEASURE', '인심 측정값을 확인해 주세요.');

    const mode = measurementMode();
    const isQuick = mode === 'quick';
    const bb = isQuick ? null : (inputCmToMm(dom.bb) || 0);
    const current = isQuick ? null : inputCmToMm(dom.current);
    const crank = crankCorrection(isQuick);
    const baseTarget = inseam.value * BASE_COEFF;
    const purposeTrim = isQuick ? PURPOSE[state.purpose].quickTrim : 0;
    const target = baseTarget + crank.value + purposeTrim;
    const floor = bb == null ? null : target + bb;
    const delta = current ? target - current : null;
    const judgement = verdict(target, current);

    state.result = { inseam: inseam.value, source: inseam.source, sourceKo: inseam.sourceKo, target, baseTarget, floor, current, delta, bb, bike: state.bike, purpose: state.purpose, crank, purposeTrim, quickFit: isQuick, analogMode: state.analogMode, measurementMode: mode };

    dom.resultState.textContent = mode === 'quick' ? 'QUICK FIT' : (mode === 'professional' ? 'PRO FIT' : 'CALCULATED');
    dom.resultState.dataset.mode = mode;
    dom.targetSaddle.textContent = formatCm(target);
    dom.targetRange.textContent = `권장 확인 범위 ${formatCm(target - RANGE_MM)}–${formatCm(target + RANGE_MM)} cm`;
    dom.heroCurrent.textContent = isQuick ? 'SKIP' : (current ? formatCm(current) : '—');
    dom.heroTarget.textContent = formatCm(target);
    dom.heroChange.textContent = isQuick ? 'SKIP' : (delta == null ? '—' : signedCm(delta));
    dom.resultBikeLine.textContent = `${BIKE[state.bike].label} · ${PURPOSE[state.purpose].label}`;
    dom.resultMeta.textContent = mode === 'quick'
      ? `QUICK · ${PURPOSE[state.purpose].label} ${signedCm(purposeTrim)} cm · LeMond 0.883`
      : (mode === 'professional'
        ? `PRO · ANALOG · FULL BIKE INPUTS · LeMond 0.883`
        : (crank.applied ? `LeMond 0.883 · CRANK ${formatCm(crank.crank)} cm corrected` : 'LeMond 0.883 · BB CENTER → SADDLE TOP'));
    dom.metricInseam.textContent = formatCm(inseam.value);
    dom.metricSource.textContent = inseam.source;
    dom.metricCrank.textContent = crank.applied ? formatCm(crank.crank) : '—';
    dom.metricFloor.textContent = floor == null ? 'SKIP' : formatCm(floor);
    if (isQuick) {
      dom.verdictBadge.dataset.verdict = 'idle';
      dom.verdictBadge.textContent = 'QUICK FIT';
      dom.verdictText.textContent = `현재 안장 실측을 생략한 간이 결과입니다. ${PURPOSE[state.purpose].label} 목적 트림 ${signedCm(purposeTrim)} cm를 반영한 BB 중심 → 안장 상단 ${formatCm(target)} cm를 현장 시작값으로 적용하세요.`;
      dom.adjustPlan.innerHTML = `<span class="orange">간이 측정값 ${formatCm(target)} cm</span><br>${PURPOSE[state.purpose].label} 목적 보정 ${signedCm(purposeTrim)} cm 적용. 현재 안장값이 없어 RAISE / LOWER 단계는 생략하며, 목표값 부근에서 짧은 테스트 라이딩으로 확인하세요.`;
    } else {
      dom.verdictBadge.dataset.verdict = judgement.code;
      dom.verdictBadge.textContent = judgement.label;
      dom.verdictText.textContent = judgement.text;
      dom.adjustPlan.innerHTML = buildAdjustmentPlan(target, current);
    }
    dom.symptomAnalysis.innerHTML = symptomAdvice();
    updateGauge(target, current);
    syncResultModeBadges();
    dom.quickResultLine.hidden = mode !== 'quick';
    dom.proResultLine.hidden = mode !== 'professional';
    if (mode === 'quick') dom.quickResultLine.innerHTML = `간이 측정값: <strong>${formatCm(target)} cm</strong>`;
    if (mode === 'professional') dom.proResultLine.innerHTML = `<span class="pro-result-label">PRO FIT VERIFIED</span><span>전문가 측정값 <strong>${formatCm(target)} cm</strong></span>`;
    updateFieldGuide();

    const crankText = isQuick
      ? ' 간이피팅에서는 크랭크 입력과 보정을 생략합니다.'
      : (crank.applied
        ? ` 선택 크랭크 ${formatCm(crank.crank)} cm에 대해 17.0 cm 기준 대비 <strong>${signedCm(crank.value)} cm</strong> 보정을 적용했습니다.`
        : ' 크랭크 길이는 미입력되어 별도 보정을 적용하지 않았습니다.');
    const floorText = floor == null ? ' 간이피팅에서는 BB 지면 높이를 생략해 FLOOR REF.를 계산하지 않습니다.' : ` 지면 참고값은 ${formatCm(floor)} cm입니다.`;
    const purposeText = isQuick ? ` ${PURPOSE[state.purpose].label} 간이 목적 트림 <strong>${signedCm(purposeTrim)} cm</strong>를 적용했습니다.` : '';
    const modeText = mode === 'quick'
      ? ' <strong>QUICK MEASUREMENT</strong> 모드로 현재 안장·BB 지면·크랭크 입력을 생략했습니다.'
      : (mode === 'professional'
        ? ' <strong>PRO MEASUREMENT</strong>로 사진 3점 측정 대신 아날로그 직접 수치(신장·인심·BB 지면높이·현재 안장)를 사용했습니다. 크랭크는 선택값입니다.'
        : '');
    dom.fitAnalysis.innerHTML = `<strong>${inseam.sourceKo}</strong> 인심 <span class="orange">${formatCm(inseam.value)} cm</span> × 0.883 = 기본 <strong>${formatCm(baseTarget)} cm</strong>.${crankText}${purposeText} 최종 BB 기준 목표는 <span class="orange">${formatCm(target)} cm</span>.${floorText}${modeText}`;

    updateUsagePanel([]);
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
    ectx.fillText(`INSEAM  ${formatCm(result.inseam)} cm`, pad, y + round(118 * scale));

    ectx.fillStyle = '#cbd6db';
    ectx.font = `800 ${round(19 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    const current = result.current ? `${formatCm(result.current)} cm` : '—';
    const change = result.delta == null ? '—' : `${signedCm(result.delta)} cm`;
    ectx.fillText(`CURRENT ${current}   →   TARGET ${formatCm(result.target)} cm   ·   CHANGE ${change}`, pad, y + round(158 * scale));

    ectx.fillStyle = '#ff9a51';
    ectx.font = `800 ${round(15 * scale)}px -apple-system,BlinkMacSystemFont,sans-serif`;
    ectx.fillText(`TARGET RANGE ${formatCm(result.target - RANGE_MM)}–${formatCm(result.target + RANGE_MM)} cm`, pad, y + round(191 * scale));

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
    dom.bb.value = button.dataset.bb || formatCm(BIKE[state.bike].bb);
    if (state.bike === 'minivelo' || state.bike === 'hybrid') state.purpose = 'commute';
    else if (state.bike === 'road' || state.bike === 'gravel') state.purpose = 'endurance';
    syncChoices();
    updateUsagePanel();
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
    if (state.analogMode) state.quickFit = false;
    syncMeasurementModes();
    saveSettings();
    scheduleRecalc();
  });

  dom.quickFitMode.addEventListener('change', () => {
    if (state.analogMode) {
      state.quickFit = false;
      dom.quickFitMode.checked = false;
    } else {
      state.quickFit = dom.quickFitMode.checked;
    }
    syncMeasurementModes();
    saveSettings();
    scheduleRecalc();
  });

  [dom.height, dom.manualInseam, dom.bb, dom.current, dom.crank].forEach((input) => input.addEventListener('input', () => {
    if (input === dom.height && state.points.length === 3) computePhotoInseam(true);
    syncResultModeBadges();
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
  dom.btnCalculate.addEventListener('click', (event) => {
    event.preventDefault();
    calculateFit(true);
  });
  dom.btnSavePhoto.addEventListener('click', saveResultPhoto);
  dom.btnDismissInstallTip?.addEventListener('click', () => {
    try { localStorage.setItem(IOS_INSTALL_DISMISS_KEY, '1'); } catch (_) {}
    dom.installTip.hidden = true;
  });
  window.addEventListener('pagehide', stopCamera);
  window.addEventListener('pageshow', syncIOSAppMode);
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', syncIOSAppMode);
  window.addEventListener('load', registerServiceWorker, { once: true });

  if (document.body?.dataset.build && document.body.dataset.build !== '1.6.6-cm-ui1') {
    console.warn('Bike Fitting Lab build mismatch:', document.body.dataset.build);
  }
  syncIOSAppMode();
  restoreSettings();
  syncMeasurementModes();
  updateTapSteps();
  updateQuality();
  updateFieldGuide();
})();

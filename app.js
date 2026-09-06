/* =========================================================
   자전거 피팅기 — BIKE FITTING LAB
   camera 3-point measurement -> inseam -> saddle height
   ========================================================= */
(function () {
  "use strict";

  // ---------- element refs ----------
  const heightCmInput   = document.getElementById('heightCm');
  const bbHeightInput   = document.getElementById('bbHeight');
  const bbPresets       = document.getElementById('bbPresets');

  const cameraWrap      = document.getElementById('cameraWrap');
  const video           = document.getElementById('video');
  const canvas          = document.getElementById('canvas');
  const ctx             = canvas.getContext('2d');
  const readyBadge      = document.getElementById('readyBadge');
  const stepHint        = document.getElementById('stepHint');

  const btnStartCamera  = document.getElementById('btnStartCamera');
  const btnSwitchCamera = document.getElementById('btnSwitchCamera');
  const btnCapture      = document.getElementById('btnCapture');
  const btnRetake       = document.getElementById('btnRetake');
  const btnUndoPoint    = document.getElementById('btnUndoPoint');

  const tapSteps        = [...document.querySelectorAll('#tapSteps li')];

  const btnManualMode   = document.getElementById('btnManualMode');
  const manualGroup     = document.getElementById('manualInseamGroup');
  const manualInseam    = document.getElementById('manualInseam');

  const inseamReadout   = document.getElementById('inseamReadout');
  const valUpright      = document.getElementById('valUpright');
  const valSlight       = document.getElementById('valSlight');
  const valAggr         = document.getElementById('valAggr');
  const btnReset        = document.getElementById('btnReset');

  // ---------- state ----------
  const POINT_LABELS = ['정수리', '가랑이', '발끝'];
  const COEFF = { upright: 0.860, slight: 0.883, aggressive: 0.900 };

  let stream = null;
  let facingMode = 'environment';
  let points = [];          // [{x,y}, ...] in canvas pixel space
  let baseImageData = null; // frozen frame pixels
  let manualMode = false;

  // ---------- persistence (best-effort, non-blocking) ----------
  try {
    const savedH = localStorage.getItem('bfl_heightCm');
    const savedBB = localStorage.getItem('bfl_bbHeight');
    if (savedH) heightCmInput.value = savedH;
    if (savedBB) bbHeightInput.value = savedBB;
  } catch (e) { /* localStorage unavailable — ignore */ }

  heightCmInput.addEventListener('input', () => {
    try { localStorage.setItem('bfl_heightCm', heightCmInput.value); } catch (e) {}
    compute();
  });
  bbHeightInput.addEventListener('input', () => {
    try { localStorage.setItem('bfl_bbHeight', bbHeightInput.value); } catch (e) {}
    bbPresets.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    compute();
  });

  // ---------- BB presets ----------
  bbPresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    bbPresets.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    bbHeightInput.value = btn.dataset.bb;
    try { localStorage.setItem('bfl_bbHeight', btn.dataset.bb); } catch (e) {}
    compute();
  });

  // ---------- step hint / tap-step UI ----------
  function updateStepUI() {
    tapSteps.forEach((li, i) => {
      li.classList.toggle('active', i === points.length);
      li.classList.toggle('done', i < points.length);
    });
    if (!cameraWrap.classList.contains('has-shot')) {
      stepHint.textContent = '카메라를 켜고 촬영하세요';
    } else if (points.length < 3) {
      stepHint.textContent = `${points.length + 1}) ${POINT_LABELS[points.length]}을(를) 터치하세요`;
    } else {
      stepHint.textContent = '측정 완료 — 결과를 확인하세요';
    }
    btnUndoPoint.disabled = points.length === 0;
  }

  // ---------- camera lifecycle ----------
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      stepHint.textContent = '이 브라우저는 카메라를 지원하지 않습니다. 최신 Safari를 사용하거나 직접 입력을 이용하세요.';
      return;
    }
    if (!window.isSecureContext) {
      stepHint.textContent = '카메라는 https 환경에서만 동작합니다 (GitHub Pages 주소로 접속해주세요).';
      return;
    }
    try {
      stopStreamTracks();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      cameraWrap.classList.remove('has-shot');
      cameraWrap.classList.add('live');
      btnStartCamera.textContent = '카메라 재시작';
      btnSwitchCamera.disabled = false;
      btnCapture.disabled = false;
      btnRetake.disabled = true;
      points = [];
      baseImageData = null;
      updateStepUI();
    } catch (err) {
      let msg = '카메라를 시작할 수 없습니다.';
      if (err && err.name === 'NotAllowedError') {
        msg = '카메라 권한이 거부되었습니다. 설정 > Safari > 카메라 접근을 허용해주세요.';
      } else if (err && err.name === 'NotFoundError') {
        msg = '사용 가능한 카메라를 찾을 수 없습니다.';
      }
      stepHint.textContent = msg;
    }
  }

  function stopStreamTracks() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  btnStartCamera.addEventListener('click', startCamera);

  btnSwitchCamera.addEventListener('click', () => {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
  });

  btnCapture.addEventListener('click', () => {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    points = [];
    cameraWrap.classList.remove('live');
    cameraWrap.classList.add('has-shot');
    btnRetake.disabled = false;
    updateStepUI();
  });

  btnRetake.addEventListener('click', () => {
    points = [];
    baseImageData = null;
    cameraWrap.classList.remove('has-shot');
    cameraWrap.classList.add('live');
    resetResults();
    updateStepUI();
  });

  btnUndoPoint.addEventListener('click', () => {
    if (points.length === 0) return;
    points.pop();
    redrawCanvas();
    updateStepUI();
    compute();
  });

  // ---------- tap-to-measure ----------
  function getCanvasPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('pointerdown', (evt) => {
    if (!cameraWrap.classList.contains('has-shot')) return;
    if (points.length >= 3) return;
    evt.preventDefault();
    points.push(getCanvasPoint(evt));
    redrawCanvas();
    updateStepUI();
    if (points.length === 3) compute();
  });

  function redrawCanvas() {
    if (!baseImageData) return;
    ctx.putImageData(baseImageData, 0, 0);
    const r = Math.max(6, canvas.width * 0.008);

    // connecting lines
    if (points.length >= 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,106,26,0.9)';
      ctx.lineWidth = Math.max(2, canvas.width * 0.0025);
      ctx.setLineDash([canvas.width * 0.012, canvas.width * 0.01]);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // points
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6A1A';
      ctx.fill();
      ctx.lineWidth = Math.max(2, canvas.width * 0.003);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.font = `700 ${Math.max(16, canvas.width * 0.022)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p.x, p.y);

      ctx.font = `600 ${Math.max(14, canvas.width * 0.02)}px sans-serif`;
      ctx.fillStyle = '#FF9142';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(POINT_LABELS[i], p.x, p.y - r - 8);
    });
  }

  // ---------- manual mode ----------
  btnManualMode.addEventListener('click', () => {
    manualMode = !manualMode;
    manualGroup.classList.toggle('hidden', !manualMode);
    btnManualMode.textContent = manualMode
      ? '← 카메라로 측정하기'
      : '카메라 대신 인심(다리길이) 직접 입력 →';
    resetResults();
    compute();
  });
  manualInseam.addEventListener('input', compute);

  // ---------- calculation ----------
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

  function resetResults() {
    inseamReadout.textContent = '인심 측정 대기 중';
    valUpright.textContent = '—';
    valSlight.textContent = '—';
    valAggr.textContent = '—';
  }

  function compute() {
    let inseamMm = null;

    if (manualMode) {
      const v = parseFloat(manualInseam.value);
      if (v > 0) inseamMm = v;
    } else if (points.length === 3) {
      const heightCm = parseFloat(heightCmInput.value);
      if (!heightCm || heightCm <= 0) {
        inseamReadout.textContent = '신장(cm)을 입력하면 자동 계산됩니다';
        return;
      }
      const headToToePx = dist(points[0], points[2]);
      const cropToToePx = dist(points[1], points[2]);
      const scalePxPerMm = headToToePx / (heightCm * 10);
      if (!isFinite(scalePxPerMm) || scalePxPerMm <= 0) {
        inseamReadout.textContent = '측정 오류 — 점을 다시 찍어주세요';
        return;
      }
      inseamMm = cropToToePx / scalePxPerMm;
    }

    if (!inseamMm || !isFinite(inseamMm) || inseamMm <= 0) {
      resetResults();
      return;
    }

    const bb = parseFloat(bbHeightInput.value) || 0;
    valUpright.textContent = Math.round(inseamMm * COEFF.upright + bb);
    valSlight.textContent  = Math.round(inseamMm * COEFF.slight  + bb);
    valAggr.textContent    = Math.round(inseamMm * COEFF.aggressive + bb);
    inseamReadout.textContent = `인심(다리길이) 약 ${inseamMm.toFixed(1)}mm`;
  }

  // ---------- reset ----------
  btnReset.addEventListener('click', () => {
    points = [];
    baseImageData = null;
    manualMode = false;
    manualGroup.classList.add('hidden');
    btnManualMode.textContent = '카메라 대신 인심(다리길이) 직접 입력 →';
    manualInseam.value = '';
    cameraWrap.classList.remove('has-shot', 'live');
    btnSwitchCamera.disabled = true;
    btnCapture.disabled = true;
    btnRetake.disabled = true;
    btnStartCamera.textContent = '카메라 켜기';
    stopStreamTracks();
    resetResults();
    updateStepUI();
  });

  // ---------- init ----------
  updateStepUI();
  resetResults();

  // release camera when leaving/hiding the page (iOS Safari best practice)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopStreamTracks();
  });
})();

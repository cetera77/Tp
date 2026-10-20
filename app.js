// File: app.js
"use strict";

/* =========================================================
   定数
   ========================================================= */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

// 記譜音が実音より何半音高いか
const INSTRUMENTS = {
  "B♭トランペット": 2,
  "Cトランペット": 0,
  "Dトランペット": -2,
  "E♭トランペット": -3,
  "Aトランペット": 3,
  "B♭フリューゲルホルン": 2,
  "B♭コルネット": 2,
  "B♭ピッコロトランペット": -10,
  "Aピッコロトランペット": -9,
};

// 3本ピストンの標準運指（記譜音MIDI番号: [主運指, 代替運指リスト]）
const FINGERINGS = {
  54: ["123", []],
  55: ["13", []],
  56: ["23", []],
  57: ["12", ["3"]],
  58: ["1", []],
  59: ["2", []],
  60: ["0", []],
  61: ["123", []],
  62: ["13", []],
  63: ["23", []],
  64: ["12", ["3"]],
  65: ["1", []],
  66: ["2", []],
  67: ["0", []],
  68: ["23", []],
  69: ["12", ["3"]],
  70: ["1", []],
  71: ["2", []],
  72: ["0", []],
  73: ["12", []],
  74: ["1", []],
  75: ["2", []],
  76: ["0", ["12"]],
  77: ["1", []],
  78: ["2", []],
  79: ["0", []],
  80: ["23", ["3"]],
  81: ["12", ["3"]],
  82: ["1", []],
  83: ["2", []],
  84: ["0", []],
};
const FINGERING_KEYS = Object.keys(FINGERINGS).map(Number).sort$(a, b) => a - b$;

const SLIDE_NOTES = {
  54: "第3スライドを抜いて音程を下げる",
  55: "第3スライドを抜いて音程を下げる",
  61: "第3スライドを抜いて音程を下げる",
  62: "第3スライドを抜いて音程を下げる",
};

// 運指ごとに下がる半音数（数値風のキーは並び順が変わるため順序は配列で保持）
const VALVE_COMBOS = ["0", "2", "1", "12", "23", "13", "123"];
const VALVE_SEMITONES = { "0": 0, "2": 1, "1": 2, "12": 3, "23": 4, "13": 5, "123": 6 };

// 倍音番号ごとの基音からの半音数（平均律に丸めた値）
const PARTIAL_OFFSETS = { 1: 0, 2: 12, 3: 19, 4: 24, 5: 28, 6: 31, 7: 34, 8: 36 };

const SCALES = {
  "メジャー": [0, 2, 4, 5, 7, 9, 11, 12],
  "ナチュラルマイナー": [0, 2, 3, 5, 7, 8, 10, 12],
  "ハーモニックマイナー": [0, 2, 3, 5, 7, 8, 11, 12],
  "メロディックマイナー（上行）": [0, 2, 3, 5, 7, 9, 11, 12],
  "ドリアン": [0, 2, 3, 5, 7, 9, 10, 12],
  "ミクソリディアン": [0, 2, 4, 5, 7, 9, 10, 12],
  "メジャーペンタトニック": [0, 2, 4, 7, 9, 12],
  "マイナーペンタトニック": [0, 3, 5, 7, 10, 12],
  "ブルース": [0, 3, 5, 6, 7, 10, 12],
  "クロマチック": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const MENU_BASE = {
  "ブレス・バズィング": 0.08,
  "ロングトーン": 0.17,
  "リップスラー": 0.17,
  "タンギング": 0.15,
  "スケール・アルペジオ": 0.15,
  "高音域": 0.08,
  "曲練習": 0.2,
};

const MENU_FOCUS = ["バランス", "音色・ロングトーン", "柔軟性", "タンギング", "ハイトーン", "曲練習"];

const MENU_BOOST = {
  "音色・ロングトーン": "ロングトーン",
  "柔軟性": "リップスラー",
  "タンギング": "タンギング",
  "ハイトーン": "高音域",
  "曲練習": "曲練習",
};

const MENU_TIPS = {
  "ブレス・バズィング": "深い呼吸とマウスピースだけでのバズィングで唇を目覚めさせる",
  "ロングトーン": "中音域から始め、pp〜ffのクレッシェンド・デクレッシェンドで音色を一定に保つ",
  "リップスラー": "リップスラータブで生成したパターンを無理のないテンポで",
  "タンギング": "シングル→ダブル→トリプルの順にメトロノームで正確に",
  "スケール・アルペジオ": "スケールタブで調を変えながら均一な音色で",
  "高音域": "力まず息のスピードで。疲れを感じたらすぐ休む",
  "曲練習": "難所をテンポを落として部分練習してから通す",
};

const LOG_CATEGORIES = [...Object.keys(MENU_BASE), "合奏", "レッスン", "その他"];

const STORAGE_SETTINGS = "trumpetToolkit.settings.v1";
const STORAGE_LOG = "trumpetToolkit.log.v1";
const TAB_IDS = ["tuner", "metronome", "fingering", "scale", "transpose", "slur", "menu", "log"];

/* =========================================================
   ユーティリティ
   ========================================================= */

const $ = (id) => document.getElementById(id);

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHTML(value) {
  return String(value).replace$/[&<>"']/g, (c) => HTML_ESCAPES[c]$;
}

function mod(n, m) {
  return $(n % m) + m$ % m;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("保存に失敗しました", e);
  }
}

function isoDate(date) {
  const d = new Date$date.getTime() - date.getTimezoneOffset() * 60000$;
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate$d.getDate() - days$;
  return isoDate(d);
}

function median(values) {
  const s = [...values].sort$(a, b) => a - b$;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : $s[mid - 1] + s[mid]$ / 2;
}

function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce$(a, b) => a + b, 0$ / values.length;
  return Math.sqrt(values.reduce$(a, b) => a + (b - mean) ** 2, 0$ / values.length);
}

function tableHTML(columns, rows) {
  const head = columns.map$(c) => `<th>${escapeHTML(c)}</th>`$.join("");
  const body = rows
    .map((row, i) => {
      const cells = columns
        .map((c) => {
          const v = row[c];
          if $v && typeof v === "object" && "html" in v$ return `<td>${v.html}</td>`;
          return `<td>${escapeHTML(v ?? "")}</td>`;
        })
        .join("");
      return `<tr data-index="${i}">${cells}</tr>`;
    })
    .join("");
  return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function fillSelect(select, items, selectedValue) {
  select.innerHTML = items
    .map$([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`$
    .join("");
  if $selectedValue !== undefined$ select.value = String(selectedValue);
}

/* =========================================================
   設定
   ========================================================= */

const settings = Object.assign(
  { instrument: "B♭トランペット", a4: 442, useFlats: true, volume: 0.5 },
  loadJSON(STORAGE_SETTINGS, {})
);
if (!(settings.instrument in INSTRUMENTS)) settings.instrument = "B♭トランペット";
settings.a4 = clamp(Number(settings.a4) || 442, 430, 450);
settings.volume = clamp(Number(settings.volume) || 0.5, 0.05, 1);

function saveSettings() {
  saveJSON(STORAGE_SETTINGS, settings);
}

function transposeOf$name = settings.instrument$ {
  return INSTRUMENTS[name];
}

function noteNames() {
  return settings.useFlats ? FLAT_NAMES : NOTE_NAMES;
}

function midiToName(m) {
  return noteNames()[mod(m, 12)] + $Math.floor(m / 12) - 1$;
}

function midiToFreq(m) {
  return settings.a4 * Math.pow(2, $m - 69$ / 12);
}

function freqToMidiFloat(f) {
  return 69 + 12 * Math.log2(f / settings.a4);
}

function valveText(combo) {
  return combo === "0" ? "開放" : combo.split("").join$"+"$;
}

function valveSymbols(combo) {
  if $combo === "0"$ return "○ ○ ○（開放）";
  return [1, 2, 3].map((v) => (combo.includes(String(v)) ? "●" : "○")).join(" ");
}

function valveHTML$combo, size = ""$ {
  const valves = [1, 2, 3]
    .map((v) => {
      const pressed = combo !== "0" && combo.includes(String(v));
      return `<div class="valve${pressed ? " pressed" : ""}">${v}</div>`;
    })
    .join("");
  return `<div class="valves ${size}">${valves}</div>`;
}

/* =========================================================
   オーディオエンジン
   ========================================================= */

let audioCtx = null;
let masterGain = null;
let trumpetWave = null;
const activeVoices = new Set();
let sequenceTimers = [];
let sequenceOwner = null;
let drone = null;

function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = settings.volume;
    masterGain.connect(audioCtx.destination);
    const harmonics = [0, 1.0, 0.65, 0.5, 0.35, 0.25, 0.15, 0.1, 0.06];
    const real = new Float32Array(harmonics.length);
    const imag = Float32Array.from(harmonics);
    trumpetWave = audioCtx.createPeriodicWave(real, imag);
  }
  if $audioCtx.state === "suspended"$ audioCtx.resume();
  return audioCtx;
}

function playTone$freq, start, duration, peak = 0.35$ {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.setPeriodicWave(trumpetWave);
  osc.frequency.value = freq;
  const attack = Math.min(0.03, duration / 3);
  const release = Math.min(0.06, duration / 3);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime$peak, start + attack$;
  gain.gain.setValueAtTime$peak, start + duration - release$;
  gain.gain.linearRampToValueAtTime$0, start + duration$;
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop$start + duration + 0.02$;
  const voice = { osc, gain };
  activeVoices.add(voice);
  osc.onended = () => {
    activeVoices.delete(voice);
    gain.disconnect();
  };
  return voice;
}

function stopSequence() {
  sequenceTimers.forEach(clearTimeout);
  sequenceTimers = [];
  if (audioCtx) {
    const now = audioCtx.currentTime;
    activeVoices.forEach((v) => {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setTargetAtTime(0, now, 0.01);
        v.osc.stop$now + 0.06$;
      } catch (e) {
        /* 停止済みのノードは無視 */
      }
    });
  }
  activeVoices.clear();
  const owner = sequenceOwner;
  sequenceOwner = null;
  if (owner && owner.onStop) owner.onStop();
}

function playSequence(writtenNotes, bpm, owner) {
  stopSequence();
  const ctx = getCtx();
  const beat = 60 / bpm;
  const lead = 0.1;
  const t0 = ctx.currentTime + lead;
  const shift = transposeOf();
  writtenNotes.forEach((m, i) => {
    playTone$midiToFreq(m - shift), t0 + i * beat, beat * 0.92$;
    if (owner.onNote) {
      sequenceTimers.push(setTimeout$() => owner.onNote(i), (lead + i * beat) * 1000$);
    }
  });
  sequenceOwner = owner;
  sequenceTimers.push(
    setTimeout(() => {
      sequenceTimers = [];
      if $sequenceOwner === owner$ {
        sequenceOwner = null;
        if (owner.onStop) owner.onStop();
      }
    }, $lead + writtenNotes.length * beat$ * 1000 + 80)
  );
}

function clearRowHighlights() {
  document.querySelectorAll("tr.current").forEach$(tr) => tr.classList.remove("current")$;
}

function highlightRow(containerId, index) {
  const container = $(containerId);
  container.querySelectorAll("tr.current").forEach$(tr) => tr.classList.remove("current")$;
  const row = container.querySelector$`tbody tr[data-index="${index}"]`$;
  if (row) {
    row.classList.add("current");
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function togglePlayback(id, button, notes, bpm, onNote) {
  if $sequenceOwner && sequenceOwner.id === id$ {
    stopSequence();
    return;
  }
  if (!notes.length) return;
  button.textContent = "■ 停止";
  button.classList.add("playing");
  playSequence(notes, bpm, {
    id,
    onNote,
    onStop: () => {
      button.textContent = "▶ 再生";
      button.classList.remove("playing");
      clearRowHighlights();
    },
  });
}

function startDrone(freq) {
  stopDrone();
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.setPeriodicWave(trumpetWave);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime$0.3, ctx.currentTime + 0.08$;
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  drone = { osc, gain };
}

function stopDrone() {
  if (!drone || !audioCtx) return;
  const now = audioCtx.currentTime;
  const d = drone;
  drone = null;
  d.gain.gain.cancelScheduledValues(now);
  d.gain.gain.setValueAtTime(d.gain.gain.value, now);
  d.gain.gain.linearRampToValueAtTime$0, now + 0.08$;
  d.osc.stop$now + 0.1$;
}

/* =========================================================
   ヘッダー設定・タブ
   ========================================================= */

let currentTab = "tuner";

function initSettings() {
  const sel = $("instrument");
  fillSelect(sel, Object.keys(INSTRUMENTS).map$(n) => [n, n]$, settings.instrument);
  $("a4").value = settings.a4;
  $$"a4-value"$.textContent = settings.a4.toFixed(1);
  $("volume").value = settings.volume;
  $$"use-flats"$.checked = settings.useFlats;

  sel.addEventListener("change", () => {
    settings.instrument = sel.value;
    saveSettings();
    renderAll();
  });

  $("a4").addEventListener("input", (e) => {
    settings.a4 = parseFloat(e.target.value);
    $$"a4-value"$.textContent = settings.a4.toFixed(1);
    saveSettings();
    updateRefInfo();
  });

  $("volume").addEventListener("input", (e) => {
    settings.volume = parseFloat(e.target.value);
    if (masterGain) masterGain.gain.setTargetAtTime(settings.volume, audioCtx.currentTime, 0.02);
    saveSettings();
  });

  $$"use-flats"$.addEventListener("change", (e) => {
    settings.useFlats = e.target.checked;
    saveSettings();
    renderAll();
  });
}

function updateTransposeInfo() {
  const t = transposeOf();
  $("transpose-info").textContent = `${settings.instrument}: 記譜音 = 実音 ${t >= 0 ? "+" : ""}${t} 半音`;
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener$"click", () => activateTab(btn.dataset.tab)$;
  });
  const initial = location.hash.replace("#", "");
  activateTab(TAB_IDS.includes(initial) ? initial : "tuner", false);
}

function activateTab$id, updateHash = true$ {
  currentTab = id;
  document.querySelectorAll(".tab").forEach$(b) => b.classList.toggle("active", b.dataset.tab === id)$;
  document.querySelectorAll(".panel").forEach$(p) => p.classList.toggle("active", p.id === `tab-${id}`)$;
  if (updateHash) history.replaceState(null, "", `#${id}`);
  if $id === "tuner"$ drawStability();
  if $id === "log"$ renderLog();
}

/* =========================================================
   チューナー
   ========================================================= */

const GAUGE_CX = 150;
const GAUGE_CY = 150;
const GAUGE_R = 120;
const DEG_PER_CENT = 1.6;
const HISTORY_MAX = 150;

const tuner = {
  stream: null,
  source: null,
  analyser: null,
  buf: null,
  work: null,
  nsdf: null,
  raf: null,
  lastUpdate: 0,
  recent: [],
  history: [],
  silent: 0,
  gate: 0.01,
};

function polar(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [GAUGE_CX + r * Math.cos(rad), GAUGE_CY + r * Math.sin(rad)];
}

function arcPath(r, a1, a2) {
  const [x1, y1] = polar(r, a1);
  const [x2, y2] = polar(r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function initGauge() {
  const maxDeg = 50 * DEG_PER_CENT;
  let svg = `<path class="gauge-zone" d="${arcPath(GAUGE_R, -5 * DEG_PER_CENT, 5 * DEG_PER_CENT)}"/>`;
  svg += `<path class="gauge-arc" d="${arcPath(GAUGE_R, -maxDeg, maxDeg)}"/>`;
  for (let c = -50; c <= 50; c += 10) {
    const major = c % 50 === 0;
    const deg = c * DEG_PER_CENT;
    const [x1, y1] = polar(GAUGE_R - 6, deg);
    const [x2, y2] = polar(GAUGE_R - (major ? 22 : 14), deg);
    svg += `<line class="gauge-tick${major ? " major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  [-50, 0, 50].forEach((c) => {
    const [x, y] = polar(GAUGE_R + 14, c * DEG_PER_CENT);
    const label = c > 0 ? `+${c}` : c < 0 ? `−${-c}` : "0";
    svg += `<text class="gauge-label" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}">${label}</text>`;
  });
  $("gauge-ticks").innerHTML = svg;
}

function setNeedle(cents, state) {
  const needle = $("needle");
  needle.style.transform = `rotate(${clamp(cents, -50, 50) * DEG_PER_CENT}deg)`;
  needle.setAttribute("class", `needle ${state}`);
}

function setTunerStatus(text, cls = "") {
  const el = $("tuner-status");
  el.textContent = text;
  el.className = `tuner-status ${cls}`;
}

function detectPitch(buf, sr, gate) {
  const n = buf.length;
  if (!tuner.work || tuner.work.length !== n) tuner.work = new Float32Array(n);
  const x = tuner.work;

  let mean = 0;
  for (let i = 0; i < n; i++) mean += buf[i];
  mean /= n;

  let energy = 0;
  for (let i = 0; i < n; i++) {
    x[i] = buf[i] - mean;
    energy += x[i] * x[i];
  }
  if (Math.sqrt(energy / n) < gate) return null;

  const minLag = Math.max(2, Math.floor(sr / 1500));
  const maxLag = Math.min(Math.ceil(sr / 80), Math.floor(n / 2));
  if (!tuner.nsdf || tuner.nsdf.length !== maxLag + 2) tuner.nsdf = new Float32Array(maxLag + 2);
  const nsdf = tuner.nsdf;

  // 正規化二乗差関数
  for (let tau = 0; tau <= maxLag + 1; tau++) {
    let acf = 0;
    let m = 0;
    const lim = n - tau;
    for (let i = 0; i < lim; i++) {
      const a = x[i];
      const b = x[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // ラグ0付近の山を飛ばす（最初に負になるまで進む）
  let tau = 1;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  if (tau > maxLag) return null;
  if (tau < minLag) tau = minLag;

  const peaks = [];
  for (; tau <= maxLag; tau++) {
    if (nsdf[tau] > 0 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) peaks.push(tau);
  }
  if (!peaks.length) return null;

  let maxVal = 0;
  peaks.forEach((p) => {
    if (nsdf[p] > maxVal) maxVal = nsdf[p];
  });
  const threshold = 0.9 * maxVal;
  const p = peaks.find((q) => nsdf[q] >= threshold);
  if (nsdf[p] < 0.8) return null;

  const a = nsdf[p - 1];
  const b = nsdf[p];
  const c = nsdf[p + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? clamp((0.5 * (a - c)) / denom, -1, 1) : 0;
  const freq = sr / (p + shift);
  if (freq < 80 || freq > 1500) return null;
  return freq;
}

function initTuner() {
  $("tuner-toggle").addEventListener("click", () => {
    if (tuner.stream) stopTuner();
    else startTuner();
  });
  $("tuner-gate").addEventListener("input", (e) => {
    tuner.gate = parseFloat(e.target.value);
    $("tuner-gate-value").textContent = tuner.gate.toFixed(3);
  });
  tuner.gate = parseFloat($("tuner-gate").value);
  $("tuner-gate-value").textContent = tuner.gate.toFixed(3);
  showTunerIdle(false);
}

async function startTuner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setTunerStatus("この環境ではマイクを利用できません。HTTPS または localhost で開いてください。", "error");
    return;
  }
  const ctx = getCtx();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    const msg =
      e.name === "NotAllowedError"
        ? "マイクの使用が許可されませんでした。ブラウザの設定で許可してください。"
        : `マイクを開始できませんでした（${e.name}）。`;
    setTunerStatus(msg, "error");
    return;
  }
  tuner.stream = stream;
  tuner.source = ctx.createMediaStreamSource(stream);
  tuner.analyser = ctx.createAnalyser();
  tuner.analyser.fftSize = 2048;
  tuner.source.connect(tuner.analyser);
  tuner.buf = new Float32Array(tuner.analyser.fftSize);
  tuner.recent = [];
  tuner.silent = 0;
  tuner.lastUpdate = 0;

  const btn = $("tuner-toggle");
  btn.textContent = "■ 停止";
  btn.classList.add("playing");
  showTunerIdle(true);
  tuner.raf = requestAnimationFrame(tunerLoop);
}

function stopTuner() {
  if (tuner.raf) cancelAnimationFrame(tuner.raf);
  tuner.raf = null;
  if (tuner.stream) tuner.stream.getTracks().forEach((t) => t.stop());
  if (tuner.source) tuner.source.disconnect();
  tuner.stream = null;
  tuner.source = null;
  tuner.analyser = null;
  const btn = $("tuner-toggle");
  btn.textContent = "🎤 マイク開始";
  btn.classList.remove("playing");
  showTunerIdle(false);
}

function tunerLoop(ts) {
  tuner.raf = requestAnimationFrame(tunerLoop);
  if (!tuner.analyser || ts - tuner.lastUpdate < 40) return;
  tuner.lastUpdate = ts;
  tuner.analyser.getFloatTimeDomainData(tuner.buf);
  const freq = detectPitch(tuner.buf, audioCtx.sampleRate, tuner.gate);
  if (freq) {
    tuner.silent = 0;
    tuner.recent.push(freq);
    if (tuner.recent.length > 5) tuner.recent.shift();
    showPitch(median(tuner.recent));
  } else {
    tuner.silent++;
    if (tuner.silent === 8) {
      tuner.recent = [];
      showTunerIdle(true);
    }
  }
}

function showTunerIdle(listening) {
  $("tuner-readout").classList.add("idle");
  $("tuner-written").textContent = "--";
  $("tuner-concert").textContent = "--";
  $("tuner-freq").textContent = "--";
  $("tuner-cents").textContent = "--";
  setNeedle(0, "idle");
  if (listening) setTunerStatus("音を待っています…");
  else setTunerStatus("「マイク開始」を押してロングトーンを吹いてください。");
}

function showPitch(freq) {
  const midiF = freqToMidiFloat(freq);
  const midi = Math.round(midiF);
  const cents = (midiF - midi) * 100;
  const written = midi + transposeOf();

  $("tuner-readout").classList.remove("idle");
  $("tuner-written").textContent = midiToName(written);
  $("tuner-concert").textContent = midiToName(midi);
  $("tuner-freq").textContent = `${freq.toFixed(1)} Hz`;
  $("tuner-cents").textContent = `${cents >= 0 ? "+" : "−"}${Math.abs(cents).toFixed(1)}`;

  if (Math.abs(cents) <= 5) {
    setNeedle(cents, "in-tune");
    setTunerStatus("✓ 合っています", "good");
  } else if (cents > 0) {
    setNeedle(cents, "sharp");
    setTunerStatus("高め：チューニングスライドを抜く、または息のスピードやアンブシュアを確認", "sharp");
  } else {
    setNeedle(cents, "flat");
    setTunerStatus("低め：チューニングスライドを入れる、または息の支えを確認", "flat");
  }

  tuner.history.push(cents);
  if (tuner.history.length > HISTORY_MAX) tuner.history.shift();
  if (currentTab === "tuner") drawStability();
}

function drawStability() {
  const canvas = $("stability-canvas");
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const g = canvas.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  const pad = 10;
  const yOf = (c) => h / 2 - (clamp(c, -50, 50) / 50) * (h / 2 - pad);

  g.fillStyle = "rgba(46, 230, 166, 0.15)";
  g.fillRect(0, yOf(5), w, yOf(-5) - yOf(5));

  g.font = "10px sans-serif";
  g.textBaseline = "middle";
  [-50, -25, 0, 25, 50].forEach((c) => {
    const y = yOf(c);
    g.strokeStyle = c === 0 ? "rgba(46, 230, 166, 0.6)" : "rgba(80, 160, 255, 0.15)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
    g.fillStyle = "rgba(138, 164, 200, 0.8)";
    g.fillText(c > 0 ? `+${c}` : String(c), 6, clamp(y, 8, h - 8));
  });

  const hist = tuner.history;
  if (hist.length > 1) {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#2f8cff");
    grad.addColorStop(1, "#00d4ff");
    g.strokeStyle = grad;
    g.lineWidth = 2;
    g.shadowColor = "rgba(0, 212, 255, 0.7)";
    g.shadowBlur = 6;
    g.beginPath();
    const offset = HISTORY_MAX - hist.length;
    hist.forEach((c, i) => {
      const x = ((offset + i) / (HISTORY_MAX - 1)) * w;
      const y = yOf(c);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.stroke();
    g.shadowBlur = 0;
  }

  const recent = hist.slice(-60);
  $("stability-std").textContent = recent.length >= 5 ? `${stdDev(recent).toFixed(1)} cent` : "--";
}

/* =========================================================
   基準音
   ========================================================= */

function initRef() {
  $("ref-note").addEventListener("change", updateRefInfo);
  $("ref-toggle").addEventListener("click", () => {
    if (drone) {
      stopDrone();
    } else {
      startDrone(midiToFreq(refConcert()));
    }
    updateRefButton();
  });
}

function refreshRefOptions() {
  const sel = $("ref-note");
  const current = sel.value || "60";
  fillSelect(sel, FINGERING_KEYS.map((m) => [m, midiToName(m)]), current);
}

function refConcert() {
  return Number($("ref-note").value || 60) - transposeOf();
}

function updateRefInfo() {
  const concert = refConcert();
  const freq = midiToFreq(concert);
  $("ref-info").textContent = `実音: ${midiToName(concert)}（${freq.toFixed(2)} Hz）`;
  if (drone && audioCtx) drone.osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.02);
}

function updateRefButton() {
  const btn = $("ref-toggle");
  btn.textContent = drone ? "■ 停止" : "▶ 再生";
  btn.classList.toggle("playing", !!drone);
}

/* =========================================================
   メトロノーム
   ========================================================= */

const metro = {
  running: false,
  bpm: 80,
  beats: 4,
  subdiv: 1,
  accent: true,
  nextTime: 0,
  beat: 0,
  sub: 0,
  timer: null,
  raf: null,
  flashTimer: null,
  queue: [],
  barsSinceChange: 0,
  taps: [],
};

function initMetronome() {
  fillSelect(
    $("metro-beats"),
    Array.from({ length: 12 }, (_, i) => [i + 1, `${i + 1}拍`]),
    4
  );

  $("bpm-range").addEventListener("input", (e) => setBpm(e.target.value));
  $("bpm-input").addEventListener("change", (e) => setBpm(e.target.value));
  document.querySelectorAll("[data-bpm-step]").forEach((btn) => {
    btn.addEventListener("click", () => setBpm(metro.bpm + Number(btn.dataset.bpmStep)));
  });

  $("metro-beats").addEventListener("change", (e) => {
    metro.beats = Number(e.target.value);
    renderDots();
  });
  $("metro-subdiv").addEventListener("change", (e) => {
    metro.subdiv = Number(e.target.value);
  });
  $("metro-accent").addEventListener("change", (e) => {
    metro.accent = e.target.checked;
    renderDots();
  });

  $("metro-toggle").addEventListener("click", () => {
    if (metro.running) stopMetro();
    else startMetro();
  });
  $("metro-tap").addEventListener("click", tapTempo);

  ["trainer-start", "trainer-target", "trainer-step", "trainer-bars"].forEach((id) => {
    $(id).addEventListener("input", renderTrainerPlan);
  });
  $("trainer-set").addEventListener("click", () => {
    setBpm(trainerValues().start);
    metro.barsSinceChange = 0;
  });
  $("trainer-auto").addEventListener("change", () => {
    metro.barsSinceChange = 0;
  });

  document.addEventListener("keydown", (e) => {
    if (currentTab !== "metronome" || e.code !== "Space") return;
    const tag = e.target.tagName;
    if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) return;
    e.preventDefault();
    if (metro.running) stopMetro();
    else startMetro();
  });

  setBpm(80);
  renderDots();
}

function setBpm(value) {
  const n = Number(value);
  metro.bpm = clamp(Math.round(Number.isFinite(n) ? n : metro.bpm), 20, 300);
  $("bpm-value").textContent = metro.bpm;
  $("bpm-range").value = metro.bpm;
  $("bpm-input").value = metro.bpm;
  renderTrainerPlan();
}

function renderDots() {
  $("beat-dots").innerHTML = Array.from(
    { length: metro.beats },
    (_, i) => `<div class="dot${i === 0 && metro.accent ? " accent" : ""}"></div>`
  ).join("");
}

function scheduleClick(type, time) {
  const settingsByType = {
    accent: [1600, 0.9],
    beat: [1000, 0.7],
    sub: [700, 0.35],
  };
  const [freq, vol] = settingsByType[type];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.04);
  osc.onended = () => gain.disconnect();
}

function metroScheduler() {
  const now = audioCtx.currentTime;
  // タブが背面にあった等で大きく遅れた場合は、過去の発音をまとめて鳴らさないよう時刻を合わせ直す
  if (metro.nextTime < now - 0.2) metro.nextTime = now + 0.05;

  while (metro.nextTime < now + 0.12) {
    let type;
    if (metro.sub === 0) {
      type = metro.beat === 0 && metro.accent ? "accent" : "beat";
      metro.queue.push({ beat: metro.beat, time: metro.nextTime });
    } else {
      type = "sub";
    }
    scheduleClick(type, metro.nextTime);

    metro.nextTime += 60 / metro.bpm / metro.subdiv;
    metro.sub++;
    if (metro.sub >= metro.subdiv) {
      metro.sub = 0;
      metro.beat++;
      if (metro.beat >= metro.beats) {
        metro.beat = 0;
        onBarComplete();
      }
    }
  }
}

function onBarComplete() {
  if (!$("trainer-auto").checked) return;
  metro.barsSinceChange++;
  const { target, step, bars } = trainerValues();
  if (metro.barsSinceChange >= bars) {
    metro.barsSinceChange = 0;
    if (metro.bpm < target) setBpm(Math.min(metro.bpm + step, target));
  }
}

function metroDraw() {
  metro.raf = requestAnimationFrame(metroDraw);
  const now = audioCtx.currentTime;
  while (metro.queue.length && metro.queue[0].time <= now) {
    flashDot(metro.queue.shift().beat);
  }
}

function flashDot(index) {
  const dots = $("beat-dots").children;
  for (const d of dots) d.classList.remove("on");
  const dot = dots[index];
  if (!dot) return;
  dot.classList.add("on");
  clearTimeout(metro.flashTimer);
  metro.flashTimer = setTimeout(() => dot.classList.remove("on"), Math.min(120, 30000 / metro.bpm));
}

function startMetro() {
  const ctx = getCtx();
  metro.running = true;
  metro.nextTime = ctx.currentTime + 0.06;
  metro.beat = 0;
  metro.sub = 0;
  metro.queue = [];
  metro.barsSinceChange = 0;
  metro.timer = setInterval(metroScheduler, 25);
  metroScheduler();
  metro.raf = requestAnimationFrame(metroDraw);
  const btn = $("metro-toggle");
  btn.textContent = "■ ストップ";
  btn.classList.add("playing");
}

function stopMetro() {
  clearInterval(metro.timer);
  if (metro.raf) cancelAnimationFrame(metro.raf);
  clearTimeout(metro.flashTimer);
  metro.timer = null;
  metro.raf = null;
  metro.queue = [];
  metro.running = false;
  for (const d of $("beat-dots").children) d.classList.remove("on");
  const btn = $("metro-toggle");
  btn.textContent = "▶ スタート";
  btn.classList.remove("playing");
}

function tapTempo() {
  const now = performance.now();
  const taps = metro.taps;
  if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
  taps.push(now);
  if (taps.length > 6) taps.shift();
  if (taps.length >= 2) {
    const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    setBpm(60000 / avg);
  }
}

function trainerValues() {
  const num = (id, lo, hi, def) => {
    const v = parseInt($(id).value, 10);
    return Number.isFinite(v) ? clamp(v, lo, hi) : def;
  };
  return {
    start: num("trainer-start", 20, 300, 60),
    target: num("trainer-target", 20, 300, 120),
    step: num("trainer-step", 1, 20, 4),
    bars: num("trainer-bars", 1, 64, 4),
  };
}

function renderTrainerPlan() {
  const { start, target, step } = trainerValues();
  const el = $("trainer-plan");
  if (target <= start) {
    el.textContent = "目標テンポは開始テンポより大きくしてください。";
    return;
  }
  const plan = [];
  for (let b = start; b <= target; b += step) plan.push(b);
  if (plan[plan.length - 1] !== target) plan.push(target);
  el.innerHTML = plan.map((b) => (b === metro.bpm ? `<strong>[${b}]</strong>` : String(b))).join(" → ");
}

/* =========================================================
   運指表・クイズ
   ========================================================= */

let fingIndex = FINGERING_KEYS.indexOf(60);

const quiz = {
  note: FINGERING_KEYS[Math.floor(Math.random() * FINGERING_KEYS.length)],
  selected: null,
  correct: 0,
  total: 0,
};

function initFingering() {
  const slider = $("fing-slider");
  slider.max = FINGERING_KEYS.length - 1;
  slider.value = fingIndex;
  slider.addEventListener("input", (e) => {
    fingIndex = Number(e.target.value);
    renderFingering();
  });
  $("fing-prev").addEventListener("click", () => {
    fingIndex = Math.max(0, fingIndex - 1);
    renderFingering();
  });
  $("fing-next").addEventListener("click", () => {
    fingIndex = Math.min(FINGERING_KEYS.length - 1, fingIndex + 1);
    renderFingering();
  });
  $("fing-play").addEventListener("click", () => {
    const ctx = getCtx();
    const m = FINGERING_KEYS[fingIndex];
    playTone(midiToFreq(m - transposeOf()), ctx.currentTime + 0.05, 1.5);
  });

  $("quiz-options").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-combo]");
    if (btn) answerQuiz(btn.dataset.combo);
  });
  $("quiz-next").addEventListener("click", () => {
    let next = quiz.note;
    while (next === quiz.note) {
      next = FINGERING_KEYS[Math.floor(Math.random() * FINGERING_KEYS.length)];
    }
    quiz.note = next;
    quiz.selected = null;
    renderQuiz();
  });
}

function renderFingering() {
  const m = FINGERING_KEYS[fingIndex];
  const [main, alts] = FINGERINGS[m];
  $("fing-slider").value = fingIndex;
  $("fing-written").textContent = midiToName(m);
  $("fing-concert").textContent = midiToName(m - transposeOf());
  $("fing-valves").innerHTML = valveHTML(main);
  $("fing-text").textContent = `運指: ${valveText(main)}`;
  $("fing-alt").textContent = alts.length ? `代替運指: ${alts.map(valveText).join(" / ")}` : "";

  const slide = $("fing-slide");
  if (SLIDE_NOTES[m]) {
    slide.textContent = SLIDE_NOTES[m];
    slide.classList.remove("hidden");
  } else {
    slide.classList.add("hidden");
  }
  $("fing-piccolo").classList.toggle("hidden", !settings.instrument.includes("ピッコロ"));
}

function renderFingTable() {
  const shift = transposeOf();
  const rows = FINGERING_KEYS.map((m) => {
    const [main, alts] = FINGERINGS[m];
    return {
      "記譜音": midiToName(m),
      "実音": midiToName(m - shift),
      "運指": { html: `${valveHTML(main, "small")}<span class="quiz-label">${escapeHTML(valveText(main))}</span>` },
      "代替": alts.map(valveText).join(" / "),
    };
  });
  $("fing-table").innerHTML = tableHTML(["記譜音", "実音", "運指", "代替"], rows);
}

function renderQuiz() {
  const [main, alts] = FINGERINGS[quiz.note];
  const answers = [main, ...alts];
  $("quiz-question").textContent = `記譜音 ${midiToName(quiz.note)} の運指は？`;
  $("quiz-score").textContent = `${quiz.correct} / ${quiz.total}`;

  $("quiz-options").innerHTML = VALVE_COMBOS.map((c) => {
    let cls = "btn quiz-option";
    if (quiz.selected !== null) {
      if (answers.includes(c)) cls += " correct";
      else if (c === quiz.selected) cls += " wrong";
    }
    return `<button class="${cls}" data-combo="${c}">${valveHTML(c, "small")}<span class="quiz-label">${escapeHTML(valveText(c))}</span></button>`;
  }).join("");

  const fb = $("quiz-feedback");
  if (quiz.selected === null) {
    fb.className = "alert hidden";
    fb.textContent = "";
    return;
  }
  const altText = alts.length ? `（代替運指: ${alts.map(valveText).join(" / ")}）` : "";
  if (answers.includes(quiz.selected)) {
    fb.className = "alert success";
    fb.textContent = `正解です！ ${valveText(main)}${altText}`;
  } else {
    fb.className = "alert error";
    fb.textContent = `不正解。正解は ${valveText(main)}${altText} です。`;
  }
}

function answerQuiz(combo) {
  if (quiz.selected !== null) return;
  const [main, alts] = FINGERINGS[quiz.note];
  quiz.selected = combo;
  quiz.total++;
  if ([main, ...alts].includes(combo)) quiz.correct++;
  renderQuiz();
}

/* =========================================================
   スケール
   ========================================================= */

function initScale() {
  fillSelect($("scale-type"), Object.keys(SCALES).map((s) => [s, s]), "メジャー");
  ["scale-key", "scale-type", "scale-octave", "scale-direction"].forEach((id) => {
    $(id).addEventListener("change", renderScale);
  });
  $("scale-bpm").addEventListener("input", (e) => {
    $("scale-bpm-value").textContent = e.target.value;
  });
  $("scale-play").addEventListener("click", () => {
    togglePlayback("scale", $("scale-play"), scaleNotes(), Number($("scale-bpm").value), (i) =>
      highlightRow("scale-table", i)
    );
  });
}

function refreshScaleKeys() {
  const sel = $("scale-key");
  const current = sel.value || "0";
  fillSelect(sel, noteNames().map((n, i) => [i, n]), current);
}

function scaleNotes() {
  const root = Number($("scale-key").value || 0);
  const octave = Number($("scale-octave").value);
  const rootMidi = 12 * (octave + 1) + root;
  let notes = SCALES[$("scale-type").value].map((i) => rootMidi + i);
  if ($("scale-direction").value === "updown") {
    notes = notes.concat(notes.slice(0, -1).reverse());
  }
  return notes;
}

function renderScale() {
  if (sequenceOwner && sequenceOwner.id === "scale") stopSequence();
  const shift = transposeOf();
  const notes = scaleNotes();
  let outOfRange = false;
  const rows = notes.map((m) => {
    const f = FINGERINGS[m];
    if (!f) outOfRange = true;
    return {
      "記譜音": midiToName(m),
      "実音": midiToName(m - shift),
      "運指": f
        ? { html: `${valveHTML(f[0], "small")}<span class="quiz-label">${escapeHTML(valveText(f[0]))}</span>` }
        : "音域外",
    };
  });
  $("scale-warning").classList.toggle("hidden", !outOfRange);
  $("scale-table").innerHTML = tableHTML(["記譜音", "実音", "運指"], rows);
}

/* =========================================================
   移調
   ========================================================= */

function initTranspose() {
  const instItems = Object.keys(INSTRUMENTS).map((n) => [n, n]);
  fillSelect($("tr-from"), [["C", "実音（C）"], ...instItems], "C");
  fillSelect($("tr-to"), instItems, "B♭トランペット");
  fillSelect($("tr-key"), FLAT_NAMES.map((n, i) => [i, n]), 10);
  ["tr-from", "tr-to", "tr-key"].forEach((id) => $(id).addEventListener("change", renderTranspose));
  $("tr-input").addEventListener("input", renderTranspose);
}

function parseNote(token) {
  const t = token
    .trim()
    .replace(/𝄫/g, "bb")
    .replace(/𝄪/g, "##")
    .replace(/♭/g, "b")
    .replace(/♯/g, "#");
  if (t.length < 2) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[t[0].toUpperCase()];
  if (base === undefined) return null;
  let rest = t.slice(1);
  let acc = 0;
  while (rest && "#bx".includes(rest[0])) {
    acc += rest[0] === "#" ? 1 : rest[0] === "x" ? 2 : -1;
    rest = rest.slice(1);
  }
  if (!/^-?\d+$/.test(rest)) return null;
  return 12 * (parseInt(rest, 10) + 1) + base + acc;
}

function renderTranspose() {
  const from = $("tr-from").value;
  const to = $("tr-to").value;
  const fromShift = from === "C" ? 0 : INSTRUMENTS[from];
  const toShift = INSTRUMENTS[to];

  const tokens = $("tr-input").value.split(/\s+/).filter(Boolean);
  const rows = tokens.map((tok) => {
    const m = parseNote(tok);
    if (m === null) return { "入力": tok, "実音": "解析不可", "変換後": "" };
    const concert = m - fromShift;
    return {
      "入力": tok,
      "実音": midiToName(concert),
      "変換後": midiToName(concert + toShift),
    };
  });
  $("tr-table").innerHTML = rows.length
    ? tableHTML(["入力", "実音", "変換後"], rows)
    : `<p class="hint" style="padding: 0 12px 12px;">音名を入力してください。</p>`;

  const k = Number($("tr-key").value);
  $("tr-key-result").innerHTML =
    `${escapeHTML(to)} の楽譜上の調` +
    `<strong>${escapeHTML(FLAT_NAMES[mod(k + toShift, 12)])}</strong>` +
    `<span class="hint">実音 ${escapeHTML(FLAT_NAMES[k])} → 記譜 ${escapeHTML(FLAT_NAMES[mod(k + toShift, 12)])}</span>`;
}

/* =========================================================
   リップスラー
   ========================================================= */

function initSlur() {
  $("slur-combos").innerHTML = VALVE_COMBOS.map(
    (c) => `<label class="chip"><input type="checkbox" value="${c}" checked>${escapeHTML(valveSymbols(c))}</label>`
  ).join("");
  $("slur-combos").addEventListener("change", renderSlur);
  ["slur-low", "slur-high", "slur-pattern"].forEach((id) => $(id).addEventListener("change", renderSlur));
  $("slur-bpm").addEventListener("input", (e) => {
    $("slur-bpm-value").textContent = e.target.value;
  });
  $("slur-play").addEventListener("click", () => {
    const data = slurData();
    if (data.error || !data.notes.length) return;
    const len = data.order.length;
    togglePlayback("slur", $("slur-play"), data.notes, Number($("slur-bpm").value), (i) =>
      highlightRow("slur-table", Math.floor(i / len))
    );
  });
}

function slurData() {
  const combos = VALVE_COMBOS.filter((c) =>
    $("slur-combos").querySelector(`input[value="${c}"]`).checked
  );
  const low = Number($("slur-low").value);
  const high = Number($("slur-high").value);
  const pattern = $("slur-pattern").value;
  if (high <= low) return { error: "最高倍音は最低倍音より大きくしてください。" };

  const partials = Object.keys(PARTIAL_OFFSETS)
    .map(Number)
    .filter((p) => p >= low && p <= high && p !== 7);

  let order;
  if (pattern === "updown") order = partials.concat(partials.slice(0, -1).reverse());
  else if (pattern === "up") order = partials;
  else if (pattern === "down") order = [...partials].reverse();
  else order = [low, high, low, high, low];

  const rows = [];
  const notes = [];
  combos.forEach((c) => {
    const fund = 48 - VALVE_SEMITONES[c];
    const seq = order.map((p) => fund + PARTIAL_OFFSETS[p]);
    notes.push(...seq);
    rows.push({
      "運指": { html: `${valveHTML(c, "small")}<span class="quiz-label">${escapeHTML(valveText(c))}</span>` },
      "記譜音の流れ": seq.map(midiToName).join(" → "),
    });
  });
  return { combos, order, rows, notes };
}

function renderSlur() {
  if (sequenceOwner && sequenceOwner.id === "slur") stopSequence();
  const data = slurData();
  const err = $("slur-error");
  if (data.error) {
    err.textContent = data.error;
    err.classList.remove("hidden");
    $("slur-table").innerHTML = "";
    return;
  }
  err.classList.add("hidden");
  $("slur-table").innerHTML = data.rows.length
    ? tableHTML(["運指", "記譜音の流れ"], data.rows)
    : `<p class="hint" style="padding: 0 12px 12px;">運指を1つ以上選択してください。</p>`;
}

/* =========================================================
   練習メニュー
   ========================================================= */

function initMenu() {
  fillSelect($("menu-focus"), MENU_FOCUS.map((f) => [f, f]), "バランス");
  $("menu-minutes").addEventListener("input", renderMenu);
  $("menu-focus").addEventListener("change", renderMenu);
}

function renderMenu() {
  const total = Number($("menu-minutes").value);
  const focus = $("menu-focus").value;
  $("menu-minutes-value").textContent = total;

  const weights = { ...MENU_BASE };
  if (MENU_BOOST[focus]) weights[MENU_BOOST[focus]] += 0.12;
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);

  let sum = 0;
  const rows = Object.entries(weights).map(([k, w]) => {
    const minutes = Math.max(1, Math.round((total * w) / totalW));
    sum += minutes;
    return { "項目": k, "時間(分)": minutes, "ポイント": MENU_TIPS[k] };
  });
  $("menu-table").innerHTML = tableHTML(["項目", "時間(分)", "ポイント"], rows);
  $("menu-total").textContent = `合計: ${sum} 分（四捨五入のため設定時間と多少異なる場合があります）`;
}

/* =========================================================
   練習記録
   ========================================================= */

let logData = loadJSON(STORAGE_LOG, []);
if (!Array.isArray(logData)) logData = [];
logData = logData
  .filter((r) => r && typeof r.date === "string")
  .map((r) => ({
    id: String(r.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    date: r.date,
    minutes: clamp(parseInt(r.minutes, 10) || 0, 0, 600),
    category: String(r.category || "その他"),
    content: String(r.content || ""),
    rating: clamp(parseInt(r.rating, 10) || 3, 1, 5),
    memo: String(r.memo || ""),
  }));

function saveLog() {
  saveJSON(STORAGE_LOG, logData);
}

function sortedLog() {
  return [...logData].sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));
}

function initLog() {
  fillSelect($("log-category"), LOG_CATEGORIES.map((c) => [c, c]), LOG_CATEGORIES[0]);
  $("log-date").value = isoDate(new Date());
  $("log-rating").addEventListener("input", (e) => {
    $("log-rating-value").textContent = e.target.value;
  });

  $("log-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = $("log-date").value;
    if (!date) return;
    logData.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date,
      minutes: clamp(parseInt($("log-minutes").value, 10) || 1, 1, 600),
      category: $("log-category").value,
      content: $("log-content").value.trim(),
      rating: Number($("log-rating").value),
      memo: $("log-memo").value.trim(),
    });
    saveLog();
    $("log-content").value = "";
    $("log-memo").value = "";
    $("log-minutes").value = 30;
    $("log-rating").value = 3;
    $("log-rating-value").textContent = "3";
    const msg = $("log-saved");
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("hidden"), 2000);
    renderLog();
  });

  $("log-export").addEventListener("click", exportCSV);

  $("log-clear").addEventListener("click", () => {
    if (!logData.length) return;
    if (confirm("すべての練習記録を削除します。元に戻せません。よろしいですか？")) {
      logData = [];
      saveLog();
      renderLog();
    }
  });

  $("log-table").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (!btn) return;
    if (confirm("この記録を削除しますか？")) {
      logData = logData.filter((r) => r.id !== btn.dataset.id);
      saveLog();
      renderLog();
    }
  });
}

function renderLog() {
  const empty = logData.length === 0;
  $("log-empty").classList.toggle("hidden", !empty);
  $("log-data").classList.toggle("hidden", empty);
  if (empty) return;

  const total = logData.reduce((a, r) => a + r.minutes, 0);
  const days = new Set(logData.map((r) => r.date)).size;
  const weekStart = daysAgoISO(6);
  const week = logData.filter((r) => r.date >= weekStart).reduce((a, r) => a + r.minutes, 0);
  $("stat-total").textContent = `${total} 分`;
  $("stat-days").textContent = `${days} 日`;
  $("stat-week").textContent = `${week} 分`;

  // 日別（直近14日）
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = daysAgoISO(i);
    daily.push({
      date: d,
      minutes: logData.filter((r) => r.date === d).reduce((a, r) => a + r.minutes, 0),
    });
  }
  const maxDaily = Math.max(1, ...daily.map((d) => d.minutes));
  $("log-daily").innerHTML = daily
    .map((d) => {
      const pct = (d.minutes / maxDaily) * 75;
      const label = `${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8, 10))}`;
      return (
        `<div class="bar-col" title="${d.date}: ${d.minutes}分">` +
        `<span class="bar-value">${d.minutes > 0 ? d.minutes : ""}</span>` +
        `<div class="bar${d.minutes === 0 ? " zero" : ""}" style="height: ${pct.toFixed(1)}%"></div>` +
        `<span class="bar-label">${label}</span>` +
        `</div>`
      );
    })
    .join("");

  // カテゴリ別
  const byCat = {};
  logData.forEach((r) => {
    byCat[r.category] = (byCat[r.category] || 0) + r.minutes;
  });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map((c) => c[1]));
  $("log-category-chart").innerHTML = cats
    .map(
      ([name, min]) =>
        `<div class="hbar-row">` +
        `<span>${escapeHTML(name)}</span>` +
        `<div class="hbar-track"><div class="hbar-fill" style="width: ${((min / maxCat) * 100).toFixed(1)}%"></div></div>` +
        `<span class="hbar-value">${min} 分</span>` +
        `</div>`
    )
    .join("");

  // 一覧
  const rows = sortedLog().map((r) => ({
    "日付": r.date,
    "時間(分)": r.minutes,
    "カテゴリ": r.category,
    "内容": r.content,
    "調子": "★".repeat(r.rating) + "☆".repeat(5 - r.rating),
    "メモ": r.memo,
    "操作": { html: `<button class="btn danger-outline del-btn" data-id="${escapeHTML(r.id)}">削除</button>` },
  }));
  $("log-table").innerHTML = tableHTML(["日付", "時間(分)", "カテゴリ", "内容", "調子", "メモ", "操作"], rows);
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV() {
  if (!logData.length) return;
  const header = ["日付", "時間(分)", "カテゴリ", "内容", "調子(1-5)", "メモ"];
  const lines = [header.map(csvCell).join(",")];
  sortedLog().forEach((r) => {
    lines.push([r.date, r.minutes, r.category, r.content, r.rating, r.memo].map(csvCell).join(","));
  });
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `practice_log_${isoDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   全体再描画・初期化
   ========================================================= */

function renderAll() {
  updateTransposeInfo();
  $("tuner-inst").textContent = settings.instrument;
  refreshRefOptions();
  updateRefInfo();
  renderFingering();
  renderFingTable();
  renderQuiz();
  refreshScaleKeys();
  renderScale();
  renderTranspose();
  renderSlur();
  renderMenu();
}

initSettings();
initGauge();
initTuner();
initRef();
initMetronome();
initFingering();
initScale();
initTranspose();
initSlur();
initMenu();
initLog();
renderAll();
initTabs();

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawStability, 150);
});
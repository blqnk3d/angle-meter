import "./style.css";
import { SensorManager } from "./sensor.js";
import { AngleCalculator } from "./angle-calc.js";
import { InclinometerUI } from "./ui.js";

let sensor, calculator, ui;
let showDecimals = true;
let rafId = null;
let installPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});

function $(id) {
  return document.getElementById(id);
}

function showScreen(id) {
  for (const el of ["start-screen", "unsupported-screen", "meter-screen"]) {
    $(el).classList.toggle("hidden", el !== id);
  }
}

function showUnsupported(reason) {
  const title = $("unsupported-title");
  const msg = $("unsupported-msg");
  const hint = $("unsupported-hint");

  if (reason === "brave-blocked") {
    title.textContent = "Brave Shields blockiert Sensoren";
    msg.textContent = "Brave blockiert standardmäßig Bewegungssensoren. Du musst sie für diese Seite erlauben.";
    hint.textContent = "Tippe auf das Schild-Symbol (Loewe) in der Adressleiste, scrolled zu 'Bewegungssensoren' und aktiviere es. Tippe dann auf 'Erneut versuchen'.";;
  } else if (reason === "permission-denied") {
    title.textContent = "Berechtigung verweigert";
    msg.textContent = "Die Sensorberechtigung wurde verweigert. Bitte erlaube den Zugriff auf Bewegungs- und Orientierungssensoren.";
    hint.textContent = "Überprüfe deine Browsereinstellungen oder versuche es in einem Inkognito-Fenster.";
  } else {
    title.textContent = "Nicht unterstützt";
    msg.textContent = "Dein Gerät oder Browser unterstützt keine Bewegungssensoren.";
    hint.textContent = "Bitte verwende ein Mobilgerät mit iOS Safari, Android Chrome oder Edge.";
  }

  showScreen("unsupported-screen");
}

function updateReadouts({ pitch, roll, inclination }) {
  const incEl = $("angle-value");
  const labelEl = $("angle-label");
  const pitchEl = $("pitch-value");
  const rollEl = $("roll-value");

  const fmt = (v) => {
    const abs = Math.abs(v);
    return showDecimals ? abs.toFixed(1) : Math.round(abs);
  };

  const sign = (v) => (v > 0.5 ? "+" : v < -0.5 ? "-" : "\u00b1");

  incEl.textContent = fmt(inclination);
  pitchEl.textContent = `${sign(pitch)}${fmt(pitch)}\u00b0`;
  rollEl.textContent = `${sign(roll)}${fmt(roll)}\u00b0`;

  if (inclination < 0.5) {
    labelEl.textContent = "Waagerecht";
    incEl.classList.add("is-level");
  } else if (inclination < 2) {
    labelEl.textContent = "Fast waagerecht";
    incEl.classList.remove("is-level");
  } else if (inclination < 10) {
    labelEl.textContent = "Leichte Neigung";
    incEl.classList.remove("is-level");
  } else if (inclination < 30) {
    labelEl.textContent = "Mittlere Neigung";
    incEl.classList.remove("is-level");
  } else {
    labelEl.textContent = "Steile Neigung";
    incEl.classList.remove("is-level");
  }
}

function updateStability(isStable) {
  const dot = $("stability-dot");
  const text = $("stability-text");
  if (dot) {
    dot.classList.toggle("stable", isStable);
  }
  if (text) {
    text.textContent = isStable ? "Stabil" : "Stabilisiert...";
  }
}

function onSensorData({ beta, gamma }) {
  const angles = calculator.update(beta, gamma);
  ui.draw(angles.pitch, angles.roll);
  updateReadouts(angles);
  updateStability(angles.isStable);
}

async function startMeter() {
  showScreen("meter-screen");
  ui.resize();
  sensor.start(onSensorData);

  try {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    }
  } catch {}

  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("portrait");
    }
  } catch {}
}

function stopMeter() {
  sensor.stop();
  calculator.reset();
  showScreen("start-screen");

  try {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
  } catch {}
}

function init() {
  sensor = new SensorManager();
  calculator = new AngleCalculator();

  const canvas = $("inclinometer");
  ui = new InclinometerUI(canvas);

  $("start-btn").addEventListener("click", async () => {
    const result = await sensor.requestPermission();
    if (result.ok) {
      startMeter();
    } else {
      showUnsupported(result.reason);
    }
  });

  $("unsupported-retry").addEventListener("click", async () => {
    showScreen("start-screen");
  });

  $("calibrate-btn").addEventListener("click", () => {
    $("calibrate-overlay").classList.remove("hidden");
  });

  $("calibrate-cancel").addEventListener("click", () => {
    $("calibrate-overlay").classList.add("hidden");
  });

  $("calibrate-confirm").addEventListener("click", () => {
    const lastPitch = calculator.displayPitch + calculator.offsetPitch;
    const lastRoll = calculator.displayRoll + calculator.offsetRoll;
    calculator.calibrate(lastPitch, lastRoll);
    $("calibration-status").textContent = "Gesetzt";
    $("calibrate-overlay").classList.add("hidden");
  });

  $("reset-btn").addEventListener("click", () => {
    stopMeter();
  });

  $("settings-btn").addEventListener("click", () => {
    $("settings-overlay").classList.remove("hidden");
    const installBtn = $("install-btn");
    installBtn.style.display = installPrompt ? "flex" : "none";
  });

  $("settings-close").addEventListener("click", () => {
    $("settings-overlay").classList.add("hidden");
  });

  $("smoothing-range").addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    $("smoothing-value").textContent = `${val}%`;
    calculator.setSmoothing(val / 100);
  });

  $("decimals-toggle").addEventListener("change", (e) => {
    showDecimals = e.target.checked;
  });

  $("install-btn").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      installPrompt = null;
      $("install-btn").style.display = "none";
    }
  });

  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    showScreen("start-screen");
  } else if (typeof DeviceOrientationEvent !== "undefined") {
    showScreen("start-screen");
  } else {
    showScreen("unsupported-screen");
  }

  const overlayClickHandler = (e) => {
    if (e.target.classList.contains("overlay-backdrop")) {
      e.target.classList.add("hidden");
    }
  };
  $("calibrate-overlay").addEventListener("click", overlayClickHandler);
  $("settings-overlay").addEventListener("click", overlayClickHandler);
}

document.addEventListener("DOMContentLoaded", init);

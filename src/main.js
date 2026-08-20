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
    title.textContent = "Brave Shields Blocking Sensors";
    msg.textContent = "Brave blocks motion sensors by default. You need to allow them for this site.";
    hint.textContent = "Tap the Shields icon (lion) in the address bar, scroll to \"Motion sensors\", and enable it. Then tap Try Again.";
  } else if (reason === "permission-denied") {
    title.textContent = "Permission Denied";
    msg.textContent = "Sensor permission was denied. Please allow motion & orientation access and try again.";
    hint.textContent = "Check your browser settings or try in an incognito window.";
  } else {
    title.textContent = "Not Supported";
    msg.textContent = "Your device or browser does not support motion sensors.";
    hint.textContent = "Please try on a mobile device with iOS Safari, Android Chrome, or Edge.";
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
    labelEl.textContent = "Level";
  } else if (inclination < 2) {
    labelEl.textContent = "Nearly level";
  } else if (inclination < 10) {
    labelEl.textContent = "Slight incline";
  } else if (inclination < 30) {
    labelEl.textContent = "Moderate incline";
  } else {
    labelEl.textContent = "Steep incline";
  }
}

function onSensorData({ beta, gamma }) {
  const angles = calculator.update(beta, gamma);
  ui.draw(angles.pitch, angles.roll);
  updateReadouts(angles);
}

function startMeter() {
  showScreen("meter-screen");
  ui.resize();
  sensor.start(onSensorData);
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
    calculator.calibrate(
      calculator.smoothBeta + calculator.offsetBeta,
      calculator.smoothGamma + calculator.offsetGamma
    );
    $("calibration-status").textContent = "Set";
    $("calibrate-overlay").classList.add("hidden");
  });

  $("reset-btn").addEventListener("click", () => {
    calculator.reset();
    $("calibration-status").textContent = "None";
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

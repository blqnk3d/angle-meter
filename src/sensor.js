function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Brave")) return "brave";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  return "other";
}

function pickOrientationEvent() {
  return new Promise((resolve) => {
    let resolved = false;

    const done = (name) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(name);
    };

    const timer = setTimeout(() => {
      done(null);
    }, 1500);

    window.addEventListener("deviceorientationabsolute", function test(e) {
      if (e.beta !== null || e.gamma !== null) {
        window.removeEventListener("deviceorientationabsolute", test);
        done("deviceorientationabsolute");
      }
    });

    window.addEventListener("deviceorientation", function test(e) {
      if (e.beta !== null || e.gamma !== null) {
        window.removeEventListener("deviceorientation", test);
        done("deviceorientation");
      }
    });
  });
}

export class SensorManager {
  constructor() {
    this.supported = false;
    this.listening = false;
    this._callback = null;
    this._handler = null;
    this._eventName = null;
    this.browser = detectBrowser();
  }

  async requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          return { ok: false, reason: "permission-denied" };
        }
      } catch {
        return { ok: false, reason: "permission-denied" };
      }
    }

    this._eventName = await pickOrientationEvent();
    this.supported = !!this._eventName;

    if (!this.supported) {
      return { ok: false, reason: this.browser === "brave" ? "brave-blocked" : "no-sensor" };
    }
    return { ok: true };
  }

  start(callback) {
    if (this.listening) return;
    if (!this._eventName) return;

    this._callback = callback;
    this._handler = (e) => {
      if (e.beta === null && e.gamma === null) return;
      callback({ beta: e.beta, gamma: e.gamma, alpha: e.alpha });
    };

    window.addEventListener(this._eventName, this._handler);
    this.listening = true;
  }

  stop() {
    if (!this.listening) return;
    window.removeEventListener(this._eventName, this._handler);
    this.listening = false;
    this._callback = null;
    this._handler = null;
  }
}

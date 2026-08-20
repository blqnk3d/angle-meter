function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Brave")) return "brave";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  return "other";
}

export class SensorManager {
  constructor() {
    this.supported = false;
    this.listening = false;
    this._callback = null;
    this._handler = null;
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

    this.supported = await this._testSupport();
    if (!this.supported) {
      return { ok: false, reason: this.browser === "brave" ? "brave-blocked" : "no-sensor" };
    }
    return { ok: true };
  }

  start(callback) {
    if (this.listening) return;

    this._callback = callback;
    this._handler = (e) => {
      if (e.beta === null && e.gamma === null) {
        return;
      }
      callback({ beta: e.beta, gamma: e.gamma, alpha: e.alpha });
    };

    window.addEventListener("deviceorientation", this._handler);
    this.listening = true;
  }

  stop() {
    if (!this.listening) return;
    window.removeEventListener("deviceorientation", this._handler);
    this.listening = false;
    this._callback = null;
    this._handler = null;
  }

  _testSupport() {
    return new Promise((resolve) => {
      let received = false;
      const handler = (e) => {
        received = true;
        window.removeEventListener("deviceorientation", handler);
        resolve(e.beta !== null || e.gamma !== null);
      };
      window.addEventListener("deviceorientation", handler);

      setTimeout(() => {
        if (!received) {
          window.removeEventListener("deviceorientation", handler);
          resolve(false);
        }
      }, 1500);
    });
  }
}

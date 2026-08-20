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

const DEG = 180 / Math.PI;

export class SensorManager {
  constructor() {
    this.supported = false;
    this.listening = false;
    this._callback = null;
    this._handler = null;
    this._motionHandler = null;
    this._eventName = null;
    this._lastOrientation = { beta: 0, gamma: 0 };
    this._lastAccel = { pitch: 0, roll: 0 };
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
      this._lastOrientation.beta = e.beta;
      this._lastOrientation.gamma = e.gamma;
      this._emit();
    };

    this._motionHandler = (e) => {
      const ag = e.accelerationIncludingGravity;
      if (!ag || ag.x === null) return;
      const ax = ag.x || 0;
      const ay = ag.y || 0;
      const az = ag.z || 0;
      this._lastAccel.pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * DEG;
      this._lastAccel.roll = Math.atan2(ay, az) * DEG;
      this._emit();
    };

    window.addEventListener(this._eventName, this._handler);
    window.addEventListener("devicemotion", this._motionHandler);
    this.listening = true;
  }

  stop() {
    if (!this.listening) return;
    window.removeEventListener(this._eventName, this._handler);
    window.removeEventListener("devicemotion", this._motionHandler);
    this.listening = false;
    this._callback = null;
    this._handler = null;
    this._motionHandler = null;
  }

  _emit() {
    if (!this._callback) return;
    this._callback({
      beta: this._lastOrientation.beta,
      gamma: this._lastOrientation.gamma,
      accelPitch: this._lastAccel.pitch,
      accelRoll: this._lastAccel.roll,
    });
  }
}

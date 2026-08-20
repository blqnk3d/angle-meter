export class SensorManager {
  constructor() {
    this.supported = false;
    this.listening = false;
    this._callback = null;
    this._handler = null;
  }

  async requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          return false;
        }
      } catch {
        return false;
      }
    }

    this.supported = await this._testSupport();
    return this.supported;
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

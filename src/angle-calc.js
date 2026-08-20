const SMOOTHING_DEFAULT = 0.85;

export class AngleCalculator {
  constructor() {
    this.smoothing = SMOOTHING_DEFAULT;
    this.offsetBeta = 0;
    this.offsetGamma = 0;
    this.offsetSet = false;
    this.smoothBeta = 0;
    this.smoothGamma = 0;
    this.initialized = false;
  }

  update(beta, gamma) {
    const rawBeta = beta - this.offsetBeta;
    const rawGamma = gamma - this.offsetGamma;

    if (!this.initialized) {
      this.smoothBeta = rawBeta;
      this.smoothGamma = rawGamma;
      this.initialized = true;
    }

    const alpha = 1 - this.smoothing;
    this.smoothBeta = this.smoothBeta * this.smoothing + rawBeta * alpha;
    this.smoothGamma = this.smoothGamma * this.smoothing + rawGamma * alpha;

    return {
      pitch: this.smoothBeta,
      roll: this.smoothGamma,
      inclination: Math.sqrt(this.smoothBeta ** 2 + this.smoothGamma ** 2),
    };
  }

  calibrate(beta, gamma) {
    this.offsetBeta = beta;
    this.offsetGamma = gamma;
    this.offsetSet = true;
    this.initialized = false;
    this.smoothBeta = 0;
    this.smoothGamma = 0;
  }

  reset() {
    this.offsetBeta = 0;
    this.offsetGamma = 0;
    this.offsetSet = false;
    this.initialized = false;
    this.smoothBeta = 0;
    this.smoothGamma = 0;
  }

  setSmoothing(value) {
    this.smoothing = Math.max(0, Math.min(0.99, value));
  }
}

const WINDOW_SIZE = 30;
const BASE_VARIANCE_THRESHOLD = 0.005;
const STABLE_CONFIRM_COUNT = 30;

export class AngleCalculator {
  constructor() {
    this.offsetPitch = 0;
    this.offsetRoll = 0;
    this.offsetSet = false;

    this.pitchBuffer = new Float64Array(WINDOW_SIZE);
    this.rollBuffer = new Float64Array(WINDOW_SIZE);
    this.bufferIndex = 0;
    this.bufferCount = 0;

    this.displayPitch = 0;
    this.displayRoll = 0;
    this.consecutiveStable = 0;
    this.isStable = false;

    this.smoothing = 0.35;
  }

  update(beta, gamma) {
    const rawPitch = beta - this.offsetPitch;
    const rawRoll = gamma - this.offsetRoll;

    this.pitchBuffer[this.bufferIndex] = rawPitch;
    this.rollBuffer[this.bufferIndex] = rawRoll;
    this.bufferIndex = (this.bufferIndex + 1) % WINDOW_SIZE;
    if (this.bufferCount < WINDOW_SIZE) this.bufferCount++;

    const count = this.bufferCount;
    let sumP = 0;
    let sumR = 0;
    for (let i = 0; i < count; i++) {
      sumP += this.pitchBuffer[i];
      sumR += this.rollBuffer[i];
    }
    const meanPitch = sumP / count;
    const meanRoll = sumR / count;

    let varP = 0;
    let varR = 0;
    for (let i = 0; i < count; i++) {
      const dp = this.pitchBuffer[i] - meanPitch;
      const dr = this.rollBuffer[i] - meanRoll;
      varP += dp * dp;
      varR += dr * dr;
    }
    varP /= count;
    varR /= count;
    const totalVariance = varP + varR;

    const threshold = BASE_VARIANCE_THRESHOLD * (1 + (1 - this.smoothing) * 3);
    const currentlyStable = count >= WINDOW_SIZE && totalVariance < threshold;

    if (currentlyStable) {
      this.consecutiveStable = Math.min(this.consecutiveStable + 1, STABLE_CONFIRM_COUNT + 10);
    } else {
      this.consecutiveStable = 0;
    }

    this.isStable = this.consecutiveStable >= STABLE_CONFIRM_COUNT;

    this.displayPitch = meanPitch;
    this.displayRoll = meanRoll;

    return {
      pitch: this.displayPitch,
      roll: this.displayRoll,
      inclination: Math.sqrt(this.displayPitch ** 2 + this.displayRoll ** 2),
      isStable: this.isStable,
    };
  }

  calibrate(pitch, roll) {
    this.offsetPitch = pitch;
    this.offsetRoll = roll;
    this.offsetSet = true;
    this.bufferCount = 0;
    this.bufferIndex = 0;
    this.consecutiveStable = 0;
    this.isStable = false;
    this.displayPitch = 0;
    this.displayRoll = 0;
  }

  reset() {
    this.offsetPitch = 0;
    this.offsetRoll = 0;
    this.offsetSet = false;
    this.bufferCount = 0;
    this.bufferIndex = 0;
    this.consecutiveStable = 0;
    this.isStable = false;
    this.displayPitch = 0;
    this.displayRoll = 0;
  }

  setSmoothing(value) {
    this.smoothing = Math.max(0, Math.min(0.99, value));
  }
}

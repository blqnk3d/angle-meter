export class InclinometerUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.radius = Math.min(this.w, this.h) / 2 - 8;
  }

  draw(pitch, roll) {
    const ctx = this.ctx;
    const { cx, cy, radius } = this;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    const maxTilt = 45;
    const clampedPitch = Math.max(-maxTilt, Math.min(maxTilt, pitch));
    const clampedRoll = Math.max(-maxTilt, Math.min(maxTilt, roll));

    const bubbleX = cx + (clampedRoll / maxTilt) * (radius - 20);
    const bubbleY = cy + (clampedPitch / maxTilt) * (radius - 20);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 1; i <= 4; i++) {
      const r = (radius / 4) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    const crossSize = 8;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const inclination = Math.sqrt(pitch ** 2 + roll ** 2);
    const normalized = Math.min(inclination / maxTilt, 1);
    const r = normalized < 0.5 ? 0 : (normalized - 0.5) * 2;
    const g = normalized < 0.5 ? 1 : 1 - (normalized - 0.5) * 2;

    const bubbleRadius = 12;
    const glow = ctx.createRadialGradient(bubbleX, bubbleY, 0, bubbleX, bubbleY, bubbleRadius * 2.5);
    glow.addColorStop(0, `rgba(${Math.round((1 - r) * 80)}, ${Math.round(g * 220)}, ${Math.round(g * 150)}, 0.25)`);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, bubbleRadius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${Math.round((1 - r) * 60)}, ${Math.round(140 + g * 80)}, ${Math.round(100 + g * 50)})`;
    ctx.shadowColor = `rgba(${Math.round((1 - r) * 100)}, ${Math.round(200 * g)}, ${Math.round(150 * g)}, 0.6)`;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, bubbleRadius - 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fill();

    ctx.font = `${Math.round(radius * 0.12)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textAlign = "center";

    const labelRadius = radius - 16;
    const labels = [
      { text: "0°", angle: -Math.PI / 2 },
      { text: "15°", angle: -Math.PI / 2 + Math.PI / 6 },
      { text: "30°", angle: -Math.PI / 2 + Math.PI / 3 },
      { text: "45°", angle: 0 },
      { text: "30°", angle: Math.PI / 6 },
      { text: "15°", angle: Math.PI / 3 },
      { text: "0°", angle: Math.PI / 2 },
      { text: "15°", angle: Math.PI / 2 + Math.PI / 6 },
      { text: "30°", angle: Math.PI / 2 + Math.PI / 3 },
      { text: "45°", angle: Math.PI },
      { text: "30°", angle: -Math.PI / 2 - Math.PI / 3 },
      { text: "15°", angle: -Math.PI / 2 - Math.PI / 6 },
    ];

    ctx.font = `${Math.round(radius * 0.085)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    for (const label of labels) {
      const lx = cx + Math.cos(label.angle) * labelRadius;
      const ly = cy + Math.sin(label.angle) * labelRadius;
      ctx.fillText(label.text, lx, ly + 3);
    }

    ctx.restore();
  }
}

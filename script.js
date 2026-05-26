const landingStage = document.getElementById("landing-stage");
const revealStage = document.getElementById("reveal-stage");
const startButton = document.getElementById("start-button");
const typewriterText = document.getElementById("typewriter-text");
const musicToggle = document.getElementById("music-toggle");
const musicToggleState = musicToggle.querySelector(".music-toggle__state");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let hasStarted = false;
let hasCompletedReveal = false;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function typeText(text, speed) {
  for (const character of text) {
    typewriterText.textContent += character;

    if (prefersReducedMotion) {
      continue;
    }

    const delay = character === "\n" ? speed * 4 : speed + Math.random() * 30;
    await wait(delay);
  }
}

async function runRevealSequence() {
  if (hasCompletedReveal) {
    return;
  }

  typewriterText.textContent = "";

  await wait(prefersReducedMotion ? 0 : 320);
  await typeText("I lied.\nThis was never about a Capstone Project.", prefersReducedMotion ? 0 : 72);
  await wait(prefersReducedMotion ? 0 : 1300);
  typewriterText.textContent += "\n\n";
  await wait(prefersReducedMotion ? 0 : 320);
  await typeText("I just wanted to say that you're really pretty:)", prefersReducedMotion ? 0 : 84);

  typewriterText.classList.add("is-finished");
  hasCompletedReveal = true;
}

startButton.addEventListener("click", async () => {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
  startButton.disabled = true;
  landingStage.classList.add("is-dismissing");
  revealStage.classList.add("is-active");

  await wait(prefersReducedMotion ? 20 : 520);
  runRevealSequence();
});

const ambientAudio = {
  context: null,
  masterGain: null,
  initialized: false,
  enabled: false,

  async init() {
    if (this.initialized) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillators = [
      { type: "sine", frequency: 196, gain: 0.018 },
      { type: "triangle", frequency: 293.66, gain: 0.012 },
      { type: "sine", frequency: 392, gain: 0.008 },
    ];

    filter.type = "lowpass";
    filter.frequency.value = 840;
    filter.Q.value = 3.2;
    masterGain.gain.value = 0.0001;

    oscillators.forEach((spec, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = spec.type;
      oscillator.frequency.value = spec.frequency;
      oscillator.detune.value = index === 0 ? -6 : index === 1 ? 4 : 9;
      gain.gain.value = spec.gain;

      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
    });

    const filterLfo = context.createOscillator();
    const filterLfoGain = context.createGain();
    filterLfo.type = "sine";
    filterLfo.frequency.value = 0.06;
    filterLfoGain.gain.value = 140;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start();

    filter.connect(masterGain);
    masterGain.connect(context.destination);

    this.context = context;
    this.masterGain = masterGain;
    this.initialized = true;
  },

  async toggle() {
    await this.init();

    if (!this.context || !this.masterGain) {
      musicToggle.disabled = true;
      musicToggleState.textContent = "N/A";
      return;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);

    if (!this.enabled) {
      this.masterGain.gain.linearRampToValueAtTime(0.038, now + 1.4);
      this.enabled = true;
      musicToggle.setAttribute("aria-pressed", "true");
      musicToggleState.textContent = "On";
      return;
    }

    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.9);
    this.enabled = false;
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggleState.textContent = "Off";
  },
};

musicToggle.addEventListener("click", () => {
  ambientAudio.toggle();
});

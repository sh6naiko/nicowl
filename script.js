const landingStage = document.getElementById("landing-stage");
const revealStage = document.getElementById("reveal-stage");
const startButton = document.getElementById("start-button");
const typewriterText = document.getElementById("typewriter-text");
const musicToggle = document.getElementById("music-toggle");
const musicToggleState = musicToggle.querySelector(".music-toggle__state");
const musicNote = document.getElementById("music-note");
const ambientTrack = document.getElementById("ambient-track");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let hasStarted = false;
let hasCompletedReveal = false;
let hasShownMusicRecommendation = false;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function syncMusicRecommendation() {
  if (!musicNote) {
    return;
  }

  if (musicController.enabled) {
    musicNote.textContent = "Music on. You're all set.";
    musicNote.classList.remove("is-emphasized");
    musicNote.classList.add("is-satisfied");
    musicToggle.classList.remove("is-recommended");
    startButton.textContent = "Get Started";
    return;
  }

  musicNote.classList.remove("is-satisfied");

  if (hasShownMusicRecommendation) {
    musicNote.textContent = "Turn on \"Happy W U\" for the full experience, or continue anyway.";
    musicNote.classList.add("is-emphasized");
    musicToggle.classList.add("is-recommended");
    startButton.textContent = "Proceed Anyway";
    return;
  }

  musicNote.textContent = "Recommended for the full experience: turn on \"Happy W U\" before you begin.";
  musicNote.classList.remove("is-emphasized");
  musicToggle.classList.remove("is-recommended");
  startButton.textContent = "Get Started";
}

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

  if (!musicController.enabled && !hasShownMusicRecommendation) {
    hasShownMusicRecommendation = true;
    syncMusicRecommendation();
    return;
  }

  hasStarted = true;
  startButton.disabled = true;
  landingStage.classList.add("is-dismissing");
  revealStage.classList.add("is-active");

  await wait(prefersReducedMotion ? 20 : 520);
  runRevealSequence();
});

const musicController = {
  enabled: false,
  fadeFrame: null,
  targetVolume: 1,

  hasTrack() {
    return Boolean(ambientTrack?.getAttribute("src"));
  },

  setState(enabled) {
    this.enabled = enabled;
    musicToggle.setAttribute("aria-pressed", String(enabled));
    musicToggleState.textContent = enabled ? "On" : "Off";
    syncMusicRecommendation();
  },

  fadeVolume(targetVolume, duration) {
    if (!ambientTrack) {
      return Promise.resolve();
    }

    if (this.fadeFrame) {
      window.cancelAnimationFrame(this.fadeFrame);
    }

    const startVolume = ambientTrack.volume;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        ambientTrack.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
          this.fadeFrame = window.requestAnimationFrame(step);
          return;
        }

        this.fadeFrame = null;
        resolve();
      };

      this.fadeFrame = window.requestAnimationFrame(step);
    });
  },

  async toggle() {
    if (!ambientTrack || !this.hasTrack()) {
      musicToggle.disabled = true;
      musicToggleState.textContent = "N/A";
      return;
    }

    if (!this.enabled) {
      try {
        ambientTrack.volume = 0;
        await ambientTrack.play();
        this.setState(true);
        await this.fadeVolume(this.targetVolume, 1200);
      } catch {
        this.setState(false);
        musicToggleState.textContent = "N/A";
      }

      return;
    }

    await this.fadeVolume(0, 700);
    ambientTrack.pause();
    this.setState(false);
  },
};

musicToggle.addEventListener("click", () => {
  musicController.toggle();
});

ambientTrack?.addEventListener("error", () => {
  musicToggle.disabled = true;
  musicToggleState.textContent = "N/A";
  musicNote.textContent = "Music unavailable. You can continue without it.";
  musicNote.classList.remove("is-emphasized", "is-satisfied");
});

syncMusicRecommendation();

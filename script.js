const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const heroHeadlineWrap = document.querySelector(".hero__headline-wrap");
const heroFooter = document.querySelector(".hero__footer");
const heroAmbient = document.querySelector(".hero__ambient");
const teamGroupsRoot = document.querySelector("[data-team-groups]");
const portfolioFiltersRoot = document.querySelector("[data-portfolio-filters]");
const portfolioGridRoot = document.querySelector("[data-portfolio-grid]");
const exitsGridRoot = document.querySelector("[data-exits-grid]");
const introVideo = document.querySelector("[data-intro-video]");
const videoPlayButtons = [...document.querySelectorAll("[data-video-play-toggle]")];
const videoAudioButtons = [...document.querySelectorAll("[data-video-audio-toggle]")];
const contactSheet = document.querySelector("[data-contact-sheet]");
const contactPanel = contactSheet?.querySelector(".contact-sheet__panel");
const contactOpenButtons = [...document.querySelectorAll("[data-contact-open]")];
const contactCloseButtons = [...document.querySelectorAll("[data-contact-close]")];
const contactForm = document.querySelector("[data-contact-form]");
const contactStatus = document.querySelector("[data-contact-status]");
const contactSubmit = document.querySelector("[data-contact-submit]");
const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionApi = window.Motion || null;
const gsapApi = window.gsap || null;
const scrollTriggerApi = window.ScrollTrigger || null;
const motionAvailable = Boolean(motionApi?.animate && motionApi?.inView && motionApi?.stagger);
const gsapAvailable = Boolean(gsapApi && scrollTriggerApi);

let activePortfolioKey = "all";
let activeTeamCardId = "";
let lastContactTrigger = null;
let revealObserver = null;
const motionBoundNodes = new WeakSet();
const hoverBoundNodes = new WeakSet();

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getContactSheetDuration = () => (mediaQuery.matches ? 0 : 380);
const motionEase = [0.22, 1, 0.36, 1];
const getMotion = () => motionApi || {};
const reduceMotion = () => mediaQuery.matches;
const refreshScrollStorytelling = () => {
  if (!gsapAvailable || reduceMotion()) return;
  scrollTriggerApi.refresh();
};

if (motionAvailable) {
  document.body.classList.add("has-motion");
}

if (gsapAvailable) {
  gsapApi.registerPlugin(scrollTriggerApi);
}

const updateHeaderHeight = () => {
  if (!header) return;
  document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
  refreshScrollStorytelling();
};

const setNavState = (isOpen) => {
  if (!nav || !navToggle) return;
  nav.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("is-nav-open", isOpen);
};

const initNavigation = () => {
  if (!navToggle) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavState(!isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setNavState(false));
  });

  document.addEventListener("click", (event) => {
    if (!nav || !navToggle) return;
    if (window.innerWidth > 980) return;
    if (nav.contains(event.target) || navToggle.contains(event.target)) return;
    setNavState(false);
  });
};

const initHeader = () => {
  if (!header) return;

  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  syncHeader();
  updateHeaderHeight();
  window.addEventListener("scroll", syncHeader, { passive: true });
  window.addEventListener("resize", updateHeaderHeight);
};

const animateElementsIn = (
  elements,
  { duration = 0.78, distance = 24, blur = 8, delay = 0, staggerAmount = 0.08 } = {}
) => {
  const targets = [...elements].filter(Boolean);
  if (!targets.length || !motionAvailable || reduceMotion()) return;

  const { animate } = getMotion();

  targets.forEach((node, index) => {
    const { x, y } = getRevealOffset(node, distance);
    const playback = animate(
      node,
      {
        opacity: [0, 1],
        transform: [`translate3d(${x}px, ${y}px, 0)`, "translate3d(0, 0, 0)"],
      },
      {
        duration: getRevealDuration(node, duration),
        delay: delay + index * staggerAmount,
        ease: motionEase,
      }
    );

    Promise.resolve(playback?.finished)
      .catch(() => null)
      .finally(() => {
        node.style.opacity = "";
        node.style.transform = "";
        node.style.willChange = "";
      });
  });
};

const getMotionTargets = (root, selector) =>
  selector === ":scope"
    ? [root].filter(Boolean)
    : [...root.querySelectorAll(selector)].filter((node) => !node.closest("[aria-hidden='true']"));

const getRevealOffset = (node, distance = 18) => {
  if (!node) return { x: 0, y: distance };
  if (node.classList.contains("reveal--right")) return { x: Math.round(distance * 0.9), y: 0 };
  if (
    node.matches(
      ".section-label, .contact-form__caption, .team-card__role, .why-column__index, .thesis-item__index, .lifecycle-stage__index, .exit-card__metric"
    )
  ) {
    return { x: 0, y: Math.max(8, Math.round(distance * 0.5)) };
  }
  if (
    node.matches(
      ".button, .portfolio-filter, .contact-sheet__close, .video-control, .hero__scroll, .team-card__link, .partnership-card a"
    )
  ) {
    return { x: 0, y: Math.max(6, Math.round(distance * 0.42)) };
  }
  return { x: 0, y: distance };
};

const getRevealDuration = (node, baseDuration) => {
  if (!node) return baseDuration;
  if (node.matches("h1, h2")) return baseDuration + 0.08;
  if (node.matches("h3, h4, p, li")) return baseDuration + 0.02;
  if (
    node.matches(
      ".section-label, .contact-form__caption, .button, .portfolio-filter, .contact-sheet__close, .video-control"
    )
  ) {
    return Math.max(0.44, baseDuration - 0.08);
  }
  return baseDuration;
};

const primeMotionTargets = (targets, distance = 18) => {
  targets.forEach((node) => {
    if (!node || node.dataset.motionPrimed === "true") return;
    const { x, y } = getRevealOffset(node, distance);
    node.dataset.motionPrimed = "true";
    node.style.opacity = "0";
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    node.style.willChange = "transform, opacity";
  });
};

const bindMotionGroup = (
  root,
  selector,
  { amount = 0.12, margin = "0px 0px -6% 0px", duration, distance, blur, staggerAmount } = {}
) => {
  if (!root || motionBoundNodes.has(root) || !motionAvailable || reduceMotion()) return;

  motionBoundNodes.add(root);
  const { inView } = getMotion();
  const targets = getMotionTargets(root, selector);
  primeMotionTargets(targets, distance ?? 18);

  inView(
    root,
    () => {
      root.classList.add("is-visible");
      animateElementsIn(targets, { duration, distance, blur, staggerAmount });
      targets.forEach((node) => {
        node.dataset.motionPrimed = "done";
      });
    },
    { amount, margin }
  );
};

const bindMotionHover = (selector, enterState, leaveState) => {
  if (!motionAvailable || reduceMotion()) return;

  const { hover, animate } = getMotion();
  document.querySelectorAll(selector).forEach((node) => {
    if (hoverBoundNodes.has(node)) return;
    hoverBoundNodes.add(node);

    hover(node, () => {
      animate(node, enterState, { duration: 0.22, ease: motionEase });
      return () => animate(node, leaveState, { duration: 0.32, ease: motionEase });
    });
  });
};

const registerRevealNodes = (nodes = document.querySelectorAll(".reveal")) => {
  const revealNodes = [...nodes];
  if (!revealNodes.length) return;

  if (reduceMotion()) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  if (motionAvailable) {
    revealNodes.forEach((node) =>
      bindMotionGroup(node, ":scope", { amount: 0.22, margin: "0px 0px -10% 0px" })
    );
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );
  }

  revealNodes.forEach((node) => {
    if (node.classList.contains("is-visible")) return;
    revealObserver.observe(node);
  });
};

const preparePaintText = () => {
  document.querySelectorAll(".mission-statement").forEach((statement) => {
    if (statement.dataset.missionPaintReady === "true") return;
    statement.dataset.missionPaintReady = "true";
    statement.classList.add("mission-statement--paint");

    statement.querySelectorAll(":scope > span").forEach((line) => {
      const text = line.textContent.trim();
      if (!text) return;
      line.dataset.text = text;
      line.style.setProperty("--mission-paint-clip", "100%");
      line.classList.add("mission-paint-line");
    });
  });

  document.querySelectorAll(".narrative-break h2, .narrative-break__support").forEach((element) => {
    if (element.dataset.paintReady === "true") return;
    if (element.classList.contains("mission-statement")) return;
    if (element.closest(".mission-title")) return;
    if (element.closest(".narrative-break--advantage")) return;

    const text = element.textContent.trim();
    if (!text) return;

    element.dataset.paintReady = "true";
    element.classList.add("paint-text");
    element.textContent = "";

    const base = document.createElement("span");
    base.className = "paint-text__base";
    base.textContent = text;

    const fill = document.createElement("span");
    fill.className = "paint-text__fill";
    fill.setAttribute("aria-hidden", "true");
    fill.textContent = text;

    element.append(base, fill);
  });
};

const initHeroMotion = () => {
  if (reduceMotion() || !heroHeadlineWrap || !heroFooter) {
    document.body.classList.add("hero-motion-reduced");
    return;
  }

  document.body.classList.add("hero-motion-ready");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("hero-motion-active");
    });
  });
};

const initMotionRevealSystem = () => {
  if (reduceMotion()) {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
    return;
  }

  if (!motionAvailable) {
    registerRevealNodes();
    return;
  }

  document.querySelectorAll(".section-head").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.74,
      distance: 14,
      blur: 8,
      staggerAmount: 0.05,
    });
  });

  document.querySelectorAll(".video-section__head").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.72,
      distance: 12,
      blur: 8,
      staggerAmount: 0.05,
    });
  });

  document.querySelectorAll(".video-section__media").forEach((node) => {
    bindMotionGroup(node, ":scope", {
      duration: 0.82,
      distance: 14,
      blur: 8,
    });
  });

  document.querySelectorAll(".why-grid, .thesis-grid").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.7,
      distance: 14,
      blur: 8,
      staggerAmount: 0.05,
    });
  });

  document.querySelectorAll(".narrative-break__inner").forEach((node) => {
    bindMotionGroup(node, ":scope > h2, :scope > .narrative-break__support", {
      duration: 0.82,
      distance: 12,
      blur: 8,
      staggerAmount: 0.055,
    });
  });

  document.querySelectorAll(".team-group").forEach((node) => {
    bindMotionGroup(node, ":scope > .team-group__head, :scope > .team-group__grid > *", {
      duration: 0.68,
      distance: 12,
      blur: 8,
      staggerAmount: 0.045,
    });
  });

  document.querySelectorAll(".portfolio-toolbar, .contact-callout, .exits-block").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.66,
      distance: 10,
      blur: 6,
      staggerAmount: 0.045,
    });
  });

  document.querySelectorAll(".portfolio-grid, .exits-grid, .incubator-columns").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.66,
      distance: 10,
      blur: 6,
      staggerAmount: 0.045,
    });
  });

  document.querySelectorAll(".incubator-statement").forEach((node) => {
    bindMotionGroup(node, ":scope", { duration: 0.7, distance: 10, blur: 6 });
  });

  document.querySelectorAll(".events-hero__content").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.78,
      distance: 14,
      blur: 7,
      staggerAmount: 0.055,
    });
  });

  document.querySelectorAll(".events-gallery__head, .events-carousel").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      duration: 0.72,
      distance: 12,
      blur: 6,
      staggerAmount: 0.045,
    });
  });

  document.querySelectorAll(".events-card, .lifecycle-stage").forEach((node) => {
    bindMotionGroup(node, ":scope > *", {
      amount: 0.18,
      duration: 0.72,
      distance: 12,
      blur: 6,
      staggerAmount: 0.045,
    });
  });
};

const initScrollStorytelling = () => {
  if (!gsapAvailable || reduceMotion()) return;

  preparePaintText();
  const supportsFullNavyMount = !window.matchMedia("(max-width: 720px)").matches;

  if (heroAmbient) {
    gsapApi.to(heroAmbient, {
      yPercent: -2,
      scale: 0.985,
      opacity: 0.035,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  if (heroHeadlineWrap) {
    gsapApi.to(heroHeadlineWrap, {
      yPercent: -2.2,
      scale: 0.982,
      transformOrigin: "50% 45%",
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.15,
      },
    });
  }

  if (heroFooter) {
    gsapApi.to(heroFooter, {
      yPercent: -4,
      opacity: 0.68,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.15,
      },
    });
  }

  document.querySelectorAll(".narrative-break").forEach((section) => {
    const paintTargets = section.querySelectorAll(".paint-text");
    const missionPaintLines = [...section.querySelectorAll(".mission-paint-line")];
    const vector = section.querySelector("[data-vector-draw]");
    const vectorPath = vector?.querySelector("path");
    const inner = section.querySelector(".narrative-break__inner");
    const easeProgress = gsapApi.parseEase ? gsapApi.parseEase("power2.out") : (value) => value;

    if (supportsFullNavyMount) {
      gsapApi.fromTo(
        section,
        {
          y: 52,
          clipPath: "inset(6.5% 0% 0% 0%)",
        },
        {
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 96%",
            end: "top 42%",
            scrub: 0.85,
          },
        }
      );
    }

    paintTargets.forEach((target) => target.style.setProperty("--paint-clip", "100%"));

    scrollTriggerApi.create({
      trigger: section,
      start: "top 78%",
      end: "bottom 28%",
      scrub: 0.9,
      onUpdate: (self) => {
        const normalized = Math.min(Math.max((self.progress - 0.04) / 0.9, 0), 1);
        const eased = easeProgress(normalized);
        const clipValue = `${(100 - eased * 100).toFixed(2)}%`;
        paintTargets.forEach((target) => target.style.setProperty("--paint-clip", clipValue));

        if (missionPaintLines.length) {
          const lineCount = missionPaintLines.length;
          missionPaintLines.forEach((line, index) => {
            const lineStart = index / (lineCount + 1.35);
            const lineDuration = 1.95 / (lineCount + 1.35);
            const lineProgress = Math.min(Math.max((normalized - lineStart) / lineDuration, 0), 1);
            const lineClip = `${(100 - easeProgress(lineProgress) * 100).toFixed(2)}%`;
            line.style.setProperty("--mission-paint-clip", lineClip);
          });
        }
      },
    });

    if (inner) {
      gsapApi.fromTo(
        inner,
        { y: 22 },
        {
          y: -12,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }

    if (vector && vectorPath) {
      const pathLength = vectorPath.getTotalLength();
      gsapApi.set(vectorPath, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
        opacity: 0.28,
      });

      gsapApi.to(vectorPath, {
        strokeDashoffset: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 26%",
          scrub: 1,
        },
      });

      gsapApi.fromTo(
        vector,
        { opacity: 0.08 },
        {
          opacity: 0.22,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            end: "bottom 26%",
            scrub: 1,
          },
        }
      );
    }
  });
};

const initMicroInteractions = () => {
  bindMotionHover(".site-nav a, .site-footer__nav a, .site-footer__nav button", { y: -1.5 }, { y: 0 });
  bindMotionHover(".partnership-card a, .team-card__link", { x: 4 }, { x: 0 });
  bindMotionHover(
    ".button, .portfolio-filter, .contact-sheet__close, .video-control",
    { filter: "brightness(1.04)" },
    { filter: "brightness(1)" }
  );
};

const syncVideoControls = () => {
  if (!introVideo) return;

  const isPlaying = !introVideo.paused && !introVideo.ended;
  const hasSound = !introVideo.muted;

  videoPlayButtons.forEach((button) => {
    button.textContent = isPlaying ? "Pause Film" : "Play Film";
    button.setAttribute("aria-pressed", String(isPlaying));
  });

  videoAudioButtons.forEach((button) => {
    button.textContent = hasSound ? "Sound On" : "Sound Off";
    button.setAttribute("aria-pressed", String(hasSound));
  });
};

const initVideoControls = () => {
  if (!introVideo) return;

  syncVideoControls();

  videoPlayButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (introVideo.paused) {
        try {
          await introVideo.play();
        } catch (error) {
          return;
        }
      } else {
        introVideo.pause();
      }

      syncVideoControls();
    });
  });

  videoAudioButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      introVideo.muted = !introVideo.muted;

      if (!introVideo.muted && introVideo.paused) {
        try {
          await introVideo.play();
        } catch (error) {
          introVideo.muted = true;
        }
      }

      syncVideoControls();
    });
  });

  ["play", "pause", "volumechange"].forEach((eventName) => {
    introVideo.addEventListener(eventName, syncVideoControls);
  });

  introVideo.addEventListener("error", () => {
    videoPlayButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = "Film Unavailable";
    });
    videoAudioButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = "Audio Unavailable";
    });
  });
};

const initHoverVideos = () => {
  const hoverVideos = [...document.querySelectorAll("[data-hover-video]")];
  if (!hoverVideos.length) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const touchLabels = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  const stopVideo = (video, { reset = true } = {}) => {
    const card = video.closest(".video-card");
    const label = card?.querySelector(".video-card__meta span");
    video.pause();
    if (reset) video.currentTime = 0;
    video.muted = true;
    card?.classList.remove("is-playing", "is-muted-fallback");
    card?.setAttribute("aria-pressed", "false");
    if (label) label.textContent = touchLabels ? "Tap to play" : "Hover to play";
  };

  const stopOtherVideos = (activeVideo) => {
    hoverVideos.forEach((video) => {
      if (video !== activeVideo) stopVideo(video);
    });
  };

  const playVideo = async (video, { withSound = false } = {}) => {
    const card = video.closest(".video-card");
    const label = card?.querySelector(".video-card__meta span");
    stopOtherVideos(video);
    video.muted = !withSound;
    video.volume = 1;
    card?.classList.add("is-playing");
    card?.classList.toggle("is-muted-fallback", video.muted);
    card?.setAttribute("aria-pressed", "true");
    if (label) label.textContent = video.muted ? "Playing muted" : "Playing";

    try {
      await video.play();
      card?.classList.add("is-playing");
      card?.classList.toggle("is-muted-fallback", video.muted);
      card?.setAttribute("aria-pressed", "true");
      if (label) label.textContent = video.muted ? "Playing muted" : "Playing";
      return true;
    } catch (error) {
      video.muted = true;

      try {
        await video.play();
        const label = card?.querySelector(".video-card__meta span");
        card?.classList.add("is-playing", "is-muted-fallback");
        card?.setAttribute("aria-pressed", "true");
        if (label) label.textContent = "Playing muted";
        return true;
      } catch (mutedError) {
        card?.classList.remove("is-playing", "is-muted-fallback");
        card?.setAttribute("aria-pressed", "false");
        return false;
      }
    }
  };

  hoverVideos.forEach((video) => {
    const card = video.closest(".video-card");
    if (!card) return;

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.playsInline = true;

    if (touchLabels) {
      video.controls = true;
      const label = card.querySelector(".video-card__meta span");
      if (label) label.textContent = "Tap to play";
    }

    card.setAttribute("aria-pressed", "false");

    const playPreview = () => {
      playVideo(video, { withSound: canHover });
    };

    const stopPreview = () => {
      stopVideo(video);
    };

    const togglePlayback = async (event) => {
      event.preventDefault();

      if (!video.paused && !video.ended) {
        stopVideo(video, { reset: false });
        return;
      }

      await playVideo(video, { withSound: true });
    };

    if (canHover) {
      card.addEventListener("mouseenter", playPreview);
      card.addEventListener("mouseleave", stopPreview);
    }

    card.addEventListener("click", togglePlayback);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      togglePlayback(event);
    });

    video.addEventListener("pause", () => {
      if (!video.ended) return;
      stopVideo(video);
    });
  });
};

const initStackContextIndicators = () => {
  const decks = [...document.querySelectorAll("[data-stacked-card-deck]")];
  if (!decks.length) return;

  const setActiveContextItem = (context, activeIndex) => {
    context.querySelectorAll("[data-stack-context-item]").forEach((item) => {
      const isActive = Number(item.dataset.stackContextItem) === activeIndex;
      item.classList.toggle("is-active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "true");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  };

  decks.forEach((deck) => {
    const context = deck.querySelector("[data-stack-context]");
    const cards = [...deck.querySelectorAll("[data-stack-card]")];

    if (!context || !cards.length) return;

    setActiveContextItem(context, Number(cards[0].dataset.stackIndex || 0));

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!activeEntry) return;

        setActiveContextItem(
          context,
          Number(activeEntry.target.dataset.stackIndex || 0)
        );
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: [0, 0.2, 0.5, 0.8, 1],
      }
    );

    cards.forEach((card) => observer.observe(card));
  });
};

const initEventsCarousel = () => {
  document.querySelectorAll("[data-events-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-events-carousel-track]");
    const realSlides = [...carousel.querySelectorAll("[data-events-slide]")];
    const prevButton = carousel.querySelector("[data-events-prev]");
    const nextButton = carousel.querySelector("[data-events-next]");
    const counter = carousel.querySelector("[data-events-counter]");

    if (!track || !realSlides.length) return;

    const cloneCount = Math.min(2, realSlides.length);
    if (track.dataset.eventsCarouselReady !== "true" && cloneCount) {
      const beforeClones = realSlides.slice(-cloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.dataset.eventsClone = "true";
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });
      const afterClones = realSlides.slice(0, cloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.dataset.eventsClone = "true";
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });

      track.prepend(...beforeClones);
      track.append(...afterClones);
      track.dataset.eventsCarouselReady = "true";
    }

    const slides = [...track.querySelectorAll("[data-events-slide]")];

    let activeIndex = 0;
    let activeSlideIndex = cloneCount;
    let syncFrame = 0;

    const formatIndex = (value) => String(value + 1).padStart(2, "0");
    const getRealIndex = (slideIndex) =>
      (slideIndex - cloneCount + realSlides.length) % realSlides.length;

    const getCurrentSlideIndex = () => {
      const trackRect = track.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;
      return slides.reduce(
        (closestIndex, slide, index) => {
          const slideRect = slide.getBoundingClientRect();
          const slideCenter = slideRect.left + slideRect.width / 2;
          const distance = Math.abs(trackCenter - slideCenter);
          const closestSlide = slides[closestIndex];
          const closestRect = closestSlide.getBoundingClientRect();
          const closestCenter = closestRect.left + closestRect.width / 2;
          return distance < Math.abs(trackCenter - closestCenter) ? index : closestIndex;
        },
        0
      );
    };

    const scrollToSlide = (slideIndex, behavior = reduceMotion() ? "auto" : "smooth") => {
      const slide = slides[slideIndex];
      if (!slide) return;

      const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior,
      });
    };

    const normalizeEdgeSlide = () => {
      if (activeSlideIndex < cloneCount) {
        scrollToSlide(activeSlideIndex + realSlides.length, "auto");
      }

      if (activeSlideIndex >= cloneCount + realSlides.length) {
        scrollToSlide(activeSlideIndex - realSlides.length, "auto");
      }
    };

    const syncCarousel = () => {
      activeSlideIndex = getCurrentSlideIndex();
      activeIndex = getRealIndex(activeSlideIndex);
      slides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === activeSlideIndex);
      });

      if (counter) {
        counter.textContent = `${formatIndex(activeIndex)} / ${String(realSlides.length).padStart(2, "0")}`;
      }

      window.clearTimeout(track._eventsCarouselNormalizeTimer);
      track._eventsCarouselNormalizeTimer = window.setTimeout(normalizeEdgeSlide, 140);
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = window.requestAnimationFrame(syncCarousel);
    };

    prevButton?.addEventListener("click", () => scrollToSlide(activeSlideIndex - 1));
    nextButton?.addEventListener("click", () => scrollToSlide(activeSlideIndex + 1));

    track.addEventListener("scroll", scheduleSync, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToSlide(activeSlideIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToSlide(activeSlideIndex + 1);
      }
    });
    window.addEventListener("resize", scheduleSync);

    requestAnimationFrame(() => scrollToSlide(cloneCount, "auto"));
    syncCarousel();
  });
};

const createTeamCard = (member) => {
  const article = document.createElement("article");
  article.className = "team-card";
  article.dataset.teamCard = member.id;

  const button = document.createElement("button");
  button.className = "team-card__button";
  button.type = "button";
  button.dataset.teamTrigger = member.id;
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `team-panel-${member.id}`);

  const portrait = document.createElement("span");
  portrait.className = "team-card__portrait";

  const image = document.createElement("img");
  image.src = member.image;
  image.alt = member.name;
  image.loading = "lazy";
  image.decoding = "async";
  portrait.append(image);

  const body = document.createElement("span");
  body.className = "team-card__body";

  const role = document.createElement("span");
  role.className = "team-card__role";
  role.textContent = member.role;

  const name = document.createElement("span");
  name.className = "team-card__name";
  name.textContent = member.name;

  const indicator = document.createElement("span");
  indicator.className = "team-card__indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.textContent = "+";

  body.append(role, name);
  button.append(portrait, body, indicator);

  const panel = document.createElement("div");
  panel.className = "team-card__panel";
  panel.id = `team-panel-${member.id}`;
  panel.setAttribute("aria-hidden", "true");

  const panelInner = document.createElement("div");
  panelInner.className = "team-card__panel-inner";

  const summary = document.createElement("p");
  summary.textContent = member.summary;

  if (member.profileUrl) {
    const link = document.createElement("a");
    link.className = "team-card__link";
    link.href = member.profileUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.tabIndex = -1;
    link.textContent = "View Profile";
    panelInner.append(summary, link);
  } else {
    const pending = document.createElement("span");
    pending.className = "team-card__pending";
    pending.textContent = "Profile link coming soon";
    panelInner.append(summary, pending);
  }

  panel.append(panelInner);
  article.append(button, panel);
  return article;
};

const renderTeam = () => {
  const groups = window.TEAM_DATA?.groups || [];
  if (!teamGroupsRoot || !groups.length) return;

  teamGroupsRoot.replaceChildren();

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "team-group reveal";

    const head = document.createElement("div");
    head.className = "team-group__head";

    const title = document.createElement("h3");
    title.textContent = group.label;

    head.append(title);

    const grid = document.createElement("div");
    grid.className = "team-group__grid";

    group.members.forEach((member) => {
      grid.append(createTeamCard(member));
    });

    section.append(head, grid);
    teamGroupsRoot.append(section);
  });

  if (!motionAvailable) {
    registerRevealNodes(teamGroupsRoot.querySelectorAll(".reveal"));
  }

  requestAnimationFrame(refreshScrollStorytelling);
};

const setActiveTeamCard = (nextId) => {
  const cards = [...document.querySelectorAll("[data-team-card]")];

  cards.forEach((card) => {
    const trigger = card.querySelector("[data-team-trigger]");
    const panel = card.querySelector(".team-card__panel");
    const isActive = card.dataset.teamCard === nextId;
    const panelFocusables = [...card.querySelectorAll(".team-card__panel a, .team-card__panel button")];

    card.classList.toggle("is-open", isActive);
    trigger?.setAttribute("aria-expanded", String(isActive));
    if (panel) {
      panel.setAttribute("aria-hidden", String(!isActive));
    }
    panelFocusables.forEach((node) => {
      node.tabIndex = isActive ? 0 : -1;
    });
  });

  activeTeamCardId = nextId;

  window.setTimeout(refreshScrollStorytelling, 420);
};

const initTeamInteractions = () => {
  teamGroupsRoot?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-team-trigger]");
    if (!trigger) return;

    const nextId = trigger.dataset.teamTrigger || "";
    setActiveTeamCard(activeTeamCardId === nextId ? "" : nextId);
  });
};

const getPortfolioCategories = () => {
  const categories = window.PORTFOLIO_DATA?.categories || [];
  const flattened = categories
    .filter((category) => category.key !== "all")
    .flatMap((category) =>
      category.companies.map((company) => ({
        ...company,
        categoryKey: category.key,
        categoryLabel: category.label,
        accent: category.accent,
      }))
    );

  return categories.map((category) =>
    category.key === "all" ? { ...category, companies: flattened } : category
  );
};

const createPortfolioCard = (company) => {
  const card = document.createElement("article");
  card.className = "portfolio-card reveal";
  card.style.setProperty("--card-accent", company.accent || "var(--sage)");

  const visual = document.createElement("div");
  visual.className = "portfolio-card__visual";

  if (company.asset) {
    const logo = document.createElement("img");
    logo.src = company.asset;
    logo.alt = `${company.name} logo`;
    logo.loading = "lazy";
    logo.decoding = "async";
    visual.append(logo);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "portfolio-card__fallback";
    fallback.textContent = company.name;
    visual.append(fallback);
  }

  const meta = document.createElement("div");
  meta.className = "portfolio-card__meta";

  const name = document.createElement("h3");
  name.textContent = company.name;

  const category = document.createElement("p");
  category.textContent = company.categoryLabel;

  meta.append(name, category);

  if (company.ceo) {
    const ceoId = `portfolio-ceo-${company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    card.tabIndex = 0;
    card.setAttribute("aria-describedby", ceoId);

    const ceoCard = document.createElement("aside");
    ceoCard.className = "portfolio-card__ceo";
    ceoCard.id = ceoId;
    ceoCard.setAttribute("aria-label", `${company.name} CEO`);

    const ceoMedia = document.createElement("span");
    ceoMedia.className = "portfolio-card__ceo-media";

    if (company.ceo.image) {
      const ceoImage = document.createElement("img");
      ceoImage.src = company.ceo.image;
      ceoImage.alt = company.ceo.name;
      ceoImage.loading = "lazy";
      ceoImage.decoding = "async";
      ceoMedia.append(ceoImage);
    }

    const ceoBody = document.createElement("span");
    ceoBody.className = "portfolio-card__ceo-body";

    const ceoRole = document.createElement("span");
    ceoRole.className = "portfolio-card__ceo-role";
    ceoRole.textContent = "CEO";

    const ceoName = document.createElement("strong");
    ceoName.textContent = company.ceo.name;

    const ceoSummary = document.createElement("span");
    ceoSummary.className = "portfolio-card__ceo-summary";
    ceoSummary.textContent = company.ceo.summary;

    ceoBody.append(ceoRole, ceoName, ceoSummary);
    ceoCard.append(ceoMedia, ceoBody);
    card.append(visual, meta, ceoCard);
  } else {
    card.append(visual, meta);
  }

  return card;
};

const renderPortfolio = () => {
  const categories = getPortfolioCategories();
  const currentCategory = categories.find((category) => category.key === activePortfolioKey);
  const activeCategory = currentCategory || categories[0];

  if (!portfolioFiltersRoot || !portfolioGridRoot) return;

  portfolioFiltersRoot.replaceChildren();
  portfolioGridRoot.replaceChildren();

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "portfolio-filter";
    button.type = "button";
    button.dataset.portfolioFilter = category.key;
    button.style.setProperty("--filter-accent", category.accent || "var(--text)");
    button.style.setProperty("--filter-foreground", category.foreground || "var(--bg)");
    button.textContent = category.label;
    button.setAttribute("aria-pressed", String(category.key === activeCategory.key));
    if (category.key === activeCategory.key) {
      button.classList.add("is-active");
    }
    portfolioFiltersRoot.append(button);
  });

  activeCategory.companies.forEach((company) => {
    portfolioGridRoot.append(createPortfolioCard(company));
  });

  if (motionAvailable && motionBoundNodes.has(portfolioGridRoot)) {
    portfolioGridRoot.querySelectorAll(".portfolio-card").forEach((node) => {
      bindMotionGroup(node, ":scope", { amount: 0.16, margin: "0px 0px -8% 0px", duration: 0.64, distance: 16, blur: 6 });
    });
  } else if (!motionAvailable) {
    registerRevealNodes(portfolioGridRoot.querySelectorAll(".reveal"));
  }

  requestAnimationFrame(refreshScrollStorytelling);
};

const renderExits = () => {
  const exits = window.PORTFOLIO_DATA?.notableExits || [];
  if (!exitsGridRoot || !exits.length) return;

  exitsGridRoot.replaceChildren();

  exits.forEach((exit) => {
    const article = document.createElement("article");
    article.className = "exit-card reveal";

    const metric = document.createElement("p");
    metric.className = "exit-card__metric";
    metric.textContent = exit.metric;

    const name = document.createElement("h4");
    name.textContent = exit.name;

    const detail = document.createElement("p");
    detail.textContent = exit.detail;

    article.append(metric, name, detail);
    exitsGridRoot.append(article);
  });

  if (!motionAvailable) {
    registerRevealNodes(exitsGridRoot.querySelectorAll(".reveal"));
  }

  requestAnimationFrame(refreshScrollStorytelling);
};

const initPortfolioInteractions = () => {
  portfolioFiltersRoot?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-portfolio-filter]");
    if (!button) return;

    activePortfolioKey = button.dataset.portfolioFilter || "all";
    renderPortfolio();
  });
};

const setContactStatus = (message = "", state = "") => {
  if (!contactStatus) return;
  contactStatus.textContent = message;
  contactStatus.classList.remove("is-success", "is-error");
  if (state) {
    contactStatus.classList.add(`is-${state}`);
  }
};

const lockPage = (className) => {
  document.body.classList.add(className);
};

const unlockPage = (className) => {
  document.body.classList.remove(className);
};

const getContactFocusableElements = () => {
  if (!contactPanel) return [];
  return [...contactPanel.querySelectorAll(focusableSelector)].filter((node) => !node.hidden);
};

const setContactTriggersExpanded = (isExpanded) => {
  contactOpenButtons.forEach((button) => {
    button.setAttribute("aria-expanded", String(isExpanded));
  });
};

const openContactSheet = (trigger = document.activeElement) => {
  if (!contactSheet || !contactPanel) return;

  lastContactTrigger = trigger instanceof HTMLElement ? trigger : null;
  setNavState(false);
  lockPage("is-contact-open");
  setContactTriggersExpanded(true);
  contactSheet.hidden = false;
  contactSheet.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    contactSheet.classList.add("is-open");
    const [firstFocusable] = getContactFocusableElements();
    (firstFocusable || contactPanel).focus();
  });
};

const closeContactSheet = () => {
  if (!contactSheet || !contactPanel || contactSheet.hidden) return;

  contactSheet.classList.remove("is-open");
  contactSheet.setAttribute("aria-hidden", "true");
  unlockPage("is-contact-open");
  setContactTriggersExpanded(false);

  window.setTimeout(() => {
    contactSheet.hidden = true;
    lastContactTrigger?.focus();
  }, getContactSheetDuration());
};

const initContactSheet = () => {
  if (!contactSheet || !contactPanel) return;

  contactOpenButtons.forEach((button) => {
    button.addEventListener("click", () => openContactSheet(button));
  });

  contactCloseButtons.forEach((button) => {
    button.addEventListener("click", closeContactSheet);
  });

  contactSheet.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeContactSheet();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getContactFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
};

const initContactForm = () => {
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(contactForm).entries());

    if (typeof payload.website === "string" && payload.website.trim()) {
      setContactStatus("Unable to submit. Please try again.", "error");
      return;
    }

    contactForm.classList.add("is-submitting");
    if (contactSubmit) {
      contactSubmit.textContent = "Sending...";
    }
    setContactStatus("");

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Unable to submit your inquiry right now.");
      }

      contactForm.reset();
      setContactStatus("Inquiry received. We will follow up as soon as possible.", "success");
      contactPanel?.focus();
    } catch (error) {
      setContactStatus(error.message || "Unable to submit your inquiry right now.", "error");
    } finally {
      contactForm.classList.remove("is-submitting");
      if (contactSubmit) {
        contactSubmit.textContent = "Send Inquiry";
      }
    }
  });
};

const runInit = (name, callback) => {
  try {
    callback();
  } catch (error) {
    console.error(`[init:${name}]`, error);
  }
};

runInit("renderTeam", renderTeam);
runInit("renderPortfolio", renderPortfolio);
runInit("renderExits", renderExits);
runInit("initNavigation", initNavigation);
runInit("initHeader", initHeader);
runInit("initVideoControls", initVideoControls);
runInit("initHoverVideos", initHoverVideos);
runInit("initStackContextIndicators", initStackContextIndicators);
runInit("initEventsCarousel", initEventsCarousel);
runInit("initContactSheet", initContactSheet);
runInit("initContactForm", initContactForm);
runInit("initTeamInteractions", initTeamInteractions);
runInit("initPortfolioInteractions", initPortfolioInteractions);
runInit("initHeroMotion", initHeroMotion);
runInit("initMotionRevealSystem", initMotionRevealSystem);
runInit("initScrollStorytelling", initScrollStorytelling);
runInit("initMicroInteractions", initMicroInteractions);

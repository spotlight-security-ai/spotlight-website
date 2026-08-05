/* Spotlight Security clone — interactions */
(function () {
  "use strict";

  /* ---- Sticky header state ------------------------------------------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav toggle --------------------------------------------- */
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  /* ---- Scroll reveal -------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---- Animated count-up stats --------------------------------------- */
  const parseTarget = (raw) => {
    const m = String(raw).match(/-?[\d,.]+/);
    return m ? parseFloat(m[0].replace(/,/g, "")) : null;
  };
  const fmt = (n, decimals, sep) => {
    let s = decimals ? n.toFixed(decimals) : String(Math.round(n));
    if (sep) s = Number(s).toLocaleString("en-US");
    return s;
  };
  const runCounter = (el) => {
    const raw = el.getAttribute("data-count");
    const target = parseTarget(raw);
    if (target === null) return;
    const prefix = raw.slice(0, raw.indexOf(raw.match(/[\d]/)[0]));
    const suffixMatch = raw.match(/[\d,.]+(.*)$/);
    const suffix = suffixMatch ? suffixMatch[1] : "";
    const decimals = (raw.split(".")[1] || "").replace(/[^\d]/g, "").length;
    const useSep = raw.indexOf(",") > -1 || target >= 10000;
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased, decimals, useSep) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + fmt(target, decimals, useSep) + suffix;
    };
    requestAnimationFrame(step);
  };
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ---- Posture bar fill ---------------------------------------------- */
  const bars = document.querySelectorAll(".posture-bar i[data-fill]");
  if ("IntersectionObserver" in window && bars.length) {
    const bio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.width = e.target.getAttribute("data-fill") + "%";
            bio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    bars.forEach((b) => bio.observe(b));
  }

  /* ---- Industry tabs -------------------------------------------------- */
  const tabBtns = document.querySelectorAll(".tab-btn");
  if (tabBtns.length) {
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-tab");
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
        document.querySelectorAll(".tab-panel").forEach((p) =>
          p.classList.toggle("active", p.id === id)
        );
        window.scrollTo({ top: window.scrollY, behavior: "auto" });
      });
    });
  }

  /* ---- Platform steps-nav active state ------------------------------- */
  const stepLinks = document.querySelectorAll(".steps-nav a");
  const steps = document.querySelectorAll(".step[id]");
  if (stepLinks.length && steps.length && "IntersectionObserver" in window) {
    const sio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            stepLinks.forEach((l) =>
              l.classList.toggle("active", l.getAttribute("href") === "#" + id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    steps.forEach((s) => sio.observe(s));
  }

  /* ---- Animated hero terminal ---------------------------------------- */
  const term = document.querySelector("[data-terminal]");
  if (term) {
    const feed = term.querySelector("[data-feed]");
    const reveals = Array.from(term.querySelectorAll("[data-stage]"));
    const lines = feed ? Array.from(feed.children) : [];
    // hide everything initially
    lines.forEach((l) => (l.style.opacity = "0"));
    reveals.forEach((r) => (r.style.display = "none"));

    let started = false;
    const play = () => {
      if (started) return;
      started = true;
      let delay = 300;
      lines.forEach((l) => {
        setTimeout(() => {
          l.style.transition = "opacity 0.35s ease";
          l.style.opacity = "1";
        }, delay);
        delay += 480;
      });
      reveals.forEach((r) => {
        setTimeout(() => {
          r.style.display = "";
          r.style.transition = "opacity 0.5s ease";
          r.style.opacity = "0";
          requestAnimationFrame(() => (r.style.opacity = "1"));
        }, delay);
        delay += 900;
      });
    };
    if ("IntersectionObserver" in window) {
      const tio = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && play()),
        { threshold: 0.3 }
      );
      tio.observe(term);
    } else {
      lines.forEach((l) => (l.style.opacity = "1"));
      reveals.forEach((r) => (r.style.display = ""));
    }
  }

  /* ---- Footer year ---------------------------------------------------- */
  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();

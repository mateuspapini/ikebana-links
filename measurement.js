"use strict";

(() => {
  const measurementVersion = "1.2.0";
  const consentStorageKey = "ikebana-analytics-consent";
  const trackedLinkSelector = "a[data-link-id]";
  const scrollThresholds = [25, 50, 75, 90, 100];
  const gtmContainerId = document
    .querySelector('meta[name="gtm-container-id"]')
    ?.getAttribute("content")
    ?.trim()
    .toUpperCase();
  const debugMode = new URLSearchParams(window.location.search).get("debug_mode") === "true";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const readConsent = () => {
    try {
      const saved = window.localStorage.getItem(consentStorageKey);
      return saved === "granted" || saved === "denied" ? saved : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (status) => {
    try {
      window.localStorage.setItem(consentStorageKey, status);
    } catch {
      // Consent remains active for this page when storage is unavailable.
    }
  };

  const initialConsent = readConsent();
  document.documentElement.dataset.analyticsConsent = initialConsent || "unset";

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: initialConsent === "granted" ? "granted" : "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });

  const updateClarityConsent = (status) => {
    window.clarity = window.clarity || function clarity() {
      window.clarity.q = window.clarity.q || [];
      window.clarity.q.push(arguments);
    };

    window.clarity("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: status,
    });
  };

  updateClarityConsent(initialConsent === "granted" ? "granted" : "denied");

  const pushEvent = (event, parameters = {}) => {
    const payload = {
      event,
      measurement_version: measurementVersion,
      page_type: "link_aggregator",
      page_path: window.location.pathname,
      debug_mode: debugMode,
      ...parameters,
    };

    window.dataLayer.push(payload);
    if (debugMode) console.debug("[Ikebana Measurement]", JSON.stringify(payload));
  };

  window.dataLayer.push({
    measurement_version: measurementVersion,
    site_name: "ikebana_links",
    site_environment: "production",
    page_type: "link_aggregator",
    debug_mode: debugMode,
  });

  const validGtmId = /^GTM-[A-Z0-9]+$/.test(gtmContainerId || "");

  if (validGtmId) {
    const existingGtm = document.querySelector(
      'script[src^="https://www.googletagmanager.com/gtm.js"]'
    );

    if (existingGtm) {
      console.warn("[Ikebana Measurement] Uma instalacao do GTM ja existe; a segunda carga foi evitada.");
    } else {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmContainerId)}`;
      script.dataset.gtmContainer = gtmContainerId;
      script.addEventListener("error", () => {
        console.error("[Ikebana Measurement] O GTM nao pode ser carregado.");
      });
      document.head.appendChild(script);

      if (initialConsent === "granted") {
        pushEvent("analytics_consent_granted", { consent_source: "stored" });
      }
    }
  } else {
    console.info(
      "[Ikebana Measurement] GTM inativo. Verifique o ID do container antes da publicacao."
    );
  }

  window.ikebanaMeasurement = Object.freeze({
    version: measurementVersion,
    gtmContainerId: validGtmId ? gtmContainerId : null,
    gtmActive: validGtmId,
    debugMode,
    getConsentStatus: readConsent,
    pushEvent,
  });

  document.documentElement.dataset.measurementVersion = measurementVersion;
  document.documentElement.dataset.gtmActive = String(validGtmId);

  const initInteractionMeasurement = () => {
    const links = [...document.querySelectorAll(trackedLinkSelector)];

    const getLinkParameters = (link) => {
      let destination;

      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        destination = new URL(window.location.href);
      }

      const sanitizedUrl = new URL(destination.href);
      sanitizedUrl.search = "";
      sanitizedUrl.hash = "";

      return {
        link_id: link.dataset.linkId || "unknown",
        link_name: link.dataset.linkName || link.getAttribute("aria-label") || "unknown",
        link_url: sanitizedUrl.href,
        link_domain: destination.hostname,
        link_type: link.dataset.linkType || "other",
        link_section: link.dataset.linkSection || "other",
        link_position: Number.parseInt(link.dataset.linkPosition || "0", 10),
        link_position_global: links.indexOf(link) + 1,
        outbound: destination.origin !== window.location.origin,
      };
    };

    document.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest(trackedLinkSelector);
        if (!link) return;
        pushEvent("link_click", getLinkParameters(link));
      },
      { capture: true }
    );

    if ("IntersectionObserver" in window) {
      const viewedLinks = new WeakSet();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
            if (viewedLinks.has(entry.target)) return;

            viewedLinks.add(entry.target);
            observer.unobserve(entry.target);
            pushEvent("link_view", {
              ...getLinkParameters(entry.target),
              visibility_threshold: 50,
            });
          });
        },
        { threshold: 0.5 }
      );

      links.forEach((link) => observer.observe(link));
    }

    const reachedScrollThresholds = new Set();
    let scrollFramePending = false;

    const measureScrollDepth = () => {
      const root = document.documentElement;
      const maximumScroll = Math.max(root.scrollHeight - window.innerHeight, 0);
      const currentScroll = Math.max(window.scrollY, root.scrollTop);
      const scrollPercent = maximumScroll === 0
        ? 100
        : Math.min(100, Math.round((currentScroll / maximumScroll) * 100));

      scrollThresholds.forEach((threshold) => {
        if (scrollPercent < threshold || reachedScrollThresholds.has(threshold)) return;
        reachedScrollThresholds.add(threshold);
        pushEvent("scroll_depth", { scroll_percent: threshold });
      });

      scrollFramePending = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (scrollFramePending) return;
        scrollFramePending = true;
        window.requestAnimationFrame(measureScrollDepth);
      },
      { passive: true }
    );

    measureScrollDepth();

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      pushEvent("theme_change", {
        theme: document.body.classList.contains("theme-dark") ? "dark" : "light",
      });
    });

    const consentBanner = document.getElementById("consent-banner");
    const consentAccept = document.getElementById("consent-accept");
    const consentReject = document.getElementById("consent-reject");
    const privacySettings = document.getElementById("privacy-settings");
    let restoreFocusToPrivacySettings = false;

    const showConsentBanner = ({ restoreFocus = false } = {}) => {
      if (!consentBanner) return;
      restoreFocusToPrivacySettings = restoreFocus;
      consentBanner.hidden = false;
      consentAccept?.focus({ preventScroll: true });
    };

    const hideConsentBanner = () => {
      if (consentBanner) consentBanner.hidden = true;
      if (restoreFocusToPrivacySettings) {
        privacySettings?.focus({ preventScroll: true });
      }
      restoreFocusToPrivacySettings = false;
    };

    const updateConsent = (status) => {
      const previousConsent = readConsent();
      saveConsent(status);
      document.documentElement.dataset.analyticsConsent = status;
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: status,
      });
      updateClarityConsent(status);

      if (status === "granted" && previousConsent !== "granted") {
        pushEvent("analytics_consent_granted", { consent_source: "banner" });
      }

      hideConsentBanner();
    };

    consentAccept?.addEventListener("click", () => updateConsent("granted"));
    consentReject?.addEventListener("click", () => updateConsent("denied"));
    privacySettings?.addEventListener("click", () => showConsentBanner({ restoreFocus: true }));

    if (initialConsent === null) showConsentBanner();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInteractionMeasurement, { once: true });
  } else {
    initInteractionMeasurement();
  }
})();

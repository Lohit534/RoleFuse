// RoleFuse AI - Enterprise Secure Job Scraper
(function () {
  "use strict";

  // Sanitize text safely (anti-XSS and strip control characters)
  function sanitize(str, maxLen = 8000) {
    if (!str || typeof str !== "string") return "";
    return str
      .replace(/<[^>]*>?/gm, " ") // Strip any HTML tags
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "") // Strip non-printable ASCII
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen);
  }

  function extractJobData() {
    let company = "";
    let title = "";
    let description = "";
    const href = window.location.href;

    try {
      // 1. LinkedIn Jobs
      if (href.includes("linkedin.com")) {
        const titleEl = document.querySelector(
          ".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .jobs-top-card__job-title, h1"
        );
        if (titleEl) title = titleEl.innerText;

        const companyEl = document.querySelector(
          ".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .jobs-top-card__company-url, a.ember-view.t-black--light"
        );
        if (companyEl) company = companyEl.innerText;

        const descEl = document.querySelector(
          "#job-details, .jobs-description-content__text, .jobs-description__content, .jobs-box__html-content"
        );
        if (descEl) description = descEl.innerText;
      }
      // 2. Indeed
      else if (href.includes("indeed.com")) {
        const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title, h1");
        if (titleEl) title = titleEl.innerText;

        const companyEl = document.querySelector(
          "[data-company-name='true'], .jobsearch-CompanyInfoContainer a, .jobsearch-InlineCompanyRating div"
        );
        if (companyEl) company = companyEl.innerText;

        const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");
        if (descEl) description = descEl.innerText;
      }
      // 3. Greenhouse & Lever
      else if (href.includes("greenhouse.io") || href.includes("lever.co")) {
        const titleEl = document.querySelector(".app-title, .posting-headline h2, h1");
        if (titleEl) title = titleEl.innerText;

        const companyEl = document.querySelector(".company-name, .posting-headline .company, h3");
        if (companyEl) company = companyEl.innerText;

        const descEl = document.querySelector("#content, .content, .section-wrapper, .posting-content");
        if (descEl) description = descEl.innerText;
      }
      // 4. Fallback / Selected Text
      else {
        const h1 = document.querySelector("h1, h2");
        if (h1) title = h1.innerText;

        const mainContent = document.querySelector("article, main, .job-description, #job-description");
        if (mainContent) description = mainContent.innerText;
      }

      // If user highlighted text, use selection
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 60) {
        description = selection.trim();
      }
    } catch (e) {
      // Fail safely without breaking host page
      console.warn("[RoleFuse Extension] Extraction notice:", e);
    }

    return {
      title: sanitize(title, 200),
      company: sanitize(company, 200),
      description: sanitize(description, 10000),
      sourceUrl: href.slice(0, 500),
      capturedAt: new Date().toISOString()
    };
  }

  // Safe message listener with origin check
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "ROLEFUSE_EXTRACT_JOB") {
      const data = extractJobData();
      sendResponse({ success: true, data });
    }
    return true; // Keep message channel open for async response
  });
})();

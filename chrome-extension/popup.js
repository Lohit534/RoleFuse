document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("jobTitle");
  const companyInput = document.getElementById("company");
  const jdInput = document.getElementById("jobDescription");
  const captureBtn = document.getElementById("captureBtn");
  const coverLetterBtn = document.getElementById("coverLetterBtn");
  const optimizeBtn = document.getElementById("optimizeBtn");
  const statusText = document.getElementById("statusText");

  // Determine base app URL safely
  const BASE_URL = "http://localhost:3000";

  function setStatus(msg, isSuccess = true) {
    if (statusText) {
      statusText.innerText = msg;
      statusText.style.color = isSuccess ? "#087F6E" : "#111827";
    }
  }

  function capture() {
    setStatus("Analyzing job posting on active tab...");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        setStatus("Unable to detect active tab.", false);
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "ROLEFUSE_EXTRACT_JOB" },
        (response) => {
          if (chrome.runtime.lastError || !response || !response.data) {
            setStatus("Ready. Paste or type details below.");
            return;
          }

          const { title, company, description } = response.data;
          let foundCount = 0;

          if (title) {
            titleInput.value = title;
            foundCount++;
          }
          if (company) {
            companyInput.value = company;
            foundCount++;
          }
          if (description) {
            jdInput.value = description;
            foundCount++;
          }

          if (foundCount > 0) {
            setStatus("Job details successfully captured!");
          } else {
            setStatus("No job posting detected on this tab.");
          }
        }
      );
    });
  }

  // Initial capture on popup open
  capture();

  captureBtn.addEventListener("click", capture);

  coverLetterBtn.addEventListener("click", () => {
    const title = encodeURIComponent(titleInput.value.trim() || "");
    const company = encodeURIComponent(companyInput.value.trim() || "");
    const jd = encodeURIComponent(jdInput.value.trim() || "");

    const targetUrl = `${BASE_URL}/dashboard/cover-letter?title=${title}&company=${company}&jd=${jd}`;
    chrome.tabs.create({ url: targetUrl });
  });

  optimizeBtn.addEventListener("click", () => {
    const jd = encodeURIComponent(jdInput.value.trim() || "");
    const targetUrl = `${BASE_URL}/dashboard?jd=${jd}`;
    chrome.tabs.create({ url: targetUrl });
  });
});

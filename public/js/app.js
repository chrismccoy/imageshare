/**
 * Image upload page.
 */

(() => {
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif"];

  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  const form = document.getElementById("form");
  const maxBytes = Number(form.dataset.maxBytes);

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  const fileInput = document.getElementById("file-input");
  const dropzone = document.getElementById("dropzone");
  const pasteTarget = document.getElementById("paste-target");
  const browseBtn = document.getElementById("browse-btn");
  const submitBtn = document.getElementById("submit-btn");
  const statusBox = document.getElementById("status");
  const previewWrap = document.getElementById("preview-wrap");
  const preview = document.getElementById("preview");
  const fileNameEl = document.getElementById("file-name");
  const progressWrap = document.getElementById("progress-wrap");
  const progress = document.getElementById("progress");
  const errorEl = document.getElementById("error");

  let activeTab = tabs[0];
  let activePanel = panels[0];
  let selected = null;

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
    statusBox.classList.remove("hidden");
  };

  const clearError = () => errorEl.classList.add("hidden");

  const formatBytes = (bytes) =>
    bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.round(bytes / 1000)} KB`;

  const select = (file) =>
    new Promise((resolve) => {
      clearError();
      selected = null;
      submitBtn.disabled = true;
      previewWrap.classList.add("hidden");

      if (!file) return resolve(false);

      if (!ALLOWED_TYPES.includes(file.type)) {
        showError("Only PNG, JPEG, and GIF images are supported.");
        return resolve(false);
      }

      if (file.size > maxBytes) {
        showError(
          `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`
        );
        return resolve(false);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        fileNameEl.textContent = `${file.name || "Pasted image"} — ${formatBytes(file.size)}`;
        previewWrap.classList.remove("hidden");
        statusBox.classList.remove("hidden");
        selected = file;
        submitBtn.disabled = false;
        resolve(true);
      };
      reader.onerror = () => {
        showError("Could not read that file.");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });

  const upload = () => {
    if (!selected) return;

    submitBtn.disabled = true;
    clearError();
    progress.style.width = "0%";
    progressWrap.classList.remove("hidden");

    const body = new FormData();
    body.append("image", selected);

    const request = new XMLHttpRequest();
    request.open("POST", "/i/create");
    request.setRequestHeader("x-csrf-token", csrfToken);
    request.setRequestHeader("Accept", "application/json");

    request.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      progress.style.width = `${Math.round((e.loaded / e.total) * 100)}%`;
    });

    request.addEventListener("load", () => {
      let payload = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = {};
      }

      if (request.status === 201 && payload.url) {
        window.location.href = payload.url;
        return;
      }

      progressWrap.classList.add("hidden");
      submitBtn.disabled = false;
      showError(payload.error || "Upload failed. Please try again.");
    });

    request.addEventListener("error", () => {
      progressWrap.classList.add("hidden");
      submitBtn.disabled = false;
      showError("Network error. Please try again.");
    });

    request.send(body);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab === activeTab) return;

      activeTab.classList.remove("border-brand-500", "text-brand-600", "bg-brand-50/50");
      activeTab.classList.add("border-transparent", "text-surface-400");
      activePanel.classList.add("hidden");

      tab.classList.add("border-brand-500", "text-brand-600", "bg-brand-50/50");
      tab.classList.remove("border-transparent", "text-surface-400");

      const panel = document.getElementById(`panel-${tab.dataset.panel}`);
      panel.classList.remove("hidden");

      activeTab = tab;
      activePanel = panel;

      if (tab.dataset.panel === "clipboard") pasteTarget.focus();
    });
  });

  ["dragenter", "dragover"].forEach((event) => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      dropzone.classList.add("border-brand-300", "bg-brand-50/30");
    });
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-brand-300", "bg-brand-50/30");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-brand-300", "bg-brand-50/30");
    select(e.dataTransfer.files[0]);
  });

  dropzone.addEventListener("click", () => fileInput.click());
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => select(fileInput.files[0]));

  document.addEventListener("paste", (e) => {
    const item = [...(e.clipboardData?.items ?? [])].find((entry) =>
      ALLOWED_TYPES.includes(entry.type)
    );
    if (!item) return;

    e.preventDefault();
    select(item.getAsFile()).then((ready) => {
      if (ready) upload();
    });
  });

  submitBtn.addEventListener("click", upload);
  form.addEventListener("submit", (e) => e.preventDefault());
})();

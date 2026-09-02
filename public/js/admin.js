/**
 * Admin dashboard
 */

(() => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const row = document.querySelector(`tr[data-row-id="${id}"]`);
      const actionsCell = btn.closest("td");

      if (!btn.dataset.confirming) {
        btn.dataset.confirming = "1";
        btn.textContent = "Confirm?";
        btn.classList.replace("text-red-500", "text-red-700");
        btn.classList.replace("hover:bg-red-50", "bg-red-50");

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.className =
          "cancel-btn px-3 py-1.5 text-xs font-medium rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition cursor-pointer";
        actionsCell.querySelector("div").appendChild(cancel);

        cancel.addEventListener("click", () => {
          btn.dataset.confirming = "";
          btn.textContent = "Delete";
          btn.classList.replace("text-red-700", "text-red-500");
          btn.classList.replace("bg-red-50", "hover:bg-red-50");
          cancel.remove();
        });

        return;
      }

      btn.disabled = true;
      btn.textContent = "...";
      const cancelBtn = actionsCell.querySelector(".cancel-btn");
      if (cancelBtn) cancelBtn.remove();

      try {
        const res = await fetch(`/admin/images/${id}`, {
          method: "DELETE",
          headers: { "x-csrf-token": csrfToken },
        });
        const data = await res.json();
        if (data.success) {
          const countEl = document.getElementById("image-count");
          if (countEl) {
            const current = parseInt(countEl.textContent, 10);
            if (!isNaN(current)) countEl.textContent = `${current - 1} total`;
          }
          row.style.transition = "opacity 0.2s";
          row.style.opacity = "0";
          setTimeout(() => {
            row.remove();
            const tbody = document.querySelector("tbody");
            if (tbody && tbody.querySelectorAll("tr").length === 0) {
              const tableContainer = document.querySelector(".overflow-hidden");
              const emptyTpl = document.getElementById("empty-state-tpl");
              tableContainer.replaceWith(emptyTpl.content.cloneNode(true));
            }
          }, 200);
        } else {
          btn.textContent = "Error";
          btn.classList.replace("text-red-500", "text-red-700");
          btn.disabled = false;
        }
      } catch {
        btn.textContent = "Error";
        btn.classList.replace("text-red-500", "text-red-700");
        btn.disabled = false;
      }
    });
  });
})();

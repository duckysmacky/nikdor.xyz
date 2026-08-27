(() => {
    const modal = document.getElementById("order-modal");
    const form = document.getElementById("order-form");
    const serviceInput = document.getElementById("order-service");
    const errorBox = modal ? modal.querySelector(".order-form-error") : null;
    const successBox = modal ? modal.querySelector(".order-success") : null;
    const successId = modal ? modal.querySelector("#order-success-id") : null;
    const closeButtons = modal
        ? Array.from(modal.querySelectorAll("[data-order-close]"))
        : [];

    if (!modal || !form || !serviceInput || !errorBox) return;

    const submitButton = form.querySelector('button[type="submit"]');
    let storedBodyPadding = "";
    let lastFocused = null;

    const siblingLayers = () =>
        Array.from(document.body.children).filter(
            (el) => el !== modal && el.tagName !== "SCRIPT"
        );

    // The service field is a <select>: assigning an unknown value leaves it
    // empty, so anything we cannot match falls back to "Other".
    const selectService = (serviceName) => {
        serviceInput.value = serviceName || "";
        if (!serviceInput.value) serviceInput.value = "Other";
    };

    const openModal = (serviceName) => {
        lastFocused = document.activeElement;
        selectService(serviceName);
        errorBox.classList.remove("is-visible");
        errorBox.textContent = "";

        if (successBox) {
            successBox.classList.remove("is-visible");
        }

        if (successId) {
            successId.textContent = "";
        }

        form.classList.remove("is-hidden");
        modal.removeAttribute("inert");
        modal.setAttribute("aria-hidden", "false");
        modal.classList.add("is-visible");
        document.body.classList.add("modal-open");

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        if (scrollbarWidth > 0) {
            storedBodyPadding = document.body.style.paddingRight;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        siblingLayers().forEach((el) => el.setAttribute("inert", ""));
        serviceInput.focus({ preventScroll: true });
    };

    const closeModal = () => {
        if (!modal.classList.contains("is-visible")) return;

        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("inert", "");
        document.body.classList.remove("modal-open");
        document.body.style.paddingRight = storedBodyPadding;

        siblingLayers().forEach((el) => el.removeAttribute("inert"));

        form.reset();
        errorBox.classList.remove("is-visible");
        errorBox.textContent = "";

        if (successBox) {
            successBox.classList.remove("is-visible");
        }

        if (successId) {
            successId.textContent = "";
        }

        form.classList.remove("is-hidden");

        if (lastFocused && typeof lastFocused.focus === "function") {
            lastFocused.focus({ preventScroll: true });
        }
    };

    const showError = (message) => {
        errorBox.textContent = message;
        errorBox.classList.add("is-visible");
    };

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest(".order-trigger");
        if (!trigger) return;
        openModal(trigger.getAttribute("data-service"));
    });

    closeButtons.forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-visible")) {
            closeModal();
        }
    });

    const DEV_MODE = false;
    const API_BASE = DEV_MODE ? "http://127.0.0.1:8000" : "";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            service: formData.get("service")?.toString().trim(),
            name: formData.get("name")?.toString().trim(),
            email: formData.get("email")?.toString().trim(),
            budget: formData.get("budget")
                ? Number(formData.get("budget"))
                : null,
            duration: formData.get("duration")?.toString().trim() || null,
            message: formData.get("message")?.toString().trim() || null,
        };

        if (
            !payload.service ||
            !payload.name ||
            !payload.email ||
            !payload.message
        ) {
            showError("Please fill out all required fields.");
            return;
        }

        const originalLabel = submitButton ? submitButton.textContent : "";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "sending...";
        }

        try {
            const response = await fetch(`${API_BASE}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const message = data.error || "Something went wrong. Please try again.";

                showError(message);

                return;
            }

            const data = await response.json().catch(() => ({}));

            if (successId && data.id) {
                successId.textContent = data.id;
            }

            if (successBox) {
                successBox.classList.add("is-visible");
            }

            form.classList.add("is-hidden");
        } catch (error) {
            showError("Network error. Please try again.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalLabel;
            }
        }
    });
})();

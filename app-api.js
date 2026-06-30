const config = window.VANLOST_CONFIG || {};
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const API_BASE_URL = (isLocal ? config.localApiUrl : config.productionApiUrl || "https://vanlostandfound-api.onrender.com").replace(/\/$/, "");

const state = {
  items: [],
  isLoading: false,
  filters: {
    search: "",
    status: "all",
    category: "all",
    area: "all"
  }
};

const elements = {
  items: document.querySelector("#items"),
  template: document.querySelector("#item-template"),
  emptyState: document.querySelector("#empty-state"),
  resultsCount: document.querySelector("#results-count"),
  totalItems: document.querySelector("#total-items"),
  search: document.querySelector("#search"),
  statusFilter: document.querySelector("#status-filter"),
  categoryFilter: document.querySelector("#category-filter"),
  areaFilter: document.querySelector("#area-filter"),
  form: document.querySelector("#report-form"),
  formNote: document.querySelector("#form-note"),
  resetDemo: document.querySelector("#reset-demo"),
  year: document.querySelector("#year"),
  navToggle: document.querySelector(".nav-toggle"),
  navLinks: document.querySelector("#nav-links")
};

init();

function init() {
  elements.year.textContent = new Date().getFullYear();
  elements.form.elements.date.value = new Date().toISOString().slice(0, 10);
  bindEvents();
  fetchItems();
}

function bindEvents() {
  elements.search.addEventListener("input", debounce(event => {
    state.filters.search = event.target.value.trim();
    fetchItems();
  }, 250));

  elements.statusFilter.addEventListener("change", event => {
    state.filters.status = event.target.value;
    fetchItems();
  });

  elements.categoryFilter.addEventListener("change", event => {
    state.filters.category = event.target.value;
    fetchItems();
  });

  elements.areaFilter.addEventListener("change", event => {
    state.filters.area = event.target.value;
    fetchItems();
  });

  elements.form.addEventListener("submit", async event => {
    event.preventDefault();
    elements.formNote.textContent = "Saving listing...";

    const formData = new FormData(elements.form);
    const newItem = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save this listing.");
      }

      elements.form.reset();
      elements.form.elements.date.value = new Date().toISOString().slice(0, 10);
      elements.formNote.textContent = "Listing saved to the Render backend.";
      await fetchItems();
    } catch (error) {
      elements.formNote.textContent = `Backend error: ${error.message}`;
    }
  });

  elements.resetDemo.addEventListener("click", fetchItems);

  elements.navToggle.addEventListener("click", () => {
    const isOpen = elements.navLinks.classList.toggle("open");
    elements.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  elements.navLinks.addEventListener("click", event => {
    if (event.target.matches("a")) {
      elements.navLinks.classList.remove("open");
      elements.navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

async function fetchItems() {
  state.isLoading = true;
  render();

  try {
    const params = new URLSearchParams();
    if (state.filters.search) params.set("search", state.filters.search);
    if (state.filters.status !== "all") params.set("status", state.filters.status);
    if (state.filters.category !== "all") params.set("category", state.filters.category);
    if (state.filters.area !== "all") params.set("area", state.filters.area);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/api/items${query}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Could not load listings.");
    }

    state.items = payload.items || [];
    elements.formNote.textContent = "";
  } catch (error) {
    state.items = [];
    elements.formNote.textContent = `Backend error: ${error.message}. Check that the Render service is deployed and awake.`;
  } finally {
    state.isLoading = false;
    render();
  }
}

function render() {
  elements.items.innerHTML = "";
  elements.totalItems.textContent = state.items.length;

  if (state.isLoading) {
    elements.resultsCount.textContent = "Loading listings from Render...";
    elements.emptyState.hidden = true;
    return;
  }

  elements.emptyState.hidden = state.items.length > 0;
  elements.resultsCount.textContent = `Showing ${state.items.length} listing${state.items.length === 1 ? "" : "s"} from the backend`;
  state.items.forEach(item => elements.items.append(createItemCard(item)));
}

function createItemCard(item) {
  const clone = elements.template.content.cloneNode(true);
  const card = clone.querySelector(".item-card");
  const status = clone.querySelector(".status-pill");
  const contact = clone.querySelector(".contact");
  const button = clone.querySelector(".contact-button");

  status.textContent = item.status;
  status.classList.add(item.status.toLowerCase());
  clone.querySelector(".category").textContent = item.category;
  clone.querySelector("h3").textContent = item.title;
  clone.querySelector(".description").textContent = item.description;
  clone.querySelector(".area").textContent = item.area;
  clone.querySelector(".date").textContent = formatDate(item.date);
  contact.textContent = item.contact;

  button.addEventListener("click", () => {
    const isHidden = contact.hidden;
    contact.hidden = !isHidden;
    button.textContent = isHidden ? "Hide contact" : "Show contact";
  });

  card.dataset.itemId = item.id;
  return clone;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function debounce(callback, delay) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

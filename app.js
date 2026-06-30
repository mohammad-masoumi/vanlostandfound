const STORAGE_KEY = "vanlostandfound-items";
const API_BASE_URL = (window.VANLOST_API_BASE_URL ?? "").replace(/\/$/, "");
const API_TIMEOUT_MS = 2500;

const sampleItems = [
  {
    id: crypto.randomUUID?.() ?? "item-1",
    status: "Found",
    category: "Bag",
    title: "Black backpack near Waterfront Station",
    description: "Found by the main entrance. Owner should be able to describe the contents and brand.",
    area: "Downtown",
    date: new Date().toISOString().slice(0, 10),
    contact: "waterfront-desk@example.com"
  },
  {
    id: crypto.randomUUID?.() ?? "item-2",
    status: "Lost",
    category: "Wallet",
    title: "Brown leather wallet",
    description: "Last seen around Kits Beach. Contains cards with initials M.M. Reward offered.",
    area: "Kitsilano",
    date: offsetDate(-1),
    contact: "text 604-555-0198"
  },
  {
    id: crypto.randomUUID?.() ?? "item-3",
    status: "Found",
    category: "Keys",
    title: "Key ring with blue fob",
    description: "Found on a bench near SFU Burnaby transit loop. Includes two silver keys.",
    area: "Burnaby",
    date: offsetDate(-2),
    contact: "campus security front desk"
  },
  {
    id: crypto.randomUUID?.() ?? "item-4",
    status: "Lost",
    category: "Phone",
    title: "iPhone with clear case",
    description: "Lost on the 99 B-Line toward UBC. Lock screen has a dog photo.",
    area: "UBC",
    date: offsetDate(-3),
    contact: "vanlost.phone@example.com"
  },
  {
    id: crypto.randomUUID?.() ?? "item-5",
    status: "Found",
    category: "ID / Documents",
    title: "Student card",
    description: "Found at a coffee shop counter. Name is hidden for privacy; describe the school and photo.",
    area: "North Vancouver",
    date: offsetDate(-4),
    contact: "manager at the cafe counter"
  },
  {
    id: crypto.randomUUID?.() ?? "item-6",
    status: "Lost",
    category: "Bike",
    title: "Matte green commuter bike",
    description: "Last locked near Richmond-Brighouse. Has a rear rack and bell with a scratch mark.",
    area: "Richmond",
    date: offsetDate(-5),
    contact: "bike-owner@example.com"
  }
];

const state = {
  items: [],
  usingBackend: false,
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

async function init() {
  elements.year.textContent = new Date().getFullYear();
  elements.form.elements.date.value = new Date().toISOString().slice(0, 10);
  elements.formNote.textContent = "Loading listings...";
  bindEvents();
  await loadListings();
  render();
}

function bindEvents() {
  elements.search.addEventListener("input", event => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  elements.statusFilter.addEventListener("change", event => {
    state.filters.status = event.target.value;
    render();
  });

  elements.categoryFilter.addEventListener("change", event => {
    state.filters.category = event.target.value;
    render();
  });

  elements.areaFilter.addEventListener("change", event => {
    state.filters.area = event.target.value;
    render();
  });

  elements.form.addEventListener("submit", async event => {
    event.preventDefault();
    elements.formNote.textContent = "Saving listing...";

    const formData = new FormData(elements.form);
    const newItem = Object.fromEntries(formData.entries());

    if (state.usingBackend) {
      try {
        const { item } = await apiRequest("/api/items", {
          method: "POST",
          body: newItem
        });
        state.items = [item, ...state.items];
        resetReportForm();
        elements.formNote.textContent = "Listing added to the shared backend.";
        render();
        return;
      } catch (error) {
        console.warn("Backend save failed; saving locally instead.", error);
        state.usingBackend = false;
      }
    }

    state.items = [
      {
        id: crypto.randomUUID?.() ?? `item-${Date.now()}`,
        ...newItem
      },
      ...state.items
    ];

    saveLocalItems(state.items);
    resetReportForm();
    elements.formNote.textContent = "Backend unavailable, so the listing was saved in this browser only.";
    render();
  });

  elements.resetDemo.addEventListener("click", async () => {
    if (state.usingBackend) {
      await loadListings();
      elements.formNote.textContent = "Shared listings reloaded from the backend.";
      render();
      return;
    }

    state.items = sampleItems;
    saveLocalItems(state.items);
    elements.formNote.textContent = "Local demo data was reset.";
    render();
  });

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

async function loadListings() {
  try {
    const { items } = await apiRequest("/api/items");
    state.items = Array.isArray(items) ? items : [];
    state.usingBackend = true;
    elements.formNote.textContent = "Connected to the shared backend.";
  } catch (error) {
    console.info("Backend unavailable; using local browser storage.", error);
    state.items = loadLocalItems();
    state.usingBackend = false;
    elements.formNote.textContent = "Demo mode: listings are saved in this browser only.";
  }
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await getErrorMessage(response);
      throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getErrorMessage(response) {
  try {
    const data = await response.json();
    if (Array.isArray(data.errors)) return data.errors.join(" ");
    return data.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function resetReportForm() {
  elements.form.reset();
  elements.form.elements.date.value = new Date().toISOString().slice(0, 10);
}

function render() {
  const filteredItems = getFilteredItems();
  elements.items.innerHTML = "";
  elements.emptyState.hidden = filteredItems.length > 0;
  elements.totalItems.textContent = state.items.length;
  elements.resultsCount.textContent = `Showing ${filteredItems.length} of ${state.items.length} listing${state.items.length === 1 ? "" : "s"}`;

  filteredItems.forEach(item => elements.items.append(createItemCard(item)));
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

function getFilteredItems() {
  const { search, status, category, area } = state.filters;

  return state.items.filter(item => {
    const searchBlob = `${item.title} ${item.description} ${item.category} ${item.area} ${item.status}`.toLowerCase();
    return (
      (!search || searchBlob.includes(search)) &&
      (status === "all" || item.status === status) &&
      (category === "all" || item.category === category) &&
      (area === "all" || item.area === area)
    );
  });
}

function loadLocalItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleItems;
  } catch {
    return sampleItems;
  }
}

function saveLocalItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

const STORAGE_KEY = "vanlostandfound-items";

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
  items: loadItems(),
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

  elements.form.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(elements.form);
    const newItem = Object.fromEntries(formData.entries());

    state.items = [
      {
        id: crypto.randomUUID?.() ?? `item-${Date.now()}`,
        ...newItem
      },
      ...state.items
    ];

    saveItems(state.items);
    elements.form.reset();
    elements.form.elements.date.value = new Date().toISOString().slice(0, 10);
    elements.formNote.textContent = "Listing added. It is saved in this browser demo.";
    render();
  });

  elements.resetDemo.addEventListener("click", () => {
    state.items = sampleItems;
    saveItems(state.items);
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

function loadItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleItems;
  } catch {
    return sampleItems;
  }
}

function saveItems(items) {
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

export const STATUSES = ["Lost", "Found"];
export const CATEGORIES = [
  "Phone",
  "Wallet",
  "Keys",
  "Bag",
  "Bike",
  "Pet",
  "ID / Documents",
  "Other"
];
export const AREAS = [
  "Downtown",
  "Kitsilano",
  "UBC",
  "Burnaby",
  "North Vancouver",
  "Richmond",
  "Surrey",
  "Other"
];

const FIELD_LIMITS = {
  title: { min: 2, max: 80 },
  description: { min: 10, max: 260 },
  contact: { min: 3, max: 90 }
};

export function normalizeQuery(query = {}) {
  return {
    search: cleanOptionalString(query.search),
    status: query.status === "all" ? undefined : cleanOptionalString(query.status),
    category: query.category === "all" ? undefined : cleanOptionalString(query.category),
    area: query.area === "all" ? undefined : cleanOptionalString(query.area)
  };
}

export function validateCreateListing(payload) {
  return validateListing(payload, { partial: false });
}

export function validateUpdateListing(payload) {
  return validateListing(payload, { partial: true });
}

function validateListing(payload, { partial }) {
  const errors = [];
  const value = {};

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      value,
      errors: ["Request body must be a JSON object."]
    };
  }

  validateEnumField(payload, value, errors, "status", STATUSES, partial);
  validateEnumField(payload, value, errors, "category", CATEGORIES, partial);
  validateTextField(payload, value, errors, "title", FIELD_LIMITS.title, partial);
  validateTextField(payload, value, errors, "description", FIELD_LIMITS.description, partial);
  validateEnumField(payload, value, errors, "area", AREAS, partial);
  validateDateField(payload, value, errors, "date", partial);
  validateTextField(payload, value, errors, "contact", FIELD_LIMITS.contact, partial);

  if (partial && Object.keys(value).length === 0 && errors.length === 0) {
    errors.push("At least one editable field must be provided.");
  }

  return { value, errors };
}

function validateEnumField(payload, value, errors, field, allowedValues, partial) {
  if (payload[field] === undefined) {
    if (!partial) errors.push(`${field} is required.`);
    return;
  }

  const cleaned = cleanRequiredString(payload[field]);
  if (!cleaned || !allowedValues.includes(cleaned)) {
    errors.push(`${field} must be one of: ${allowedValues.join(", ")}.`);
    return;
  }

  value[field] = cleaned;
}

function validateTextField(payload, value, errors, field, limits, partial) {
  if (payload[field] === undefined) {
    if (!partial) errors.push(`${field} is required.`);
    return;
  }

  const cleaned = cleanRequiredString(payload[field]);
  if (!cleaned) {
    errors.push(`${field} cannot be empty.`);
    return;
  }

  if (cleaned.length < limits.min || cleaned.length > limits.max) {
    errors.push(`${field} must be between ${limits.min} and ${limits.max} characters.`);
    return;
  }

  value[field] = cleaned;
}

function validateDateField(payload, value, errors, field, partial) {
  if (payload[field] === undefined) {
    if (!partial) errors.push(`${field} is required.`);
    return;
  }

  const cleaned = cleanRequiredString(payload[field]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    errors.push(`${field} must use YYYY-MM-DD format.`);
    return;
  }

  const date = new Date(`${cleaned}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== cleaned) {
    errors.push(`${field} must be a real calendar date.`);
    return;
  }

  value[field] = cleaned;
}

function cleanRequiredString(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}

function cleanOptionalString(input) {
  if (typeof input !== "string") return undefined;
  const cleaned = input.trim().replace(/\s+/g, " ");
  return cleaned || undefined;
}

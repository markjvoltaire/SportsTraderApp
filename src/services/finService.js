import API_BASE_URL from "../config/api";

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body:
      body == null
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      payload?.details ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchFinCatalogue() {
  return request("/api/fin/catalogue");
}

export async function createFinIndividualCustomer(payload, authToken) {
  return request("/api/fin/onboarding/individual", {
    method: "POST",
    body: payload,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}

export async function uploadFinCustomerDocuments({ customerId, files = [] }, authToken) {
  const formData = new FormData();
  formData.append("customer_id", customerId);

  files.forEach((file, index) => {
    if (!file?.uri) return;
    formData.append(`file${index + 1}`, {
      uri: file.uri,
      name: file.name || `upload_${index + 1}.jpg`,
      type: file.type || "image/jpeg",
    });
  });

  return request("/api/fin/onboarding/upload", {
    method: "POST",
    body: formData,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}

export async function attachFinCustomerDocuments(payload, authToken) {
  return request("/api/fin/onboarding/attach", {
    method: "POST",
    body: payload,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}

export async function fetchFinCustomerStatus(customerId, authToken) {
  return request(`/api/fin/onboarding/status/${encodeURIComponent(customerId)}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}

export function saveAuth(authResponse: { token: string; user: unknown }) {
  const payload = {
    token: authResponse.token,
    user: authResponse.user,
  };
  localStorage.setItem("techfestAuth", JSON.stringify(payload));
  return payload;
}

export function clearAuth() {
  localStorage.removeItem("techfestAuth");
}

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("techfestAuth") || "null");
  } catch {
    return null;
  }
}

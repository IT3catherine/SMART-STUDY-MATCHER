/**
 * LocalStorage auth helper.
 * Stores JWT token and user object returned from backend.
 */
const TOKEN_KEY = "spm_token";
const USER_KEY = "spm_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch (e) {
    return null; /* Safe fallback */
  }
}

export function isAuthed() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

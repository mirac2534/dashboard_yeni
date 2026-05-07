const AUTH_KEY = 'synapse-authenticated';

export function isAuthenticated() {
  localStorage.removeItem(AUTH_KEY);
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.setItem(AUTH_KEY, 'true');
}

export function clearAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}

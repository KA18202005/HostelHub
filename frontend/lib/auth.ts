export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    window.location.href = "/login";
  }
}
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "تطبيق تتبع المصروفات";

export const APP_LOGO = "https://placehold.co/128x128/10b981/ffffff?text=💰";

// Generate login URL - not used in standalone mode
export const getLoginUrl = () => {
  return "/";
};

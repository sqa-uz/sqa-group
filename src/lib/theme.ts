/** The visitor's light/dark choice, kept in localStorage. Light is the default. */
export const THEME_STORAGE_KEY = "sqa-theme";

/** Runs in <head> before first paint so a saved dark theme never flashes light. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="dark")t="light";var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();`;

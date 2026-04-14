// ==UserScript==
// @name         Substack light mode
// @namespace    https://dungnt.net/
// @version      2026-04-14
// @description  Switch to light mode for substack and substack base website.
// @author       Dzung Nguyen (nhymxu)
// @match        https://thoughts.jock.pl/
// @match        https://www.softwareenchiridion.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jock.pl
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/nhymxu/UserScripts/main/substack-light-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/nhymxu/UserScripts/main/substack-light-mode.user.js
// ==/UserScript==

// Idea & CSS from https://github.com/victor-david/substack-reader

const styles = `
/* substack.light.css */
:root {
    --background_contrast_1: #fff !important;
    --background_contrast_2: #fff !important;
    --color-accent-themed: #9e9e9e !important;
    --color-bg-secondary-themed: #fff !important;
    --color-detail-themed: #e6e6e6 !important;
    --color-fg-primary: #444 !important;
    --color-fg-secondary: #444 !important;
    --color-primary-themed: #000 !important;
    --color-secondary-themed: #444 !important;
    --cover_bg_color: #fff !important;
    --cover_print_secondary: #000 !important;
    --cover_print_tertiary: #000 !important;
    --print_on_web_bg_color: #444 !important;
    --print_secondary: #444 !important;
    --print_secondary_on_web_bg_color: #444 !important;
    --web_bg_color: #fff !important;
}

._pubTheme_ztq6h_1 {
    --color-bg-secondary: #eee !important;
    --color-button-primary-bg-hover: #aaa !important;
    --color-button-primary-bg: #ddd !important;
    --color-button-primary-fg: #000 !important;
    --color-button-secondary-bg-hover: #aaa !important;
    --color-button-secondary-bg: #ddd !important;
    --color-button-secondary-fg: #000 !important;
    --color-fg-primary: #444 !important;
}
`;

(() => {
  GM_addStyle(styles);
})();
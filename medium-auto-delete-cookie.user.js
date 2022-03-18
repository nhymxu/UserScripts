// ==UserScript==
// @name         Dz - medium cookie reset
// @namespace    https://dungnt.net/
// @version      0.1.1
// @description  Auto delete medium cookie each visit
// @author       Dung Nguyen (nhymxu)
// @match        https://towardsdatascience.com/*
// @match        https://*.medium.com/*
// @match        https://levelup.gitconnected.com/*
// @icon         https://www.google.com/s2/favicons?domain=medium.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/nhymxu/UserScripts/main/medium-auto-delete-cookie.user.js
// @downloadURL    https://raw.githubusercontent.com/nhymxu/UserScripts/main/medium-auto-delete-cookie.user.js
// ==/UserScript==

(function() {
    'use strict';
    document.cookie = "uid=";
})();

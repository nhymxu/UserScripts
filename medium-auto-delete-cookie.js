// ==UserScript==
// @name         Dz - medium cookie reset
// @namespace    https://dungnt.net/
// @version      0.1
// @description  Auto delete medium cookie each visit
// @author       Dung Nguyen (nhymxu)
// @match        https://towardsdatascience.com/*
// @match        https://*.medium.com/*
// @icon         https://www.google.com/s2/favicons?domain=medium.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.cookie = "uid=";
})();

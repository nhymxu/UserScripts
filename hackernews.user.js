// ==UserScript==
// @name         Better hackernews reader
// @namespace    https://dungnt.net/
// @version      0.1.0
// @description  HN but it is not an eyesore
// @author       Dung Nguyen (nhymxu)
// @match        https://news.ycombinator.com
// @match        https://news.ycombinator.com/*
// @icon         https://www.google.com/s2/favicons?domain=ycombinator.com
// @resource     NxCustomCSS https://gist.githubusercontent.com/Darrenmeehan/d7ccd863abec1a0c348d2aa6ba920b0d/raw/6c934e5e69a6e9e17cc91913e4e9579636100ae9/hn.css
// @grant GM_getResourceText
// @grant GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    // https://gist.github.com/Darrenmeehan/d7ccd863abec1a0c348d2aa6ba920b0d
    // https://gist.github.com/xypnox/2e550b29151090484494815800e9fcc0
    const my_css = GM_getResourceText("NxCustomCSS");

    GM_addStyle(my_css);
})();

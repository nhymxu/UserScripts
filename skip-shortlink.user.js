// ==UserScript==
// @name         Nhymxu prevent shorten link
// @namespace    https://dungnt.net/
// @version      0.1.0
// @description  try to take over the world!
// @author       Dz
// @match        https://link1s.com/st*
// @match        https://megaurl.in/st*
// @match        https://megalink.vip/st*
// @match        https://megalink.pro/st*
// @match        https://mmo1s.com/st*
// @match        https://loptelink.vip/st*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = window.location.hash;
    if (urlParams.has('api') && urlParams.has('url')) {
        window.location.href = urlParams.get('url') + window.location.hash;
    }
})();

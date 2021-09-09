// ==UserScript==
// @name          Dz - DownAlbum stories
// @author        nhymxu
// @version       0.0.1
// @description   Download Facebook (Album & Video), Instagram.
// @namespace     DzDownAlbum
// @grant         unsafeWindow
// @grant         GM_xmlhttpRequest
// @include       htt*://instagram.com/*
// @include       htt*://*.instagram.com/*
// @require       https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require       https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.10.0/js/md5.min.js
// @require       https://raw.githubusercontent.com/nhymxu/DownAlbum/dev/lib.js
// ==/UserScript==

const base = 'https://www.instagram.com/';
let isWinReady = false;
let toExport = null;


async function loadStories(id, highlightId = '') {
    const hash = '61e453c4b7d667c6294e71c57afa6e63';
    const variables = `{"reel_ids":["${id}"],"tag_names":[],"location_ids":[],"highlight_reel_ids":[${highlightId}],"precomposed_overlay":false,"show_story_header_follow_button":false}`;

    try {
        const url = `${base}graphql/query/?query_hash=${hash}&variables=${variables}`;
        let r = await fetch(url, {
            credentials: 'include'
        });
        r = await r.json();
        if (!r.data.reels_media || !r.data.reels_media.length) {
            alert('No stories loaded');
            return;
        }

        openWindow();
        const type = highlightId !== '' ? 'GraphHighlightReel' : 'GraphReel';
        const {items, latest_reel_media: last, owner, user} = r.data.reels_media.filter(e => e.__typename === type)[0];
        const lastTime = last ? last : items[0].taken_at_timestamp;
        const photodata = {
            aDes: '',
            aName: 'Stories',
            aAuth: (user || owner).username,
            aLink: `${base}${(user || owner).username}`,
            aTime: lastTime ? 'Last Update: ' + parseTime(lastTime) : '',
            newL: true,
            newLayout: true,
            photos: [],
            videos: [],
            type: 'Stories',
        };
        items.forEach((e, i) => {
            const p = {
                url: e.display_url,
                href: '',
                date: parseTime(e.taken_at_timestamp)
            };
            if (e.video_resources) {
                p.videoIdx = photodata.videos.length;
                const {src} = e.video_resources[e.video_resources.length - 1];
                photodata.videos.push({
                    url: src,
                    thumb: e.display_url
                });
            }
            photodata.photos.push(p);
        });
        if (isWinReady) {
            nx_export_data({data: photodata});
        } else {
            toExport = photodata;
        }
    } catch (e) {
        console.error(e);
        alert('Cannot load stories');
    }
}

if (unsafeWindow === undefined) {
    alert("Cannot init script. Please try Greasemonkey/Scriptish.");
} else {
    unsafeWindow.name = 'main';
    console = unsafeWindow.console;
    try {
        // var expG = exportFunction(g, unsafeWindow, {
        //     defineAs: "g"
        // });
        // unsafeWindow.g = expG;
        var expLoadStories = exportFunction(loadStories, unsafeWindow, {
            defineAs: "loadStories"
        });
        unsafeWindow.dzLoadStories = expLoadStories;
    } catch (e) {
        unsafeWindow.dzLoadStories = expLoadStories;
        // unsafeWindow.g = g;
    }
    // document.addEventListener("DOMContentLoaded", dFAinit, false);
    // setTimeout(dFAinit, 2000);
}

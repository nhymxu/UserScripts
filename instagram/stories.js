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
const profiles = {};
var g = {};

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

async function loadHighlights(id) {
	const hash = 'ad99dd9d3646cc3c0dda65debcd266a7';
	const variables = `{"user_id":"${id}","include_highlight_reels":true}`;
	try {
		const url = `${base}graphql/query/?query_hash=${hash}&variables=${variables}`;
		let r = await fetch(url, {credentials: 'include'});
		r = await r.json();

		const list = r.data.user.edge_highlight_reels.edges;
		if (!list || !list.length) {
			alert('No highlights loaded');
			return;
		}

		createDialog();

        g.statusEle = qS('.daCounter');
		g.statusEle.innerHTML = '<p>Select highlight to download:</p>'

        for (let i = 0; i < list.length; i++) {
			const n = list[i].node;
			const a = document.createElement('a');
			g.statusEle.appendChild(a);
			a.style.cssText = 'width: 100px; display: inline-block;';
			a.innerHTML = `<img src="${n.cover_media_cropped_thumbnail.url}" style="width:100%;"><br>${n.title}`;
			a.addEventListener('click', () => loadStories(id, `"${n.id}"`));
		}
	} catch (e) {
		console.error(e);
		alert('Cannot load highlights');
	}
}

async function _get_profile_data(username) {
    try {
        let r = await fetch(`https://www.instagram.com/${username}/?__a=1`);
        return (await r.json()).graphql.user.id;
    } catch (e) {
        console.error(e);
        return null;
    }
}

function _addLink(k, target) {
    var isProfile = (k.tagName == 'HEADER' || k.parentNode.tagName == 'HEADER');
    let username = null;
    let user_id = null;

    if (isProfile) {
        const u = k.parentNode.querySelector('h1, h2, span a');
        if (u) {
            username = u.textContent;
            if (!username || !username.length) {
                return;
            }
        }
    }

    var tParent = target.parentNode;
    var t = k.querySelector('img, video');
    if (t) {
        var src = t.getAttribute('src');
        if (!src) {
            return setTimeout(addLink, 300);
        }
        src = isProfile && profiles[username] ? profiles[username].src : parseFbSrc(src);
        if (qS('.dLink [href="' + src + '"]')) {
            return;
        }
        var next = isProfile ? target.querySelector('.dLink') :
            target.nextElementSibling;
        if (next) {
            if (next.childNodes[0] &&
                next.childNodes[0].getAttribute('href') == src) {
                return;
            } else {
                (isProfile ? target : tParent).removeChild(next);
            }
        }
    }

    if (isProfile) {
        if (profiles[username] === null) {
            return;
        }
        
        if (profiles[username] === undefined) {
            profiles[username] = null;
            // user_id = _get_profile_data(username);
            user_id = unsafeWindow._sharedData.entry_data.ProfilePage[0].graphql.user.id;
            profiles[username] = {user_id};
        }

        if (!profiles[username]) {
            return;
        }

        if (!k.querySelector(`.dStory[data-id="${user_id}"]`)) {
            const storyBtn = document.createElement('a');
            storyBtn.className = 'dStory';
            storyBtn.style.cssText = 'max-width: 200px; cursor: pointer; display: block;';
            storyBtn.dataset.id = user_id;
            storyBtn.textContent = '📥 Stories';
            k.appendChild(storyBtn);
            storyBtn.addEventListener('click', () => loadStories(user_id));
            const highlightBtn = document.createElement('a');
            highlightBtn.style.cssText = 'max-width: 200px; cursor: pointer;';
            highlightBtn.textContent = '📥 Highlights';
            k.appendChild(highlightBtn);
            highlightBtn.addEventListener('click', () => loadHighlights(user_id));
        }
    }
}

var init = function() {
    var href = location.href;
    var site = href.match(/instagram\.com/);

    if (document.querySelector('#dFA') || !site) {
        return;
    }

    if (location.host.match(/instagram.com/)) {
        if (location.href.indexOf('explore/') > 0) {
            return;
        }

        let k = qSA('article>div:nth-of-type(2), header>div:nth-of-type(1):not([role="button"])');
        for (var i = 0; i < k.length; i++) {
            if (k[i].nextElementSibling) {
                _addLink(k[i], k[i].nextElementSibling);
            }
        }
    }
};

if (unsafeWindow === undefined) {
    alert("Cannot init script. Please try Greasemonkey/Scriptish.");
} else {
    unsafeWindow.name = 'main';
    console = unsafeWindow.console;
    try {
        var expG = exportFunction(g, unsafeWindow, {
            defineAs: "g"
        });
        unsafeWindow.g = expG;
        // var expLoadStories = exportFunction(loadStories, unsafeWindow, {
        //     defineAs: "loadStories"
        // });
        // unsafeWindow.loadStories = expLoadStories;
    } catch (e) {
        // unsafeWindow.loadStories = loadStories;
        unsafeWindow.g = g;
    }
    document.addEventListener("DOMContentLoaded", init, false);
    setTimeout(init, 2000);
}




 
var dFAinit = function(){
  var href = location.href;
  var site = href.match(/(facebook|instagram|twitter|weibo)\.com|ask\.fm|pinterest/);
  var isTwitter = href.indexOf('twitter.com') > 0;
  if (document.querySelector('#dFA') || !site) {
    return;
  }
  if (location.host.match(/instagram.com|facebook.com|twitter.com/)) {
    var o = window.WebKitMutationObserver || window.MutationObserver;
    if (o && !window.addedObserver) {
      window.addedObserver = true;
      var observer = new o(runLater);
      observer.observe(document.body, {subtree: true, childList: true});
      runLater();
    }
  }
  var k, k2, klass;
  if (site[0] == 'instagram.com') {
    klass = qS('header section div span button, header section div button')
    if (!klass) {
      return;
    }
    klass = klass.parentNode;
    k = document.createElement('div');
    k.className = klass ? klass.className : '';
  } else {
    k = document.createElement('li');
  }
  k2 = k.cloneNode();
  k.innerHTML = '<a id="dFA" class="navSubmenu">DownAlbum</a>';
  k2.innerHTML = '<a id="dFAsetup" class="navSubmenu">DownAlbum(Setup)</a>';
  var t = qS('.gn_topmenulist ul') || qS('.uiContextualLayer [role="menu"]') ||
    qS('header section div') /* ig */ || (isTwitter && qS('[role="menu"]')) /* twitter */;
  if(t){
    t.appendChild(k); t.appendChild(k2);
    k.addEventListener("click", function(){
      dFAcore();
    });
    k2.addEventListener("click", function(){
      dFAcore(true);
    });
  }
  if(href.indexOf('facebook.com') > 0){
    if (t) {
      var pBtn = document.createElement('li');
      pBtn.innerHTML = '<a id="photosOf" class="navSubmenu">[FB] Open "Photos of"</a>';
      t.appendChild(pBtn);
      pBtn.addEventListener('click', photosOfHelper);
    }
    if(!t && qS('#userNavigation, #logoutMenu')){
      // Handle async menu
      $('#pageLoginAnchor, #logoutMenu').on('click.dfainit', function(){
        setTimeout(dFAinit, 500);
      });
    }
  }else if(href.indexOf('pinterest') > 0){
    if(!qS('#dfaButton')){
      let search = qS('.SearchPage') ? qS('.SearchPage .gridCentered') : null;
      t = qS('.boardHeaderWrapper') || search || (qS('h1') ? qS('h1').parentNode : null);
      if (!t) {
        return;
      }
      t.innerHTML = '<button id="dfaButton">DownAlbum</button>' +
        '<button id="dfaSetButton">DownAlbum(Setup)</button>' + t.innerHTML;
      qS('#dfaButton').addEventListener("click", function(){
        dFAcore();
      });
      qS('#dfaSetButton').addEventListener("click", function(){
        dFAcore(true);
      });
    }
  }else if(href.indexOf('ask.fm') > 0){
    k = qS('.profileButton').parentNode;
    if (k) {
      k.innerHTML += '<a class="link-green" onClick="dFAcore();">DownAlbum</a>' + 
        '<a class="link-green" onClick="dFAcore(true);">DownAlbum(Setup)</a>';
    } else {
      setTimeout(dFAinit, 300);
    }
  }
};


 

async function loadStories(id, highlightId = '') {
  const hash = '61e453c4b7d667c6294e71c57afa6e63';
  const variables = `{"reel_ids":["${id}"],"tag_names":[],` +
      `"location_ids":[],"highlight_reel_ids":[${highlightId}],`+
      `"precomposed_overlay":false,"show_story_header_follow_button":false}`;
  try {
    const url = `${base}graphql/query/?query_hash=${hash}&variables=${variables}`;
    let r = await fetch(url, { credentials: 'include' });
    r = await r.json();
    if (!r.data.reels_media || !r.data.reels_media.length) {
      alert('No stories loaded');
      return;
    }
    openWindow();
    const type = highlightId !== '' ? 'GraphHighlightReel' : 'GraphReel';
    const { items, latest_reel_media: last, owner, user } =
      r.data.reels_media.filter(e => e.__typename === type)[0];
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
      const p = { url: e.display_url, href: '',
        date: parseTime(e.taken_at_timestamp) };
      if (e.video_resources) {
        p.videoIdx = photodata.videos.length;
        const { src } = e.video_resources[e.video_resources.length - 1];
        photodata.videos.push({ url: src, thumb: e.display_url });
      }
      photodata.photos.push(p);
    });
    if (isWinReady) {
      sendRequest({ type:'export', data: photodata });
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
    let r = await fetch(url, { credentials: 'include' });
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
      a.innerHTML = `<img src="${n.cover_media_cropped_thumbnail.url}" ` +
        `style="width:100%;" /><br>${n.title}`;
      a.addEventListener('click', () => loadStories(id, `"${n.id}"`));
    }
  } catch (e) {
    console.error(e);
    alert('Cannot load highlights');
  }
}


function photosOfHelper() {
  var userId;
  var timeline = qS('#pagelet_timeline_main_column');
  try {
    if (timeline) {
      userId = JSON.parse(timeline.getAttribute('data-gt')).profile_owner;
    }
  } catch(e) {}
 
  var cover = qS('.coverWrap') || qS('.coverImage');
  try {
    if (cover && !userId) {
      userId = cover.href.match(/set=([\w\d\.]+)/)[1].split('.')[3];
    }
  } catch(e) {}
 
  if (userId) {
    location.href = '/search/' + userId + '/photos-of/intersect';
  }
}


function getText(s, html, parent){
  var q = parent ? parent.querySelector(s) : qS(s);
  var t = 'textContent';
  if(q && q.querySelectorAll('br').length){t = 'innerHTML';}
  if(q && html && q.querySelectorAll('a').length){t = 'innerHTML';}
  return q ? q[t] : "";
}
function getDOM(html){
  var doc;
  if(document.implementation){
    doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = html;
  }else if(DOMParser){
    doc = (new DOMParser).parseFromString(html, 'text/html');
  }else{
    doc = document.createElement('div');
    doc.innerHTML = html;
  }
  return doc;
}

function parsePos(n) {
  return +((n * 100).toFixed(3));
}

function getSharedData(response) {
  var html = response;
  var doc = getDOM(html);
  s = doc.querySelectorAll('script');
  for (i=0; i<s.length; i++) {
    if (!s[i].src && s[i].textContent.indexOf('_sharedData') > 0) {
      s = s[i].textContent;
      break;
    }
  }
  return JSON.parse(s.match(/({".*})/)[1]);
}

function createDialog() {
  if (qS('#daContainer')) {
    qS('#daContainer').style = '';
    qS('#stopAjaxCkb').checked = false;
    return;
  }
  var d = document.createElement('div');
  var s = document.createElement('style');
  s.textContent = '#daContainer {position: fixed; width: 360px; \
    top: 20%; left: 50%; margin-left: -180px; background: #FFF; \
    padding: 1em; border-radius: 0.5em; line-height: 2em; z-index: 9999;\
    box-shadow: 1px 3px 3px 0 rgba(0,0,0,.2),1px 3px 15px 2px rgba(0,0,0,.2);}\
    #daHeader {font-size: 1.5rem; font-weight: 700; background: #FFF; \
    padding: 1rem 0.5rem; color: rgba(0,0,0,.85); \
    border-bottom: 1px solid rgba(34,36,38,.15);} \
    .daCounter {max-height: 300px;overflow-y: auto;} \
    #daContent {font-size: 1.2em; line-height: 1.4; padding: .5rem;} \
    #daContainer a {cursor: pointer;border: 1px solid black;padding: 10px; \
      display: block;} \
    #stopAjaxCkb {display: inline-block; -webkit-appearance: checkbox; \
    width: auto;}';
  document.head.appendChild(s);
  d.id = 'daContainer';
  d.innerHTML = '<div id="daHeader">DownAlbum</div><div id="daContent">' +
    'Status: <span class="daCounter"></span><br>' +
    '<label>Stop <input id="stopAjaxCkb" type="checkbox"></label>' +
    '<div class="daExtra"></div>' +
    '<a class="daOutput">Output</a><a class="daClose">Close</a></div>';
  document.body.appendChild(d);
  qS('.daClose').addEventListener('click', hideDialog);
  qS('.daOutput').addEventListener('click', output);
}
function hideDialog() {
  qS('#daContainer').style = 'display: none;';
}


function getFbMessagesPhotos() {
  if (!g.threadId) {
    g.ajax = null;
    g.photodata.aName = getText('.fb_content [role="main"] h2');
    if (qS('a[uid]')) {
      g.threadId = qS('a[uid]').getAttribute('uid');
    } else if (location.href.match(/messages\/t\/(\d+)/)) {
      g.threadId = location.href.match(/messages\/t\/(\d+)/)[1];
    } else {
      alert('Cannot get message thread id.');
      return;
    }
  }
  var variables = JSON.stringify({ id: g.threadId, first: 30, after: g.ajax });
  var url = location.origin + '/webgraphql/query/?query_id=515216185516880&variables='+variables;
  var data = '__user='+g.Env.user+'&__a=1&__req=7&fb_dtsg='+g.fb_dtsg;
  var xhr = new XMLHttpRequest();
  xhr.onload = function(){
    var payload = extractJSON(this.response).payload[g.threadId];
    if (!payload.message_shared_media) {
      alert('Cannot get message media.');
      return;
    }
    for (var i = 0; i < payload.message_shared_media.edges.length; i++) {
      var n = payload.message_shared_media.edges[i].node;
      g.photodata.photos.push({ href: '', url: n.image2.uri });
    }
    g.statusEle.textContent = 'Loading album... (' + g.photodata.photos.length + ')';
    if (payload.message_shared_media.page_info.has_next_page) {
      g.ajax = payload.message_shared_media.page_info.end_cursor;
      getFbMessagesPhotos();
    } else if (g.photodata.photos.length) {
      output();
    }
  };
  xhr.open('POST', url);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.send(data);
}
function getQL(type, target, key) {
  if (g.pageType === 'album') {
    if (!g.elms.length && !g.ajaxStartFrom) {
      return 'Query PhotoAlbumRoute {node(' + g.pageAlbumId +
        ') {id,__typename,@F8}} QueryFragment F0 : Photo {album {' +
        'album_type,id},can_viewer_edit,id,owner {id,__typename}} ' +
        'QueryFragment F1 : Photo {can_viewer_delete,id} QueryFragment F2 : ' +
        'Feedback {does_viewer_like,id} QueryFragment F3 : Photo {id,album {' +
        'id,name},feedback {id,can_viewer_comment,can_viewer_like,likers {' +
        'count},comments {count},@F2}} QueryFragment F4 : Photo {' +
        'can_viewer_edit,id,image as _image1LP0rd {uri},url,modified_time,' +
        'message {text},@F0,@F1,@F3} QueryFragment F5 : Node {id,__typename}' +
        ' QueryFragment F6 : Album {can_upload,id} QueryFragment F7 : Album' +
        ' {id,media.first(28) as ' + key + ' {edges {node {__typename,@F4,' +
        '@F5},cursor},page_info {has_next_page,has_previous_page}},owner {' +
        'id,__typename},@F6} QueryFragment F8 : Album {can_edit_caption,' +
        'can_upload,id,media.first(28) as ' + key + ' {edges {node {' +
        '__typename,@F4,@F5},cursor},page_info {has_next_page,' +
        'has_previous_page}},message {text},modified_time,owner {' +
        'id,name,__typename},@F6,@F7}';
    }
    return 'Query ' + type + ' {node('+ g.pageAlbumId +
      ') {@F6}} QueryFragment F0 : Photo {album {album_type,id},' +
      'can_viewer_edit,id,owner {id,__typename}} QueryFragment F1 : ' +
      'Photo {can_viewer_delete,id} QueryFragment F2 : Feedback ' +
      '{does_viewer_like,id} QueryFragment F3 : Photo {id,album {id,name},' +
      'feedback {id,can_viewer_comment,can_viewer_like,likers {count},' +
      'comments {count},@F2}} QueryFragment F4 : Photo {can_viewer_edit,id,' +
      'image as _image1LP0rd {uri},url,modified_time,message {text},' +
      '@F0,@F1,@F3} QueryFragment F5 : Node ' +
      '{id,__typename} QueryFragment F6 : ' + target +
      '.first(28) as ' + key +' {edges {node {__typename,@F4,@F5},cursor},' +
      'page_info {has_next_page,has_previous_page}}}';
  } else {
    if (g.pageType === 'other' && !g.elms.length && !g.ajaxStartFrom) {
      return 'Query MediaPageRoute {node(' + g.pageId + ') {id,__typename,' +
        '@F5}} QueryFragment F0 : Photo {album {album_type,id},' +
        'can_viewer_edit,id,owner {id,__typename}} QueryFragment F1 : ' +
        'Photo {can_viewer_delete,id} QueryFragment F2 : Feedback {' +
        'does_viewer_like,id} QueryFragment F3 : Photo {id,album {id,name}' +
        ',feedback {id,can_viewer_comment,can_viewer_like,likers {count},' +
        'comments {count},@F2}} QueryFragment F4 : Photo {can_viewer_edit,' +
        'id,image as _image1LP0rd {uri},url,modified_time,message {text},' +
        '@F0,@F1,@F3} QueryFragment F5 : Page {id,photos_by_others.first(28)' +
        ' as _photos_by_others4vtdVT {count,edges {node {id,@F4},cursor}, ' +
        'page_info {has_next_page,has_previous_page}}}';
    }
    return 'Query ' + type + ' {node(' + g.pageId +
      ') {@F3}} QueryFragment F0 : Feedback {does_viewer_like,id} ' +
      'QueryFragment F1 : Photo {id,album {id,name},feedback ' +
      '{id,can_viewer_comment,can_viewer_like,likers {count},' +
      'comments {count},@F0}} QueryFragment F2 : Photo {image' +
      ' as _image1LP0rd {uri},url,id,modified_time,message {text},@F1} ' +
      'QueryFragment F3 : ' + target + '.first(28) as ' + key + ' {edges {' +
      'node {id,@F2},cursor},page_info {has_next_page,has_previous_page}}}';
  }
}

async function getTwitter() {
  let url = 'https://api.twitter.com/2/timeline/media/' + g.id +
    '.json?skip_status=1&tweet_mode=extended&include_entities=false&count=20' +
    (g.ajax ? ('&cursor=' + encodeURIComponent(g.ajax)) : '');
  let r = await fetch(url, { credentials: 'include', headers: {
    'authorization': 'Bearer ' + g.token,
    'x-csrf-token': g.csrf
  }});
  r = await r.json();
  const photodata = g.photodata;
  let keys = Object.keys(r.globalObjects.tweets);
  keys.sort((a, b) => (+b - +a));
  if (g.photodata.aAuth === null) {
    const user = r.globalObjects.users[g.id];
    photodata.aName = user.screen_name;
    photodata.aAuth = user.name;
    photodata.aDes = user.description;
    g.total = user.media_count;
    g.aTime = parseTime(new Date(r.globalObjects.tweets[keys[0]].created_at), true);
  }
  for (let k = 0; k < keys.length; k++) {
    const t = r.globalObjects.tweets[keys[k]];
    if (!t.extended_entities) {
      continue;
    }
    const media = t.extended_entities.media;
    for (let i = 0; i < media.length; i++) {
      const m = media[i];
      const p = {
        title: i === 0 ? t.text : '',
        url: m.media_url_https + '?name=orig',
        href: 'https://' + m.display_url,
        date: parseTime(new Date(t.created_at), true)
      };
      if (m.type === 'video') {
        p.videoIdx = photodata.videos.length;
        m.video_info.variants.sort((a, b) => ((b.bitrate || 0) - (a.bitrate || 0)));
        photodata.videos.push({
          url: m.video_info.variants[0].url,
          thumb: m.media_url_https
        });
      }
      photodata.photos.push(p);
    }
  }
  const e = r.timeline.instructions[0].addEntries.entries;
  if (keys.length === 20 && e[e.length - 1].entryId.indexOf('cursor-bottom') > -1) {
    const cursor = e[e.length - 1].content.operation.cursor.value;
    g.ajax = g.ajax === cursor ? false : cursor;
  } else {
    g.ajax = false;
  }
  document.title = `${photodata.photos.length}/${g.total} || ${photodata.aName}`;
  g.statusEle.textContent = photodata.photos.length + '/' + g.total;
  if (qS('#stopAjaxCkb') && qS('#stopAjaxCkb').checked) {
    output();
  } else if (g.ajax) {
    setTimeout(getTwitter, 1000);
  } else {
    output();
  }
}
async function getTwitterInit() {
  let r = await fetch(qS('link[href*="/main"]').getAttribute('href'));
  r = await r.text();
  r = r.match(/="([\w\d]+%3D[\w\d]+)"/g);
  if (!r) {
    alert('Cannot get auth token');
    return;
  }
  g.token = r[0].slice(2, -1);
  getTwitter();
}
function getWeibo() {
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://www.weibo.com/p/aj/album/loading?owner_uid=${g.uId}&page_id=${g.pageId}&page=${g.ajaxPage}&ajax_call=1&since_id=${g.ajax}`,
    onload: function(res) {
      g.ajaxPage++;
      var html = getDOM(JSON.parse(res.response).data);
      var loading = html.querySelector('[node-type="loading"]').getAttribute('action-data');
      g.ajax = parseQuery(loading).since_id;
      var links = html.querySelectorAll("a.ph_ar_box");
      var img = html.querySelectorAll("img.photo_pict");
      for(var imgCount = 0; imgCount < links.length; imgCount++){
        var data = parseQuery(links[imgCount].getAttribute("action-data"));
        var url = img[imgCount].src.match(/:\/\/([\w\.]+)\//);
        url = 'https://' + url[1] + '/large/' + data.pid + '.jpg';
        if(!g.downloaded[url]){g.downloaded[url]=1;}else{continue;}
        // For href since pid !== photo_id therefore cannot use direct link
        g.photodata.photos.push({
          title: '',
          url: url,
          href: `http://photo.weibo.com/${g.uId}/wbphotos/large/mid/${data.mid}/pid/${data.pid}`,
          date: ''
        });
      }
      const count = g.photodata.photos.length;
      log(`Loaded ${count} photos.`);
      document.title=`(${count}) ||${g.photodata.aName}`;
      g.statusEle.textContent = `Loaded ${count}`;
      if(qS('#stopAjaxCkb')&&qS('#stopAjaxCkb').checked){output();}
      else if(g.ajax){setTimeout(getWeibo, 2000);}else{output();}
    }
  });
}
function getWeiboAlbum() {
  if (!GM_xmlhttpRequest) { return alert("This script required Greasemonkey/Tampermonkey!"); }
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://photo.weibo.com/albums/get_all?uid=${g.uId}&page=1&count=20`,
    onload: function(res) {
      try {
        const list = JSON.parse(res.response).data.album_list;
        g.statusEle.innerHTML = '<p>Select album to download:</p>'
        for (let i = 0; i < list.length; i++) {
          const a = document.createElement('a');
          const count = list[i].count.photos;
          a.textContent = `${list[i].caption} (${count} photos)`;
          a.addEventListener('click', () => {
            g.aId = list[i].album_id;
            g.photodata.aName = list[i].caption;
            g.total = count;
            loadWeiboAlbum();
          });
          g.statusEle.appendChild(a);
        }
      } catch (e) {
        console.error(e);
        alert('Cannot get album list, try old method instead.');
        getWeibo();
      }
    }
  });
}
function loadWeiboAlbum() {
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://photo.weibo.com/photos/get_all?uid=${g.uId}&` +
      `album_id=${g.aId}&count=30&page=${g.ajaxPage}&type=3`,
    onload: function(res) {
      g.ajaxPage++;
      let ended = false;
      try {
        const list = JSON.parse(res.response).data.photo_list;
        ended = list.length === 0;
        if (ended) {
          alert('Reached end of album due to author setting.');
        }
        let lastCaption = '';
        for (let i = 0; i < list.length; i++) {
          const e = list[i];
          const url = `${e.pic_host}/large/${e.pic_name}`;
          if (!g.downloaded[url]) { g.downloaded[url] = 1; } else { continue; }
          g.photodata.photos.push({
            title: e.caption == lastCaption ? '' : e.caption,
            url: url,
            href: `https://photo.weibo.com/${g.uId}/talbum/detail/photo_id/${e.photo_id}`,
            date: parseTime(e.timestamp)
          });
          lastCaption = e.caption;
        }
        const count = g.photodata.photos.length;
        log(`Loaded ${count} photos.`);
        document.title=`(${count}/${g.total}) ||${g.photodata.aName}`;
        g.statusEle.textContent = `Loaded ${count}/${g.total}`;
        if (qS('#stopAjaxCkb') && qS('#stopAjaxCkb').checked || ended) {
          output();
        } else if (count < g.total) {
          setTimeout(loadWeiboAlbum, 2000);
        } else {
          output();
        }
      } catch (e) {
        console.error(e);
        alert('Cannot get album photos, try old method instead.');
        getWeibo();
      }
    }
  });
}
function parsePinterest(list){
  var photodata = g.photodata;
  for(var j = 0; j < list.length; j++){
    if (list[j].name || !list[j].images) {
      continue;
    }
    photodata.photos.push({
      title: list[j].description + '<br><a taget="_blank" href="' + 
        list[j].link + '">Pinned from ' + list[j].domain + '</a>',
      url: (list[j].images.orig || list[j].images['736x']).url,
      href: 'https://www.pinterest.com/pin/' + list[j].id + '/',
      date: list[j].created_at ? new Date(list[j].created_at).toLocaleString() : false
    });
  }
  log('Loaded ' + photodata.photos.length + ' photos.');
}
function getPinterest(){
  var board = location.pathname.match(/([^\/]+)/g);
  if (board && board[0] === 'pin') {
    closeDialog();
    var img = qS('.pinImage, .imageLink img');
    if (img) {
      var link = document.createElement('a');
      link.href = img.getAttribute('src');
      link.download = '';
      link.click();
    }
    return;
  }
  g.source = board ? encodeURIComponent(location.pathname) : '/';
  var s = qS('#initial-state') ? extractJSON(getText('#initial-state')) : null;
  if (!s) {
    var doc = qSA('script');
    for (var i = 0; i < doc.length; i++) {
      var c = doc[i].textContent;
      if (c.indexOf('__INITIAL_STATE__') > 0) {
        s = extractJSON(c.replace(/\\\\\\"/g, '\'').replace(/\\"/g, '"'));
        break;
      }
    }
  }
  if (!s || !s.ui || !s.ui.mainComponent) {
    alert('Cannot load initial state');
    return;
  }
  var type = s.ui.mainComponent.current;
  var resources = s.resources.data;
  while (resources && !resources.data) {
    const key = Object.keys(resources).filter(k => k !== 'UserResource')[0];
    resources = resources[key];
  }
  var r = resources && resources.data ? resources.data : null;
  g.resource = type.replace(/Feed|Page/g, '') + 'FeedResource';
  switch (type) {
    case 'HomePage':
      parsePinterest(r);
      g.bookmarks = {
        bookmarks: [resources.nextBookmark],
        prependPartner: false,
        prependUserNews: false,
        prependExploreRep: null,
        field_set_key: 'hf_grid'
      };
      g.resource = 'UserHomefeedResource';
      break;
    case 'BoardPage':
      g.bookmarks = {
        board_id: r.id,
        board_url: r.url,
        field_set_key: 'react_grid_pin',
        layout: 'default',
        page_size: 25
      };
      break;
    case 'BoardSectionPage':
      g.bookmarks = {
        section_id: r.id,
        page_size: 25
      };
      g.resource = 'BoardSectionPinsResource';
      g.photodata.aName += ' - ' + r.title;
      break;
    case 'DomainFeedPage':
      g.bookmarks = {domain: board[2]};
      break;
    case 'ProfilePage':
      switch (board[2]) {
        case 'pins': 
          g.bookmarks = {username: board[1], field_set_key: 'grid_item'};
          g.resource = 'UserPinsResource';
          break;
        case 'likes':
          g.bookmarks = {username: board[1], page_size: 25};
          g.resource = 'UserLikesResource';
          break;
      }
      break;
    case 'SearchPage':
      var query = location.search.slice(1).replace(/&/g, '=').split('=');
      query = query[query.indexOf('q') + 1];
      g.bookmarks = {query: query, scope: board[2]};
      break;
    case 'TopicFeedPage':
      g.bookmarks = {interest: board[2]};
      break;
    case 'InterestFeedPage':
      g.bookmarks = {query: board[2]};
      break;
    default:
      alert('Download type not supported.');
      return;
  }
  if (type === 'SearchPage' || type === 'InterestFeedPage') {   
    if (r.results) {
      parsePinterest(r.results);
    }
    if (resources.nextBookmark) {
      g.bookmarks.bookmarks = [resources.nextBookmark];
    }
    g.resource = 'SearchResource';
  }
  getPinterest_sub();
}
function getPinterest_sub(){
  var photodata = g.photodata;
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var r = JSON.parse(this.responseText);
    parsePinterest(r.resource_response.data);
    g.bookmarks = r.resource.options;
 
    document.title="("+g.photodata.photos.length+") ||"+g.photodata.aName;
    g.statusEle.textContent = g.photodata.photos.length + '/' + g.total;
    if(qS('#stopAjaxCkb')&&qS('#stopAjaxCkb').checked){output();}
    else if(g.bookmarks.bookmarks[0] != '-end-'){
      setTimeout(getPinterest_sub, 1000);
    }else{
      output();
    }
  };
  var data = {
    "options" : g.bookmarks,
    "context": {}
  };
  var url = location.origin + '/resource/' + g.resource + '/get/';
  var data = 'source_url=' + g.source + '&data=' +
    escape(JSON.stringify(data)) + '&_=' + (+new Date());
  xhr.open('POST', url);
  xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  var token = g.token || document.cookie.match(/csrftoken=(\S+);/)
  if(token){
    if(!g.token){
      token = token[1];
      g.token = token;
    }
    xhr.setRequestHeader('X-CSRFToken', token);
    xhr.setRequestHeader('X-NEW-APP', 1);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(data);
  }else{
    alert('Missing token!');
  }
}
function getAskFM() {
  var url = g.page || (location.protocol + '//ask.fm/' + g.username + 
    '?no_prev_link=true');
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var html = getDOM(this.response);
    var hasMore = html.querySelector('.item-page-next');
    var elms = html.querySelectorAll('.streamItem_visual');
    var i, box, link, title, url, video;
    var photodata = g.photodata;
    for (var i = 0; i < elms.length; i++) {
      box = getParent(elms[i], '.item');
      var img = elms[i].querySelector('img');
      if (!img) {
        continue;
      }
      video = box.querySelector('.playIcon');
      if (video) {
        url = img.getAttribute('src');
        photodata.videos.push({
          url: img.parentNode.getAttribute('href'),
          thumb: url
        });
      } else {
        url = img.parentNode.getAttribute('data-url') ||
          img.getAttribute('src');
      }
      link = box.querySelector('.streamItem_meta');
      var content = box.querySelector('.streamItem_content');
      if (content) {
        content.removeChild(box.querySelector('.readMore'));
      }
      title = 'Q: ' +  
        getText('.streamItem_header', 0, box) +
        ' <br>' + 'A: ' + getText('.streamItem_content', 0, box);
      photodata.photos.push({
        title: title,
        url: url,
        href: 'https://ask.fm' + link.getAttribute('href'),
        date: link.getAttribute('title'),
        videoIdx: video ? photodata.videos.length - 1 : undefined
      });
    }
    console.log('Loaded ' + photodata.photos.length + ' photos.');
    g.count += html.querySelectorAll('.item').length;
    g.statusEle.textContent = g.count + '/' + g.total;
    document.title = g.statusEle.textContent + ' ||' + g.title;
    if (g.count < g.total && hasMore && !qS('#stopAjaxCkb').checked) {
      g.page = hasMore.getAttribute('href');
      setTimeout(getAskFM, 500);
    } else {
      if (photodata.photos.length) {
        output();
      } else {
        alert('No photos loaded.');
      }
    }
  };
  xhr.open('GET', url);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send();
}
 

let win = null;
let needOpenWindow = false;

var log = function(s) {
    try {
        console.log(s);
    } catch(e) {
        GM_log(s);
    }
};

function quickSelect(s) {
    var method = false;
    switch (s) {
        case /#\w+$/.test(s):
            method = 'getElementById';
            break;
        case /\.\w+$/.test(s):
            method = 'getElementsByClassName';
            break;
    }
    return method;
}

function getParent(child, selector) {
    var target = child;
    while (target && !target.querySelector(selector)) {
        if (target.parentNode && target.parentNode.tagName == 'BODY') {
            return target;
        }

        if (target.parentNode && target.parentNode.querySelector(selector)) {
            return target;
        }

        target = target.parentNode;
    }

    return null;
}

function qS(s) {
    var k = document[quickSelect(s) || 'querySelector'](s);
    return k && k.length ? k[0] : k;
}

function qSA(s) {
    return document[quickSelect(s) || 'querySelectorAll'](s);
}

function padZero(str, len) {
    str = str.toString();
    while (str.length < len) {
        str = '0' + str;
    }
    return str;
}

function parseTime(t, isDate) {
    var d = isDate ? t : new Date(t * 1000);
    return d.getFullYear() 
        + '-' + padZero(d.getMonth() + 1, 2) 
        + '-' + padZero(d.getDate(), 2) 
        + ' ' + padZero(d.getHours(), 2) 
        + ':' + padZero(d.getMinutes(), 2) 
        + ':' + padZero(d.getSeconds(), 2);
}

function parseFbSrc(s, fb) {
    if (fb) {
        return s.replace(/s\d{3,4}x\d{3,4}\//g, '');
    }

    if (!s.match(/\/fr\/|_a\.jpg|1080x/)) {
        return s.replace(/c\d+\.\d+\.\d+\.\d+\//, '').replace(/\w\d{3,4}x\d{3,4}\//g, s.match(/\/e\d{2}\//) ? '' : 'e15/');
    }

    return s;
}

function createDialog() {
	if (qS('#daContainer')) {
		qS('#daContainer').style = '';
		qS('#stopAjaxCkb').checked = false;
		return;
	}
	var d = document.createElement('div');
	var s = document.createElement('style');
	s.textContent = `#daContainer {position: fixed; width: 360px;
    top: 20%; left: 50%; margin-left: -180px; background: #FFF;
    padding: 1em; border-radius: 0.5em; line-height: 2em; z-index: 9999;
    box-shadow: 1px 3px 3px 0 rgba(0,0,0,.2),1px 3px 15px 2px rgba(0,0,0,.2);}
    #daHeader {font-size: 1.5rem; font-weight: 700; background: #FFF;
    padding: 1rem 0.5rem; color: rgba(0,0,0,.85);
    border-bottom: 1px solid rgba(34,36,38,.15);}
    .daCounter {max-height: 300px;overflow-y: auto;}
    #daContent {font-size: 1.2em; line-height: 1.4; padding: .5rem;}
    #daContainer a {cursor: pointer;border: 1px solid black;padding: 10px;display: block;}
    #stopAjaxCkb {display: inline-block; -webkit-appearance: checkbox;
    width: auto;}`;
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

function output() {
    document.title = g.photodata.aName;
    if (g.photodata.photos.length > 1000 && !g.largeAlbum) {
        if (confirm('Large amount of photos may crash the browser:\nOK->Use Large Album Optimize Cancel->Continue')) g.photodata.largeAlbum = true;
    }
    toExport = g.photodata;
    nx_export_data({data: g.photodata});
}

function openWindow() {
    win = window.open(location.href);
    win.addEventListener('readystatechange', () => {
        if (win.document.readyState === 'interactive') {
            isWinReady = true;
            win.document.open();
            win.document.write(`<html><body>
        Loading... <a id="link" href="javascript:;">Return to Parent</a><script>
        (function() {
          const link = document.querySelector('#link');
          link.addEventListener('click', () => {
            const goBack = window.open('', 'main');
            goBack.focus();
          });
        })();
        </script></body></html>`);
            win.document.close();
            if (toExport) {
                nx_export_data({data: toExport});
                toExport = null;
            }
        }
    }, true);
}

function nx_export_data(request, sender, sendResponse) {
    if (win.closed && !needOpenWindow) {
        alert('Click Output to view photos');
        needOpenWindow = true;
        return;
    }

    if (needOpenWindow) {
        needOpenWindow = false;
        openWindow();
        return;
    }

    if (!request.data) {
        request.data = JSON.parse(localStorage["downAlbum"]);
    }

    log('Exported ' + request.data.photos.length + ' photos.');

    var a, b = [], c = request.data;
    c.aName = (c.aName) ? c.aName : "Facebook";
    c.dTime = (new Date()).toLocaleString();

    var d = c.photos, totalCount = d.length;
    for (var i = 0; i < totalCount; i++) {
        if (!d[i]) {
            continue;
        }

        var href = d[i].href ? d[i].href : '',
            title = d[i].title || '',
            tag = d[i].tag || '',
            comments = d[i].comments || '',
            tagIndi = '',
            dateInd = '',
            commentInd = '';
        href = href ? ' href="' + href + '" target="_blank"' : '';
        
        if (tag) {
            if (c.aLink.indexOf('facebook.com') > -1) {
                tag = tag.replace(/href="/g, 'target="_blank" href="https://www.facebook.com');
            }
            tag = '<div class="loadedTag">' + tag + '</div>';
            tagIndi = '<i class="tagArrow tagInd"></i>';
        }

        if (comments) {
            var co = '<div class="loadedComment">';
            try {
                if (comments[0] > comments.length - 1) {
                    var cLink = comments[1].fbid ? ("https://www.facebook.com/photo.php?fbid=" + comments[1].fbid) : comments[1].id;
                    co += '<p align="center"><a href="' + cLink + '" target="_blank">View all ' + comments[0] + ' comments</a></p>';
                }
            } catch (e) {}
            for (var ii = 1; ii < comments.length; ii++) {
                var p = comments[ii];
                co += '<blockquote><p>' + p.text + '</p><small><a href="' + p.url + '" target="_blank">' + p.name + '</a> ' + (p.fbid ? ('<a href="https://www.facebook.com/photo.php?fbid=' + p.fbid + '&comment_id=' + p.id + '" target="_blank">') : '') + p.date + (p.fbid ? '</a>' : '') + '</small></blockquote>';
            }
            comments = co + '</div>';
            commentInd = '<a title="Click to view comments" rel="comments"><i class="tagArrow commentInd"></i></a>';
        }

        if (d[i].date) {
            dateInd = '<div class="dateInd"><span>' + d[i].date + '</span> <i class="tagArrow dateInd"></i></div>';
        }

        var videoInd = d[i].videoIdx !== undefined ? `<a class="videoInd" href="${c.videos[d[i].videoIdx].url}" target="_blank">🎥</a>` : '';
        var $t = [];
        var test = false;
        var test2 = false;
        
        try { if (title.match(/<.*>/)) { $t = $(title) }; } catch (e) {}
        
        try { test = title.match(/hasCaption/) && $t.length; } catch (e) {}
        
        try { test2 = title.match(/div/) && title.match(/span/) } catch (e) {}

        try {
            if (test) {
                var t = document.createElement('div');
                t.innerHTML = title;
                var junk = t.querySelector('.text_exposed_hide');
                if (junk && junk.length) t.removeChild(junk);
                title = $t.html();
                if (title.indexOf("<br>") == 0) title = title.slice(4);
            } else if (test2) {
                title = title.replace(/&(?!\w+([;\s]|$))/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            } else if ($t.length) {
                try {
                    $t.find('.text_exposed_hide').remove().end()
                        .find('div *').unwrap().end()
                        .find('.text_exposed_show').unwrap().end()
                        .find('span').each(function() {
                            $(this).replaceWith(this.childNodes);
                        });
                    title = $t.html();
                } catch (e) {}
            } else {
                title = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        } catch (e) {}

        title = title ? '<div class="captions"><a class="captions" rel="captions"></a>' + title + '</div>' : '<div class="captions"></div>';
        var a = '<div rel="gallery" class="item' + (c.largeAlbum ? ' largeAlbum' : '') + '" id="item' + i + '"><a' + href + '>' + (i * 1 + 1) + '</a>' + commentInd + tagIndi + videoInd + dateInd + '<a class="fancybox" rel="fancybox" href="' + d[i].url + '" target="_blank"><div class="crop"><div style="background-image: url(' + d[i].url + ');" class="img"><img src="' + d[i].url + '"></div></div></a>' + title + tag + comments + '</div>';
        b.push(a)
    }

    const opt = {type: 'text/plain;charset=utf-8'};
    const rawFile = new File([JSON.stringify(c)], document.title + '.txt', opt);
    const rawUrl = window.URL.createObjectURL(rawFile);
    const photos = [];
    
    c.photos.forEach(function(item) {
        photos.push(item.url);
    });
    
    const photoFile = new File([photos.join('\n')], document.title + '-photos.txt', opt);
    const photoUrl = window.URL.createObjectURL(photoFile);
    const videos = [];
    
    if (c.videos && c.videos.length) {
        c.videos.forEach(function(item) {
            videos.push(item.url);
        });
    }

    const videoFile = new File([videos.join('\n')], document.title + '-videos.txt', opt);
    const videoUrl = window.URL.createObjectURL(videoFile);
    
    var tHTML = '<html><body class="index">' + '<script>document.title=\'' + c.aAuth + (c.aAuth ? "-" : "") + c.aName + '\';</script>';
    tHTML = tHTML + '<style>' + nx_export_css() + '</style>';
    tHTML = tHTML + '<header id="hd"><div class="logo" id="logo"><div class="wrapper"><h1><a id="aName" href=' + c.aLink + '>' + c.aName + '</a> ' + ((c.aAuth) ? '- ' + c.aAuth : "") + ' <button onClick="cleanup()">ReStyle</button> <a download="' + c.aAuth + '.txt" target="_blank" href="' + rawUrl + '">saveRawData</a> <a download="' + c.aAuth + '-photos.txt" target="_blank" href="' + photoUrl + '">savePhotoUrl (' + photos.length + ')</a> <a download="' + c.aAuth + '-videos.txt" target="_blank" href="' + videoUrl + '">🎥 saveVideoUrl (' + videos.length + ')</a></h1><h1>Press Ctrl+S / [Mac]Command+S (with Complete option) to save all photos. [Photos are located in _files folder]</h1></div></div></header>';
    tHTML = tHTML + '<center id="aTime">' + c.aTime + '</center><br><center id="aDes">' + c.aDes + '</center><center>Download at: ' + c.dTime + '</center><br><div id="output" class="cName"></div><div class="wrapper"><div id="bd"><div id="container" class="masonry">';
    tHTML = tHTML + b.join("") + '</div></div></div></body></html>';
    win.document.open();
    win.document.write(tHTML);
    win.document.close();
    win.focus();
};

function nx_export_css() {
    return `
    body{line-height:1;background:#f5f2f2;font-size:13px;color:#444;padding-top:70px;}.crop{width:192px;height:192px;overflow:hidden;}.crop img{display:none;}div.img{width:192px;height:192px;background-size:cover;background-position:50% 25%;border:none;image-rendering:optimizeSpeed;}@media screen and (-webkit-min-device-pixel-ratio:0){div.img{image-rendering: -webkit-optimize-contrast;}}header{display:block}.wrapper{width:960px;margin:0 auto;position:relative}#hd{background:#faf7f7;position:fixed;z-index:100;top:0;left:0;width:100%;}#hd .logo{padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.2)}#container{width:948px;position:relative;margin:0 auto}.item{width:192px;float:left;padding:5px 15px 0;margin:0 7px 15px;font-size:12px;background:white;line-height:1.5}.item .captions{color:#8c7e7e;padding-bottom:15px;overflow:hidden;height:8px;position:relative;}.item .captions:first-child{position:absolute;width:100%;height:100%;top:0;left:0;z-index:1;}#logo{background-color:#3B5998;color:#FFF}#hd .logo h1{background-color:#3B5998;left:0;position:relative;width:100%;display:block;margin:0;color:#FFF;height:100%;font-size:18px}#logo a{color:#FFF}#logo a:hover{color:#FF9}progress{width:100%}#aDes{line-height:1.4;}.largeAlbum>a{visibility:visible;}.largeAlbum .fancybox{visibility:hidden;display:none;}.oImg{background-color:#FFC}
    .twitter-emoji, .twitter-hashflag {height: 1.25em; width: 1.25em; padding: 0 .05em 0 .1em; vertical-align: -0.2em;}
    
    /* drag */
    #output{display:none;background:grey;min-height:200px;margin:20px;padding:10px;border:2px dotted#fff;text-align:center;position:relative;-moz-border-radius:15px;-webkit-border-radius:15px;border-radius:15px;}#output:before{content:"Drag and Drop images.";color:#fff;font-size:50px;font-weight:bold;opacity:0.5;text-shadow:1px 1px#000;position:absolute;width:100%;left:0;top:50%;margin:-50px 0 0;z-index:1;}#output img{display:inline-block;margin:0 10px 10px 0;} button{display:inline-block;vertical-align:baseline;outline:none;cursor:pointer;text-align:center;text-decoration:none;font:700 14px/100% Arial, Helvetica, sans-serif;text-shadow:0 1px 1px rgba(0,0,0,.3);color:#d9eef7;border:solid 1px #0076a3;-webkit-border-radius:.5em;-moz-border-radius:.5em;background-color:#59F;border-radius:.5em;margin:0 2px 12px;padding:.5em 1em .55em;}.cName{display:none;}#fsCount{position: absolute;top: 20;right: 20;font-size: 3em;}
    
    /*! fancyBox v2.1.3 fancyapps.com | fancyapps.com/fancybox/#license */
    .fancybox-wrap,.fancybox-skin,.fancybox-outer,.fancybox-inner,.fancybox-image,.fancybox-wrap iframe,.fancybox-wrap object,.fancybox-nav,.fancybox-nav span,.fancybox-tmp{border:0;outline:none;vertical-align:top;margin:0;padding:0;}.fancybox-wrap{position:absolute;top:0;left:0;z-index:8020;}.fancybox-skin{position:relative;background:#f9f9f9;color:#444;text-shadow:none;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;}.fancybox-opened{z-index:8030;}.fancybox-outer,.fancybox-inner{position:relative;}.fancybox-type-iframe .fancybox-inner{-webkit-overflow-scrolling:touch;}.fancybox-error{color:#444;font:14px/20px "Helvetica Neue",Helvetica,Arial,sans-serif;white-space:nowrap;margin:0;padding:15px;}.fancybox-image,.fancybox-iframe{display:block;width:100%;height:100%;}.fancybox-image{max-width:100%;max-height:100%;}#fancybox-loading,.fancybox-close,.fancybox-prev span,.fancybox-next span{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAACYBAMAAABt8RZRAAAAMFBMVEUAAAABAQEiIiIjIyM4ODhMTExmZmaCgoKAgICfn5+5ubnW1tbt7e3////+/v4PDw+0IcHsAAAAEHRSTlP///////////////////8A4CNdGQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAphJREFUSMftlE1oE0EUgNeCICru0YunaVNNSj3kbim5SqUECh7MxZMUvPQgKBQPggrSSy9SdFVC8Q8XwbNLpWhByRJQE5vsvimIFjxss14KmnTj/GR+Nrs9WH9OeZdlP96+nXnzvjG6qWHsDb+sVJK4AzSqfbgN767PXHimOMfu2zxCaPgujuGoWUA0RuyWjt0y4pHDGm43kQi7qvDF1xKf3lDYWZT4OJZ426Nfl1GO1nIk/tEgr9BEFpCnVRW4XSev87AEn8izJHHnIy1K9j5HnlMtgY98QCydJqPxjTi2gP4CnZT4MC2SJUXoOk/JIodqLHmJpatfHqRFCWMLnF+JbcdaRFmabcvtfHfPy82Pqs2HVlninKdadUw11tIauz+Y69ET+jGECyLdauiHdiB4yOgsvq/j8Bw8KqCRK7AWH4h99wAqAN/6p2po1gX/cXIGQwOZfz7I/xBvbW1VEzhijrT6cATNSzNn72ic4YDbcAvHcOQVe+32dBwsi8OB5wpHXkEc5YKm1M5XdfC+woFyZNi5KrGfZ4OzyX66InCHH3uJTqCYeorrTOCAjfdYXeCIjjeaYNNNxlNiJkPASym88566Aatc10asSAb6szvUEXQGXrD9rAvcXucr8dhKagL/5J9PAO1M6ZXaPG/rGrtPHkjsKEcyeFI1tq462DDVxYGL8k5aVbhrv5E32KR+hQFXKmNvGvrJ2941Rv1pU8fbrv/k5mUHl434VB11yFD5y4YZx+HQjae3pxWVo2mQMAfu/Dd3uDoJd8ahmOZOFr6kuYMsnE9xB+Xgc9IdEi5OukOzaynuIAcXUtwZ662kz50ptpCEO6Nc14E7fxEbiaDYSImuEaZhczc8iEEMYm/xe6btomu63L8A34zOysR2D/QAAAAASUVORK5CYII=);}#fancybox-loading{position:fixed;top:50%;left:50%;margin-top:-22px;margin-left:-22px;background-position:0 -108px;opacity:0.8;cursor:pointer;z-index:8060;}#fancybox-loading div{width:44px;height:44px;}.fancybox-close{position:absolute;top:-18px;right:-18px;width:36px;height:36px;cursor:pointer;z-index:8040;}.fancybox-nav{position:absolute;top:0;width:40%;height:100%;cursor:pointer;text-decoration:none;background:transparent url(data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==);-webkit-tap-highlight-color:rgba(0,0,0,0);z-index:8040;}.fancybox-prev{left:-30%;}.fancybox-next{right:-30%;}.fancybox-nav span{position:absolute;top:50%;width:36px;height:34px;margin-top:-18px;cursor:pointer;z-index:8040;visibility:hidden;}.fancybox-prev span{left:10px;background-position:0 -36px;}.fancybox-next span{right:10px;background-position:0 -72px;}.fancybox-tmp{position:absolute;top:-99999px;left:-99999px;visibility:hidden;max-width:99999px;max-height:99999px;overflow:visible!important;}.fancybox-overlay{position:absolute;top:0;left:0;overflow:hidden;display:none;z-index:8010;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjY3NjM0OUJFNDc1MTFFMTk2RENERUM5RjI5NTIwMEQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjY3NjM0OUNFNDc1MTFFMTk2RENERUM5RjI5NTIwMEQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCNjc2MzQ5OUU0NzUxMUUxOTZEQ0RFQzlGMjk1MjAwRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCNjc2MzQ5QUU0NzUxMUUxOTZEQ0RFQzlGMjk1MjAwRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgbXtVkAAAAPSURBVHjaYhDg4dkAEGAAATEA2alCfCIAAAAASUVORK5CYII=);}.fancybox-overlay-fixed{position:fixed;bottom:0;right:0;}.fancybox-lock .fancybox-overlay{overflow:auto;overflow-y:scroll;}.fancybox-title{visibility:hidden;font:normal 13px/20px "Helvetica Neue",Helvetica,Arial,sans-serif;position:relative;text-shadow:none;z-index:8050;}.fancybox-title-float-wrap{position:absolute;bottom:0;right:50%;margin-bottom:-35px;z-index:8050;text-align:center;}.fancybox-title-float-wrap .child{display:inline-block;margin-right:-100%;background:rgba(0,0,0,0.8);-webkit-border-radius:15px;-moz-border-radius:15px;border-radius:15px;text-shadow:0 1px 2px #222;color:#FFF;font-weight:700;line-height:24px;white-space:nowrap;padding:2px 20px;}.fancybox-title-outside-wrap{position:relative;margin-top:10px;color:#fff;}.fancybox-title-inside-wrap{padding-top:10px;}.fancybox-title-over-wrap{position:absolute;bottom:0;left:0;color:#fff;background:rgba(0,0,0,.8);padding:10px;}.fancybox-inner,.fancybox-lock{overflow:hidden;}.fancybox-nav:hover span,.fancybox-opened .fancybox-title{visibility:visible;}
    #fancybox-buttons{position:fixed;left:0;width:100%;z-index:8050;}#fancybox-buttons.top{top:10px;}#fancybox-buttons.bottom{bottom:10px;}#fancybox-buttons ul{display:block;width:400px;height:30px;list-style:none;margin:0 auto;padding:0;}#fancybox-buttons ul li{float:left;margin:0;padding:0;}#fancybox-buttons a{display:block;width:30px;height:30px;text-indent:-9999px;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaBAMAAADKhlwxAAAAMFBMVEUAAAAAAAAeHh4uLi5FRUVXV1diYmJ3d3eLi4u8vLzh4eHz8/P29vb////+/v4PDw9Xwr0qAAAAEHRSTlP///////////////////8A4CNdGQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAbVJREFUWMPtlktugzAQhnPNnqLnSRuJXaRGVFm3NmFdPMC+YHqA8NiWBHBdlPgxETRIVatWjIQ0Hn/8DL9lywsxJRYz/T10h+uxkefyiUw6xPROpw33xZHHmm4yTD9WKg2LRHhZqumwuNDW77tQkAwCRTepx2VU5y/LSEMlXkPEc3AUHTJCCESn+S4FOaZa/F7OPqm/bDLyGXCmoR8a4nLkKLrupymiwT/Thz3ZbbWDK9ZPnzxuoMeZ6sSTdKLpGthShnP68EaGIX3MGKGFrx1cAXbQDbR0ypY0TDRdX9JKWtD8RawiZqz8CtMbnR6k1zVsDfod046RP8jnbt6XM/1n6WoSzX2ryLlo+dsgXaRWsSxFV1aDdF4kZjGP5BE0TAPj5vEOII+geJgm1Gz9S5p46RSaGK1fQUMwgabPkzpxrqcZWV/vYA5PE1anDG4nrDw4VpFR0ZDhTtbzLp7p/03LW6B5qnaXV1tL27X2VusX8RjdWnTH96PapbXLuzIe7ZvdxBb9OkbXvtga9ca4EP6c38hb5DymsbduWY1pI2/bcRp5W8I4bXmLnMc08hY5P+/L36M/APYreu7rpU5/AAAAAElFTkSuQmCC);background-repeat:no-repeat;outline:none;opacity:0.8;}#fancybox-buttons a:hover{opacity:1;}#fancybox-buttons a.btnPrev{background-position:5px 0;}#fancybox-buttons a.btnNext{background-position:-33px 0;border-right:1px solid #3e3e3e;}#fancybox-buttons a.btnPlay{background-position:0 -30px;}#fancybox-buttons a.btnPlayOn{background-position:-30px -30px;}#fancybox-buttons a.btnToggle{background-position:3px -60px;border-left:1px solid #111;border-right:1px solid #3e3e3e;width:35px;}#fancybox-buttons a.btnToggleOn{background-position:-27px -60px;}#fancybox-buttons a.btnClose{border-left:1px solid #111;width:35px;background-position:-56px 0;}#fancybox-buttons a.btnDisabled{opacity:0.4;cursor:default;}
    .loadedTag, .loadedComment{display:none}.fbphotosphototagboxes{z-index:9997}.fancybox-nav{width:10%;}.igTag{padding: 1.5em;}.tagArrow{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAABgCAMAAADfGilYAAABQVBMVEUAAABXV1dXV1dXV1dXV1dkZGRkZGQAAABXV1dXV1fj4+NXV1cAAAAAAABXV1dXV1cAAABXV1dXV1cdHR1XV1ciIiLi4uJXV1cnJyfl5eVXV1dXV1ff399XV1dXV1dXV1dXV1dXV1dXV1cXFxcAAABXV1dXV1dXV1cAAAA3NzdXV1dXV1dXV1cAAAAAAABXV1dXV1dXV1dXV1cAAAD+/v74+PhXV1dXV1f29vYeHh4tLS0AAAAyMjJXV1f5+flXV1f7+/v///9XV1dtfq9ugLCSn8PO0+Nrfqq9xdqKmL/x8fh1h7COnL5ugK/O1eKTocGkr87O1OTN0+Gnsc7L0eH4+PuRn8Crt85tgK/c4Oyos8+qtc1ugaytuNHx8vnX2+jx8viqtdFzhbOtt9ByhLHX3OiqtdC9xtuKl7/T2ebS2ObSpKIFAAAAQXRSTlMAFCzrgWZAfNNo5fkwLiY8MnLzhWCH49mJ5yp64x5CDo0yw4MG7Xz7Co0G1T5kSmwCk/1g/fcwOPeFiWKLZvn3+z0qeQsAAAJ7SURBVHhendLXctswEAXQJSVbVrdkW457r3FN7WUBkurFvab3/P8HZAGatCIsZ6zcJ2iOLrgYAKBcrrdbrXa9XAZApAX9RAQgaaNOW8lZWedMS11BmagOcKgAiY6VNAJp0DqQhpJWIC2A60CufVHLUBBDaaBOuJtOI5wA/QmOAzk2pr7y4QoBgpOe3pz0kE56eohaoiNlpYa1ipSq8v5b88vXoCE9VPGUuOdSyqZ7Ix1qqFYHwHOcyqeKIw988WpYkRWseQAdKWv4wXE6oVBHyw/1zZ+O/BzuRtG7fafPNJ2m/OiLPNByoCaoEjmyGsxW1VIlIXZIvECopCokyiVVQqnqipaLc0de3Iq8xCPpC142j7BLXM8N5OTXiZI7ZmAgCgYHiVhAJOJBEQ+aeNBkAEcaONLAkQaeCAyCu8XKRUAyNh6PANu6H+cBwBqK82Ar4mC2qFsmjKbF/AKR3QWWgqeCki7YMatL7CELdOeBEMUkdCeuaWvFWhVrM8DQpB3bF7vAkB1LbooCmEQAcyIPBo0TQH4RzOQs8ikb+OzlIDr8bnxogtc8DFlPaDgV/qQs2Jq4RnHWJJtgYV6kRw2imyukBSWvyOqmZFGIt7rTc9swsyZWrZUtMF/IrtiP2ZMMQEFsRrzEvJgDIgMoi3kg4p61PUVsTbJXsAf/kezDhMqOActL06iSYDpL0494gcyrx6YsKxhL4bNeyT7PQmYkhaUXpR55WRpRjdRIdmxi+x9JYGqjRJCB4XvDPYJvMDWWoeU69Aq+2/D/bQpO0Ea8EK0bspNQ2WY60alLisuJ9MMK/GaJ5I/Lt6QKS24obmSpn+kgAJ4gIi70k79vocBUxmfchgAAAABJRU5ErkJggg==);background-size: auto;background-repeat: no-repeat;display: inline-block;height: 11px;width: 20px;background-position: 0 -24px;margin-top:3px;}.tagInd{background-position: 0 -83px;float:right;}.dateInd{background-position:-12px 1px;text-indent:-100%;text-align:right;float:right;}.dateInd span{font-size:11px;padding-right:3px;visibility:hidden;}.dateInd:hover span{visibility:visible;}.videoInd{float:right;margin-left:-6px;margin-top:-2px;}.vis{visibility:visible !important;}.commentInd{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAGJJREFUKFNjgIGJi47+905fQBCD1EG1MDCABIgBIHVQLSRqmrP2wn8QHo6aeuYdAwugYxiA8cFBDtME04iOYRpBNDSgGVA0YcMwjSiaYABZIVQIBWQ3bsStCcolDhCvgYEBADd1oN6ZvLbPAAAAAElFTkSuQmCC);background-position:0 0;float:right;cursor:pointer;}blockquote {padding: 0 0 0 15px;margin: 0 0 20px;border-left: 5px solid #eeeeee;}blockquote p {margin-bottom: 0;line-height: 1.25;}blockquote small {display: block;line-height: 20px;color: #999999;font-size: 85%;}blockquote small:before {content: "— ";}
    .dateInd span{visibility:visible !important;} /* force show date string */
    /* .borderTagBox & .innerTagBox */
    .fbPhotosPhotoTagboxes{height:100%;left:0;position:absolute;top:0;width:100%;/*pointer-events:none*/}.fbPhotosPhotoTagboxes .tagsWrapper{display:inline-block;height:100%;width:100%;position:relative;vertical-align:middle}.fbPhotosPhotoTagboxBase{line-height:normal;position:absolute}.imageLoading .fbPhotosPhotoTagboxBase{display:none}
    /*.fbPhotosPhotoTagboxBase .borderTagBox, .fbPhotosPhotoTagboxBase .innerTagBox{-webkit-box-sizing:border-box;height:100%;width:100%}.ieContentFix{display:none;font-size:200px;height:100%;overflow:hidden;width:100%}.fbPhotosPhotoTagboxBase .innerTagBox{border:4px solid #fff;border-color:rgba(255, 255, 255, .8)}*/
    .fbPhotosPhotoTagboxBase .tag{bottom:0;left:50%;position:absolute}.fbPhotosPhotoTagboxBase .tagPointer{left:-50%;position:relative}.fbPhotosPhotoTagboxBase .tagArrow{left:50%;margin-left:-10px;position:absolute;top:-10px}.fbPhotosPhotoTagboxBase .tagName{background:#fff;color:#404040;cursor:default;font-weight:normal;padding:2px 6px 3px;top:3px;white-space:nowrap}.fancybox-inner:hover .fbPhotosPhotoTagboxes{opacity:1;z-index:9998;}.fbPhotosPhotoTagboxes .tagBox .tag{top:85%;z-index:9999}.fbPhotosPhotoTagboxes .tag, .fbPhotosPhotoTagboxes .innerTagBox, .fbPhotosPhotoTagboxes .borderTagBox{visibility:hidden}
    .tagBox:hover .tag/*, .tagBox:hover .innerTagBox*/{opacity:1;/*-webkit-transition:opacity .2s linear;*/visibility:visible}
    `
}
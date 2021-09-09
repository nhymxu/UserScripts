let win = null;
let needOpenWindow = false;

var log = function(s) {
    try {
        console.log(s);
    } catch(e) {
        GM_log(s);
    }
};

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
    tHTML = tHTML + '<link crossorigin="anonymous" href="https://raw.githubusercontent.com/nhymxu/DownAlbum/dev/style.css">';
    tHTML = tHTML + '<header id="hd"><div class="logo" id="logo"><div class="wrapper"><h1><a id="aName" href=' + c.aLink + '>' + c.aName + '</a> ' + ((c.aAuth) ? '- ' + c.aAuth : "") + ' <button onClick="cleanup()">ReStyle</button> <a download="' + c.aAuth + '.txt" target="_blank" href="' + rawUrl + '">saveRawData</a> <a download="' + c.aAuth + '-photos.txt" target="_blank" href="' + photoUrl + '">savePhotoUrl (' + photos.length + ')</a> <a download="' + c.aAuth + '-videos.txt" target="_blank" href="' + videoUrl + '">🎥 saveVideoUrl (' + videos.length + ')</a></h1><h1>Press Ctrl+S / [Mac]Command+S (with Complete option) to save all photos. [Photos are located in _files folder]</h1></div></div></header>';
    tHTML = tHTML + '<center id="aTime">' + c.aTime + '</center><br><center id="aDes">' + c.aDes + '</center><center>Download at: ' + c.dTime + '</center><br><div id="output" class="cName"></div><div class="wrapper"><div id="bd"><div id="container" class="masonry">';
    tHTML = tHTML + b.join("") + '</div></div></div><scrip src="https://rawgit.com/inDream/DownAlbum/master/assets/jquery.min.js"></script><script>(function(w,d,s){var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://rawgit.com/inDream/DownAlbum/master/assets/jquery.min.js";f.parentNode.insertBefore(j,f);})(window,document,"script");</script></body></html>';
    win.document.open();
    win.document.write(tHTML);
    win.document.close();
    win.focus();

};

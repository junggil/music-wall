$(function() { 
    // -------------------------------------------------
    //  script for audio.js
    // -------------------------------------------------

    // Setup the player to autoplay the next track
    var a = audiojs.createAll({
      trackEnded: function() {
        var next = $('ol li.playing').next();
        if (!next.length) next = $('ol li').first();
        next.addClass('playing').siblings().removeClass('playing');
        audio.load($('a', next).attr('data-src'));
        audio.play();
      }
    });

    // Load in the first track
    var audio = a[0];
        first = $('ol a').attr('data-src');
    $('ol li').first().addClass('playing');
    audio.load(first);

    // Load in a track on click
    $('ol li span#music').click(function(e) {
      e.preventDefault();
      socket.emit('click', {'offset' : $('ol li span#music').index(this)});
    });

    // Mouse click shortcuts
    function mouseShortcut(item) {
        item.parent().addClass('playing').siblings().removeClass('playing');
        audio.load($('a', item).attr('data-src'));
        fetchAlbumcover();
        audio.pause();

        (function loadingCheck(duration) {
            return setTimeout(function(duration) {
                if($('.loading').length == 1) {
                    setTimeout(function(){socket.emit('ready');}, 500);
                } else {
                    loadingCheck(100);
                }
            }, duration);
        })(1000);
    };

    // Keyboard shortcuts
    function keyboardShortcut(unicode) {
      // right arrow
      if (unicode == 39) {
        var next = $('li.playing').next();
        if (!next.length) next = $('ol li').first();
        mouseShortcut($('span#music', next));
        // back arrow
      } else if (unicode == 37) {
        var prev = $('li.playing').prev();
        if (!prev.length) prev = $('ol li').last();
        mouseShortcut($('span#music', prev));
        // spacebar
      } else if (unicode == 32) {
        audio.playPause();
      }
    };

    $(document).keydown(function(e) {
      var unicode = e.charCode ? e.charCode : e.keyCode;
      if (unicode == 39 || unicode == 37 || unicode == 32) {
          socket.emit('keydown', {'unicode' : unicode});
       }
    });

    // Setup the socket.io channel
    var socket = io.connect('http://192.168.0.2:4040');
    socket.on('keydown', function(data) {
        keyboardShortcut(data.unicode);
    });
    socket.on('play', function() {
        audio.play();
    });
    socket.on('click', function(data) {
        var item = $('ol li span#music').eq(data.offset);
        mouseShortcut(item);
    });

    if(typeof(String.prototype.trim) === "undefined")
    {
        String.prototype.trim = function() 
        {
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }

    function fetchAlbumcover(){
        var title = $('.playing a strong').text().trim();
        $('.carousel-inner .item').remove();
        $('.carousel-inner').append('<div class="item"><img src="http://192.168.0.2:8080/1024x768/' + title.split(' ').join('%20') + '/1" /> <div class="carousel-caption"><h4>' + title + '</h4></div></div>');
        $('.carousel-control.right')[0].click();
    };

    fetchAlbumcover();

    // -------------------------------------------------
    //  script for list.js
    // -------------------------------------------------
    var options = { 
        valueNames: [ 'title', 'artist' ] 
    };

    var musicList = new List('music-list', options);

    // -------------------------------------------------
    //  script for jquery.filedrop.js
    // -------------------------------------------------
	var dropbox = $('#dropbox'),
        fileDone = 0;
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'imgs',
		
		maxfiles: 10,
    	maxfilesize: 15,
		url: 'http://192.168.0.2:4040/upload',
		
		uploadFinished:function(i,file,response){
            $('.modal').hide();
		},
		
    	error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					alert('Your browser does not support HTML5 file uploads!');
					break;
				case 'TooManyFiles':
					alert('Too many files! Please select 5 at most! (configurable)');
					break;
				case 'FileTooLarge':
					alert(file.name+' is too large! Please upload files up to 2mb (configurable).');
					break;
				default:
					break;
			}
		},
		
		// Called before each upload is started
		beforeEach: function(file){
			if(!file.type.match(/^audio\//)){
				alert('Only audio/mp3 are allowed!');
				
				// Returning false will cause the
				// file to be rejected
				return false;
			}
		},
		
		uploadStarted:function(i, file, len, start_time){
            console.log(file.name);
            $('#uploadModal ul li').eq(i).css('display', 'none');
            updateFileCounter();
            updateProgress(len);
            socket.emit('upload', {'file' : start_time + ".mp3", 'rename' : file.name});
		},

        uploadBefore:function(files_count) {
            fileDone = 0;
        },

        rename:function(file, start_time) {
            return start_time + ".mp3";
        }
	});

    function updateFileCounter(){
        var counter = parseInt($('.badge').text());
        $('.badge').text(counter - 1);
    };
    
    function updateProgress(len){
        $('.progress div').width((++fileDone / len * 100) + '%');
    };

    socket.on('upload', function(data) {
        var template = '<li>'+
                            '<span id="music">'+
                               '<a href="#" data-src="musics/'+data.rename+'">'+ 
                                  '<strong class="title">'+data.title+'</strong><small class="artist"></small>'+ 
                               '</a>'+ 
                            '</span>'+ 
                            '<span>'+ 
                               '<i class="icon-circle-arrow-up"></i>'+ 
                               '<i class="icon-circle-arrow-down"></i>'+
                            '</span>'+
                         '</li>';
        $('#playlist ul').append($(template));
        musicList.add({ title : data.title, artist : '' });
        Notifier.success(data.rename + ' is uploded!');
        $('#playlist li').last().removeClass('playing')
        $('#playlist i').click(thumb_up);
        $('#playlist li span#music').last().click(function(e) {
            e.preventDefault();
            socket.emit('click', {'offset' : $('ol li span#music').index(this)});
        });
    });

    // -------------------------------------------------
    //  script for menu align
    // -------------------------------------------------
    $('.nav-collapse li a').attr('style', 'display:block');

    // -------------------------------------------------
    //  script for menu thumb_up / thumb_down
    // -------------------------------------------------
    thumb_up = function(e) { 
        e.preventDefault();
        socket.emit('thumb', {'offset' : $('#playlist i').index(this)});
    }

    function onClick_thumb(cur_pos){
        var cur_item = $('#playlist li').eq(cur_pos / 2);

        if (cur_pos % 2 == 0) {
            if (cur_pos / 2 > 0) {
                cur_item.prev().before(cur_item);
            }
        } else {
            if (cur_pos / 2 < $('#playlist li').length - 1) {
                cur_item.next().after(cur_item);
            }
        }
    }

    socket.on('thumb', function(data) {
        onClick_thumb(data.offset);
    });

    // Load in a track on click
    $('#playlist i').click(thumb_up);

});

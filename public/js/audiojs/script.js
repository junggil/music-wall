$(function() { 
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
    $('ol li').click(function(e) {
      e.preventDefault();
      socket.emit('click', {'offset' : $('ol li').index(this)});
    });

    // Mouse click shortcuts
    function mouseShortcut(item) {
        item.addClass('playing').siblings().removeClass('playing');
        audio.load($('a', item).attr('data-src'));
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
        mouseShortcut(next);
        // back arrow
      } else if (unicode == 37) {
        var prev = $('li.playing').prev();
        if (!prev.length) prev = $('ol li').last();
        mouseShortcut(prev);
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
        var item = $('ol li').eq(data.offset);
        mouseShortcut(item);
    });
});

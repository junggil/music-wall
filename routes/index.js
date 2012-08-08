var util = require('util')
    , fs = require('fs')
    , exec = require('child_process').exec;

function escapeshell(cmd) {
  return '"'+cmd.replace(/(["\s'$`\\()&])/g,'\\$1')+'"';
};

function renderByDate(files, res) {
    var count = files.length, 
        results = {};
    var sortOnKeys = function(dict) {
        var sorted = [];
        for(var key in dict) {
            sorted[sorted.length] = key;
        }
        sorted.sort();

        var tempDict = {};
        for(var i = 0; i < sorted.length; i++) {
            tempDict[sorted[i]] = dict[sorted[i]];
        }

        return tempDict;
    };

    files.forEach(function(file) {
        exec('mediainfo "public/musics/' + escapeshell(file) + '" |grep "Track name"| awk "NR==1" | cut -d ":" -f 2', function(error, stdout, stderr) { 
            if (stdout) {
                results[file] = stdout;
            } else {
                results[file] = file.split('.mp3')[0]
            }
            count--;
            if (count == 0) {
                console.log(results);
                res.render('index', {title : 'MusicWall, A Synchronized Audio Player', target : 'home', musics : sortOnKeys(results)});
            }
        });
    });
}
    
exports.index = function(req, res){
    renderByDate(fs.readdirSync('public/musics/').filter(function (filename) {
        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
        return endsWith(filename, '.mp3');
    }), res);
};

exports.about = function(req, res){
    res.render('about', { title: 'MusicWall, Information', target : 'about' });
};

exports.changelog = function(req, res){
    res.render('changelog', { title: 'MusicWall, History of modification', target : 'changelog' });
};


exports.drag = function(req, res){
    res.render('drag', { title: 'Drag & Drop Upload Test'});
};

exports.upload = function(req, res){
    console.log('-> upload was called\n\n');
    console.log('-> ' +  util.inspect(req.files));        
    var images = [];

    req.addListener('data', function(chunk) {
        console.log('-> data ' + chunk);
    });

    if (Array.isArray(req.files.imgs)){
        req.files.imgs.forEach(function(image){
            var kb = image.size / 1024 | 0;

            images.push({name: image.name, size: kb});
            renameImg(image);
        });  
    }else{
        var image = req.files.imgs;
        var kb = image.size / 1024 | 0;

        images.push({name: image.name, size: kb});
        renameImg(image);
    }

    console.log('->> render');
    res.send('"uploaded successfuly"');
};

exports.extractTitle = function(data, socket) {
    var tmp_path = 'public/musics/' + data.file;
    var target_path = 'public/musics/' + data.rename;

    fs.rename(tmp_path, target_path, function(err){
        if(err) throw err;
        exec('mediainfo "' + target_path + '" |grep "Track name"| awk "NR==1" | cut -d ":" -f 2', function(error, stdout, stderr) { 
            if (stdout) {
                data.title = stdout;
            } else {
                data.title = data.rename;
            }
            console.log(data);
            socket.broadcast.emit('upload', data); socket.emit('upload', data);
        });
    });
}

function renameImg(image){
    var tmp_path = image.path;
    var target_path = 'public/musics/' + image.name;
    console.log('->> tmp_path: ' + tmp_path );
    console.log('->> target_path: ' + target_path );
            
    fs.rename(tmp_path, target_path, function(err){
        if(err) throw err;
        
        console.log('->> upload done');
    });
}

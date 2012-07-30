var util = require('util')
    , fs = require('fs')
    , exec = require('child_process').exec;

function renderByDate(files, res) {
    var count = files.length, 
        results = {};
    var escapeshell = function(cmd) {
      return '"'+cmd.replace(/(["\s'$`\\])/g,'\\$1')+'"';
    };

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
        exec('mediainfo "public/musics/' + escapeshell(file) + '" | grep Track | cut -d ":" -f 2', function(error, stdout, stderr) { 
            results[file] = stdout;
            count--;
            if (count == 0) {
                res.render('index', {musics: sortOnKeys(results)});
            }
        });
    });
}
    
exports.index= function(req, res){
    renderByDate(fs.readdirSync('public/musics/'), res);
};

exports.test = function(req, res){
    res.render('test', { title: 'Upload Test'});
};

exports.upload = function(req, res){
    if(req.is('an image')){
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
        res.render('show', { title: 'Show'
                            ,images: images
        });
    }else{
        res.render('error', { title: 'Error'
                            ,msg: 'plz Upload only Image types'
        });
    }
};

function renameImg(image){
    var tmp_path = image.path;
    var target_path = './public/upload/' + image.name;
    console.log('->> tmp_path: ' + tmp_path );
    console.log('->> target_path: ' + target_path );
            
    fs.rename(tmp_path, target_path, function(err){
        if(err) throw err;
        
        console.log('->> upload done');
    });
}

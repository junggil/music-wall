/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.limit('5mb'));
  app.use(express.bodyParser({uploadDir: __dirname + '/public/tmp'}));  
  app.use(express.static(__dirname + '/public'));
  app.use(express.methodOverride());
  app.use(express.logger({ buffer: 5000}));
  app.use(express.favicon());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.is('an image', function(req){
    console.log('->> ' + req.headers['content-type']);
    if(req.headers['content-type'].indexOf('multipart') === 0){
        if (Array.isArray(req.files.imgs)){
            req.files.imgs.forEach(function(image){
                if(image.type.indexOf('image')  !== 0) return false;
            });
        }else{
            console.log('->> ' + req.files.imgs.type);
            if(req.files.imgs.type.indexOf('image') !== 0) return false;            
        }
    }else{
        if(req.headers['content-type'].indexOf('image') !== 0) return false;
    }
    return true;
});

// Routes

app.get('/', routes.index);
app.get('/test', routes.test);
app.post('/upload', routes.upload);
app.get('/public/images/*', routes.show);

app.listen(4040);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

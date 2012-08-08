$(function(){
	
	var dropbox = $('#dropbox'),
        fileDone = 0;
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'imgs',
		
		maxfiles: 10,
    	maxfilesize: 10,
		url: 'http://localhost:4040/upload',
		
		uploadFinished:function(i,file,response){
			// $.data(file).addClass('done');
			// response is the JSON object that post_file.php returns
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
		
		uploadStarted:function(i, file, len){
            console.log(file.name);
            $('#uploadModal ul li').eq(i).css('display', 'none');
            updateFileCounter();
            updateProgress(len);
		},

        uploadBefore:function(files_count) {
            fileDone = 0;
        }
	});

    function updateFileCounter(){
        var counter = parseInt($('.badge').text());
        $('.badge').text(counter - 1);
    };
    
    function updateProgress(len){
        $('.progress div').width((++fileDone / len * 100) + '%');
    };
});

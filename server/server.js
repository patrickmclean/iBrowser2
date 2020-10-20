var express = require('express');
var app = express();
var fileUpload = require('express-fileupload');

var rh = require("./responsehandler");

// set location for js, css etc
app.use(express.static('client'));
app.use(fileUpload());

// host the index page
app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

// process form return
app.get('/process_get', function (req, res) {
   rh.addToDb(req.query.image_name);
   // Prepare output in JSON format
   response = {
      first_name:req.query.image_name,
   };
   console.log(response);
   res.end(JSON.stringify(response));
})

// process file upload
app.post('/upload', function(req, res) {
   if (!req.files || Object.keys(req.files).length === 0) {
     return res.status(400).send('No files were uploaded.');
   }
   rh.uploadFile(req.files);
   res.send('File(s) uploaded!');
 });

 // get image list
 app.get('/loadimages', function(req, res){
   console.log('loadimages call received');
   rh.loadImages()
   .then(result => {
      console.log('load images came back');
      res.send(JSON.stringify(result));
   })
})

// The server itself
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})
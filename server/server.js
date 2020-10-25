const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');

const rh = require("./responsehandler");
const logger = require('./logger');


// set location for js, css etc
app.use(express.static('client'));
app.use(fileUpload());

// host the index page
app.get('/index.html', function (req, res) {
   logger.write('get','called',2);
   res.sendFile( __dirname + "/" + "index.html" );
})

// process file upload
app.post('/upload', function(req, res) {
   logger.write('upload','called',2);
   if (!req.files || Object.keys(req.files).length === 0) {
     return res.status(400).send('No files were uploaded.');
   }
   rh.uploadFile(req.files)
   // used to have a .then promise return, but this took too long. in process of replacing with cascading pub=/sub back up
 });

 // get image list
 app.get('/loadimages', function(req, res){
   logger.write('loadimages','called',2);
   rh.loadImages()
   .then(result => {
      logger.write('loadimages','returned',2);
      res.send(JSON.stringify(result));
   })
})

// The server itself
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
   logger.write('app','launched',1);
})
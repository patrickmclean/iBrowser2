const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');

const rh = require("./responsehandler");
const logger = require('./logger');
const ps = require('./pubsub');
const config = require('../config/config.js');


// set location for js, css etc
app.use(express.static('client'));
app.use(fileUpload());
app.use(express.json())

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
   rh.uploadFile(req.files);
   res.sendStatus(200);
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

// process delete image
app.post('/deleteimage', function(req,res){
   logger.write('deleteimage',req.body.filename,1)
   rh.deleteImage(req.body);
})



// Prep server side event stream for sending async refresh updates
app.get('/serverstream', (req, res) => {
   logger.write('serverstream','launch',2);
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.flushHeaders(); // flush the headers to establish SSE with client

   let sub = ps.subscribe('s3uploads', function(obj) {
      logger.write('serverstream listener',obj.item,2);
      if(obj.item.includes("tb")) {
         res.write(`data: refresh ${obj.item}\n\n`); 
      }
   });
   
   // If client closes connection, stop sending events
   res.on('close', () => {
       logger.write('serverstream','client dropped connection',2);
       sub.remove();
       res.end();
   });

    // Random - this is hosting christine's key server, just for convenience
   app.get('/getkey', function(req, res){
   logger.write('getkey','called',2);
   res.send(config.christine_key);
   })
   
});


// The server itself
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
   logger.write('app','launched',1);
})
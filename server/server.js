const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const image = require('./image.js');
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
   // add error conditions
});

// process file download
// this is currently broken since it is downloading files
// where it should be parsing json
app.post('/process', function(req,res){
   logger.write('process','called',2);
   if (!req.body) {
      return res.status(400).send('No files were sent');
    }
    rh.processFiles(req.body);
    res.sendStatus(200);
})

// get image list
app.get('/loadimages', function(req, res){
   logger.write('loadimages','called',2);
   rh.loadImages()
   .then(result => {
      logger.write('loadimages','returned',2);
      res.send(JSON.stringify(result));
   })
   // add error conditions
})

// process delete image
app.post('/deleteimage', function(req,res){
   logger.write('deleteimage',req.body.filename,2)
   rh.deleteImage(req.body);
   res.sendStatus(200);
   // add error conditions
})

// return the set of image processing options available
app.get('/loadprocessingoptions', function(req,res){
   logger.write('loadprocoptions','',2);
   const options = rh.loadProcessingOptions();
   logger.write('loadprocoptions','returned',2);
   res.send(JSON.stringify(options));
   //add error conditions
})

// Stub for processing output complete (deepart case)
app.post('/outputcomplete', function(req,res){
   logger.write('output complete',req.body.filename,2)
   // make a db entry
   // make a thumbnail
   // notify the front end
   res.sendStatus(200)
})

// Prep server side event stream for sending async refresh updates
app.get('/serverstream', (req, res) => {
   logger.write('serverstream','launch',2);
   let responseJSON = "";
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.flushHeaders(); // flush the headers to establish SSE with client

   let sub1 = ps.subscribe('s3uploads', function(obj) {
      logger.write('serverstream listener uploads',obj.item,2);
      if(obj.item.includes("tb")) {
         responseJSON = JSON.stringify({"type": "refresh","data": obj.item});
         res.write(`data: ${responseJSON}\n\n`);   
      }
   });
   let sub2 = ps.subscribe('s3delete', function(obj) {
      logger.write('serverstream listener delete',obj.item,2);
      if(obj.item.includes("tb")) {
         responseJSON = JSON.stringify({"type": "refresh","data": obj.item});
         res.write(`data: ${responseJSON}\n\n`);   
      }
   });
   let sub3 = ps.subscribe('procComplete', function(obj){
      logger.write('serverstream listener proc complete',obj.item,2);
      let imageItem = new image.imageClass;
      imageItem.imageID = obj.item;
      imageItem.filename = obj.item;
      responseJSON = JSON.stringify({"type": "output","data": imageItem});
      res.write(`data: ${responseJSON}\n\n`);   
   })

   // If client closes connection, stop sending events
   res.on('close', () => {
       logger.write('serverstream','client dropped connection',2);
       sub1.remove();
       sub2.remove();
       sub3.remove();
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
   console.log("App listening at http://%s:%s", host, port)
   logger.write('app','launched',1);
})
const ddb = require('./awsdynamodb');
const aws = require('aws-sdk');
const image = require('./image.js');
const ps = require('./pubsub');
const awss3 = require('./awss3');
const logger = require('./logger');
const config = require('../config/config.js');
const {execFile} = require("child_process");
const http = require('http');

module.exports = {

    uploadFile: function (files){
        // files might be single or multiple, format is different for the two cases
        if (Array.isArray(files.fileName) == true) {
            files.fileName.forEach(file => {
                logger.write('UploadMultiple ',file.name,2);
                this.processUpload(file)
            })
        } 
        else {
            logger.write('UploadSingle ',files.fileName.name,2);
            this.processUpload(files.fileName)
        }
    },

    processUpload : function (file) {
        
        // Create db item and add to ddb
        let imageItem = new image.imageClass;
        logger.write('process upload - file.imageID',file.name+' '+imageItem.imageID,2);
        imageItem.filename = file.name;
        imageItem.addDate(new Date());
        imageItem.getMetadata(file.data);
        ddb.insert(imageItem);

        // Launch thumbnail creation (async)
        imageItem.createReducedImage(imageItem,file.data,{width:imageItem.thumbnailSize, height:imageItem.thumbnailSize},'thumbnails');

        // Launch midsize image creation (async)
        imageItem.createReducedImage(imageItem,file.data,{width:imageItem.gallerySize, height:imageItem.gallerySize},'gallery');

        // Upload file to s3
        let uploadParams = {
            Bucket: config.s3_originals_folder, 
            Key: imageItem.imageID, 
            Body: file.data, 
            //ContentType: 'image/jpg',
            ACL: 'public-read'
        };
        awss3.uploadToS3(uploadParams);
    },

    loadImages: async function() {
        logger.write('loadImage','enter',2);
        let data = await ddb.readAll();
        logger.write('load images', 'data back',2);
        return data;
    },

    deleteImage: async function (image) {
        logger.write('deleteImage',image.fileName,2);
        let params = {
            Bucket: config.s3_originals_folder, 
            Key: image.imageID, 
        };
        awss3.deleteFromS3(params);
        params = {
            Bucket: config.s3_gallery_folder, 
            Key: 'gl_'+image.imageID, 
        };
        awss3.deleteFromS3(params);
        params = {
            Bucket: config.s3_thumbnail_folder, 
            Key: 'tb_'+image.imageID, 
        };
        awss3.deleteFromS3(params);
        ddb.delete(image);
    },

    loadProcessingOptions: function() {
        return config.image_processes;
    },


    // This is not currently working
    // Need to work on the construction of the execFile argument
    // Looks at the test2 example in neural style
    // Also we need to wait for the files to complete downloading before starting the process
    processFiles: function(files){
        const inputFile = files.input.replace('id-','');
        const refFile = files.reference.replace('id-','');
        const processName = files.process;
        const processOptions = config.image_processes;
        const chosenProcess = processOptions[processName];
        let outputImageItem = new image.imageClass;
        outputImageItem.addDate(new Date());
        if(chosenProcess.execType == "filestream"){
            awss3.processS3Files(inputFile,outputImageItem.imageID,chosenProcess.executable,chosenProcess.args);
        } 
        if(chosenProcess.execType == "rest")
        {
            let localInputFile =  inputFile +".jpg";
            let localReferenceFile = "";
            awss3.downloadFromS3(inputFile,config.processingRoot + "/input/"+ localInputFile);
            if(chosenProcess.needReference){
                localReferenceFile = refFile +".jpg";
                awss3.downloadFromS3(refFile,config.processingRoot + "/reference/" + localReferenceFile);
            }
            let outputImageFile = outputImageItem.imageID + ".jpg";
            const params = 'inputFile='+localInputFile+"&referenceFile="+localReferenceFile+"&outputFile="+outputImageFile;
            logger.write('calling api',chosenProcess.url + params,2);
            
            const options = {
              host: chosenProcess.url, 
              port: chosenProcess.port,
              path: chosenProcess.path,
              //crossOrigin: true,
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Content-Length': params.length
              }
            };
            
            // This needs to become more robust...
            var req = http.request(options, function(res) {
              var msg = '';
            
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                msg += chunk;
              });
              res.on('error', function(err){
                logger.write('rest error',err,2);    
              });
              res.on('end', function() {
                logger.write('rest came back ',JSON.parse(msg),2);
              });
            });
            
            req.write(params);
            req.end();
        }
    },

    // don't need this anymore but handy little function anyway...
    getKeyByValue: function(object,value){
        return Object.keys(object).find(key => object[key] === value);
    },

    listener: ps.subscribe('resizer', function(obj){
        logger.write('Resize listener '+obj.type,obj.item.filename,2);
        switch(obj.type){
            case 'thumbnails': 
                bucket = config.s3_thumbnail_folder;
                keyPrefix = 'tb_';
                break;
            case 'gallery':
                bucket = config.s3_gallery_folder;
                keyPrefix = 'gl_';
                break;
        }
        let uploadParams = {
            Bucket: bucket, 
            Key: keyPrefix+obj.item.imageID, 
            Body: obj.content, 
            ContentType: 'image/jpg',
            ACL: 'public-read'
        };
        logger.write('calling s3upl', uploadParams.Key,2);
        awss3.uploadToS3(uploadParams); 
    }),

}
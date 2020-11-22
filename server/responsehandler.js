const ddb = require('./awsdynamodb');
const aws = require('aws-sdk');
const image = require('./image.js');
const ps = require('./pubsub');
const awss3 = require('./awss3');
const logger = require('./logger');
const { s3_gallery_folder } = require('../config/config');

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
        logger.write('process upload - file.imageID',file.name+' '+imageItem    .imageID,2);
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
            ContentType: 'image/jpg',
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
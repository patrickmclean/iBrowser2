const ddb = require('./awsdynamodb');
const aws = require('aws-sdk');
const image = require('./image.js');
const ps = require('./pubsub');
const awss3 = require('./awss3');
const logger = require('./logger');

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
        imageItem.createThumbnail(imageItem,file.data,{width:300, height:256})

        // Upload file to s3
        let uploadParams = {
            Bucket: config.s3_images_folder, 
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

    //listener: ps.subscribe('s3uploads', function(obj) {
    //    logger.write('Upload listener',obj.item,2);
    //}),

    listener2: ps.subscribe('thumbnails', function(obj){
        logger.write('Thumbnail listener',obj.item.filename,2);
        let uploadParams = {
            Bucket: config.s3_thumbnail_folder, 
            Key: 'tb_'+obj.item.imageID, 
            Body: obj.content, 
            ContentType: 'image/jpg',
            ACL: 'public-read'
        };
        logger.write('calling s3upl', uploadParams.Key,2);
        awss3.uploadToS3(uploadParams); 
    })

}
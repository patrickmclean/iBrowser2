// Load the AWS SDK for Node.js
const aws = require('aws-sdk');
const config = require('../config/config.js');
const logger = require('./logger.js');
const ps = require('./pubsub');
const fs = require('fs');

// AWS config update is called for every call
// Likely not efficient, add some session state at some point

module.exports = {
  uploadToS3: function(uploadParams) {
    aws.config.update(config.aws_remote_config);
    const s3 = new aws.S3();
    logger.write('s3upload',uploadParams.Key +" to "+uploadParams.Bucket,2);
    s3.upload(uploadParams, function (err, data, uploadParams2=uploadParams){
        if (err) {
            throw(err)
        } else {
            logger.write('s3upload','complete '+uploadParams2.Key,2);
            ps.publish('s3uploads', {
                content: data,
                item: uploadParams2.Key
            })
        };
    })
  },

  downloadFromS3: function(imageID,location){
    let remoteFilename = imageID.replace('id-','');
    let localFilename = location + imageID.replace('id-','') + '.jpg';
    aws.config.update(config.aws_remote_config);
    const s3 = new aws.S3();
    let downloadParams = {
        Bucket: config.s3_originals_folder, 
        Key: remoteFilename, 
    };
    logger.write('s3download',downloadParams.Key +" from "+downloadParams.Bucket,2);
    let s3stream =  s3.getObject(downloadParams).createReadStream();
    let writeStream = fs.createWriteStream(localFilename);
    s3stream.pipe(writeStream);
    s3stream.on('end', function (){
      logger.write('writeFileDone',localFilename,2)
    })
    s3stream.on('error', function (err){
      logger.write('writeFileError',localFilename,2)
    })
  },

  deleteFromS3: function(params){
    aws.config.update(config.aws_remote_config);
    const s3 = new aws.S3();
    logger.write('s3delete',params.Key +" from "+ params.Bucket,2);
    s3.deleteObject(params, function (err, data, params2=params){
        if (err) {
          logger.write('s3delete','err'+err, 1);
            throw(err)
        } else {
            logger.write('s3delete','complete '+params2.Key,2);
            ps.publish('s3delete', {
              item: params2.Key
          })
        };
    })
  }
}


// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const config = require('../config/config.js');
const logger = require('./logger.js');
const asyncLimit = require('./asynclimit');
const util = require('util');


// Set the credentials & get S3 service object
AWS.config.update(config.aws_remote_config);

module.exports = {
  uploadThumbnail: function (imageID, thumbnail){
    if (config.s3_use == false) return;

    // call S3 to retrieve upload file to specified bucket
    thumbnail_buffer = Buffer.from(thumbnail,'base64');
    
    var uploadParams = {
      Bucket: config.s3_thumbnail_folder, 
      Key: imageID+'.jpg', 
      Body: thumbnail_buffer, 
      ContentType: 'image/jpg',
      ACL: 'public-read'
    };

    s3 = new AWS.S3();

    this.s3upload(uploadParams)
      .then(data => {
        logger.write('aws upload', 'Upload Success:'+ data.Location,1);
      })
      .catch(err => {console.log(err)});

  },
  s3upload: asyncLimit(function(uploadParams){
    return new Promise(function(resolve, reject){
        s3.upload(uploadParams, function (err, data){
          resolve(data);
          reject(err);
        });
    })
  })
}


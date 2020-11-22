// Load the AWS SDK for Node.js
const aws = require('aws-sdk');
const config = require('../config/config.js');
const logger = require('./logger.js');
const ps = require('./pubsub');

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


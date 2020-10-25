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
    logger.write('s3upload',uploadParams.Key,2);
    s3.upload(uploadParams, function (err, data, file=uploadParams.Key){
        if (err) {
            throw(err)
        } else {
            logger.write('s3upload','complete '+file,2);
            ps.publish('s3uploads', {
                content: data,
                item: file
            })
        };
    })
  }
}


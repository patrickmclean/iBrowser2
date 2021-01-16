// Load the AWS SDK for Node.js
const aws = require('aws-sdk');
const config = require('../config/config.js');
const logger = require('./logger.js');
const ps = require('./pubsub');
const fs = require('fs');
const stream = require('stream');
const {spawn} = require("child_process");
const image = require('./image.js');

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

  // downloads a file from s3 and saves on local drive
  downloadFromS3: function(remoteFilename,localFilePath){
    return new Promise(function(resolve, reject){
      aws.config.update(config.aws_remote_config);
      const s3 = new aws.S3();
      let downloadParams = {
          Bucket: config.s3_originals_folder, 
          Key: remoteFilename, 
      };
      logger.write('s3download',downloadParams.Key +" from "+downloadParams.Bucket,2);
      let s3stream =  s3.getObject(downloadParams).createReadStream();
      let writeStream = fs.createWriteStream(localFilePath);
      s3stream.pipe(writeStream);
      s3stream.on('end', function (){
        logger.write('writeFileDone',localFilePath,2);
        resolve();
      })
      s3stream.on('error', function (err){
        logger.write('writeFileError',localFilePath,2)
        reject('write file error');
      })
    })
  },

  // stream process path for, for instance, imagemagick 
  // streams from s3 through a local process pipe
  // and saves back out to s3
  processS3Files: function(inputFile, outputFile, process, args){
    aws.config.update(config.aws_remote_config);
    const s3 = new aws.S3();
    let readParams = {
        Bucket: config.s3_originals_folder, 
        Key: inputFile, 
    };
    let writeParams = {
      Bucket: config.s3_output_folder, 
      Key: outputFile, 
      ACL: 'public-read'
    };
    logger.write('s3process',readParams.Key +" from "+readParams.Bucket,2);
    let s3readStream =  s3.getObject(readParams).createReadStream();
    let proc = spawn(process,args);
    s3readStream.pipe(proc.stdin);
    proc.stdout.pipe(this.uploadFromStream(s3,writeParams));
  
    s3readStream.on('end', function (){
      logger.write('s3proc read complete',inputFile,2)
    })
    s3readStream.on('error', function (err){
      logger.write('s3proc read file error',inputFile,2)
    })
    
  },

  // supports the above
  uploadFromStream: function(s3,params) {
    var pass = new stream.PassThrough();
    params.Body = pass;
    s3.upload(params, function(err, data) {
      if (err) {
        throw(err)
      } else {
        logger.write('process write','complete '+data.Key,2);
        ps.publish('procComplete', {
          item: data.Key
        })
      };
    });
    return pass;
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

/* This is a promise version of uploadfromstream but ran with errors 

const uploadStream = ({ Bucket, Key }) => {
  const s3 = new aws.S3();
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
  };
}
*/



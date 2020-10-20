const ddb = require('./awsdynamodb');
const aws = require('aws-sdk');
const image = require('./image.js');
const fs = require('fs');
const util = require('util');
const { response } = require('express');

const readFile = util.promisify(fs.readFile);

module.exports = {
    addToDb: function (imageName){
        var item = new image.imageClass;
        item.filename = imageName;
        item.addDate(new Date());
        ddb.insert(item);
        console.log(item)
    },

    uploadFile: function (files){
        aws.config.update(config.aws_remote_config);
        s3 = new aws.S3();
        
        if (Array.isArray(files.fileName) == true) {
            files.fileName.forEach(file => {
                this.addFileToS3andDB(file)
            })
        } 
        else {
            this.addFileToS3andDB(files.fileName)
        }
    },

    addFileToS3andDB : function (file) {
        // create item in db
        this.addToDb(file.name);
        var uploadParams = {
            Bucket: config.s3_images_folder, 
            Key: file.name, 
            Body: file.data, 
            ContentType: 'image/jpg',
            ACL: 'public-read'
        };
        return new Promise(function(resolve, reject){
            s3.upload(uploadParams, function (err, data){
                resolve(data);
                reject(err);
            })
        });
    },

    loadImages: async function() {
        console.log('now in load images function');
        let data = await ddb.readAll();
        console.log('load images: data back');
        return data;
    }
}




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
        console.log('dbadd '+item.filename)
    },

    uploadFile: function (files){
        that = this;
        return new Promise(function(resolve, reject){
            if (Array.isArray(files.fileName) == true) {
                files.fileName.forEach(file => {
                    console.log('UploadMultiple '+file.name);
                    that.addFileToS3andDB(file)
                    .then(response => {
                        console.log('s3 return'+response.Key);
                        resolve(response);
                    })
                    .catch(err => {
                        console.log('s3 err'+err);
                        reject(err);
                    })
                })
            } 
            else {
                console.log('UploadSingle '+files.fileName.name);
                that.addFileToS3andDB(files.fileName)
                .then(response => {
                    console.log('s3 return'+response.Key);
                    resolve(response);
                })
                .catch(err => {
                    console.log('s3 err'+err);
                    reject(err);
                })
            }
        })
    },

    addFileToS3andDB : function (file) {
         // this is a mess to be cleaned up - these variables are global context
        // not being properly passed to where they need to be
        aws.config.update(config.aws_remote_config);
        s3 = new aws.S3();

        // create item in db
        this.addToDb(file.name);
        var uploadParams = {
            Bucket: config.s3_images_folder, 
            Key: file.name, 
            Body: file.data, 
            ContentType: 'image/jpg',
            ACL: 'public-read'
        };
        //this.createThumbnail(file);
        return new Promise(function(resolve, reject){
            console.log('ready for s3 '+uploadParams.Key);
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
    },

    // Creates a thumbnail fitted insize the boundBox (w x h)
    createThumbnail(file, boundBox){
    if (!boundBox || boundBox.length != 2){
      throw "You need to give the boundBox"
    }
    var scaleRatio = Math.min(...boundBox) / Math.max(file.width, file.height)
    var reader = new FileReader();
    var canvas = document.createElement("canvas")
    var ctx = canvas.getContext('2d');
  
    return new Promise((resolve, reject) => {
      reader.onload = function(event){
          var img = new Image();
          img.onload = function(){
              var scaleRatio = Math.min(...boundBox) / Math.max(img.width, img.height)
              let w = img.width*scaleRatio
              let h = img.height*scaleRatio
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(img, 0, 0, w, h);
              return resolve(canvas.toDataURL(file.type))
          }
          img.src = event.target.result;
      }
      reader.readAsDataURL(file);
    })
  }
}


/*
generateThumbnail(file, [300, 300]).then(function(dataUrl){
    console.log(dataUrl)
})
*/
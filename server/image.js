// Image classes and functions

const uuid = require('uuid');
const exif = require('exif').ExifImage;
const jimp = require('jimp');
const ps = require('./pubsub');
const { MIME_JPEG } = require('jimp');
const { AUTO } = require('jimp');
const logger = require('./logger');

module.exports = {

imageClass: class {
    constructor() {
        this.imageID = uuid();
        this.date = {
            utc: '',
            year: '',
            month: '',
            day: ''
        };
        this.md5;
        this.filename;
        this.folder;
        this.thumbnailSize = config.thumbnailSize;
        this.gallerySize = config.gallerySize;
        this.width;
        this.height;
        this.orientation;
        this.aspectRatio;
        this.version = 4; // change this any time the object definition changes
    }
    addFileInfo(file, folder, rootDirectory) {
        this.filename = path.basename(file);
        this.folder = folder.replace(rootDirectory, '');
        this.s3thumbnailUrl = config.s3_thumbnail_url;
        this.s3galleryUrl = config.s3_gallery_url;
        this.s3originalsUrl = config.s3_originals_url;
    }
    addDate(birthtime) {
        this.date.utc = birthtime;
        this.date.year = birthtime.getUTCFullYear();
        this.date.month = birthtime.getUTCMonth() + 1; /* months are zero based ! */
        this.date.day = birthtime.getUTCDate();
        this.date.hour = birthtime.getUTCHours();
        this.date.minutes = birthtime.getUTCMinutes();
        this.date.seconds = birthtime.getUTCSeconds();
    }

    getMetadata(fileData) {
        let that = this;
        exif({ image : fileData }, function (error, exifData) {
            if (error)
                logger.write('Exif Error',error.message,1);
            else
                that.width = exifData.exif.ExifImageWidth;
                that.height = exifData.exif.ExifImageHeight;
                that.orientation = exifData.image.Orientation;
                that.aspectRatio = that.width / that.height;
                logger.write('exif w+h ',that.width+" "+that.height,2); 
            });
    }

    // Forgive the item, item2 thing below. Want to pass custom parameters into the callback and
    // this was the only way I could figure out how to get it to work
    createReducedImage(imageItem, fileData, boundBox, type){
        logger.write('reduce image '+type,imageItem.filename,2);
        jimp.read(fileData)
            .then((returnImage, item=imageItem) => {
                logger.write('thumbFileRead',item.filename,2);
                let tbImage = returnImage.scaleToFit(boundBox.width,boundBox.height);
                // This is super annoying - Jimp screws up orientation on resize
                // The two main sideways orientations are 6 and 8, 1 is upright, 3 is upside down
                switch(imageItem.orientation){
                    case 6: 
                        tbImage = tbImage.rotate(90);
                        break;
                    case 8: 
                        tbImage = tbImage.rotate(-90);
                        break;
                }
                tbImage.getBuffer(AUTO,(error, img, item2=item) =>{
                    logger.write(type+' Resize',item2.filename,2);
                    ps.publish('resizer', {
                        content: img,
                        item: item2,
                        type: type
                    });
                })
            },imageItem)
            .catch((err, item=imageItem) => {
                // this is getting called even when the .then succeeds. don't know why, but appears harmless
                logger.write('Jimp error ',err+" "+item.filename,1);
            })
    }
}
}
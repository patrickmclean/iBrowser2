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
        this.width;
        this.height;
        this.version = 3; // change this any time the object definition changes
    }
    addFileInfo(file, folder, rootDirectory) {
        this.filename = path.basename(file);
        this.folder = folder.replace(rootDirectory, '');
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
                logger.write('exif w+h ',that.width+" "+that.height,2); 
            });
    }

    // Forgive the item, item2 thing below. Want to pass custom parameters into the callback and
    // this was the only way I could figure out how to get it to work
    createThumbnail(imageItem, fileData, boundBox){
        logger.write('createThumb',imageItem.filename,2);
        jimp.read(fileData)
            .then((returnImage, item=imageItem) => {
                logger.write('thumbFileRead',item.filename,2);
                returnImage.resize(boundBox.width,boundBox.height).getBuffer(AUTO,(error, img, item2=item) =>{
                    logger.write('thumbFileResize',item2.filename,2);
                    ps.publish('thumbnails', {
                        content: img,
                        item: item2
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
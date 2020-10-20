// Image classes and functions

uuid = require('uuid');

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
        this.md5 = '';
        this.filename = ''
        this.folder = '';
        this.thumbnailSize = config.thumbnailSize;
        this.version = 2; // change this any time the object definition changes
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
}
}
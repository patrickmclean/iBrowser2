const logger = require('./logger');
const {exec} = require("child_process");
const {spawn} = require("child_process");
const config = require('../config/config');
const fs = require('fs');
const { stdin } = require('process');
const { read } = require('jimp');

module.exports = {
    imageProcess: function(process, parameters, inputFile, outputFile) {
        let processCommand = process+inputFile+parameters+outputFile;
        logger.write('image process',processCommand,2);
        exec(processCommand, (error, stdout, stderr) => {
            if (error) {
                logger.write('ip error ',error.message,1);
                return;
            }
            if (stderr) {
                logger.write('ip stderr ',stderr,1);
                return;
            }
            logger.write('ip success ',stdout,2)
        });
    },

    imageProcess2: function(inputFile,outputFile) {
        
        let args = [
            "-", // stdin
            "-resize", "50%", 
            "-blur", "0x6", 
            "-bordercolor", "red",
            "-border", "20", 
            "-" // stdout
        ];
        let readStream = fs.createReadStream(inputFile);
        let writeStream = fs.createWriteStream(outputFile);
        logger.write('image process 2','convert '+args+" "+inputFile+' '+outputFile,2);
        let proc = spawn('convert',args);
        readStream.pipe(proc.stdin);
        proc.stdout.pipe(writeStream);
        readStream.on('end', function (){
            logger.write('process writeFileDone',outputFile,2)
        })
        readStream.on('error', function (err){
            logger.write('process writeFileError',outputFile,2)
        })
    }
}

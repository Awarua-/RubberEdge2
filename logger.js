'use-strict';

const fs = require('fs'),
    directory = "results";


class Logger {
    constructor() {
        this.currentParticipantId = 1;
        this._checkForDirectory()
        .then(() => this._findNextId())
        .then(() => this._createFileHandle())
        .catch(error => {
            console.log(error);
        });
    }

    destructor() {
        return this._closeFileStream();
    }

    _checkForDirectory() {
        return new Promise((resolve, reject) => {
            fs.stat(directory, (err, stats) => {
                if (err) {
                    console.warn(directory + " folder does not exist");
                    fs.mkdir(directory, 0o777, () => {
                        resolve();
                    });
                }
                else if (!stats.isDirectory()) {
                    reject(directory + " was defined, but was not a directory");
                }
                else {
                    resolve();
                }
            })
        });
    }

    _findNextId(){
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (files.length > 0) {
                    files = files.map(i => {return parseInt(i.replace(".txt", ""))});
                    files.sort((a, b) => {return a - b});
                    this.currentParticipantId = files[files.length - 1]  + 1;
                    resolve();
                } else {
                    resolve();
                }
            })
        });
    }

    _closeFileStream() {
        return new Promise((resolve, reject) => {
            try {
                if (this.fileStream) {
                    this.fileStream.end(resolve);
                }
                else {
                    resolve();
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    _createFileHandle() {
        return new Promise((resolve, reject) => {
            this._closeFileStream().then(() => {
                const path = directory + '/' + this.currentParticipantId + '.txt';
                this.fileStream = fs.createWriteStream(path, {flags: "a+", encoding: 'utf-8',mode: 0o777});
                this.fileStream.on('error', e => { console.log("fail"); console.error(e); });
                resolve();
            }).catch(error => reject(error));
        });
    }

    getCurrentParticipantId() {
        return this.currentParticipantId;
    }

    newParticipant() {
        this.currentParticipantId += 1;
        this._createFileHandle()
        .then(() => {
            return true})
        .catch(error => {
            console.log(error);
            return false;
        });
        return this.currentParticipantId;
    }

    log(data) {
        //FIXME race condition, when opening new file to write too.
        if (data.participantId && data.participantId !== this.currentParticipantId) {
            console.error("participant Id does not match the file being logged to");
            //FIXME raise exception?
        }
        let dataString = data;
        if (typeof data === 'object') {
            dataString = JSON.stringify(data);
        }
        this.fileStream.write(dataString + '\n');
    }

}

module.exports = Logger;

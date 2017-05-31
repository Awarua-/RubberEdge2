'use-strict'

const fs = require('fs');

let rmDir = dirPath => {
    try {
        let files = fs.readdirSync(dirPath);
        if (files.length > 0) {
            for (let file of files) {
                let filePath = dirPath + '/' + file;
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
                else {
                    rmDir(filePath);
                }
            }
        }
        fs.rmdirSync(dirPath);
    }
    catch(e) {
        console.error(e);
        return;
    }
};


rmDir('./results');

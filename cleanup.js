"use-strict"

const noop = () => {};

class Cleanup {

    constructor(callback) {
        this.callback = callback || noop;
        this._registerEvents();
    }

    _registerEvents() {

        // catch ctrl+c event and exit normally
        process.on('SIGINT', () => {
          console.log('Ctrl-C...');
          this.callback().then(() => {
              process.exit(0);
            })
            .catch((error) => {
                console.log(error);
                process.exit(1)
            });
        });

        //catch uncaught exceptions, trace, then exit normally
        process.on('uncaughtException', e => {
          console.log('Uncaught Exception...');
          console.log(e.stack);
          process.exit(99);
        });
    }
}

module.exports = Cleanup

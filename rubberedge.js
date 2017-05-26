'use-strict';

const pointing = require('./pointing.node'),
    rubberEdgeFunctionDir = '/rubberEdgeFunction';


class RubberEdge {

    constructor(cb, debug) {
        // Setup debug
        this.debug = false;
        if (debug !== null) {
            this.debug = debug;
        }

        // Mapping to transfer functions
        this.transferFunctions = [{"name": "system", "function": this._composeFunction("system:?slider=-2&epp=true"), "active": true},
                                     {"name": "constant", "function": this._composeFunction("constant:?cdgain=1"), "active": false},
                                {"name": "rubberedge", "function": this._composeFunction("interp:" + rubberEdgeFunctionDir), "active": false}];

        this.callback = cb;
        this.input = new pointing.PointingDevice("any:?debugLevel=1");
        this.output = new pointing.DisplayDevice("any:?debugLevel=1");
        // by default set the transferFunction to the selected one
        this.tFunc = new pointing.TransferFunction(this.transferFunctions.filter(v => {if (v.name === "system") {return true}})[0].function, this.input, this.output);
        //this.tFunc.setSubPixeling(true);
        //this._setupCallback();
    }

    _composeFunction(uri) {
        if (this.debug) {
            // Compose differently if the uri has arguments
            let prefix = '&';
            if (uri[uri.length - 1] === ':') {
                prefix = ':';
            }
            return uri + prefix + "debugLevel=1"
        }
        return uri;
    }


    //FIXME Dead code below, used with trackpad
    _setupCallback() {
        this.input.setPointingCallback((timestamp, dx, dy, buttons, x, y) => {
            let pixels = this.tFunc.applyd(dx, dy, timestamp);
            if (this.callback) {
                this.callback({dx: pixels.dx, dy: pixels.dy, timestamp: timestamp, button: buttons});
            }
        });
    }

    updatePosition(data) {
        let pixels = this.tFunc.applyd(data.dx, data.dy, data.timestamp),
            isEnd = false;
        if (data.eventType === "touchEnd") {
            isEnd = true;
        }
        if (this.callback) {
            this.callback({dx: pixels.dx, dy: pixels.dy, timestamp: data.timestamp, end: isEnd});
        }
    }

    changeTransferFunction(data) {
        if (!data) {
            console.error('No data recieved to change transfer function');
            //FIXME should throw and exception
            return;
        }
        console.log(data);
        let functionFilter = this.transferFunctions.filter(v => {if (data === v.name) {return true}});
        if (functionFilter.length < 1 || functionFilter.length > 1) {
            console.error('found no or more than one function in the filter, not changing function');
            //FIXME should throw and exception
            return;
        }
        let newFunction = functionFilter[0].function;
        this.tFunc = new pointing.TransferFunction(newFunction, this.input, this.output);
        console.log('Transfer function changed');
    }

    setDebug(debug) {
        this.debug = debug;
    }

    getTransferFunctions() {
        return this.transferFunctions;
    }

}
module.exports = RubberEdge;

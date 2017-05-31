'use-strict';

const pointing = require('./pointing.node'),
    math = require('mathjs'),
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
        //FIXME uncomment below to enable trackpad
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

    calibrationInput(data) {
        switch (data.eventType) {
            case "calibrationInner":
                    this._calibrateInner(data);
                break;

            case "calibrationOuter":
                this._calibrateOuter(data);
                break;

            default:
                console.error("Calibation message not supported");
        }
    }

    _calibrateInner(data) {
        this._calibrate(data, 'inner');
    }

    _calibrate(data, circle) {
        switch(circle) {
            case 'inner':
                if (!this.caliInnerX) {
                    this.caliInnerX = [];
                }

                if (!this.caliInnerY) {
                    this.caliInnerY = [];
                }

                this.caliInnerX.push(data.x);
                this.caliInnerY.push(data.y);
                break;
            case 'outer':
                if (!this.caliOuterX) {
                    this.caliOuterX = [];
                }

                if (!this.caliOuterY) {
                    this.caliOuterY = [];
                }

                this.caliOuterX.push(data.x);
                this.caliOuterY.push(data.y);
                break;
            default:
                console.error("Circle type not supported");

            if (data.isEnd) {
                switch (circle) {
                    case 'inner':
                        this.caliInnerMatrix = math.matrix(this.caliInnerX, this.caliInnerY);

                        this.innerPos, this.innerRadius = this._fitCircle(this.caliInnerMatrix);
                        break;
                    case 'outer':
                        this.caliOuterMatrix = math.matrix(this.caliOuterX, this.caliOuterY);

                        this.outerPos, this.outerRadius = this._fitCircle(this.caliOuterMatrix);
                        break;
                    default:
                        console.error("Circle type not supported");
                }
            }
        }
    }

    _calibrateoOuter(data) {
        this._calibrate(data, 'outer');
    }

    _fitCircle(matrix) {
        let size = math.size(matrix);
        let transpose = math.transpose(matrix);
        let ones = math.ones(size[1], 1);
        let times = math.dotMultiply(matrix, matrix);
        let summed = this._sumColumn(times);
        let transpose2 = math.transpose(summed);
        let concat = math.concat(transpose, ones);
        let inverse = math.ins(concat);
        let y = math.multiply(inverse, transpose2);
        let yrange = math.subset(y, math.index(math.range(0, size[0])))
        let x = math.multiply(0.5, yrange);
        let xTransposeThing = math.multiply(math.transpose(x), x);
        let r = math.sqrt(math.add(math.subset(y, math.index(size[0])), xTransposeThing));

        return x, r;
    }

    _sumColumn(matrix) {
        let output = []
        for (let m = 0; m < size[1]; m++) {
            let value = 0;
            for (let n = 0; n < size[0]; n++) {
                value += math.subset(matrix, math.index(n, m));
            }
            output[m] = value
        }
        return math.matrix(output);
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

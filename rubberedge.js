'use-strict';

const pointing = require('./pointing.node'),
    CircleFitter = require('./circleFitter.js'),
    circleFitter = new CircleFitter(),
    rubberEdgeFunctionDir = './rubberEdgeFunction';



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
                                {"name": "rubberedge", "function": this._composeFunction("constant:?cdgain=1"), "active": false}];

        this.callback = cb;
        this.input = new pointing.PointingDevice("any:?debugLevel=1");
        this.output = new pointing.DisplayDevice("any:?debugLevel=1");
        // by default set the transferFunction to the selected one
        this.tFunc = new pointing.TransferFunction(this.transferFunctions.filter(v => {if (v.name === "system") {return true}})[0].function, this.input, this.output);

        //TODO fix hard coded default
        this.selectedFunction = this.transferFunctions[0].name;
        //FIXME uncomment below to enable trackpad
        //this._setupCallback();
        this.isCalibrating = false;

        this.elasticState = false;
        this.accelerationConstant = 0.1;
        this.elasticUpdateFrequency = 40;
        this.elasticVelocity = {dx: 0, dy: 0};
        this.movementHistory = [];
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
        this.last = data;
        if (this.isCalibrating) {
            this.calibrateInput(data);
        }
        else {
            this.movementHistory.push(data);

            //TODO fix hard coded string
            if (this.selectedFunction === "rubberedge") {

                // conditions
                // Enter elastic zone for the first time
                // continue in elastic zone
                // exit elastic zone
                // not in the elastic zone
                if (this._isElastic(data)) {
                    if (this.elasticState && data.eventType != 'touchEnd') {
                    //TODO apply momentum
                    // Workout the difference between
                        //console.log("dx: " + data.dx);
                        //console.log("dy: " + data.dy);
                        let vx = data.dx * this.accelerationConstant;
                        let vy = data.dy * this.accelerationConstant;

                        //console.log("vx: " + vx);
                        //console.log("vy: " + vy);

                        let vfx = this.elasticVelocity.vx + vx;
                        let vfy = this.elasticVelocity.vy + vy;

                        //console.log("vfx: " + vfx);
                        //console.log("vfy: " + vfy);

                        this.elasticVelocity.vx = vfx;
                        this.elasticVelocity.vy = vfy;
                        data.dx = vfx;
                        data.dy = vfy;
                    }
                    else {
                        // first time entering the elastic zone
                        this.elasticState = true;
                        this._clearElasticInterval();
                        this._findInitialVelocity();

                    }
                }
                else {
                    // previously in elastic zone, reset
                    if (this.elasticState) {
                        this.elasticState = false;
                        this._clearElasticInterval();
                        this.elasticVelocity.vx = 0.0;
                        this.elasticVelocity.vy = 0.0;
                    }
                }
            }

            let pixels = this.tFunc.applyd(data.dx, data.dy, data.timestamp),
                isEnd = false;
            if (data.eventType === "touchEnd") {
                isEnd = true;
                // Regardless if we were in the elasticzone or not, reset the state for the isotonic zone
                this.elasticState = false;
                this.elasticVelocity.vx = 0.0;
                this.elasticVelocity.vy = 0.0;
                this.movementHistory = [];
            }
            if (this.callback) {
                this.callback({type: 'mouse', dx: pixels.dx, dy: pixels.dy, timestamp: data.timestamp, end: isEnd});
                // If this is an interval call then we should not set another inverval.
                if (this.elasticState && !data.fake) {
                    // When we are in the elastic state we want the pointer to continue to accelerate, even if the user remains stationary in the elastic zone.
                    // clear the interval
                    this._clearElasticInterval();
                    data.fake = true;
                    this.elasticTimeout = setInterval((data) => {this.updatePosition(data);}, this._getPeriod(), data);
                }

            }
        }
    }

    _findInitialVelocity() {
        this.elasticVelocity.vx = 0.0;
        this.elasticVelocity.vy = 0.0;
        if (this.movementHistory.length <= 1) {
            return;
        }
        let numToConsider = Math.min(3, this.movementHistory.length),
            dx = 0,
            dy = 0,
            startingIndex = this.movementHistory.length - numToConsider,
            endIndex = this.movementHistory.length - 1;
        // Look at the last two or three data points
        for (let i = startingIndex; i <= endIndex; i++) {
            dx += this.movementHistory[i].dx;
            dy += this.movementHistory[i].dy;
        }

        this.elasticVelocity.vx = dx / numToConsider;
        this.elasticVelocity.vy = dy / numToConsider;
    }

    _clearElasticInterval() {
        if (this.elasticTimeout) {
            clearInterval(this.elasticTimeout);
        }
    }

    _getPeriod() {
        if (!this.period) {
            this.period = Math.floor(1000 / this.elasticUpdateFrequency);
        }

        return this.period;
    }

    _isElastic(data) {
        if (!this.innerCircle || !this.innerCircle.success) {
            console.error("Calibration needs to occur before use");
            return;
        }
        let cx = data.x - this.innerCircle.center.x;
        let cy = data.y - this.innerCircle.center.y;
        let distance = Math.sqrt(cx * cx + cy * cy);

        if (distance > this.innerCircle.r) {
            return true;
        }
        return false;
    }

    calibrateInput(data) {
        if (data.eventType === "touchEnd") {
            data.isEnd = true;
        }
        this._calibrate(data);
    }

    _calibrate(data) {
        if (!this.caliInnerX) {
            this.caliInnerX = [];
        }

        if (!this.caliInnerY) {
            this.caliInnerY = [];
        }

        this.caliInnerX.push(data.x);
        this.caliInnerY.push(data.y);

        if (data.isEnd) {
            if (this.caliInnerX.length !== this.caliInnerY.length) {
                console.error('Length of arrays don\'t match up');
                return;
            }
            let data = [];

            for (let i = 0; i < this.caliInnerX.length; i++) {
                data.push([this.caliInnerX[i], this.caliInnerY[i]]);
            }
            this.innerCircle = circleFitter.calculate(data);
            if (this.innerCircle.success) {
                this.callback({success: this.innerCircle.success, type: 'calibrateInner', x: this.innerCircle.center.x, y: this.innerCircle.center.y, r: this.innerCircle.r});
            }

            this.caliInnerX = [];
            this.caliInnerY = [];
        }
    }

    calibrateSwitch(data) {
        this.isCalibrating = data.isCalibrating;
    }

    changeTransferFunction(data) {
        if (!data) {
            console.error('No data recieved to change transfer function');
            //FIXME should throw and exception
            return;
        }
        let functionFilter = this.transferFunctions.filter(v => {if (data === v.name) {return true}});
        if (functionFilter.length < 1 || functionFilter.length > 1) {
            console.error('found no or more than one function in the filter, not changing function');
            //FIXME should throw and exception
            return;
        }
        let newFunction = functionFilter[0].function;
        this.tFunc = new pointing.TransferFunction(newFunction, this.input, this.output);
        this.selectedFunction = functionFilter[0].name;
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

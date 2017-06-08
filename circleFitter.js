'use-strict';

class CircleFitter {

    constructor() {
        this._reset();
    }

    /**
     * Calculates the center of a circle from an array of points.
     * @param  {Array[Array]} data Takes an array of data of x,y coordinates. [[x1, y1], [x2, y2], .... [xn, yn]]
     * @return {Object} Object containing the center point and the radius
     */
    calculate(data) {
        this._reset();
        this.data = data;
        this.initialize();
        let iter = this.minimise(300, 0.1, 0.000000001);
        if (iter === null) {
            return {success: false}
        }
        return {success: true, center: this.center, r: this.rHat};
    }

    _reset() {
        this.data = [];
        this.center = {x: 0, y: 0};
        this.rHat = 1.0;

        this.J = 0;
        this.dJdx = 0;
        this.dJdy = 0;
    }

    initialize() {
        let n = 0;
        for (let i = 0; i < (this.data.length - 2); ++i) {
            let p1 = this.data[i];
            for (let j = i + 1; j < (this.data.length - 1); ++j) {
                let p2 = this.data[j];
                for (let k = j + 1; k < this.data.length; ++k) {
                    let p3 = this.data[k];

                    let cc = this.circumcenter(p1, p2, p3);
                    if (cc !== null) {
                        ++n;
                        this.center.x += cc.x;
                        this.center.y += cc.y;
                    }
                }
            }
        }

        if (n === 0) {
            console.error("all points are aligned");
        }



        this.center.x /= n;
        this.center.y /= n;

        this.updateRadius();

    }

    updateRadius() {
        this.rHat = 0;
        for (let i = 0; i < this.data.length; ++i) {
            let dx = this.data[i][0] - this.center.x,
                dy = this.data[i][1] - this.center.y;
            this.rHat += Math.sqrt(dx * dx + dy * dy);
        }
        this.rHat /= this.data.length;
    }

    circumcenter(pI, pJ, pK) {
        let dIJ = [pJ[0] - pI[0], pJ[1] - pI[1]],
            dJK = [pK[0] - pJ[0], pK[1] - pJ[1]],
            dKI = [pI[0] - pK[0], pI[1] - pK[1]];

        let sqI = pI[0] * pI[0] + pI[1] * pI[1],
            sqJ = pJ[0] * pJ[0] + pJ[1] * pJ[1],
            sqK = pK[0] * pK[0] + pK[1] * pK[1];

        let det = dJK[0] * dIJ[1] - dIJ[0] * dJK[1];

        if (Math.abs(det) < 0.00000000001) {
            return null;
        }

        let center = {x: (sqI * dJK[1] + sqJ * dKI[1] + sqK * dIJ[1]) / (2 * det),
            y: -(sqI * dJK[0] + sqJ * dKI[0] + sqK * dIJ[0]) / (2 * det)}

        return center;
    }

    minimise(iterMax, innerThreshold, outerThreshold) {
        this.computeCost();

        if (this.J < 0.00000000001 || (Math.sqrt(this.dJdx * this.dJdx + this.dJdy * this.dJdy) < 0.00000000001)) {
            // already at the local minimum
            return 0;
        }

        let previousJ = this.J,
            previousU = 0.0,
            previousV = 0.0,
            previousDJdx = 0.0,
            previousDJdy = 0.0;

        for (let iterations = 0; iterations < iterMax;) {
            let u = -this.dJdx,
                v = -this.dJdy;

            if (iterations != 0) {
                let beta = (this.dJdx * (this.dJdx - previousDJdx) + this.dJdy * (this.dJdy - previousDJdy)) / (previousDJdx * previousDJdx + previousDJdy * previousDJdy);

                u += beta * previousU;
                v += beta * previousV;
            }
            previousDJdx = this.dJdx;
            previousDJdy = this.dJdy;
            previousU = u;
            previousV = v;

            let innerJ = 0;
            do {
                innerJ = this.J;
                let lambda = this.newtonStep(u, v);
                this.center.x += lambda * u;
                this.center.y += lambda * v;
                this.updateRadius();
                this.computeCost();
            } while((++iterations < iterMax) && ((Math.abs(this.J - innerJ) / this.J) > innerThreshold));

            if ((Math.abs(this.J - previousJ) / this.J) < outerThreshold) {
                return iterations;
            }
            previousJ = this.J;
        }

        console.error("unable to converge");
        return null;
    }

    computeCost() {
        this.J = 0;
        this.dJdx = 0;
        this.dJdy = 0;

        for (let i = 0; i < this.data.length; ++i) {
            let dx = this.data[i][0] - this.center.x,
                dy = this.data[i][1] - this.center.y,
                di = Math.sqrt(dx * dx + dy * dy);

            if (di < 0.00000000001) {
                console.error("cost singularity");
                return;
            }

            let dr = di - this.rHat,
                ratio = dr / di;

            this.J += dr * (di + this.rHat);
            this.dJdx += dx * ratio;
            this.dJdy += dy * ratio;
        }
        this.dJdx *= 2.0;
        this.dJdy *= 2.0;
    }

    newtonStep(u, v) {
        let sum1 = 0,
            sum2 = 0,
            sumFac = 0,
            sumFac2R = 0;

        for (let i = 0; i < this.data.length; ++i) {
            let dx = this.center.x - this.data[i][0],
                dy = this.center.y - this.data[i][1],
                di = Math.sqrt(dx * dx + dy * dy),
                coeff1 = (dx * u + dy * v) / di,
                coeff2 = di - this.rHat;

            sum1 += coeff1 * coeff2;
            sum2 += coeff2 / di;
            sumFac += coeff1;
            sumFac2R += coeff1 * coeff1 / di
        }

        return -sum1 / ((u * u + v * v) * sum2 - sumFac * sumFac / this.data.length + this.rHat * sumFac2R);
    }

}

module.exports = CircleFitter;

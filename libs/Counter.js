export default class Counter {
    initValue;
    currValue;
    maxValue;
    constructor(maxValue, initialValue = 0) {
        this.initValue = initialValue;
        this.currValue = initialValue;
        this.maxValue = maxValue;
    }
    count(n = 1) {
        this.currValue += n;
    }
    reset(value = this.initValue) {
        this.currValue = value;
    }
    over() {
        return this.currValue > this.maxValue;
    }
    progress() {
        return this.currValue / this.maxValue;
    }
}
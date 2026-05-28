import V3 from "./V3.js";

export default class Color extends V3 {
    a = 1;
    static get white() { return new Color(1,1,1); }
    static get gray() { return new Color(0.5,0.5,0.5); }
    static get black() { return new Color(0,0,0); }
    static get red() { return new Color(1,0,0); }
    static get yellow() { return new Color(1,1,0); }
    static get green() { return new Color(0,1,0); }
    static get cyan() { return new Color(0,1,1); }
    static get blue() { return new Color(0,0,1); }
    
    get r() { return this.x; }
    get g() { return this.y; }
    get b() { return this.z; }
    set r(v) { this.x = v; }
    set g(v) { this.y = v; }
    set b(v) { this.z = v; }

    constructor(r,g,b,a=1) {
        super(r,g,b);
        this.a = a;
    }
    toVec() {
        return this;
    }
    setAlpha(a) {
        this.a = a;
        return this;
    }
    static fromVec(v1,a=1) {
        return new Color(v1.x,v1.y,v1.z,a);
    }
    static vecToRGB(v1,a=1) {
        return (
            'rgb('+
                255*v1.x+','+
                255*v1.y+','+
                255*v1.z+','+
                255*a+
            ')'
        )
    }
    // https://labex.io/tutorials/javascript-hsl-to-rgb-conversion-28378
    static HSLToRGB(h, s, l) {
        const k = (n) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n) =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return new Color(f(0),f(8),f(4));
    }
    invert() {
        return new Color(
            1 - this.r,
            1 - this.g,
            1 - this.b,
            this.a
        )
    }
    toHex() {
        let normToHex = (n, pad = 2) => {
            return Math.floor(255*n)
            .toString(16)
            .padStart(pad,'0')
        };
        return (
            '#'
            + normToHex(this.r)
            + normToHex(this.g)
            + normToHex(this.b)
            + normToHex(this.a)
        )
    }
    diff(c2) {
        return this.toVec().sub(c2.toVec()).abs().clamp(V3.one).toColor();
    }
    copy() {
        return new Color(this.r,this.g,this.b,this.a);
    }
}
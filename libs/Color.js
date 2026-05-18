import V3 from "./V3.js";

export default class Color {
    r;
    g;
    b;
    a;
    static white = new Color(1,1,1);
    static gray = new Color(0.5,0.5,0.5);
    static black = new Color(0,0,0);
    static red = new Color(1,0,0);
    static yellow = new Color(1,1,0);
    static green = new Color(0,1,0);
    static blue = new Color(0,0,1);
    constructor(r,g,b,a=1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static fromVec(v1,a=1) {
        return new Color(v1.x,v1.y,v1.z,a);
    }
    toVec() {
        return new V3(this.r,this.g,this.b);
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
}
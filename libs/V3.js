import Util from './Util.js'

export default class V3 {
    x = 0;
    y = 0;
    z = 0;
    static get zero() { return new V3(0,0,0); }
    static get one() { return new V3(1,1,1); }
    static get UP() { return new V3(0, 1, 0); }
    static get DOWN() { return new V3(0, -1, 0); }
    static get LEFT() { return new V3(-1, 0, 0); }
    static get RIGHT() { return new V3(1, 0, 0); }
    static get FRONT() { return new V3(0, 0, 1); }
    static get BACK() { return new V3(0, 0, -1); }
    constructor(x,y,z) {
        this.x = x || 0
        this.y = y || 0
        this.z = z || 0
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    equals(v1) {
        return v1 instanceof V3
            && v1.x === this.x
            && v1.y === this.y
            && v1.z === this.z
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    add(v1){
        return new this.constructor(
        this.x+v1.x,
        this.y+v1.y,
        this.z+v1.z
        )
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    sub(v1){
        return new this.constructor(
        this.x-v1.x,
        this.y-v1.y,
        this.z-v1.z
        )
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    mult(v1){
        return new this.constructor(
        this.x*v1.x,
        this.y*v1.y,
        this.z*v1.z
        )
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    div(v1){
        return new this.constructor(
        this.x/v1.x,
        this.y/v1.y,
        this.z/v1.z
        )
    }
    /**
     * @param {Number} n
     * @returns {this}
     */
    scale(n){
        return new this.constructor(
        this.x*n,
        this.y*n,
        this.z*n
        )
    }
    /**
     * @returns {Number}
     */
    mag(){
        return Math.sqrt(this.x**2+this.y**2+this.z**2)
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    cross(v1) {
        return new this.constructor(
            this.y*v1.z-this.z*v1.y,
            this.z*v1.x-this.x*v1.z,
            this.x*v1.y-this.y*v1.x
        )
    }
    /**
     * @param {V3,Color} v1 
     * @returns {Number}
     */
    dot(v1) {
        //return this.x*v1.x+this.y*v1.y+this.z*v1.z;
        return this.mult(v1).sum();
    }
    /**
     * @param {V3,Color} v1 
     * @returns {Number}
     */
    angFromVec(v1) {
        let cosAng = this.dot(v1)/(this.mag()*v1.mag())
        //precision breaks sometimes, need to clamp to [-1,1]
        cosAng = Math.min(1,Math.max(-1,cosAng))
        return Util.radToAng(Math.acos(cosAng))
    }
    /**
     * @returns {this}
     */
    normalized() {
        return this.scale(1/this.mag())
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    lerp(v1,t){
        return (this.scale(1-t)).add(v1.scale(t))
    }
    /**
     * @param {V3,Color} v1 
     * @returns {this}
     */
    proj_vec(v1) {
        let dot = this.dot(v1)
        return v1.scale(dot)
    }
    /**
     * @returns {this}
     */
    copy() {
        return new this.constructor(this.x,this.y,this.z)
    }
    rot(angle,axis,posOff = new this.constructor(0,0,0)) {
        let ang = Util.angToRad(angle)
        let out = this
        let diff = this.sub(posOff)
        switch(axis) {
        case 'X':
            out = new this.constructor(
            diff.x,
            diff.y*Math.cos(ang)+diff.z*Math.sin(ang),
            diff.z*Math.cos(ang)-diff.y*Math.sin(ang)
            )
            break
        case 'Y':
            out = new this.constructor(
            diff.x*Math.cos(ang)-diff.z*Math.sin(ang),
            diff.y,
            diff.z*Math.cos(ang)+diff.x*Math.sin(ang)
            )
            break
        case 'Z':
            out = new this.constructor(
            diff.x*Math.cos(ang)+diff.y*Math.sin(ang),
            diff.y*Math.cos(ang)-diff.x*Math.sin(ang),
            diff.z
            )
            break
        }
        out = out.add(posOff)
        return out
    }
    relRot(angle,normAxis = new this.constructor(0,0,0), posOff = new this.constructor(0,0,0)) {
        if(normAxis.mag()==0) return
        let ang = Util.angToRad(angle)
        normAxis = normAxis.normalized()
        
        let out = this.sub(posOff)
        //Rodrigues formula from chatgpt, sorry
        let diff = this.sub(posOff)
        diff = diff.scale(Math.cos(ang))
        .add(normAxis.cross(diff).scale(Math.sin(ang)))
        .add(normAxis.scale(normAxis.dot(diff)).scale(1-Math.cos(ang)))
        out = diff.add(posOff)
        return out
    }
    /**
     * @param {Number} v1 
     * @returns {V3}
     */
    static normToTrig(n) {
        return new V3(
            Math.sin(6.283 * n),
            Math.cos(6.283 * n),
            0
        );
    }
    /**
     * @param {Number} v1 
     * @returns {V3}
     */
    static angToVec(ang) {
        let vec = V3(
            Math.cos(ang),
            Math.sin(ang)
        );
        let out = V3(
            vec.x,
            -vec.y
        );
        return out;
    }
    /**
     * @returns {this}
     */
    toAng() {
        return Math.atan2(-this.y, this.x)
    }
    /**
     * @returns {this}
     */
    floor() {
        return new this.constructor(
            Math.floor(this.x),
            Math.floor(this.y),
            Math.floor(this.z)
        )
    }
    /**
     * @returns {this}
     */
    invert() {
        return new this.constructor(
            1/this.x,
            1/this.y,
            1/this.z
        )
    }
    /**
     * @returns {this}
     */
    ceil() {
        return new this.constructor(
            Math.ceil(this.x),
            Math.ceil(this.y),
            Math.ceil(this.z)
        )
    }
    /**
     * @param {V3,Color} v2 
     * @param {V3,Color} v1 
     * @returns {this}
     */
    clamp(v2,v1 = new this.constructor(0,0,0)) {
        return new this.constructor(
            Util.clamp(this.x,v1.x,v2.x),
            Util.clamp(this.y,v1.y,v2.y),
            Util.clamp(this.z,v1.z,v2.z)
        );
    }
    /**
     * @returns {this}
     */
    abs() {
        return new this.constructor(
            Math.abs(this.x),
            Math.abs(this.y),
            Math.abs(this.z)
        )
    }
    /**
     * @returns {this}
     */
    sum() {
        return this.x + this.y + this.z;
    }
    /**
     * 
     * @param {V3} origin 
     * @param {V3} p1 
     * @param {V3} p2 
     * @param {Boolean} normalize 
     * @returns 
     */
    static getNormal(origin,p1,p2) {
        let v1 = p1.sub(origin).normalized();
        let v2 = p2.sub(origin).normalized();
        let out = v1.cross(v2).normalized();

        return out;
    }
}
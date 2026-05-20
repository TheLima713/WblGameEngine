import Util from './Util.js'

export default class V3 {
  x = 0;
  y = 0;
  z = 0;
  static ZERO = new V3(0, 0, 0);
  static UP = new V3(0, 1, 0);
  static DOWN = new V3(0, -1, 0);
  static LEFT = new V3(-1, 0, 0);
  static RIGHT = new V3(1, 0, 0);
  static FRONT = new V3(0, 0, 1);
  static BACK = new V3(0, 0, -1);
  constructor(x,y,z) {
    this.x = x || 0
    this.y = y || 0
    this.z = z || 0
  }
  equals(v1) {
    return v1 instanceof V3
        && v1.x === this.x
        && v1.y === this.y
        && v1.z === this.z
  }
  add(v1){
    return new V3(
      this.x+v1.x,
      this.y+v1.y,
      this.z+v1.z
    )
  }
  sub(v1){
    return new V3(
      this.x-v1.x,
      this.y-v1.y,
      this.z-v1.z
    )
  }
  mult(v1){
    return new V3(
      this.x*v1.x,
      this.y*v1.y,
      this.z*v1.z
    )
  }
  div(v1){
    return new V3(
      this.x/v1.x,
      this.y/v1.y,
      this.z/v1.z
    )
  }
  scale(n){
    return new V3(
      this.x*n,
      this.y*n,
      this.z*n
    )
  }
  mag(){
    return Math.sqrt(this.x**2+this.y**2+this.z**2)
  }
  cross(v2) {
    return new V3(
      this.y*v2.z-this.z*v2.y,
      this.z*v2.x-this.x*v2.z,
      this.x*v2.y-this.y*v2.x
    )
  }
  dot(v2) {
    return this.x*v2.x+this.y*v2.y+this.z*v2.z
  }
  angFromVec(v2) {
    let cosAng = this.dot(v2)/(this.mag()*v2.mag())
    //precision breaks sometimes, need to clamp to [-1,1]
    cosAng = Math.min(1,Math.max(-1,cosAng))
    return Util.radToAng(Math.acos(cosAng))
  }
  normalized() {
    return this.scale(1/this.mag())
  }
  lerp(v2,t){
    return (this.scale(1-t)).add(v2.scale(t))
  }
  proj_vec(v2) {
    let dot = this.dot(v2)
    return v2.scale(dot)
  }
  copy() {
    return new V3(this.x,this.y,this.z)
  }
  rot(angle,axis,posOff = new V3(0,0,0)) {
    let ang = Util.angToRad(angle)
    let out = this
    let diff = this.sub(posOff)
    switch(axis) {
      case 'X':
        out = new V3(
          diff.x,
          diff.y*Math.cos(ang)+diff.z*Math.sin(ang),
          diff.z*Math.cos(ang)-diff.y*Math.sin(ang)
        )
        break
      case 'Y':
        out = new V3(
          diff.x*Math.cos(ang)-diff.z*Math.sin(ang),
          diff.y,
          diff.z*Math.cos(ang)+diff.x*Math.sin(ang)
        )
        break
      case 'Z':
        out = new V3(
          diff.x*Math.cos(ang)+diff.y*Math.sin(ang),
          diff.y*Math.cos(ang)-diff.x*Math.sin(ang),
          diff.z
        )
        break
    }
    out = out.add(posOff)
    return out
  }
  relRot(angle,normAxis = new V3(0,0,0), posOff = new V3(0,0,0)) {
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
  static normToTrig(n) {
    return new V3(
        Math.sin(6.283 * n),
        Math.cos(6.283 * n),
        0
    );
  }
  static angToVec(ang) {
    let vec = new V3(
        Math.cos(ang),
        Math.sin(ang)
    );
    let out = new V3(
        vec.x,
        -vec.y
    );
    return out;
  }
  toAng() {
    return Math.atan2(-this.y, this.x)
  }
}
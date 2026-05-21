export default class Util {
    pi = 3.14159
    angToRad(ang) {
        return ang * nPi / 180
    }
    radToAng(ang) {
        return rad * 180 / nPi
    }
    rndRange(min,max) {
        return min + (max-min)*Math.random()
    }
    static rndAng() {
        return 6.283 * Math.random()
    }
    mapVal(v,vMin,vMax,oMin,oMax) {
        if(vMin===vMax) return oMin+0.5*(oMax-oMin)//can't map v
        let normalized = (v-vMin)/vMax
        return oMin+(oMax-oMin)*normalized
    }
    static clamp(v,min,max) {
        return Math.min(Math.max(v,min),max)
    }
    static lerp(n1,n2,t) {
        return n1 * (1-t) + n2 * t
    }
    static lerpAngle(a1,a2,t) {
        
        let full = 2 * Math.PI;
        a1 = this.normAngle(a1);
        a2 = this.normAngle(a2);

        let diffClockwise = (a2-a1 + 2 * Math.PI) % (2 * Math.PI);
        let diffCounter = diffClockwise - 2 * Math.PI;

        let finalDiff = Math.abs(diffClockwise) <= Math.abs(diffCounter)
            ? diffClockwise
            : diffCounter
        ;
        return a1 + finalDiff*t;
    }
    static normAngle(angle) {
        let full = 2 * Math.PI;
        return ((angle%full)+full)%full;
    }
}
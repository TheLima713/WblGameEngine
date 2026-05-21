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
}
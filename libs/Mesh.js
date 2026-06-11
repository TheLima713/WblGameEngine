import Color from "/libs/Color.js";
import V3 from "/libs/V3.js"
import WebGLRenderer from "/libs/WebGLRenderer.js";

export class Quad {
    indexes = [];
    params = {
        color: Color.white,
        textureName: 'none',
        UVStart: V3.zero,
        UVScale: V3.one,
        flip: null
    };
    /**
     * @param {Number[]} indexes 
     */
    constructor(
        indexes,
        params = {
            color: Color.white,
            textureName: 'none',
            UVStart: V3.zero,
            UVScale: V3.one,
            flip: null
        }
    ) {
        if(indexes.length!==4) {
            throw new Error(`Quad without 4 indexes.`);
        }
        this.indexes = indexes;
        this.params = params;
    }
}

export class F3 extends V3 {
    normal = V3.zero;
    srcPos = V3.zero;
    srcScl = V3.one;
    
    color = Color.white;
    textureName = 'none';

    //when creating Meshes, always follow clockwise order,
    //so the normals point the same way
    
    get i1() { return this.x; }
    get i2() { return this.y; }
    get i3() { return this.z; }
    set i1(v) { this.x = v; }
    set i2(v) { this.y = v; }
    set i3(v) { this.z = v; }

    constructor(i1,i2,i3,src,srcPos = V3.zero,srcScl = V3.one, color = Color.white, textureName = 'none'){
        super(i1,i2,i3);

        this.src = src;
        this.srcPos = srcPos;
        this.srcScl = srcScl;
        
        this.color = color;
        this.textureName = textureName;
    }
    getNormal(pts,normalize=false) {
        let v1 = pts[this.i1].sub(pts[this.i2])
        let v2 = pts[this.i3].sub(pts[this.i2])
        let out = v1.cross(v2)

        let m = out.mag()
        if(m==0) m=1

        this.normal = out
        if(normalize) return out.scale(1/m)

        return out
    }
}

export default class Mesh {
    /** @type {WebGLRenderer} */
    renderer
    /** @type {V3[]} */
    pts = []
    /** @type {F3[]} */
    faces = []
    
    /** @type {Quad[]} */
    quads = [];

    center = V3.zero
    up = V3.UP
    front = V3.FRONT
    vRot = V3.zero
    debugVecs = []
    followDist = 1

    color = Color.white;
    textureName = 'none';
    
    static genDebug(scl) {
        let debug = new Mesh(V3.zero)
        debug.addPt(V3.RIGHT.scale(scl))
        debug.addPt(V3.UP.scale(scl))
        debug.addPt(V3.FRONT.scale(scl))
        debug.addFace(new F3(0,1,2))
        debug.faces.forEach(f=>{
            f.normal = f.getNormal(debug.pts,true)
        })
        
        return debug
    }
    static genCube(renderer,center,l,src) {
        l/=2
        let cube = new Mesh(renderer,center)
        cube.addPt(new V3(-l,-l,-l))
        cube.addPt(new V3(l,-l,-l))
        cube.addPt(new V3(-l,l,-l))
        cube.addPt(new V3(-l,-l,l))
        cube.addPt(new V3(-l,l,l))
        cube.addPt(new V3(l,-l,l))
        cube.addPt(new V3(l,l,-l))
        cube.addPt(new V3(l,l,l))
        cube.pts.forEach((pt,idx)=>{cube.pts[idx] = pt.add(cube.center)})
        
        cube.addFace(new F3(1,0,2,src))
        cube.addFace(new F3(2,0,3,src))
        cube.addFace(new F3(3,0,1,src))
        cube.addFace(new F3(1,5,3,src,V3.zero,V3.one.scale(-1)))
        cube.addFace(new F3(2,6,1,src,V3.zero,V3.one.scale(-1)))
        cube.addFace(new F3(3,4,2,src,V3.zero,V3.one.scale(-1)))
        cube.addFace(new F3(4,3,5,src))
        cube.addFace(new F3(5,1,6,src))
        cube.addFace(new F3(6,2,4,src))
        cube.addFace(new F3(4,7,6,src,V3.zero,V3.one.scale(-1)))
        cube.addFace(new F3(5,7,4,src,V3.zero,V3.one.scale(-1)))
        cube.addFace(new F3(6,7,5,src,V3.zero,V3.one.scale(-1)))
        
        cube.faces.forEach(f=>{
            f.normal = f.getNormal(cube.pts,true)
        })
        
        return cube
    }
    static genCylinder(renderer,center,radius,height,src,LOD=16,wX=0,wY=0) {
        height = Math.abs(height)
        LOD = (LOD<=0?16:LOD)
        
        let wrapX = wX>0?wX:LOD
        let wrapY = wY>0?wY:1
        
        let cyl = new Mesh(renderer,center)
        let ci1 = 2*LOD
        let ci2 = 2*LOD+1
        //step the circumference by 1/LOD
        for(let r=0;r<LOD;r++){
            let ang = r*2*Math.PI/LOD
            let i1 = cyl.addPt( new V3(
                radius*Math.cos(ang),
                -height/2,
                radius*Math.sin(ang)
            ))
            let i2 = cyl.addPt( new V3(
                radius*Math.cos(ang),
                height/2,
                radius*Math.sin(ang)
            ))
            let i3 = (i1+2)%(2*LOD)//wrap after last point
            let i4 = (i2+2)%(2*LOD)//wrap after last point
            let iX = r%wrapX
            let iY = r%wrapY
            cyl.addFace(new F3(
                i3,i1,i2,
                src,
                new V3(iX/wrapX,iY/wrapY,0),
                new V3(1/wrapX,1/wrapY,0)
            ))
            cyl.addFace(new F3(
                i2,i4,i3,
                src,
                new V3((iX+1)/wrapX-1,(iY+1)/wrapY-1,0),
                new V3(-1/wrapX,-1/wrapY,0)
                //-wrapX+iX+1/wrapX = iX+1/wrapX-1
            ))
            cyl.addFace(new F3(ci1,i1,i3,src))
            cyl.addFace(new F3(ci2,i4,i2,src))
        }
        cyl.addPt(new V3(0,-height/2,0))
        cyl.addPt(new V3(0,height/2,0))
        
        cyl.pts.forEach((pt,idx)=>{cyl.pts[idx] = pt.add(cyl.center)})
        
        cyl.faces.forEach(f=>{
            f.normal = f.getNormal(cyl.pts,true)
        })
        return cyl
    }
    static genSphere(renderer,center,radius,src,LOD=16,wX=0,wY=0) {
        let sphere = new Mesh(renderer,center)
        let numPts = LOD*LOD
        
        let wrapX = wX>0?wX:LOD
        let wrapY = wY>0?wY:LOD
        
        for(let r=0; r<=LOD; r++) {
            let ang1 = r*Math.PI/LOD
            for(let n=0; n<LOD; n++) {
                let ang2 = n*2*Math.PI/LOD
                let iX = (n)%wrapX
                let iY = (r)%wrapY
                
                let i1 = sphere.addPt(new V3(
                    radius*Math.cos(ang2)*Math.sin(ang1),
                    radius*Math.cos(ang1),
                    radius*Math.sin(ang2)*Math.sin(ang1)
                ))
                let i2 =i1+1>numPts?numPts:i1+1
                let i3 =i1+LOD>numPts?numPts:i1+LOD
                let i4 =i1+LOD+1>numPts?numPts:i1+LOD+1
                if(n==LOD-1) {
                    i2-=LOD
                    i4-=LOD
                }
                if(n==LOD-1&&r==LOD) continue

                let UVScale = new V3(wrapX,wrapY).invert();
                let UVStart = UVScale.mult(new V3(iX,iY));

                sphere.addFace(new F3(
                    i3,i1,i2,
                    src,
                    UVStart,
                    UVScale
                ))
                sphere.addFace(new F3(
                    i2,i4,i3,
                    src,
                    UVStart.add(UVScale),
                    UVScale.scale(-1)
                ))

                sphere.quads.push(new Quad(
                    [i3,i1,i2,i4],
                    {
                        UVStart: UVStart,
                        UVScale: UVScale,
                        textureName: 'mimir'
                    }
                ));
            }
        }
        sphere.pts.forEach((pt,idx)=>{
            sphere.pts[idx] = pt.add(sphere.center)
        })
        sphere.faces.forEach(f=>{
            f.normal = f.getNormal(sphere.pts,true)
        })
        return sphere
    }
    static genBranch(root,r,h,dr,dh,a1,n,rc,src) {
        let out = []
        out.push(root)
        for(let i=0;i<n;i++) {
            let ang = 360*i/n
            let newC = root.center
            .add(root.up.scale(0.5*h))
            .add(root.up.scale(0.5*dh*h))
            let branch = genCylinder(newC,r*dr,h*dh,src+1,3)
            let rndPointTo = new V3(0,5-rc,0)
            rndPointTo = rndPointTo.sub(new V3(-0.5,-0.5,-0.5))
            //rndPointTo = rndPointTo.mult(new V3(5,rc/5,5-rc))
            rndPointTo = rndPointTo.mult(new V3(0,0,0))
            branch.pointTo(root.up.add(rndPointTo))    
            let rndAng1 = 0*.2*(Math.random()-0.5)
            let rndAng2 = 0*.2*(Math.random()-0.5)
            branch.relRot(a1+rndAng1,root.front,branch.up.scale(dh*h*0.5))
            branch.relRot(ang+rndAng2,root.up,branch.up.scale(dh*h*0.5))
            let rootTop = root.center.add(root.up.scale(0.5*h))
            let branchBot = branch.center.add(branch.up.scale(-0.5*dh*h))
            let diff = rootTop.sub(branchBot)
            branch.move(diff)
            if(rc!==0) {
            let branches = genBranch(branch,dr*r,dh*h,dr,dh,a1,n,rc-1,src+1)
            branches.forEach(b=>out.push(b))
            }
            else {
            out.push(branch)
            }
        }
        return out
    }
    static genBranchTec(root = 0,LOD = 3, r,h,a1,a2,n,rc,src,vo) {
        
        if(root===0) {
            root = genCylinder(
            new V3(0,0,500),
            r(rc+1,0,n),
            h(rc+1,0,n),
            src(rc+1,0),
            LOD
            )
            root.rc = rc
            root.i = 0
        }
        
        let out = []
        out.push(root)
        for(let i=0;i<n(rc,root.i);i++) {
            let oldN = n(rc+1,root.i)
            let oldH = h(rc+1,root.i,n)
            let oldA1 = a1(rc+1,root.i,n)
            let oldA2 = a2(rc+1,root.i,n)
            
            let rndN = 0*rndRange(-15,15)
            let rndH = 0*rndRange(-15,15)
            let rndA1 = rndRange(-15,15)
            let rndA2 = rndRange(-15,15)
            
            let modN = (rc,i)=>{return n(rc,i)+rndN}
            let modH = (rc,i)=>{return h(rc,i,n)+rndH}
            let modA1 = (rc,i,n_)=>{return a1(rc,i,n_)+rndA1}
            let modA2 = (rc,i,n_)=>{return a2(rc,i,n_)+rndA2}
            
            let newN = modN(rc,i)
            let newH = modH(rc,i,n)
            let newA1 = modA1(rc,i,n)
            let newA2 = modA2(rc,i,n)
            let newR = r(rc,i,n)
            
            
            let newC = root.center
            .add(root.up.scale(0.5*oldH))
            .add(root.up.scale(0.5*newH))
            let branch = genCylinder(newC,newR,newH,src(rc,i),LOD)
            
            branch.rc = rc
            branch.i = i
            
            branch.pointTo(root.up.add(vo(rc,i)))
            branch.faceTo(root.front)
            
            branch.relRot(newA1,root.front,branch.up.scale(0.5*newH))
            
            branch.relRot(newA2,root.up,branch.up.scale(0.5*newH))
            
            
            let rootTop = root.center.add(root.up.scale(0.5*oldH))
            let branchBot = branch.center.add(branch.up.scale(-0.5*newH))
            let diff = rootTop.sub(branchBot)
            branch.move(diff)
            
            if(rc>0) {
            let branches = genBranchTec(branch,LOD,r,modH,modA1,modA2,modN,rc-1,src,vo)
            branches.forEach(b=>out.push(b))
            }
            else {
            out.push(branch)
            }
        }
        return out
    }
    static genRingPoints(renderer,center,radius,src,LOD=16,wX=0,wY=0) {
        LOD = (LOD<=0?16:LOD)
        
        let wrapX = wX>0?wX:LOD
        let wrapY = wY>0?wY:1
        
        let ring = new Mesh(renderer,center)
        ring.normal = new V3(0,1,0)
        //step the circumference by 1/LOD
        for(let r=0;r<LOD;r++){
            let ang = r*2*Math.PI/LOD
            let i1 = ring.addPt( new V3(
            radius*Math.cos(ang),
            0,
            radius*Math.sin(ang)
            ))
        }
        
        ring.pts.forEach((pt,idx)=>{
            ring.pts[idx] = pt.add(ring.center)
        })
        
        return ring
    }
    constructor(renderer,c,u=new V3(0,1,0),f=new V3(0,0,1)){
        this.renderer = renderer;
        this.center = c;
        this.up = u;
        this.front = f;
    }
    addPt(pt) {
        this.pts.push(pt)
        return this.pts.length-1
    }
    addFace(f) {
        this.faces.push(f)
        return this.faces.length-1
    }
    mergeMesh(m) {
        return
        m.pts.forEach(p=>this.pts.push(p))
        m.faces.forEach(f=>{
            let newf = f
            newf.i1 = f.i1 + (this.pts.length)
            newf.i2 = f.i2 + (this.pts.length)
            newf.i3 = f.i3 + (this.pts.length)
            this.faces.push(newf)
        })
    }
    move(off){
        this.center = this.center.add(off)
        this.pts.forEach((pt,idx)=>this.pts[idx]=pt.add(off))
    }
    rot(ang,axis,off = new V3(0,0,0)){
        /*
        \    _
            \.-'
        for a certain (x,y) and 90 degree: (-y,x)
            sin cos
        0    0   1
        90   1   0
        180  0  -1
        (x,y)->(x*cos-y*sin,y*cos+x*sin)
        */
        this.pts.forEach((pt,idx)=>{
            this.pts[idx] = pt.rot(ang,axis,this.center.sub(off))
        })
        this.center = this.center.rot(ang,axis,this.center.sub(off))
        this.up = this.up.rot(ang,axis)
        this.front = this.front.rot(ang,axis)
    }
    relRot(ang,normAxis = new V3(0,0,0), posOff = new V3(0,0,0)){
        if(normAxis.mag()==0) return
        /*
        \    _
            \.-'
        for a certain (x,y) and 90 degree: (-y,x)
            sin cos
        0    0   1
        90   1   0
        180  0  -1
        (x,y)->(x*cos-y*sin,y*cos+x*sin)
        */
        this.pts.forEach((pt,idx)=>{
            this.pts[idx] = pt.relRot(ang,normAxis,this.center.sub(posOff))
        })
        this.center = this.center.relRot(ang,normAxis,this.center.sub(posOff))
        this.up = this.up.relRot(ang,normAxis)
        this.front = this.front.relRot(ang,normAxis)
    }
    pointTo(v) {
        let cross = this.up.normalized().cross(v.normalized())
        let ang = this.up.angFromVec(v)
        this.relRot(ang,cross)
    }
    faceTo(v) {
        let cross = this.front.normalized().cross(v.normalized())
        let ang = this.up.angFromVec(v)
        this.relRot(ang,cross)
    }
    scale(v){
        this.pts.forEach((pt,idx)=>{
            this.pts[idx] = pt.sub(this.center).mult(v).add(this.center)
        })
    }
    drawBaryTri(f,cam=camera) {
        let p1 = this.camProj(this.pts[f.i1],cam)
        let p2 = this.camProj(this.pts[f.i2],cam)
        let p3 = this.camProj(this.pts[f.i3],cam)
        
        drawLine(this.pts[f.i1],this.pts[f.i2],'#f42')
        drawLine(this.pts[f.i2],this.pts[f.i3],'#f42')
        drawLine(this.pts[f.i3],this.pts[f.i1],'#f42')
        
        let v1 = p1.sub(p2)
        let v2 = p3.sub(p2)
        
        if(v1==0) {
        drawLine(p3,p2,'#fff',cam)
        return
        }
        if(v2==0) {
        drawLine(p1,p2,'#fff',cam)
        return
        }
        
        let detT = (p2.y-p3.y)*(p1.x-p3.x)+(p3.x-p2.x)*(p1.y-p3.y)
        
        let minY = Math.min(0,v1.y,v2.y,v1.y+v2.y)
        let maxY = Math.max(0,v1.y,v2.y,v1.y+v2.y)
        let minX = Math.min(0,v1.x,v2.x,v1.x+v2.x)
        let maxX = Math.max(0,v1.x,v2.x,v1.x+v2.x)
    
        for(let y=minY;y<maxY;y++) {
        for(let x=minX;x<maxX;x++) {
            let a = 1
            let l1 = ((p2.y-p3.y)*(x-p3.x)+(p3.x-p2.x)*(y-p3.y))/detT
            let l2 = ((p3.y-p1.y)*(x-p3.x)+(p1.x-p3.x)*(y-p3.y))/detT
            let l3 = 1-l1-l2
        }
        }
    }
    drawProjTri(f,cam=camera) {
        let p1 = this.pts[f.i1]
        let p2 = this.pts[f.i2]
        let p3 = this.pts[f.i3]
        
        let v1 = p1.sub(p2)
        let v2 = p3.sub(p2)
        
        if(v1==0) {
            drawLine(p3,p2,'#fff',cam)
            return
        }
        if(v2==0) {
            drawLine(p1,p2,'#fff',cam)
            return
        }

        let m1 = v1//this.camProj(v1,cam)
        let m2 = v2//this.camProj(v2,cam)
        let step1 = .01//1/mag(m1)/2
        let step2 = .01//1/mag(m2)/2
        
        let srcH = f.src.height
        let srcW = f.src.width
        for(let d1=0;d1<1;d1+=step1) {
            for(let d2=0;d2<1-d1;d2+=step2) {
                let srcX1 = srcW*(d1*f.srcScl.x+f.srcPos.x)//scale
                srcX1 = Math.floor(srcX1)//round
                srcX1 = (srcW+srcX1)%srcW//wrap
                
                let srcY1 = srcH*(d2*f.srcScl.y+f.srcPos.y)//scale
                srcY1 = Math.floor(srcY1)//round
                srcY1 = (srcH+srcY1)%srcH//wrap
                
                let pt = p2.add(v1.scale(d1)).add(v2.scale(d2))
                if(pt.z<cam.z) continue
                pt = this.camProj(pt,cam)
                pt.x = Math.floor(pt.x)
                pt.y = Math.floor(pt.y)
                pt.z = Math.floor(pt.z)
                ctx.drawImage(
                f.src,
                srcX1,srcY1,1,1,
                pt.x,pt.y,1,1
                )
            }
        }
    }
    /*code for 'increasing' texture quality (blur stuff)
        let srcX2 = Math.ceil(srcW*d1)
        let srcY2 = Math.ceil(srcH*d2)
        let t1 = (srcW*d1)%1
        let t2 = (srcH*d2)%1
        if(altTri) {
        srcX2 = srcW-1-srcX2
        srcY2 = srcH-1-srcY2
        }
        srcX2 = (srcW+srcX2)%srcW
        srcY2 = (srcH+srcY2)%srcH
        let colIdx1 = src[srcY1][srcX1]
        let colIdx2 = src[srcY1][srcX2]
        let colIdx3 = src[srcY2][srcX1]
        let colIdx4 = src[srcY2][srcX2]
        let col1 = cols[colIdx1].lerp(cols[colIdx2],t1)
        let col2 = cols[colIdx3].lerp(cols[colIdx4],t1)
        let col = col1.lerp(col2,t2)
    */
    
    /**
     * 
     * @param {V3} cam 
     */
    draw(cam){
        this.faces.forEach((face,idx)=>{
            //update normal
            
            let p1 = this.pts[face.i1]
            let p2 = this.pts[face.i2]
            let p3 = this.pts[face.i3]

            face.normal = face.getNormal(this.pts,true)
            let avg = p1.add(p2).add(p3).scale(1/3)
            if(avg.z<cam.z) return;

            let dp = (face.normal).dot(avg.sub(cam))
            if(dp<=0) return;
            
            this.renderer.fillTriangle(
                this.camProj(p1,cam),
                this.camProj(p2,cam),
                this.camProj(p3,cam),
                {
                    color: face.color,
                    textureName: face.textureName,
                    UVStart: face.srcPos,
                    UVScale: face.srcScl,
                    normals: [face.normal,face.normal,face.normal,face.normal]
                }
            );
        })
        //return;
        this.quads.forEach((quad)=>{
            let pts = this.getPoints(quad.indexes);
            let avgPt = pts.reduce((prev,curr)=>{return prev.add(curr)}).scale(1/4);
            
            let normals = this.getQuadNormals(quad);
            //let normals = pts.map((pt)=>{return pt.sub(cam).normalized()});
            let avgNormal = normals.reduce((prev,curr)=>{return prev.add(curr)}).normalized();
            
            quad.pts = pts;
            quad.params.normals = normals;

            let camDir = avgPt.sub(cam);
            let projDiff = avgNormal.dot(camDir);
            if(projDiff <= 0) return;

            let projPts = pts.map(pt=>this.camProj(pt,cam));
            this.renderer.pushQuadToBuffer(...projPts,'quad',quad.params);
        })
    }
    drawPoints(cam) {
        this.pts.forEach((pt,idx)=>{
            //if(idx > 10) return;
            if(pt.z<cam.z) return

            let maxDist = 10**4
            let distShade = 0

            if(pt.z<=maxDist) distShade = 1-(pt.z/maxDist)

            let maxSize = 3
            let pointSize = maxSize * distShade
            
            let projPt = this.camProj(pt,cam)
            this.renderer.fillCircle(projPt,pointSize,{color: Color.HSLToRGB(360 * (idx / 8),0.75,0.5)});
        })
        let debug = true
        if(debug) {
            let projCenter = this.camProj(this.center,cam)
            this.renderer.fillCircle(projCenter,5,{color: Color.white});
        }
    }
    drawDebugVecs(cam) {
        this.debugVecs.forEach((vec,index)=>{
            let c1 = this.camProj(this.center,cam)
            let p1 = this.camProj(this.center.add(vec),cam)
            
            let lerpIdx = index / this.debugVecs.length
            let lerpColor = Color.red.lerp(Color.green,lerpIdx)
            
            this.renderer.fillLine(c1,p1,{color: lerpColor})
        })
    }
    dist(Mesh) {
        return this.center.sub(Mesh.center).mag()
    }
    follow(Mesh,strength = 1, minDist = this.followDist, maxAng = Math.PI * 2, debug = false) {
        let dir = Mesh.center.sub(this.center)
        
        if(dir.mag()>minDist) {
            //Scale and merge new direction with current direction
            let moveScale = dir.mag() - minDist
            let scaledDir = dir.normalized().scale(moveScale)
            let newUp = this.up.lerp(scaledDir,strength)
            
            this.pointTo(newUp)
            this.move(newUp)
            
            let newFront = this.front.lerp(Mesh.front,strength)
            this.debugVecs[0] = this.front
            this.debugVecs[1] = newFront
            this.debugVecs[2] = Mesh.front
            this.debugVecs[3] = this.up
            //this.faceTo(newFront)/**/
        }
    }
    camProj(point,cam) {
        /*
        CX,CZ
        OX,OZ
        PX,PZ

        PX-CX/PZ+CZ = OX/CZ;
        OX = CZ * (PX-CX/PZ+CZ);
        OY = CZ * (PY-CY/PZ+CZ);
        */
    
        let diff = point.sub(cam);
        let projected = diff.scale(-cam.z/diff.z);

        let originOffset = this.renderer.size.scale(0.5);

        return originOffset.add(projected.mult(new V3(1,-1,1)))
    }
    /**
     * @param {Number[]} indexes 
     * @returns {V3[]}
     */
    getPoints(indexes) {
        return indexes.map(i=>this.pts[i]);
    }
    /**
     * @param {Number[]} indexes 
     * @returns {V3[]}
     */
    getPointNormals(indexes) {
        return indexes.map((i)=>{
            //subtracting this the inverted way, so that normals pointing to the camera (-Z) return >0 and so on
            return this.center.sub(this.pts[i]).normalized();
        });
    }
    /**
     * @param {Quad} quad 
     * @returns {V3[]}
     */
    getQuadNormals(quad) {
        let [p1,p2,p3,p4] = this.getPoints(quad.indexes);
        let n1 = V3.getNormal(p2,p1,p4);
        let n2 = V3.getNormal(p3,p2,p1);
        let n3 = V3.getNormal(p4,p3,p2);
        let n4 = V3.getNormal(p1,p4,p3);
        return [n1,n2,n3,n4];
    }
}
export class TrailObject {
    /** @type {WebGLRenderer} */
    renderer

    center = new V3(0,0,0)
    height = 100
    LOD = 16
    pointLayers = []
    fullMesh = null
    src = [127,192,255]
    dir = new V3(0,0,0)
    minFollowDist = 50
    target = new Mesh(new V3(0,0,0))
    constructor(renderer) {
        this.renderer = renderer;
    }
    genMesh(center,height,fnLOD,radiusFn, followStrFn, getNextDirFn,LOD=16,src = this.src,wX=0,wY=0) {
        this.center = center
        this.src = src
        this.height = height
        this.LOD = (LOD<=0?16:LOD)
        this.dir = new V3(0,1,0)

        this.pointLayers = []
        let wrapX = wX>0?wX:this.LOD
        let wrapY = wY>0?wY:1
    
        this.fullMesh = new Mesh(this.renderer,center)
        this.fullMesh.up = new V3(0,0,1)
        this.fullMesh.front = new V3(0,1,0)
        this.target = new Mesh(this.renderer,center.add(new V3(0,height/2,0)))

        let heightStep = height/fnLOD
        for(let i = 0; i<fnLOD;i++) {
            let fnIndex = i/fnLOD
            let radius = radiusFn(fnIndex)
            let lerpHeight = (height/2) - fnIndex * height
            let ring = Mesh.genRingPoints(
                this.renderer,
                new V3(0,lerpHeight,0),
                radius,
                src,
                this.LOD,
                wX,
                wY
            )
            let sphere = Mesh.genSphere(
                this.renderer,
                new V3(0,lerpHeight,0),
                radius,
                src,
                this.LOD,
                wX,
                wY
            )
            ring.move(center)
            ring.followDist = heightStep * (1 + 0.5 * (i/fnLOD))
            this.pointLayers.push(ring)
        }
        let ringEnd = Mesh.genRingPoints(
            this.renderer,
            new V3(0,height,0),
            1,
            src,
            this.LOD,
            wX,
            wY
        )
        ringEnd.move(center)
        ringEnd.followDist = 1
        this.pointLayers.push(ringEnd)
        
        this.pointLayers.forEach((layer,index)=>{
            layer.rot(90,'Y')
        })
        this.remeshFromLayers()
    }
    remeshFromLayers() {
        let avgCenter = new V3(0,0,0)
        this.pointLayers.forEach((layer)=>{avgCenter = avgCenter.add(layer.center)})
        avgCenter = avgCenter.scale(1/this.pointLayers.length)
        this.fullMesh.center = avgCenter
        this.center = avgCenter
        
        this.fullMesh.pts = []
        this.fullMesh.faces = []
        this.fullMesh.src = this.src
        this.pointLayers.forEach((layer,index)=>{
            layer.pts.forEach((pt,idx)=>{this.fullMesh.addPt(pt)})
        })
        let layerCount = this.pointLayers.length
        let pointCount = this.LOD
        for(let l=0;l<layerCount-1;l++) {
            for(let p=0;p<pointCount;p++) {
                //Derive indexes for tris
                let tl = (pointCount * l) + p//self
                let tr = (pointCount * l) + (p + 1) % pointCount//layer neighbor
                let bl = (pointCount * (l+1)) + p;
                let br = (pointCount * (l+1)) + (p + 1) % pointCount//layer neighbor
                
                let UVScale = new V3(pointCount,layerCount).invert();
                let UVStart = UVScale.mult(new V3(p,l));

                let f1 = new F3(
                    bl,tl,tr,
                    this.src,
                    UVStart,
                    UVScale
                )
                let f2 = new F3(
                    tr,br,bl,
                    this.src,
                    UVStart.add(UVScale),
                    UVScale.scale(-1)
                )
                this.fullMesh.addFace(f1)
                this.fullMesh.addFace(f2)
            }
        }
    }
    run(delta) {
        let minFollowDist = 20
        let maxAng = Math.PI
        let head = this.pointLayers[0]
        let right = head.up.cross(head.front)
        let waveScale = 50
        let off = head.front.add(head.up.scale(waveScale)).scale(1/waveScale)
        let globalPos = this.target.center.add(off)
        let finalTarget = globalPos.lerp(this.center,0.001).sub(this.target.center)
        this.target.move(finalTarget)
        
        head.follow(this.target, 0.2)
        
        let layerCount = this.pointLayers.length
        for(let l=0;l<layerCount-1;l++) {
            this.pointLayers[l+1].follow(
                this.pointLayers[l],
                0.2
            )
        }
        this.remeshFromLayers()
    }
    draw(camera) {
        this.fullMesh.draw(camera)
    }
    drawPoints(camera) {
        this.fullMesh.drawPoints(camera)
        this.pointLayers.forEach((layer,index)=>{layer.drawPoints(camera)})
        this.target.drawPoints(camera)
    }
    drawDebugVecs(camera) {
        this.pointLayers.forEach((layer,index)=>{
            layer.drawDebugVecs(camera)
        })
    }
    move(off) {
        this.center = this.center.add(off)
        this.target.move(off)
        this.pointLayers.forEach((layer,index)=>{
            layer.move(off)
        })
        this.remeshFromLayers()
    }
    rot(ang,axis,off = new V3(0,0,0)) {
        this.center = this.center.rot(ang,axis,off)
        this.target.rot(ang,axis,this.target.center.sub(off))
        this.pointLayers.forEach((layer,index)=>{
            layer.rot(ang,axis,layer.center.sub(off))
        })
        this.remeshFromLayers()
    }
}
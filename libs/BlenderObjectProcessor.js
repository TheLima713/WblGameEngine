import Color from "./Color.js";
import Mesh, { F3, Quad } from "./Mesh.js";
import V3 from "./V3.js";
import WebGLRenderer from "./WebGLRenderer.js";

export default class BlenderObjectProcessor {
    /** @type {WebGLRenderer} */
    renderer;
    /**
     * 
     * @param {WebGLRenderer} renderer 
     */
    constructor(renderer) {
        this.renderer = renderer;
    }
    async translateObjFileToMesh(path) {
        let response = await fetch('/data/objs/bee.obj');
        let data = await response.text();
        let lines = data.split('\n');
        console.log(lines)

        let vertices = lines.filter(line=>line.startsWith('v '));
        let uvs = lines.filter(line=>line.startsWith('vt '));
        let normals = lines.filter(line=>line.startsWith('vn '));
        let faces = lines.filter(line=>line.startsWith('f '));

        console.log(`Found ${vertices.length} vertices, first line: \n${vertices[0]}`);
        console.log(`Found ${uvs.length} uvs, first line: \n${uvs[0]}`);
        console.log(`Found ${normals.length} normals, first line: \n${normals[0]}`);
        console.log(`Found ${faces.length} faces, first line: \n${faces[0]}`);

        let mesh = new Mesh(this.renderer,new V3(0,0,0));
        mesh.addPt(new V3(0,0,0));

        vertices.forEach((line,index)=>{
            let values = line.split(' ');
            let point = new V3(
                parseFloat(values[1]),
                parseFloat(values[2]),
                parseFloat(values[3])
            );

            mesh.addPt(point);
        })

        faces.forEach((line,index)=>{

            let indexes = line.replace('f ','').split(' ');
            let values = indexes.map(index=>index.split('/'));
            let normal = normals[index] || V3.zero;

            if(values.length<4) values[3] = values[2];

            let quad = new Quad(
                [
                    parseInt(values[0][0]),
                    parseInt(values[1][0]),
                    parseInt(values[2][0]),
                    parseInt(values[3][0])
                ],
                {
                    UVStart: V3.zero,
                    UVScale: V3.one,
                    color: Color.white,//Color.HSLToRGB(0.1 * 360 * index,0.75,0.5),
                    textureName: 'none',
                    normals: [normal,normal,normal,normal]
                }
            )
            mesh.quads.push(quad)
        })

        response = await fetch('/data/objs/bee.mtl');
        data = await response.text();
        console.log(data)

        return mesh;
    }
}
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
    async getColorFromMaterial(path) {
        let response = await fetch(`${path}.mtl`);
        if(!response.ok) {
            console.log(`${path}.mtl not found`);
            return {
                default: {
                    kd: Color.white,
                    d: 1
                }
            };
        }

        let data = await response.text();
        let lines = data.split('\n');

        let materials = {};
        let newColorKey = '';

        lines.forEach((line)=>{
            if(line.startsWith('newmtl ')) {
                newColorKey = line.replace('newmtl ','');
                materials[newColorKey] = {};
            }
            if(line.startsWith('Kd ')) {
                let values = line.split(' ');
                let color = new Color(
                    parseFloat(values[1]),
                    parseFloat(values[2]),
                    parseFloat(values[3])
                )
                materials[newColorKey].kd = color;
            }
            if(line.startsWith('d ')) {
                let opacity = line.split(' ')[1];
                materials[newColorKey].d = parseFloat(opacity);
            }
        })

        return materials;
    }
    async translateObjFileToMesh(path) {
        let materials = await this.getColorFromMaterial(path);

        let response = await fetch(`${path}.obj`);
        
        if(!response.ok) {
            console.log(`${path}.obj not found`);
            return null;
        }

        let data = await response.text();
        let lines = data.split('\n');

        let verticeLines = lines.filter(line=>line.startsWith('v '));
        let uvLines = lines.filter(line=>line.startsWith('vt '));
        let normalLines = lines.filter(line=>line.startsWith('vn '));
        let faceLines = lines.filter(line=>line.startsWith('f ') || line.startsWith('usemtl '));

        let mesh = new Mesh(this.renderer,new V3(0,0,0));
        mesh.addPt(new V3(0,0,0));

        verticeLines.forEach((line,index)=>{
            let values = line.split(' ');
            let point = new V3(
                parseFloat(values[1]),
                parseFloat(values[2]),
                parseFloat(values[3])
            );

            mesh.addPt(point);
        })

        let currMaterialKey = 'default';
        let currColor = Color.white;
        faceLines.forEach((line,index)=>{
            if(line.startsWith('usemtl ')) {
                let newKey = line.replace('usemtl ','');
                if(!Object.keys(materials).includes(newKey)) {
                    console.log(`Material data not found for key '${newKey}'`);
                    return;
                }
                currMaterialKey = newKey;

                let alpha = materials[currMaterialKey].d;
                currColor = materials[currMaterialKey].kd.setAlpha(alpha);
                return;
            }
            if(line.startsWith('f ')) {
                let indexes = line.replace('f ','').split(' ');
                let values = indexes.map(index=>index.split('/'));
                let normal = normalLines[index] || V3.zero;

                if(values.length!==4) {
                    values[3] = values[2];
                }

                let quad = new Quad(
                    [
                        parseInt(values[0][0]),
                        parseInt(values[1][0]),
                        parseInt(values[2][0]),
                        parseInt(values[3][0])
                    ],
                    {
                        uvLinestart: V3.zero,
                        uvLinescale: V3.one,
                        color: currColor,
                        textureName: 'none',
                        normalLines: [normal,normal,normal,normal]
                    }
                )
                mesh.quads.push(quad)
                return;
            }
        })
        return mesh;
    }
}
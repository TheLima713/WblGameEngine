import Color from "./Color.js";
import Mesh, { F3, Quad } from "./Mesh.js";
import V3 from "./V3.js";
import WebGLRenderer, { Texture } from "./WebGLRenderer.js";

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
        let lines = data.replaceAll('\t','').replaceAll('\r','').split('\n');

        let materials = {};
        let newColorKey = '';

        lines.forEach(async (line)=>{
            if(line.startsWith('newmtl ')) {
                newColorKey = line.replace('newmtl ','');
                materials[newColorKey] = {
                    mapKa: 'none',
                    mapKd: 'none'
                };
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
            if(line.startsWith('map_Ka ')) {
                let filename = line.split(' ')[1];
                await this.renderer.pushImageToArray(`${path}/${filename}`,filename);
                materials[newColorKey].mapKa = filename;
            }
            if(line.startsWith('map_Kd ')) {
                let filename = line.split(' ')[1];
                await this.renderer.pushImageToArray(`${path}/${filename}`,filename);
                materials[newColorKey].mapKd = filename;
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
        let lines = data.replaceAll('\t','').replaceAll('\r','').replaceAll('  ',' ').split('\n');

        let verticeLines = lines.filter(line=>line.startsWith('v '));
        let uvLines = lines.filter(line=>line.startsWith('vt '));
        let normalLines = lines.filter(line=>line.startsWith('vn '));
        let faceLines = lines.filter(line=>line.startsWith('f ') || line.startsWith('usemtl '));

        let mesh = new Mesh(this.renderer,new V3(0,0,0));
        mesh.addPt(new V3(0,0,0));

        // Load Points

        verticeLines.forEach((line,index)=>{
            let values = line.split(' ');
            let point = new V3(
                parseFloat(values[1]),
                parseFloat(values[2]),
                parseFloat(values[3])
            );
            mesh.addPt(point);
        })

        // Load Texture with UV Points

        let uvCoords = [V3.zero];
        uvLines.forEach((line,index)=>{
            let values = line.split(' ');
            uvCoords.push(new V3(
                parseFloat(values[1]),
                parseFloat(values[2])
            ));
        });

        // Load Faces

        let currMaterialKey = 'default';

        let currMaterial = {
            d: 1,
            kd: Color.white,
            mapKd: 'none',
            mapKa: 'none'
        };
        faceLines.forEach((line,index)=>{
            if(line.startsWith('usemtl ')) {
                let newKey = line.replace('usemtl ','');
                if(!Object.keys(materials).includes(newKey)) {
                    console.log(`Material data not found for key '${newKey}'`);
                    return;
                }
                //currMaterialKey = newKey;
                currMaterial = materials[newKey];
                return;
            }
            if(line.startsWith('f ')) {
                let indexes = line.replace('f ','').split(' ');
                let values = indexes.map(index=>index.split('/'));

                let normal = V3.FRONT;
                if(normalLines[index]) {
                    let normalValues = normalLines[index].split(' ');
                    normal = new V3(
                        parseFloat(normalValues[1]),
                        parseFloat(normalValues[2]),
                        parseFloat(normalValues[3])
                    );
                }

                if(values.length<4) {
                    values[3] = values[2];
                }

                let uvIndexes = [
                    parseInt(values[0][1]),
                    parseInt(values[1][1]),
                    parseInt(values[2][1]),
                    parseInt(values[3][1])
                ];
                let uvPoints = uvIndexes.map(idx=>uvCoords[idx]);
                
                let uvStart = uvPoints[0];
                let uvScale = uvPoints[1]
                    .sub(uvPoints[0])
                    .add(
                        uvPoints[2]
                        .sub(uvPoints[0])
                    )
                ;

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
                        color: currMaterial.kd.setAlpha(currMaterial.d),
                        textureName: currMaterial.mapKd,
                        normals: [normal,normal,normal,normal],
                        uvs: uvPoints
                    }
                )
                mesh.quads.push(quad)
                return;
            }
        })

        console.log(mesh);

        return mesh;
    }
}
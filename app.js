/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import SimpleMeshRendering from "./examples/3D Rendering/SimpleMeshRendering.js";

let meshProg = new SimpleMeshRendering();
await meshProg.load()

setInterval(() => {
    meshProg.run();
    meshProg.draw();
}, 1000/60);
// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor
// - Peixes movendo distorcendo por Perlin
// - Sombra dinamica com normal map
// - Reflexo dagua
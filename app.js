/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import MovingTextureApp from "./examples/Image Processing/MovingTextureApp.js";

let prog = new MovingTextureApp();
await prog.load()
prog.loop()

// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor
// - Peixes movendo distorcendo por Perlin
// - Sombra dinamica com normal map
// - Reflexo dagua
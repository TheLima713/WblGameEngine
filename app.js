/*
resources i need to gamedev:
libs/manager objs:
- &audio
- >Scene
*/

import EffectApplier from "./examples/EffectApplier.js";


let prog = new EffectApplier();
await prog.load()
await prog.loop()

// Persio Quests:
// - Shader pra recortar um layer da mesh 3d e mostrar o 'interior'
// - Tesselation
// - Shader node editor
// - Peixes movendo distorcendo por Perlin
// - Sombra dinamica com normal map
// - Reflexo dagua
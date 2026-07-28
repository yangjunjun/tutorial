# 材质体系与 PBR / Material System & PBR

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 3–4 小时 / 3–4 hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

材质决定了几何体"长什么样"——颜色、光泽、透明、发光、纹理映射方式。Three.js 提供了一条从最简单到最复杂的材质阶梯：`MeshBasicMaterial`（不受光）→ `MeshLambertMaterial`（漫反射）→ `MeshPhongMaterial`（高光）→ `MeshStandardMaterial`（PBR）→ `MeshPhysicalMaterial`（高级 PBR）→ `ShaderMaterial`（自定义）→ `NodeMaterial`/TSL（节点化）。

Material determines how geometry "looks"—color, gloss, transparency, emission, texture mapping. Three.js offers a ladder from simplest to most complex: `MeshBasicMaterial` (unlit) → `MeshLambertMaterial` (diffuse) → `MeshPhongMaterial` (specular) → `MeshStandardMaterial` (PBR) → `MeshPhysicalMaterial` (advanced PBR) → `ShaderMaterial` (custom) → `NodeMaterial`/TSL (node-based).

本节重点讲解 PBR 材质参数、颜色空间、色调映射，并搭建一个可实时调整金属度/粗糙度/曝光/色调映射的"材质实验室"。

This lesson focuses on PBR parameters, color space, and tone mapping, and builds a "material lab" with live metalness/roughness/exposure/tone-mapping controls.

## 核心概念 / Core Concepts

### 1. 材质阶梯 / The Material Ladder

```text
MeshBasicMaterial      不受光照，纯色/贴图 / unlit, solid color or texture
    ↓
MeshLambertMaterial    漫反射，无高光 / diffuse, no specular (fastest lit)
    ↓
MeshPhongMaterial      漫反射 + Blinn-Phong 高光 / diffuse + Blinn-Phong specular
    ↓
MeshStandardMaterial   PBR：metalness + roughness / PBR with metalness & roughness
    ↓
MeshPhysicalMaterial   PBR + clearcoat/sheen/iridescence/transmission / extended PBR
    ↓
ShaderMaterial         自定义 GLSL / custom GLSL shaders
    ↓
NodeMaterial / TSL     节点化着色器（Three.js 未来方向）/ node-based shaders (future)
```

```js
// 最简单的材质 / simplest material
const basic = new THREE.MeshBasicMaterial({ color: 0x44aaff });

// PBR 标准材质 / standard PBR
const std = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.5,      // 0=电介质(塑料) 1=金属 / 0=dielectric 1=metal
  roughness: 0.3,      // 0=镜面 1=完全粗糙 / 0=mirror 1=fully rough
});
```

### 2. PBR 核心参数 / Core PBR Parameters

| 参数 / Param | 范围 / Range | 作用 / Effect |
| --- | --- | --- |
| `metalness` | 0–1 | 金属度：0=非金属（塑料/木头），1=金属。决定反射颜色是否染色。/ 0=dielectric, 1=metal |
| `roughness` | 0–1 | 粗糙度：0=镜面反射，1=完全漫反射。控制高光大小与锐度。/ 0=mirror, 1=diffuse |
| `envMapIntensity` | 0–∞ | 环境贴图强度，影响反射亮度。/ env reflection strength |
| `normalMap` | texture | 法线贴图，用纹理模拟表面凹凸细节。/ simulate surface detail |
| `normalScale` | Vector2 | 法线贴图强度。/ normal map intensity |
| `emissive` | Color | 自发光颜色（不受光照影响）。/ self-illumination color |
| `emissiveIntensity` | 0–∞ | 自发光强度。/ emissive strength |
| `aoMap` | texture | 环境遮蔽贴图。/ ambient occlusion |
| `map` | texture | 漫反射/反照率贴图。/ albedo / diffuse map |

```js
const mat = new THREE.MeshStandardMaterial({
  map: albedoTex,           // 基础色 / base color
  normalMap: normalTex,     // 法线细节 / surface detail
  normalScale: new THREE.Vector2(1, 1),
  roughnessMap: roughTex,   // 粗糙度图 / per-pixel roughness
  metalnessMap: metalTex,   // 金属度图 / per-pixel metalness
  emissive: 0xff3300,       // 发光 / glow
  emissiveIntensity: 0.5,
  envMapIntensity: 1.0,
});
```

### 3. 颜色空间 / Color Space

Three.js r152+ 把颜色空间从 `encoding` 改成了 `colorSpace`。关键规则：

Three.js r152+ renamed `encoding` to `colorSpace`. Key rules:

```js
// 颜色贴图（albedo / diffuse）用 SRGB / color textures use SRGB
texture.colorSpace = THREE.SRGBColorSpace;

// 数据贴图（normal / roughness / metalness / AO）用 Linear / data textures use Linear
normalTex.colorSpace = THREE.LinearSRGBColorSpace; // 默认就是 Linear

// 渲染器输出空间 / renderer output space
renderer.outputColorSpace = THREE.SRGBColorSpace; // 默认值，正确

// 颜色值 / color values
new THREE.Color(0xff8800);  // 默认按 SRGB 解释 → 内部转线性 / interpreted as sRGB → converted to linear
```

> **核心原理 / Core principle**：所有光照计算在线性空间进行，最终输出时转回 sRGB 给显示器。贴图的 `colorSpace` 告诉 Three.js 怎么把它转成线性。/ All lighting math happens in linear space; output is converted back to sRGB for the display. `colorSpace` tells Three.js how to convert textures to linear.

### 4. 色调映射 / Tone Mapping

HDR 光照值（如 >1 的亮度）不能直接显示，必须映射到 `[0,1]`。Three.js 提供 `ACESFilmicToneMapping`、`ReinhardToneMapping`、`CineonToneMapping`、`LinearToneMapping`、`NeutralToneMapping` 等。

HDR light values (>1) cannot be displayed directly; they must be mapped to `[0,1]`. Three.js offers `ACESFilmicToneMapping`, `ReinhardToneMapping`, etc.

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;  // 电影感 / cinematic
renderer.toneMappingExposure = 1.0;                   // 曝光 / exposure

// 注意：ShaderMaterial 不会自动应用色调映射
// note: ShaderMaterial does NOT auto-apply tone mapping
// 需要手动在 fragment shader 里加 / must add manually in fragment shader
```

### 5. 透明度 / 混合 / 深度 / Transparency, Blending, Depth

```js
const mat = new THREE.MeshStandardMaterial({
  transparent: true,            // 开启透明 / enable transparency
  opacity: 0.5,                 // 透明度 / opacity
  side: THREE.DoubleSide,       // 双面渲染 / render both sides
  blending: THREE.NormalBlending, // 混合模式 / blend mode
  depthWrite: false,            // 不写深度（玻璃常用）/ don't write depth (glass)
  depthTest: true,              // 仍做深度测试 / still test depth
  alphaTest: 0.5,               // alpha 低于阈值直接丢弃 / discard below threshold
});
```

```js
// side 选项 / side options
THREE.FrontSide    // 只渲染正面（默认）/ front only (default)
THREE.BackSide     // 只渲染背面 / back only
THREE.DoubleSide   // 双面 / both sides
```

### 6. flatShading / wireframe

```js
const mat = new THREE.MeshStandardMaterial({
  flatShading: true,   // 平面着色（每面一个法线，低多边形风格）/ flat shading (low-poly)
  wireframe: false,    // 线框模式 / wireframe mode
});
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `MeshBasicMaterial` | 不受光材质 / unlit |
| `MeshLambertMaterial` | 漫反射材质 / diffuse only |
| `MeshPhongMaterial` | Blinn-Phong 高光 / specular highlight |
| `MeshStandardMaterial` | PBR 标准材质 / standard PBR |
| `MeshPhysicalMaterial` | PBR + clearcoat/sheen/iridescence / extended PBR |
| `ShaderMaterial` | 自定义 GLSL / custom shaders |
| `material.color` | 漫反射颜色 / diffuse color |
| `material.metalness` | 金属度 0–1 / metalness |
| `material.roughness` | 粗糙度 0–1 / roughness |
| `material.envMapIntensity` | 环境贴图强度 / env map strength |
| `material.emissive` / `emissiveIntensity` | 自发光 / emission |
| `material.map` / `normalMap` / `roughnessMap` / `metalnessMap` | PBR 贴图集 / PBR texture set |
| `material.transparent` / `opacity` / `alphaTest` | 透明控制 / transparency |
| `material.side` | 面剔除 / face culling |
| `material.blending` | 混合模式 / blend mode |
| `material.depthWrite` / `depthTest` | 深度控制 / depth control |
| `material.flatShading` / `wireframe` | 着色模式 / shading mode |
| `material.needsUpdate` | 修改后标记重编译 / flag recompile |
| `renderer.toneMapping` / `toneMappingExposure` | 色调映射 / tone mapping |
| `renderer.outputColorSpace` | 输出颜色空间 / output color space |

## 原理 / Principles

### PBR 的金属度-粗糙度模型 / The Metalness-Roughness Model

PBR 基于物理的反射模型将表面分为两类：电介质（`metalness=0`，如塑料、木头、皮肤）和金属（`metalness=1`，如铁、铜、金）。电介质的反射是无色的（白色），金属的反射被基础色染色。`roughness` 控制微表面粗糙程度：0=完美镜面，1=完全漫反射。

PBR's physically-based reflection model divides surfaces into dielectrics (`metalness=0`, e.g. plastic, wood, skin) and metals (`metalness=1`, e.g. iron, copper, gold). Dielectric reflection is achromatic (white); metal reflection is tinted by the base color. `roughness` controls micro-surface roughness: 0=perfect mirror, 1=fully diffuse.

```text
反射颜色 = mix(白色反射, 基础色, metalness)
漫反射颜色 = mix(基础色, 黑色, metalness)   // 金属没有漫反射
高光锐度 = roughness²   // 粗糙度平方后影响更自然
```

### 为什么"颜色不对"不只是贴图问题 / Why "Wrong Color" Isn't Just the Texture

新手遇到"颜色偏暗/偏亮/偏色"时，常反复调贴图。实际上问题链是：

When beginners see "too dark/bright/tinted," they often fiddle with textures. The actual chain is:

```text
纹理 colorSpace 错（没设 SRGB）
  → 光照在线性空间算但输入是错的线性值
    → 结果偏暗或偏亮
      → 色调映射把错误值进一步压缩
        → 最终颜色不对
```

排查顺序 / troubleshooting order：
1. `texture.colorSpace = THREE.SRGBColorSpace`（颜色贴图）
2. `renderer.outputColorSpace = THREE.SRGBColorSpace`
3. `renderer.toneMapping` 与 `toneMappingExposure` 是否合理
4. 环境光 / 环境贴图强度是否过强或过弱
5. 材质 `metalness`/`roughness` 是否合理（`metalness=1` 无环境贴图时全黑）

## 常见陷阱 / Common Pitfalls

1. **`metalness=1` 无环境贴图 → 全黑 / Metal without env = black**：金属靠反射环境光产生颜色，没有 `envMap` 或环境光就全黑。/ Metals need env reflection; without it they're black.
2. **颜色贴图未设 SRGB / Color texture not SRGB**：albedo 贴图没设 `colorSpace = SRGBColorSpace`，整体偏暗。/ Albedo without SRGB looks too dark.
3. **数据贴图设了 SRGB / Data texture set to SRGB**：normal/roughness 贴图设成 SRGB，光照失真。/ Normal/roughness as SRGB distorts lighting.
4. **透明物体深度写入 / Transparent depth write**：`transparent:true` 但 `depthWrite:true`，导致排序错误、边缘黑边。/ Transparent + depthWrite causes sorting artifacts.
5. **`toneMappingExposure` 过高 / Over-exposure**：曝光过高，高光溢出成纯白。/ Too high exposure blows highlights.
6. **`flatShading` 与索引几何体 / flatShading & indexed**：`flatShading:true` 需要非索引几何体才能正确显示面法线。/ `flatShading` needs non-indexed geometry.
7. **改 `uniforms` 后不更新 / Not flagging update**：修改材质属性后需 `material.needsUpdate = true` 才会重编译 shader。/ Some changes require `needsUpdate = true`.
8. **`ShaderMaterial` 不参与色调映射 / ShaderMaterial & tone mapping**：自定义 shader 默认不做色调映射，需手动加。/ Custom shaders skip tone mapping by default.

## 调试技巧 / Debugging Tips

- 临时换成 `MeshNormalMaterial` 查看法线是否正确。/ Temporarily use `MeshNormalMaterial` to check normals.
- 临时换成 `MeshBasicMaterial` 排除光照问题。/ Use `MeshBasicMaterial` to isolate lighting issues.
- 用 `envMapIntensity=0` 排除环境贴图影响。/ Set `envMapIntensity=0` to isolate env map.
- 逐项检查：贴图 colorSpace → 渲染器 outputColorSpace → toneMapping → exposure → 灯光强度。/ Check each link in the color chain.
- `renderer.debug.checkShaderErrors = true` 查看 shader 编译错误。/ Enable shader error checking.

## 练习 / Exercises

1. 用同一个球体，依次切换 Basic→Lambert→Phong→Standard，观察差异。/ Switch the same sphere through all material types.
2. 给 `MeshStandardMaterial` 加法线贴图，调整 `normalScale`。/ Add a normal map and adjust `normalScale`.
3. 做一个透明玻璃球（`transmission`、`ior`、`thickness`，需要 `MeshPhysicalMaterial`）。/ Make a glass sphere with `MeshPhysicalMaterial`.
4. 故意把颜色贴图设成 Linear，观察偏暗效果，再改回 SRGB。/ Deliberately mis-set colorSpace to see the darkening.
5. 切换 `toneMapping` 类型，对比 ACES vs Reinhard 的视觉差异。/ Compare ACES vs Reinhard tone mapping.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/08-material/index.html`](../../examples/08-material/index.html)

```js
// 材质实验室核心 / material lab core
const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

// 程序化环境贴图（不依赖外部文件）/ procedural env map
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x222233);
// ... 添加一些彩色面片做反射 / add colored panels for reflections
const envRT = pmrem.fromScene(envScene, 0.04);

const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.5,
  roughness: 0.3,
  envMapIntensity: 1.0,
});
mat.envMap = envRT.texture;

const sphere = new THREE.Mesh(sphereGeo, mat);
scene.add(sphere);

// GUI
const params = {
  type: 'Standard',
  metalness: 0.5, roughness: 0.3,
  envIntensity: 1.0, exposure: 1.0,
  toneMapping: 'ACESFilmic',
  lightAngle: 45,
};
gui.add(params, 'metalness', 0, 1).onChange(v => mat.metalness = v);
gui.add(params, 'roughness', 0, 1).onChange(v => mat.roughness = v);
gui.add(params, 'envIntensity', 0, 3).onChange(v => mat.envMapIntensity = v);
gui.add(params, 'exposure', 0, 3).onChange(v => renderer.toneMappingExposure = v);
gui.add(params, 'toneMapping', ['ACESFilmic', 'Reinhard', 'Cineon', 'Linear', 'Neutral'])
  .onChange(v => {
    renderer.toneMapping = THREE[v + 'ToneMapping'];
  });
gui.add(params, 'lightAngle', 0, 360).onChange(v => {
  const r = THREE.MathUtils.degToRad(v);
  dirLight.position.set(Math.cos(r) * 5, 5, Math.sin(r) * 5);
});
```

## 参考资源 / References

- [Three.js Docs — Materials](https://threejs.org/docs/#api/en/materials/Material)
- [Three.js Docs — MeshStandardMaterial](https://threejs.org/docs/#api/en/materials/MeshStandardMaterial)
- [Three.js Manual — Materials](https://threejs.org/manual/#en/materials)
- [Three.js Manual — PBR](https://threejs.org/manual/#en/pbr)
- [Three.js Color Management](https://threejs.org/docs/#manual/en/introduction/Color-management)
- [Khronos PBR Spec](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-material-pbrmetallicroughness)

# ShaderMaterial 与 RawShaderMaterial / ShaderMaterial vs RawShaderMaterial

> 阶段 / Phase: 四、Shader 和 GPU 渲染 / Shader & GPU Rendering
> 预计用时 / Estimated: 3 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

Three.js 提供两种自定义着色器材质：`ShaderMaterial` 与 `RawShaderMaterial`。前者自动注入一组内置 uniform、attribute、define 和 GLSL 前缀，让你只关心核心算法；后者什么也不注入，完全由你手写，最接近原生 WebGL。本节讲清两者的差异清单，并用同一个"顶点位移 + 着色"效果分别实现一遍，让你直观看到注入了什么、省略了什么、何时该用哪个。

Three.js offers two custom shader materials: `ShaderMaterial` and `RawShaderMaterial`. The former auto-injects a set of built-in uniforms, attributes, defines, and GLSL prefixes so you focus on the algorithm; the latter injects nothing, staying closest to raw WebGL. This lesson lists exactly what is injected, implements the same vertex-displacement + coloring effect twice, and explains when to choose each.

## 核心概念 / Core Concepts

### 1. ShaderMaterial：自动注入 / ShaderMaterial: Auto-Injected

当你使用 `THREE.ShaderMaterial`，Three.js 会在你的 `vertexShader` / `fragmentShader` 字符串前拼接一段前缀，包含：

With `THREE.ShaderMaterial`, Three.js prepends a prefix to your shader strings containing:

**顶点前缀 / Vertex prefix（部分 / partial）：**
```glsl
precision highp float;
uniform mat4 modelViewMatrix;     // 自动注入 / auto
uniform mat4 projectionMatrix;    // 自动注入 / auto
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
attribute vec3 position;          // 自动声明 / auto-declared
attribute vec3 normal;
attribute vec2 uv;
// + defines: USE_COLOR, USE_UV, USE_INSTANCING ...
```

**片元前缀 / Fragment prefix（部分）：**
```glsl
precision highp float;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
// varying 由你在两段里自己声明，但 Three 会做匹配检查
```

因此你的顶点着色器只需写：

So your vertex shader can be as short as:

```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

不用声明 `attribute vec3 position`、不用写 `precision`、不用自己传 `projectionMatrix`。

### 2. RawShaderMaterial：零注入 / RawShaderMaterial: Zero Injection

`RawShaderMaterial` 不拼接任何前缀，你必须自己声明所有 attribute、uniform 和精度：

`RawShaderMaterial` prepends nothing; you must declare everything yourself:

```glsl
// 顶点 / vertex
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// 片元 / fragment
precision highp float;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
```

### 3. 差异对照表 / Difference Table

| 项目 / Item | ShaderMaterial | RawShaderMaterial |
| --- | --- | --- |
| `precision` 声明 | 自动 / auto | 必须手写 / manual |
| `position`/`normal`/`uv` attribute | 自动 / auto | 必须手写 / manual |
| `modelViewMatrix`/`projectionMatrix` uniform | 自动 / auto | 必须手写 / manual |
| `cameraPosition`/`normalMatrix` | 自动 / auto | 必须手写 / manual |
| `#define USE_UV` 等特性开关 | 由 Three 根据 material 属性设置 / set by Three | 必须自己 `#define` / manual |
| `gl_FragColor` 输出 | Three 处理色调映射等 / Three handles tonemapping | 你完全负责 / you own it |
| 适合场景 | 99% 日常需求 / 99% of cases | 教学、移植原生 Shader、极致控制 / porting raw shaders, teaching, max control |
| 代码长度 | 短 / short | 长 / long |

### 4. 何时用哪个 / When to Use Which

- **默认用 ShaderMaterial**。它仍能完全访问 `projectionMatrix` 等，只是省去重复声明。
- 用 RawShaderMaterial 的情况：从 ShaderToy / LearnOpenGL 复制整段着色器；需要精确控制前缀；做引擎级封装不想被 Three 的注入干扰；教学需要展示"裸"GLSL。
- **不要因为"Raw 更高性能"而选它**——注入的 uniform 你本来也要用，性能无差别。

### 5. uniform 传递方式相同 / Uniform Passing Is Identical

无论哪种材质，JS 端传 uniform 的方式完全一样：

Regardless of material, JS-side uniform passing is identical:

```js
new THREE.RawShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xffaa00) },
  },
  vertexShader, fragmentShader,
});
```

### 6. onBeforeCompile：改内置材质的另一条路 / onBeforeCompile: Patching Built-in Materials

除了完全自定义 ShaderMaterial，还有一条更实用的路：用 `MeshStandardMaterial` 等内置材质，在编译前**注入**一小段 GLSL。这能复用 Three 的 PBR 光照，只改你需要的一两行：

Instead of a fully custom material, you can patch a built-in `MeshStandardMaterial` via `onBeforeCompile`, reusing Three's PBR lighting while injecting a few lines:

```js
const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
mat.onBeforeCompile = (shader) => {
  // 顶点：加一个位移 / vertex: add displacement
  shader.vertexShader = shader.vertexShader
    .replace('#include <begin_vertex>', `
      vec3 transformed = position;
      transformed.y += sin(position.x * 4.0 + uTime) * 0.2;
    `);
  // 注入 uniform / inject uniform
  shader.uniforms.uTime = { value: 0 };
  // 片元：把位移高度混进颜色 / fragment: tint by height
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <color_fragment>', `
      #include <color_fragment>
      diffuseColor.rgb *= 1.0 + vHeight * 0.5;
    `);
  // 保存引用以便每帧更新 / keep ref to update each frame
  mat.userData.shader = shader;
};
// 每帧 / each frame
if (mat.userData.shader) mat.userData.shader.uniforms.uTime.value = t;
```

这是"在保留 PBR 的前提下做自定义"的最佳手段，比从零写 ShaderMaterial 光照容易得多。但它依赖 GLSL chunk 字符串替换，版本升级时 chunk 名可能变化，需要测试。

This is the best way to customize while keeping PBR — far easier than rewriting lighting from scratch. It relies on string-replacing GLSL chunks, which may rename across versions, so test on upgrades.

### 7. defines 与 #include / Defines & Chunks

`ShaderMaterial` 支持 `defines` 注入宏，并可用 `#include <chunk>` 引用 Three 的 GLSL 片段库：

`ShaderMaterial` supports `defines` and `#include <chunk>`:

```js
new THREE.ShaderMaterial({
  defines: {
    USE_UV: '',          // 启用 UV attribute / enable UV attribute
    USE_FOG: '',         // 启用雾 / enable fog
    NUM_DIR_LIGHTS: 1,   // 方向光数量 / directional light count
  },
  vertexShader: `
    #include <common>
    #include <fog_pars_vertex>     // 雾相关变量声明 / fog varyings
    void main() { ... }
  `,
  fragmentShader: `
    #include <fog_pars_fragment>
    void main() { ... #include <fog_fragment> }
  `,
});
```

`RawShaderMaterial` **不解析** `#include`，原样保留文本会导致编译错误——这是两者最容易被忽视的差异。

`RawShaderMaterial` does **not** resolve `#include`; it leaves the text as-is, causing compile errors — the most overlooked difference.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.ShaderMaterial` | 自动注入内置变量的自定义材质 / Custom material with auto-injected built-ins |
| `THREE.RawShaderMaterial` | 不注入任何内容的自定义材质 / Custom material with no injection |
| `material.uniforms` | 传 uniform（两种材质通用）/ Pass uniforms (shared API) |
| `material.defines` | 注入 `#define` 宏 / Inject `#define` macros |
| `material.onBeforeCompile` | 在编译前修改内置材质 shader / Patch built-in material shaders |
| `renderer.compile(scene, camera)` | 预编译，便于提前捕获错误 / Pre-compile to catch errors early |
| `renderer.debug.checkShaderErrors` | 开关着色器错误检查 / Toggle shader error checking |

## 原理 / Principles

### Three.js 如何注入前缀 / How Three Injects the Prefix

`WebGLProgram` 在创建程序时，会读取 `material` 的属性（是否有 `map`、`normalMap`、`instancing` 等）生成一组 `#define`，再拼接 `getPrefixVertex(material)` / `getPrefixFragment(material)`，最后才是你写的字符串。这就是为什么 ShaderMaterial 里写 `#include <common>` 这类 chunk 也能生效——它们是 Three 预定义的 GLSL 片段库。

`WebGLProgram` reads material flags (map, normalMap, instancing…) to generate `#define`s, prepends `getPrefixVertex/Fragment`, then your string. That's why `#include <common>` works in ShaderMaterial — those are Three's predefined GLSL chunk libraries.

### ShaderMaterial 的 uniform 注入清单 / ShaderMaterial Injected Uniforms

这些即使你不写 `uniforms`，只要材质开启对应特性，Three 也会上传：

These are uploaded automatically when the corresponding feature is enabled, even if you don't list them:

```text
modelMatrix, modelViewMatrix, projectionMatrix, viewMatrix,
normalMatrix, cameraPosition, isOrthographic,
DiffuseMap, NormalMap, RoughnessMap ...（随材质属性）
```

RawShaderMaterial 一概不传，必须你在 `uniforms` 里声明，并在 GLSL 里 `uniform` 声明一一对应。

### RawShaderMaterial 的责任清单 / RawShaderMaterial Responsibility Checklist

```text
□ precision highp float;  （顶点 + 片元都要）
□ attribute vec3 position; attribute vec2 uv; attribute vec3 normal;
□ uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
□ 任何你需要的 uniform（uTime, uColor…）
□ 输出 gl_Position / gl_FragColor
□ 若用 instancing：attribute mat4 instanceMatrix;
□ 若要 fog/tonemapping：自己实现或 include
```

### ShaderMaterial 默认注入的完整清单 / Full List of ShaderMaterial Injections

下表是 ShaderMaterial 在 `getPrefixVertex` / `getPrefixFragment` 里自动添加的内容（r160）：

The table lists what ShaderMaterial's prefix functions auto-add (r160):

| 类别 / Category | 注入内容 / Injected |
| --- | --- |
| 精度 | `precision highp float;`（顶点 + 片元） |
| 顶点 attribute | `position`, `normal`, `uv`, `uv1/uv2/uv3`, `color`, `tangent`, `instanceMatrix`, `instanceColor`（按需） |
| 矩阵 uniform | `modelMatrix`, `modelViewMatrix`, `projectionMatrix`, `viewMatrix`, `normalMatrix`, `inverseProjectionMatrix` |
| 相机 | `cameraPosition`, `isOrthographic` |
| 内置 varying | 由 chunk 声明（`vViewPosition`, `vNormal` 等） |
| defines | `USE_UV`, `USE_COLOR`, `USE_INSTANCING`, `USE_FOG`, `USE_SHADOWMAP`, `NUM_DIR_LIGHTS` …（按材质属性） |
| chunk 解析 | `#include <chunk>` 被替换为实际 GLSL |

这意味着用 ShaderMaterial 时，你"免费"获得了与 Three 渲染体系（雾、阴影、实例化、光照）的兼容性，而 RawShaderMaterial 这些都得自己接。

This means ShaderMaterial gives you free compatibility with Three's rendering system (fog, shadows, instancing, lighting), while RawShaderMaterial requires you to wire all of it yourself.

## 常见陷阱 / Common Pitfalls

1. **把 ShaderMaterial 代码粘进 RawShaderMaterial**：缺 `attribute`/`uniform` 声明，编译失败报 `undeclared identifier position`。 / Pasting ShaderMaterial code into Raw fails with `undeclared identifier`.
2. **RawShaderMaterial 忘记 `precision`**：桌面可能侥幸，移动端精度默认不足。 / Forgetting precision works on desktop, breaks on mobile.
3. **uniform 声明但不传值**：GLSL 里声明了 `uniform float uTime` 但 JS `uniforms` 没写，值为 0 且无警告。 / Declaring a uniform in GLSL but not in JS yields 0 with no warning.
4. **混用 `#include` 与 RawShaderMaterial**：Raw 不解析 chunk，`#include <common>` 会原样留下导致编译错误。 / Raw doesn't resolve `#include`; it stays as literal text.
5. **varying 两边类型不一致**：顶点 `varying vec2 vUv`、片元写成 `varying vec3 vUv`，链接失败。 / Mismatched varying types break linking.
6. **以为 Raw 更快**：注入的 uniform 仍在用，性能没有差异。 / Believing Raw is faster — no, injected uniforms are used anyway.
7. **ShaderMaterial 的 `gl_FragColor` 与色调映射**：r150+ 默认 `renderer.toneMapping` 会作用于 ShaderMaterial 输出，若不想被映射需 `material.toneMapped=false` 或 `OutputPass`。 / Tone mapping may alter ShaderMaterial output; set `toneMapped=false` if unwanted.
8. **RawShaderMaterial 的 instancing**：必须手写 `attribute mat4 instanceMatrix;` 且在顶点里 `vec4 transformed = instanceMatrix * vec4(position,1.0);`，ShaderMaterial 则自动处理。 / Raw instancing requires manual `attribute mat4 instanceMatrix;`; ShaderMaterial handles it.
9. **chunk 字符串替换易碎**：`onBeforeCompile` 依赖 `#include <begin_vertex>` 这类锚点，Three 版本升级可能改名，需回归测试。 / `onBeforeCompile` string replacement depends on chunk anchors that may rename across versions.
10. **uniform 重名**：自定义 `uniform float modelViewMatrix` 会与 ShaderMaterial 注入的冲突，编译报 redefinition。 / Custom uniforms that shadow injected names cause redefinition errors.

## 调试技巧 / Debugging Tips

- **读前缀**：在 `material.onBeforeCompile` 里 `console.log(shader.vertexShader)` 看 Three 拼出的完整 GLSL。 / Log the full compiled GLSL via `onBeforeCompile`.
- **对比实现**：把同一效果用两种材质各写一遍，diff 两段 GLSL，差异就是注入部分。 / Diff two implementations to see exactly what's injected.
- **`renderer.debug.checkShaderErrors = true`**：确保编译错误进控制台。 / Ensure errors surface.
- **最小化 uniform**：逐个注释，定位哪个 uniform 声明缺失。 / Comment out uniforms one by one to find missing declarations.
- **用 `#define` 替代分支**：在两种材质间共享 GLSL 时用 `#ifdef RAW` 切换声明。 / Share GLSL via `#ifdef RAW`.
- **`renderer.info.programs`**：查看编译后的 program 对象，含 attributes/uniforms 日志。 / Inspect compiled program objects for attribute/uniform logs.
- **逐 attribute 验证**：在 RawShaderMaterial 里先只声明 `position`，能跑后再加 `uv`、`normal`，隔离声明错误。 / In Raw, declare only `position` first, then add `uv`/`normal` to isolate declaration errors.

## 练习 / Exercises

1. 把示例的 ShaderMaterial 版本复制为 RawShaderMaterial，手动补全所有声明。 / Clone the ShaderMaterial version as Raw and fill in declarations.
2. 在两种材质里都加上 instancing（`instanceMatrix`），对比声明差异。 / Add instancing to both and compare.
3. 用 `onBeforeCompile` 打印 ShaderMaterial 的完整顶点着色器，数出 Three 注入了多少行。 / Count how many lines Three injects.
4. 在 RawShaderMaterial 里手动实现 fog，体会 Three 自动注入的便利。 / Implement fog manually in Raw to feel the convenience of injection.
5. 把一段 ShaderToy 着色器分别用两种材质接入，记录改造成本。 / Port a ShaderToy shader via both materials and compare effort.
6. 用 `material.defines` 在 ShaderMaterial 里加 `#define USE_INSTANCING`，实现 1000 个实例化立方体。 / Use `defines` to enable instancing on 1000 cubes in ShaderMaterial.
7. 对比 `material.toneMapped` 为 true/false 时，ShaderMaterial 输出颜色的差异。 / Compare ShaderMaterial output with `toneMapped` on vs off.
8. 用 `onBeforeCompile` 给 `MeshStandardMaterial` 加程序化位移，保留 PBR 光照。 / Add procedural displacement to `MeshStandardMaterial` via `onBeforeCompile`, keeping PBR.
9. 打印 `onBeforeCompile` 里 `shader.vertexShader` 的完整内容，数出 Three 注入了多少行 chunk。 / Log the full `shader.vertexShader` inside `onBeforeCompile` and count injected chunk lines.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/19-shader-material/index.html`](../../examples/19-shader-material/index.html)

同一个"波浪平面 + 火焰着色"效果，两种材质各实现一遍，GUI 切换并显示代码差异。

The same "waving plane + flame coloring" effect implemented twice; GUI switches material and shows the diff.

```glsl
// ── ShaderMaterial 版（短）/ ShaderMaterial version (short) ──
varying vec2 vUv;
varying float vH;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {            // ← position/uv/projectionMatrix 已注入
  vUv = uv;
  float h = sin(position.x * 3.0 + uTime) * 0.3
          + cos(position.y * 4.0 + uTime * 1.3) * 0.2;
  vH = h;
  vec3 p = position; p.z += h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
```

```glsl
// ── RawShaderMaterial 版（长）/ Raw version (long) ──
precision highp float;                 // ← 必须手写
attribute vec3 position;               // ← 必须手写
attribute vec2 uv;
uniform mat4 modelViewMatrix;          // ← 必须手写
uniform mat4 projectionMatrix;
varying vec2 vUv;
varying float vH;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
  vUv = uv;
  float h = sin(position.x * 3.0 + uTime) * 0.3
          + cos(position.y * 4.0 + uTime * 1.3) * 0.2;
  vH = h;
  vec3 p = position; p.z += h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
```

## 参考资源 / References

- [Three.js Docs - ShaderMaterial](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [Three.js Docs - RawShaderMaterial](https://threejs.org/docs/#api/en/materials/RawShaderMaterial)
- [Three.js Source - WebGLProgram prefix](https://github.com/mrdoob/three.js/blob/master/src/renderers/webgl/WebGLProgram.js)
- [Three.js Manual - Writing custom materials](https://threejs.org/manual/#en/custom-shader)
- [ShaderToy](https://www.shadertoy.com/)
- [LearnOpenGL - Shaders](https://learnopengl.com/Getting-started/Shaders)
- [Three.js onBeforeCompile guide](https://threejs.org/manual/#en/how-to-use-onBeforeCompile)
- [Anthony Bouchard - onBeforeCompile tutorial](https://codepen.io/atonchev/pen/gOYyZmG)

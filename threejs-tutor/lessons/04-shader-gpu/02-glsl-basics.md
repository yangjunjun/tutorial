# GLSL 基础 / GLSL Basics

> 阶段 / Phase: 四、Shader 和 GPU 渲染 / Shader & GPU Rendering
> 预计用时 / Estimated: 4–5 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

GLSL（OpenGL Shading Language）是 GPU 上运行的类 C 语言。它和 JavaScript 的最大区别：GLSL 是**高度并行**的——同一段代码在成千上万个顶点/片元上同时执行，没有共享状态，每个片元只负责计算自己的输出。本节按学习顺序讲解：数据类型、向量与矩阵、uniform/attribute/varying、内置变量、纹理采样、插值、噪声，并用一条从"纯色 → UV 渐变 → 时间动画 → 波浪顶点 → 纹理采样 → 圆形遮罩 → 扫描线 → 溶解"的渐进路线，让你一步步写出第一个完整的 Shader。

GLSL (OpenGL Shading Language) is a C-like language that runs on the GPU. Its defining trait versus JavaScript is **massive parallelism** — the same code runs simultaneously on thousands of vertices/fragments, with no shared state, each fragment computing only its own output. This lesson covers, in learning order: data types, vectors & matrices, uniform/attribute/varying, built-in variables, texture sampling, interpolation, and noise, following a progressive path from "solid color → UV gradient → time animation → vertex wave → texture sampling → circle mask → scanline → dissolve".

## 核心概念 / Core Concepts

### 1. 标量与向量类型 / Scalar & Vector Types

```glsl
float  x = 1.0;     // 单精度浮点 / single-precision float（GLSL 中 1 是 int，1.0 才是 float）
int    i = 1;        // 整数 / integer
bool   b = true;     // 布尔 / boolean

vec2 uv = vec2(0.5, 0.5);   // 二维向量 / 2-component
vec3 rgb = vec3(1.0, 0.0, 0.0);  // 三维 / 3-component
vec4 rgba = vec4(rgb, 1.0);      // 四维 / 4-component，可用 swizzle 构造
```

**Swizzling** 是 GLSL 特有的语法，用 `.xyzw` / `.rgba` / `.stpq` 任一组后缀组合分量：

```glsl
vec3 c = vec3(1.0, 2.0, 3.0);
vec2 a = c.xy;      // (1.0, 2.0)
vec3 b = c.xxx;     // (1.0, 1.0, 1.0)
float z = c.z;      // 3.0
c.x = 9.0;          // 可写 / assignable
```

### 2. 矩阵 / Matrices

```glsl
mat2 m2 = mat2(1.0, 0.0, 0.0, 1.0);    // 列主序 / column-major
mat3 m3 = mat3(1.0);
mat4 m4 = mat4(1.0);                    // 单位矩阵 / identity
// 矩阵 × 向量 / matrix-vector multiply：列向量在右
vec4 transformed = m4 * vec4(position, 1.0);
```

Three.js 已提供 `modelMatrix`、`viewMatrix`、`projectionMatrix`、`modelViewMatrix`，多数情况你不需要手写矩阵。

Three.js provides these matrices, so you rarely write them by hand.

### 3. uniform / attribute / varying（再回顾）/ Three Storage Qualifiers

```glsl
// 顶点着色器 / Vertex shader
attribute vec3 position;    // 每顶点不同 / per-vertex（ShaderMaterial 自动声明 position/uv/normal）
uniform float uTime;        // 全局相同 / global，所有顶点/片元一致
varying vec2 vUv;           // 传给片元 / passed to fragment，光栅化时插值
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// 片元着色器 / Fragment shader
precision highp float;       // 移动端建议显式声明 / declare precision on mobile
varying vec2 vUv;            // 接收插值后的 UV / interpolated UV
uniform float uTime;
void main() {
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
```

JS 端通过 `material.uniforms` 传值：

```js
const mat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },                // 每帧更新 / update each frame
    uColor: { value: new THREE.Color(0xff6600) },
  },
  vertexShader, fragmentShader,
});
// 每帧 / each frame
mat.uniforms.uTime.value = clock.getElapsedTime();
```

### 4. 内置变量 / Built-in Variables

| 变量 | 所在阶段 | 含义 / Meaning |
| --- | --- | --- |
| `position` | 顶点 | 顶点局部坐标 / vertex local position（ShaderMaterial 注入） |
| `normal` | 顶点 | 顶点法线 / vertex normal |
| `uv` | 顶点 | 纹理坐标 / texture coordinate |
| `projectionMatrix` | 顶点 | 投影矩阵 / projection matrix |
| `modelViewMatrix` | 顶点 | 模型×视图 / model × view |
| `modelMatrix` / `viewMatrix` | 顶点 | 模型 / 视图矩阵 |
| `cameraPosition` | 顶点 | 相机世界坐标 / camera world pos |
| `gl_Position` | 顶点 | 输出：裁剪空间坐标 / output clip-space pos |
| `gl_PointSize` | 顶点 | 点精灵大小 / point sprite size |
| `gl_FragCoord` | 片元 | 像素坐标（含 0.5 偏移）/ pixel coords |
| `gl_FragColor` | 片元 | 输出颜色（WebGL1）/ output color（r160 推荐 `pc_fragColor`） |

### 5. 函数与控制流 / Functions & Control Flow

GLSL 的函数与 C 几乎一致，但**不支持递归**，且循环次数需在编译期可确定上限（WebGL1 严格，WebGL2 宽松）：

```glsl
float clamp01(float v) { return clamp(v, 0.0, 1.0); }

vec3 mix3(vec3 a, vec3 b, float t) { return a + (b - a) * t; }

// 条件 / branching
vec3 col = t > 0.5 ? colorA : colorB;
```

常用内置函数 / common built-ins：

```glsl
// 数学 / math
sin, cos, tan, pow, exp, log, sqrt, abs, sign, floor, ceil, fract,
mod, min, max, clamp, mix, step, smoothstep,
length, distance, dot, cross, normalize, reflect, refract
// 分量 / component-wise
clamp(v, 0.0, 1.0), mix(a, b, t), smoothstep(0.0, 1.0, t)
```

`step(edge, x)`：`x < edge ? 0 : 1`，`smoothstep(e0, e1, x)`：平滑过渡。这两个函数是 Shader 中"硬边/软边"的核心工具。

### 6. 纹理采样 / Texture Sampling

```glsl
// JS：传入纹理 / pass texture
uniforms: { uTex: { value: new THREE.TextureLoader().load('a.png') } }
```

```glsl
// GLSL
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(uTex, vUv);    // WebGL1；WebGL2/Three r160 用 texture()
  gl_FragColor = tex;
}
```

```js
// Three.js r160 会自动把 texture2D 转为 texture，所以 GLSL 里写 texture2D 也能跑
// 但最佳实践是直接用 texture()
```

### 7. 噪声 / Noise

GLSL 没有内置 `noise()`（WebGL1 的 `noise` 函数基本不可用），通常自己实现或用现成库（如 `noise-cell`、Ashima 的 simplex noise）。最简单的 value noise：

GLSL has no usable built-in `noise()`; implement your own or use a library. A minimal value noise:

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);   // smoothstep 插值 / smoothstep interp
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
```

### 8. 渐进式第一 Shader / Progressive First Shader

学习路线 / learning path：

```text
1. 纯色      gl_FragColor = vec4(1,0,0,1)
2. UV 渐变   gl_FragColor = vec4(vUv, 0, 1)
3. 时间动画  gl_FragColor = vec4(vUv * (0.5+0.5*sin(uTime)), 0, 1)
4. 顶点波浪  position.y += sin(position.x*4 + uTime)*0.2
5. 纹理采样  texture(uTex, vUv)
6. 圆形遮罩  step(0.3, length(vUv-0.5))
7. 扫描线    step(0.5, fract(vUv.y*20 + uTime))
8. 溶解      discard when hash(vUv) < uDissolve
```

### 9. FBM：把噪声叠成分形 / FBM: Stack Noise Into Fractals

单层 value noise 太平，把多个频率叠加就得到 **FBM（Fractal Brownian Motion）**，是生成云、地形、大理石纹理的标准技巧：

Single-layer noise is too flat; stacking octaves yields **FBM**, the standard technique for clouds, terrain, and marble:

```glsl
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;        // 振幅，每层减半 / amplitude, halve each octave
  float f = 1.0;        // 频率，每层翻倍 / frequency, double each octave
  for (int i = 0; i < 5; i++) {      // 5 层八度 / 5 octaves
    v += a * valueNoise(p * f);
    f *= 2.0;
    a *= 0.5;
  }
  return v;             // 范围约 [0,1]
}
```

层越多细节越丰富，但每层翻倍片元开销。通常 4–6 层够用。FBM 是进入程序化生成的门槛——掌握它你就能写地形、云、木纹、火焰。

More octaves = more detail, but each doubles fragment cost; 4–6 is usually enough. FBM is the gateway to procedural generation — with it you can write terrain, clouds, wood grain, and fire.

### 10. 常用 GLSL 内置函数速查 / Built-in Function Cheat Sheet

```glsl
// ── 插值与阶跃 / interpolation & stepping ──
mix(a, b, t)            // 线性插值 a→b / linear interp
smoothstep(e0, e1, x)   // 平滑阶跃，返回 [0,1] / smooth step
step(edge, x)           // 硬阶跃，x<edge?0:1 / hard step
clamp(x, lo, hi)        // 钳位 / clamp

// ── 几何 / geometric ──
length(v)               // 向量长度 / vector length
distance(a, b)          // 距离 / distance
dot(a, b)               // 点积 / dot product
cross(a, b)             // 叉积 / cross product
normalize(v)            // 归一化 / normalize
reflect(I, N)           // 反射向量 / reflection
refract(I, N, eta)      // 折射向量 / refraction
faceforward(N, I, Nref) // 朝向修正 / orient normal

// ── 数学 / math ──
pow, exp, log, sqrt, inversesqrt
sin, cos, tan, asin, acos, atan
abs, sign, floor, ceil, fract, mod
min, max, clamp

// ── 分量操作 / component-wise ──
any(bvec), all(bvec)            // 布尔归约 / boolean reduce
greaterThan(a,b), lessThan(...) // 返回 bvec / returns bvec
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader})` | 创建自定义着色器材质 / Create custom shader material |
| `material.uniforms[name].value` | 读写 uniform 值 / Read/write uniform |
| `precision highp float;` | 声明片元精度 / Declare fragment precision |
| `texture2D(sampler, uv)` / `texture()` | 采样纹理 / Sample texture |
| `gl_FragCoord` | 片元像素坐标 / Fragment pixel coords |
| `mix(a,b,t)` / `smoothstep(e0,e1,x)` | 插值工具 / Interpolation tools |
| `fract()` | 取小数部分，常做重复 / Fractional part, used for repetition |
| `step(edge,x)` | 硬阶跃，0 或 1 / Hard step |
| `#define` / `#if` | GLSL 预处理宏 / GLSL preprocessor macros |

## 原理 / Principles

### 为什么 Shader 不用 `if` 就能高效 / Why Branchless Shaders Are Fast

GPU 以 warp/wavefront 为单位锁步执行，同一组线程若走不同分支，两边都要执行再丢弃，`if` 会降低并行效率。因此 Shader 中大量使用 `step`/`mix`/`smoothstep` 等"无分支"函数：

GPUs execute in lockstep warps; divergent branches waste cycles. So shaders favor branchless tools:

```glsl
// 低效 / slow
float v;
if (t > 0.5) v = a; else v = b;
// 高效 / fast, branchless
float v = mix(b, a, step(0.5, t));
```

### 插值如何让顶点 UV 变成片元渐变 / Interpolation Turns Per-Vertex UV Into Per-Fragment Gradient

顶点着色器只设 3 个顶点的 `vUv`，光栅化对每个片元做重心坐标插值，于是三角形内部每个像素都得到不同 UV，片元着色器据此输出渐变。这正是"用 3 个值生成百万像素渐变"的原理。

The vertex shader sets `vUv` for only 3 vertices; rasterization interpolates per fragment via barycentric coords, giving each pixel a distinct UV — how 3 values generate a million-pixel gradient.

## 常见陷阱 / Common Pitfalls

1. **`1` 与 `1.0` 混用**：`vec3(1, 0, 0)` 在某些驱动下报错，必须写 `1.0`。 / Int literals in float contexts may error; use `1.0`.
2. **忘记 `precision`**：片元着色器在移动端默认精度可能是 mediump，导致噪声抖动。 / Mobile default precision may cause noise flicker.
3. **varying 未在片元声明**：顶点声明了 `vUv`，片元忘了写 `varying vec2 vUv;` 会链接失败。 / Forgetting the matching `varying` declaration breaks linking.
4. **除零**：`normalize(vec3(0))` 结果未定义，会产生 NaN 黑块。 / `normalize` of a zero vector yields NaN.
5. **循环上限未知**：WebGL1 要求 `for` 循环上限是常量。 / WebGL1 requires constant loop bounds.
6. **纹理未设置 wrap/filter**：默认 `ClampToEdge`，重复效果需 `RepeatWrapping`。 / Default is ClampToEdge; set RepeatWrapping for tiling.
7. **`texture2D` vs `texture`**：r160 推荐 `texture()`，但 Three 的 GLSL 转换器会自动处理，混用通常可跑。 / r160 prefers `texture()`; Three's transformer handles `texture2D` too.

## 调试技巧 / Debugging Tips

- **第一步永远输出 UV**：`gl_FragColor = vec4(vUv, 0, 1)` 确认 UV 正确。 / Always output UV first to confirm it's correct.
- **输出标量为灰度**：`gl_FragColor = vec4(vec3(v), 1)` 把任意 float 可视化。 / Visualize any float as grayscale.
- **缩放观察**：`fract(vUv * 5.0)` 放大 5 倍重复，看清细节。 / Multiply UV to see repeated detail.
- **`#pragma glslify`**：用 glslify 模块化复用噪声函数。 / Modularize noise via glslify.
- **Shader Editor 网站预览**：先在 ShaderToy / Bonzomatic 验证算法再搬进 Three.js。 / Prototype on ShaderToy before integrating.

## 练习 / Exercises

1. 实现一个随时间流动的彩色条纹（用 `fract(vUv.x * 5 + uTime)`）。 / Implement scrolling colored stripes.
2. 把示例的"圆形遮罩"改为柔和边缘（用 `smoothstep` 替代 `step`）。 / Soften the circle mask with `smoothstep`.
3. 用 value noise 生成程序化"木纹"纹理。 / Generate procedural wood grain with value noise.
4. 在顶点着色器里用噪声做地形起伏。 / Displace vertices with noise to form terrain.
5. 实现一个 RGB 色分离故障效果（分别偏移 R/G/B 通道采样）。 / Implement RGB-split glitch.
6. 用 FBM 生成程序化云朵，并让云随 `uTime` 缓慢流动。 / Generate procedural clouds with FBM that drift over `uTime`.
7. 对比 `step` 与 `smoothstep` 在圆形遮罩中的视觉差异，理解硬边与软边。 / Compare `step` vs `smoothstep` for circle masks — hard vs soft edges.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/18-glsl-basics/index.html`](../../examples/18-glsl-basics/index.html)

核心：一个平面 ShaderMaterial，GUI 切换 6 种渐进式片元效果。

Core: a plane with ShaderMaterial; GUI switches among 6 progressive fragment effects.

```glsl
// 片元着色器核心 / Fragment shader core
uniform int uEffect;        // 0:纯色 1:UV渐变 2:动画渐变 3:扫描线 4:圆形 5:溶解
uniform float uTime, uDissolve;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  vec3 c;
  if      (uEffect == 0) c = uColor;
  else if (uEffect == 1) c = vec3(vUv, 0.0);
  else if (uEffect == 2) c = vec3(vUv * (0.5 + 0.5 * sin(uTime)), 0.0);
  else if (uEffect == 3) c = uColor * step(0.5, fract(vUv.y * 20.0 + uTime));
  else if (uEffect == 4) {
    float d = length(vUv - 0.5);
    c = uColor * smoothstep(0.30, 0.25, d);
  } else {
    float h = fract(sin(dot(vUv * 50.0, vec2(127.1, 311.7))) * 43758.5453);
    if (h < uDissolve) discard;
    c = mix(uColor, vec3(1.0), h);
  }
  gl_FragColor = vec4(c, 1.0);
}
```

## 参考资源 / References

- [The Book of Shaders](https://thebookofshaders.com/)
- [ShaderToy](https://www.shadertoy.com/)
- [Three.js Docs - GLSL Helpers](https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram)
- [GLSL Reference Card (Khronos)](https://www.khronos.org/files/opengl-quick-reference-card.pdf)
- [LearnOpenGL - Shaders](https://learnopengl.com/Getting-started/Shaders)
- [LearnOpenGL - Textures](https://learnopengl.com/Getting-started/Texturing)
- [Bonzomatic](https://github.com/Gargaj/Bonzomatic)
- [glsl.tokyo](https://glsl.app/)
- [Inigo Quilez - Noise articles](https://iquilezles.org/articles/)

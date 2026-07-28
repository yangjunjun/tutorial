# 渲染管线 / Render Pipeline

> 阶段 / Phase: 四、Shader 和 GPU 渲染 / Shader & GPU Rendering
> 预计用时 / Estimated: 3–4 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

渲染管线是 GPU 把一组顶点数据变成屏幕像素的固定流程。理解这条管线，是理解一切 Shader、后处理、性能优化的前提。本节从 JavaScript 层出发，沿着数据流向，逐站讲解：顶点数据如何进入显存、顶点着色器如何变换坐标、图元装配与裁剪、光栅化如何生成片元、片元着色器如何决定颜色，最后经过深度测试与混合写入帧缓冲。

The render pipeline is the fixed sequence the GPU follows to turn vertex data into screen pixels. Understanding it is the prerequisite for understanding every shader, postprocessing effect, and performance optimization. This lesson follows the data: how vertex buffers reach VRAM, how the vertex shader transforms coordinates, how primitives are assembled and clipped, how rasterization generates fragments, how the fragment shader decides their color, and finally how depth testing and blending write into the framebuffer.

## 核心概念 / Core Concepts

### 1. 管线全景 / Pipeline Overview

```text
JavaScript (CPU)          GPU 显存 / VRAM
    │
    ├─ BufferGeometry ──→ Buffer (位置/法线/UV)   attribute
    ├─ Material/Uniform ─→ Uniform 变量            uniform
    ├─ drawArrays / drawElements
    ▼
┌──────────────────────────────────────────────────┐
│ 1. 顶点着色器 Vertex Shader  (每顶点执行 1 次)    │
│    position → gl_Position (clip space)            │
├──────────────────────────────────────────────────┤
│ 2. 图元装配 Primitive Assembly                    │
│    顶点 → 三角形 / 线 / 点                       │
├──────────────────────────────────────────────────┤
│ 3. 裁剪 Clipping + 视口变换                       │
│    裁掉视锥外、裁剪到 NDC [-1,1]                  │
├──────────────────────────────────────────────────┤
│ 4. 光栅化 Rasterization                          │
│    三角形 → 片元 (fragment)，插值 varying        │
├──────────────────────────────────────────────────┤
│ 5. 片元着色器 Fragment Shader (每片元执行 1 次)   │
│    决定颜色 gl_FragColor / 输出到 framebuffer      │
├──────────────────────────────────────────────────┤
│ 6. 深度测试 Depth Test + 混合 Blending            │
│    通过则写入，否则丢弃                           │
└──────────────────────────────────────────────────┘
    ▼
帧缓冲 Framebuffer → 屏幕
```

顶点着色器对**每个顶点**执行一次，片元着色器对**每个片元**（约等于像素）执行一次。一个三角形只有 3 个顶点，但可能覆盖几千个片元，所以片元着色器的开销通常远大于顶点着色器。

The vertex shader runs **once per vertex**; the fragment shader runs **once per fragment** (roughly per pixel). A triangle has only 3 vertices but may cover thousands of fragments, so fragment-shader cost usually dominates.

### 2. 坐标空间变换链 / Coordinate Space Chain

顶点从局部空间一路变换到屏幕空间，每一步都对应一个矩阵：

A vertex travels through several spaces, each with its own matrix:

```glsl
// 局部坐标 local position (attribute)
vec4 localPos = vec4(position, 1.0);

// → 世界坐标 world space（模型矩阵 modelMatrix）
vec4 worldPos = modelMatrix * localPos;

// → 视图坐标 view space（视图矩阵 viewMatrix）
vec4 viewPos = viewMatrix * worldPos;

// → 裁剪坐标 clip space（投影矩阵 projectionMatrix）
vec4 clipPos = projectionMatrix * viewPos;

// 这就是顶点着色器的最终输出
gl_Position = clipPos;
```

Three.js 的 `ShaderMaterial` 会自动注入 `modelMatrix`、`viewMatrix`、`projectionMatrix`、`modelViewMatrix`、`projectionMatrix` 和 `cameraPosition`，所以你通常只需写一行：

Three.js `ShaderMaterial` auto-injects those matrices, so usually you only write:

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

### 3. attribute / uniform / varying

| 变量类型 | 来源 | 作用域 | 何时确定 | 中文说明 |
| --- | --- | --- | --- | --- |
| `attribute` | BufferGeometry | 顶点着色器 | 每顶点不同 | 每个顶点独有的数据：位置、法线、UV、颜色 |
| `uniform` | Material.uniforms | 顶点 + 片元 | 整次 draw call 全局相同 | 全局参数：时间、变换矩阵、颜色、纹理 |
| `varying` | 着色器自定义 | 顶点 → 片元 | 光栅化时插值 | 把顶点数据传给片元，插值后每个片元得到平滑值 |

```glsl
// 顶点着色器 / Vertex shader
attribute vec3 position;   // Three.js 内置 / built-in
attribute vec2 uv;          // Three.js 内置 / built-in
uniform float uTime;        // 全局时间 / global time
varying vec2 vUv;           // 传给片元 / passed to fragment

void main() {
  vUv = uv;                                   // 传递 UV / pass UV
  vec3 p = position;
  p.y += sin(p.x * 4.0 + uTime) * 0.2;        // 顶点位移 / vertex displacement
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
```

```glsl
// 片元着色器 / Fragment shader
varying vec2 vUv;          // 插值后的 UV / interpolated UV
uniform float uTime;
uniform vec3 uColor;

void main() {
  // vUv 在三角形内部被光栅化插值 / vUv is interpolated across the triangle
  float t = vUv.y;
  gl_FragColor = vec4(uColor * t, 1.0);
}
```

### 4. 光栅化与插值 / Rasterization & Interpolation

光栅化把三角形拆成像素，并对 `varying` 做**重心坐标插值**。顶点 A 的 varying 值为 `a`，顶点 B 为 `b`，顶点 C 为 `c`，片元位于重心坐标 `(w0, w1, w2)`，则插值结果为：

Rasterization splits a triangle into pixels and interpolates `varying`s via **barycentric coordinates**:

```text
v_fragment = w0 * a + w1 * b + w2 * c   (w0 + w1 + w2 = 1)
```

这就是为什么 UV、法线、颜色在三角形内部能平滑过渡。注意：透视投影下，深度非线性，直接线性插值会出错，GPU 默认做**透视正确插值**（除以 `w`）。

This is why UV, normals, and colors blend smoothly inside a triangle. Under perspective projection the GPU performs **perspective-correct interpolation** (dividing by `w`).

### 5. 深度测试与混合 / Depth Test & Blending

每个片元写入帧缓冲前要过两关：

Each fragment passes two gates before writing the framebuffer:

- **深度测试 Depth Test**：比较片元深度与深度缓冲，近的覆盖远的（默认 `LESS`）。远的片元被丢弃，节省混合开销。
- **混合 Blending**：若开启透明度，新片元与已有颜色按 `blendSrc` / `blendDst` 混合，公式为 `out = src * srcFactor + dst * dstFactor`。

```js
// 常见混合模式 / common blend modes
// 透明度混合 / alpha blending
new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.NormalBlending,          // src*srcAlpha + dst*(1-srcAlpha)
});
// 加性混合（发光、火焰）/ additive (glow, fire)
blending: THREE.AdditiveBlending;          // src*1 + dst*1
// 乘性（玻璃、暗化）/ multiply
blending: THREE.MultiplyBlending;          // src*dst
```

### 6. 各阶段的执行频率与开销 / Per-Stage Frequency & Cost

把整条管线的执行次数列出来，就能理解性能瓶颈在哪：

Listing execution counts per stage reveals where the bottleneck is:

```text
假设 / assume: 顶点数 N = 10,000，覆盖片元数 F = 2,000,000

阶段 Stage              执行次数 Runs     单次开销 Cost/run
顶点着色器              N = 10⁴           中（矩阵乘 + varying 赋值）
图元装配                N/3 ≈ 3.3×10³     低
光栅化                  生成 F = 2×10⁶    —
片元着色器              F = 2×10⁶         中～高（纹理采样、光照）
深度测试                F                 极低
混合（若开启）          通过的片元数       低
```

经验法则：片元数通常是顶点数的 100～1000 倍。所以**顶点着色器里做重活（如复杂位移）通常可接受，片元着色器里的 `sin`/`noise`/循环要谨慎**。这也是为什么降低渲染分辨率能显著提速——它线性减少 F。

Rule of thumb: fragments are 100–1000× vertices. So heavy work in the vertex shader (complex displacement) is usually fine; `sin`/`noise`/loops in the fragment shader must be careful. This is why lowering render resolution speeds things up — it linearly reduces F.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.BufferGeometry` | 组织顶点属性数据（位置、法线、UV），上传到 GPU / Organizes vertex attributes and uploads to GPU |
| `THREE.BufferAttribute` | 单个属性的数据数组与每顶点分量数 / A single attribute array + item size |
| `THREE.ShaderMaterial` | 自定义顶点 + 片元着色器，自动注入内置 uniform / Custom shaders with auto-injected built-ins |
| `THREE.RawShaderMaterial` | 完全手写，不注入任何内置变量 / Fully manual, no built-ins injected |
| `material.uniforms` | JS 端向 shader 传递 uniform 的入口 / JS-side entry to pass uniforms to shaders |
| `renderer.render(scene, camera)` | 触发一次完整管线 / Triggers one full pipeline pass |
| `gl_Position` | 顶点着色器输出：裁剪空间坐标 / Vertex output: clip-space position |
| `gl_FragColor` / `fragColor` | 片元着色器输出颜色（r160 后推荐用 `pc_fragColor`）/ Fragment output color |

## 原理 / Principles

### 顶点变换的数学本质 / The Math Behind Vertex Transform

完整变换链可合并为一个矩阵：

The whole chain collapses into one matrix:

```text
clipPos = P · V · M · localPos
          │   │   │
          │   │   └─ modelMatrix   模型变换（平移/旋转/缩放）
          │   └───── viewMatrix    相机变换（世界→视图）
          └───────── projectionMatrix  投影（视图→裁剪）
```

裁剪空间齐次坐标 `(x, y, z, w)`，除以 `w` 得到 **NDC（Normalized Device Coordinates）**，范围 `[-1, 1]`：

Clip-space homogeneous coords `(x, y, z, w)`, divide by `w` to get **NDC** in `[-1, 1]`:

```text
ndc = clipPos.xyz / clipPos.w
```

NDC 的 x/y 映射到屏幕像素，z 写入深度缓冲。把 NDC 值当颜色输出，就能直观"看见"坐标空间——这正是本节示例的可视化思路。

NDC x/y map to screen pixels; z goes into the depth buffer. Outputting NDC as color lets you literally *see* the coordinate space — which is exactly what the demo does.

#### 各矩阵的构造 / How Each Matrix Is Built

- **modelMatrix**：`T(平移) · R(旋转) · S(缩放)`，把局部坐标搬到世界。
- **viewMatrix**：相机位置的逆矩阵 `inverse(camera.matrixWorld)`，把世界搬到相机视角。
- **projectionMatrix**：由 fov/aspect/near/far 构造，透视投影会把 z 压缩（非线性），使近处精度高、远处精度低——这是 z-fighting（深度冲突）的根源。
- **MVP = P · V · M**：GPU 实际只算这一个组合矩阵，但 Three.js 把它们分开提供，方便你在世界空间或视图空间做光照计算。

#### 视口变换 / Viewport Transform

NDC 还要经过视口变换才到屏幕像素：

NDC undergoes a viewport transform to reach screen pixels:

```text
screenX = (ndc.x * 0.5 + 0.5) * width
screenY = (ndc.y * 0.5 + 0.5) * height
screenZ = (ndc.z * 0.5 + 0.5)    → depth buffer [0,1]
```

`renderer.setViewport(x, y, w, h)` 改变这个映射，可用于分屏渲染。

`renderer.setViewport` changes this mapping — useful for split-screen rendering.

### 管线各阶段的执行频率 / Execution Frequency per Stage

```text
顶点数 N，片元数 F（通常 F >> N）
顶点着色器：N 次
图元装配：  N/3 次（三角形）
光栅化：    生成 F 个片元
片元着色器：F 次
深度测试：  F 次
```

所以优化重点是：减少片元数量（降低分辨率、LOD、剔除），或降低片元着色器复杂度。

Optimization priority: reduce fragment count (lower resolution, LOD, culling) or simplify the fragment shader.

#### 一个具体的计数例子 / A Concrete Counting Example

一个 32×32 分段的 BoxGeometry 有 `33×33×6 = 6534` 个顶点。若它覆盖屏幕 400×400 像素的区域，光栅化约产生 `160,000` 个片元。顶点着色器跑 6534 次，片元着色器跑 160,000 次——片元是顶点的约 25 倍。如果场景里有 100 个这样的盒子，片元着色器总执行 1600 万次/帧。这就是为什么移动端要严格控片元数。

A 32×32-segment BoxGeometry has `33×33×6 = 6534` vertices. Covering a 400×400 pixel region yields ~`160,000` fragments — 25× the vertices. With 100 such boxes, the fragment shader runs 16M times per frame. This is why mobile must tightly control fragment count.

## 常见陷阱 / Common Pitfalls

1. **忘了除以 w**：自己计算 NDC 时若忘记透视除法，坐标会错乱。 / Forgetting perspective divide when computing NDC manually produces wrong coords.
2. **varying 名字不匹配**：顶点和片元着色器里 varying 必须同名同类型，否则链接失败。 / Varying names/types must match between stages or linking fails.
3. **attribute 用在片元着色器**：attribute 只能在顶点着色器声明，片元要用 varying 接收。 / `attribute` is vertex-only; use `varying` to pass to fragment.
4. **ShaderMaterial 与 RawShaderMaterial 混淆**：RawShaderMaterial 不注入 `projectionMatrix` 等，直接复制 ShaderMaterial 代码会编译失败。 / RawShaderMaterial doesn't inject built-ins; pasting ShaderMaterial code into it fails.
5. **精度未声明**：片元着色器在移动端默认精度可能不是 highp，建议显式 `precision highp float;`。 / Mobile fragment shaders may default to low precision; declare `precision highp float;`.
6. **深度测试方向理解反**：深度值越小越近（默认 LESS），不是越大越近。 / Smaller depth = closer (default LESS), not larger.
7. **不写 `gl_Position`**：顶点着色器必须赋值 `gl_Position`，否则管线无输出。 / The vertex shader must assign `gl_Position` or nothing renders.

## 调试技巧 / Debugging Tips

- **把坐标当颜色输出**：`gl_FragColor = vec4(vPos * 0.5 + 0.5, 1.0)` 可直接观察位置空间。 / Output position as color to visualize a space.
- **分阶段注释**：先只输出顶点位置，确认顶点着色器正确，再加片元逻辑。 / Isolate the vertex shader first, then add fragment logic.
- **用 `renderer.debug.checkShaderErrors = true`**：确保编译错误被打印。 / Ensure shader compile errors are printed.
- **检查 uniform 是否上传**：在 `onBeforeCompile` 或每帧打印 `material.uniforms.uTime.value`。 / Log uniform values each frame to confirm they upload.
- **缩小到单三角形**：用一个三角形调试比用复杂模型快得多。 / Debug with a single triangle, not a full model.

## 练习 / Exercises

1. 在示例中加入"视图空间"可视化模式，把 viewPos 映射为颜色。 / Add a "view space" mode mapping viewPos to color.
2. 修改片元着色器，让靠近 `z=0`（NDC 中间）的片元变白，观察深度分布。 / Highlight fragments near `z=0` in NDC to observe depth distribution.
3. 用 `RawShaderMaterial` 重写示例，手动声明 `projectionMatrix` 等 uniform，体会差异。 / Rewrite with `RawShaderMaterial`, declaring matrices manually.
4. 关闭深度测试 `depthTest=false`，观察绘制顺序导致的错误。 / Disable `depthTest` and observe draw-order artifacts.
5. 计算并打印一个 1920×1080 全屏三角形的片元数量级。 / Estimate the fragment count for a full-screen triangle at 1920×1080.
6. 开启 `renderer.logarithmicDepthBuffer`，观察远处 Z-fighting 是否缓解，并解释原理。 / Enable logarithmic depth buffer and observe whether distant Z-fighting eases.
7. 用 `renderer.info.render` 读取一次 draw call 的顶点数与三角形数，对照你的计算。 / Read `renderer.info.render` to compare actual vertex/triangle counts with your estimate.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/17-render-pipeline/index.html`](../../examples/17-render-pipeline/index.html)

核心：用 ShaderMaterial 可视化一个立方体在不同坐标空间的输出，GUI 切换空间模式。

Core: a ShaderMaterial visualizes a cube's coordinates in different spaces, with a GUI to switch modes.

```glsl
// 顶点着色器 / Vertex shader
varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNdc;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vec4 viewPos = viewMatrix * worldPos;
  vViewPos = viewPos.xyz;
  vec4 clipPos = projectionMatrix * viewPos;
  vNdc = clipPos.xyz / clipPos.w;        // 透视除法 / perspective divide
  gl_Position = clipPos;
}
```

```glsl
// 片元着色器 / Fragment shader
uniform int uMode;                       // 0:NDC 1:世界 2:视图 3:法线
varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNdc;
varying vec3 vNormal;
void main() {
  vec3 c;
  if (uMode == 0)      c = vNdc * 0.5 + 0.5;
  else if (uMode == 1) c = vWorldPos * 0.5 + 0.5;
  else if (uMode == 2) c = vViewPos * 0.5 + 0.5;
  else                 c = vNormal * 0.5 + 0.5;
  gl_FragColor = vec4(c, 1.0);
}
```

```js
// JS：切换模式 / Switch mode
const material = new THREE.ShaderMaterial({
  uniforms: { uMode: { value: 0 }, uTime: { value: 0 } },
  vertexShader, fragmentShader,
});
gui.add({ mode: 0 }, 'mode', { NDC: 0, World: 1, View: 2, Normal: 3 })
   .onChange(v => material.uniforms.uMode.value = v);
```

## 参考资源 / References

- [Three.js Docs - ShaderMaterial](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [Three.js Manual - Custom shaders](https://threejs.org/manual/#en/custom-shader)
- [WebGL Fundamentals - How it works](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)
- [The Book of Shaders](https://thebookofshaders.com/)
- [LearnOpenGL - Hello Triangle](https://learnopengl.com/Getting-started/Hello-Triangle)
- [LearnOpenGL - Coordinate Systems](https://learnopengl.com/Getting-started/Coordinate-Systems)
- [Khronos - WebGL 2.0 Spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [Scratchapixel - Rasterization Stage](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation)

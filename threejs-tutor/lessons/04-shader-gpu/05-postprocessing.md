# 后处理 / Postprocessing

> 阶段 / Phase: 四、Shader 和 GPU 渲染 / Shader & GPU Rendering
> 预计用时 / Estimated: 3–4 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

后处理是渲染管线的"第二段"：先把整个场景渲染到一张纹理（Render Target），再把这张纹理当作输入，经过一个个全屏 Pass（通道）处理后输出到屏幕。Bloom（辉光）、FXAA、景深、边缘描边、像素化、故障、调色，都是后处理。本节讲解 Three.js 的 `EffectComposer` 体系、Pass 的连接原理、常用内置 Pass，并实现一个 Bloom 后处理示例。

Postprocessing is the "second half" of the pipeline: the scene is first rendered to a texture (render target), then that texture is fed through a chain of full-screen passes before reaching the screen. Bloom, FXAA, DoF, edge outline, pixelation, glitch, and color grading are all postprocessing. This lesson covers Three.js's `EffectComposer` system, how passes chain together, common built-in passes, and implements a Bloom example.

## 核心概念 / Core Concepts

### 1. 后处理的数据流 / Data Flow

```text
scene + camera
    │  RenderPass
    ▼
┌───────────────┐
│ RenderTarget  │  ← writeBuffer（场景纹理）
└───────────────┘
    │  ShaderPass / UnrealBloomPass / ...
    ▼
┌───────────────┐
│ RenderTarget  │  ← readBuffer（ping-pong 交换）
└───────────────┘
    │  ...
    ▼  OutputPass / RenderPass to screen
   屏幕 Screen
```

关键点：场景不再直接画到屏幕，而是画到一张离屏纹理；每个 Pass 读取上一张纹理、处理后写到下一张，像流水线传递。最后由 `OutputPass`（或 `RenderPass` 的 `renderToScreen`）输出到屏幕。

Key: the scene is no longer drawn directly to the screen but to an offscreen texture; each Pass reads the previous texture, processes it, writes the next — a pipeline. Finally `OutputPass` (or `renderToScreen`) writes to the screen.

### 2. EffectComposer / EffectComposer

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));   // 第一步：渲染场景 / step 1: render scene
// 后续 Pass 顺序很重要 / order matters
composer.addPass(bloomPass);
composer.addPass(outputPass);

// 渲染循环里用 composer 代替 renderer.render / use composer in loop
function animate() {
  composer.render();
}
```

`EffectComposer` 内部维护 `readBuffer` / `writeBuffer` 两个 RenderTarget，每执行一个 Pass 就交换二者（ping-pong）。

`EffectComposer` maintains two render targets and swaps them (ping-pong) after each pass.

### 3. RenderPass / RenderPass

第一个 Pass，把场景渲染到当前 RenderTarget。它本质就是调用 `renderer.render(scene, camera)`，但输出到纹理而非屏幕。

The first pass: renders the scene to the current render target. It's essentially `renderer.render` but output to a texture instead of the screen.

### 4. ShaderPass / ShaderPass

用一个自定义 shader 处理输入纹理。最灵活，可写任意全屏效果：

Processes the input texture with a custom shader — the most flexible pass, any full-screen effect:

```js
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const grayscale = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float g = dot(c.rgb, vec3(0.299,0.587,0.114));
      gl_FragColor = vec4(vec3(g), 1.0);
    }
  `,
};
composer.addPass(new ShaderPass(grayscale));
```

`tDiffuse` 是约定俗成的输入纹理 uniform 名。

`tDiffuse` is the conventional uniform name for the input texture.

### 5. UnrealBloomPass / UnrealBloomPass

辉光：提取画面中亮于阈值的区域，做高斯模糊，叠加回原图。

Bloom: extract regions brighter than a threshold, blur them, add back to the image.

```js
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  strength,    // 强度 / strength（默认 1.5）
  radius,      // 模糊半径 / radius（默认 0.4）
  threshold,   // 亮度阈值 / threshold（默认 0.85，越小越多区域发光）
);
composer.addPass(bloom);
```

### 6. OutputPass / OutputPass

r152+ 引入，负责色调映射（tone mapping）与色彩空间转换（sRGB）。应放在 Pass 链**最后**，替代手写 `gamma` 与 `toneMapping`。否则颜色会偏暗或过亮。

Introduced in r152, `OutputPass` applies tone mapping and sRGB conversion. It belongs at the **end** of the chain, replacing manual gamma/toneMapping. Without it colors look off.

### 7. RenderTarget / RenderTarget

后处理底层依赖 `WebGLRenderTarget`——一块 GPU 显存纹理 + 深度缓冲。`EffectComposer` 自动创建并管理 ping-pong 的两个 target，但你也可以手动创建以做自定义多通道（如拾取、反射）：

Postprocessing builds on `WebGLRenderTarget` — a GPU texture + depth buffer. `EffectComposer` auto-creates two ping-pong targets, but you can create your own for custom multi-pass setups (picking, reflection):

```js
const rt = new THREE.WebGLRenderTarget(width, height, {
  type: THREE.HalfFloatType,        // HDR，bloom 推荐 / HDR for bloom
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
});
renderer.setRenderTarget(rt);
renderer.render(scene, camera);
renderer.setRenderTarget(null);
```

### 8. 常见 Pass 一览 / Common Passes

| Pass | 效果 / Effect |
| --- | --- |
| `RenderPass` | 渲染场景 / render scene |
| `OutputPass` | 色调映射 + sRGB 输出 / tonemap + sRGB |
| `UnrealBloomPass` | 辉光 / bloom |
| `ShaderPass` | 自定义全屏 shader / custom full-screen shader |
| `FXAAShader` (via ShaderPass) | 快速抗锯齿 / fast AA |
| `FilmPass` | 胶片噪点 + 扫描线 / film grain + scanline |
| `GlitchPass` | 故障 / glitch |
| `AfterimagePass` | 拖影 / afterimage trail |
| `HalftonePass` | 半色调网点 / halftone dots |
| `OutlinePass` | 物体描边 / object outline |

### 9. 手写一个 ShaderPass / Writing a Custom ShaderPass

理解后处理最好的方式是手写一个。以"暗角（Vignette）"为例，它只需读输入纹理、按距中心距离压暗边缘：

The best way to understand postprocessing is to write one. A vignette reads the input texture and darkens edges by distance from center:

```js
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },     // 约定：输入纹理 / convention: input texture
    uOffset:  { value: 1.0 },      // 暗角范围 / vignette spread
    uDarkness:{ value: 1.0 },      // 暗角强度 / darkness
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    uniform float uDarkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * uOffset;        // 中心偏移 / center offset
      float vignette = clamp(1.0 - dot(uv, uv), 0.0, 1.0);
      vignette = pow(vignette, uDarkness);
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};
composer.addPass(new ShaderPass(VignetteShader));
```

`ShaderPass` 的顶点着色器几乎永远是这个模板（把全屏 quad 的 UV 传给片元），你只需写片元逻辑。`tDiffuse` 是 Three 约定的输入纹理名，`ShaderPass` 会自动把上一个 Pass 的输出接到这里。

The vertex shader is almost always this template (pass the full-screen quad's UV to the fragment); you only write fragment logic. `tDiffuse` is Three's convention; `ShaderPass` auto-connects the previous pass's output.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `EffectComposer(renderer)` | 后处理容器 / postprocessing container |
| `composer.addPass(pass)` | 添加 Pass / add a pass |
| `composer.render()` | 执行整条 Pass 链 / run the whole chain |
| `composer.setSize(w,h)` | 调整所有 target 尺寸 / resize all targets |
| `composer.setPixelRatio(dpr)` | 设置像素比 / set pixel ratio |
| `RenderPass(scene, camera)` | 场景渲染 Pass / scene render pass |
| `UnrealBloomPass(res, strength, radius, threshold)` | 辉光 Pass / bloom pass |
| `ShaderPass(shader)` | 自定义 shader Pass / custom shader pass |
| `OutputPass` | 色调映射输出 / tonemapping output |
| `WebGLRenderTarget` | 离屏渲染目标 / offscreen render target |
| `pass.enabled` | 临时开关某个 Pass / toggle a pass |

## 原理 / Principles

### Bloom 的三步原理 / Three Steps of Bloom

```text
1. 亮度提取 brightness extract：texelColor = texture(tDiffuse, uv);
   luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
   if (luminance < threshold) discard;   // 只保留亮区
2. 高斯模糊 gaussian blur：多次 separable blur（横向+纵向）扩散亮区
3. 加性混合 additive blend：final = sceneColor + bloomColor * strength
```

为什么用 HDR（`HalfFloatType`）：亮区可能 > 1.0，LDR（8-bit）会钳到 1 丢失信息，辉光范围变窄。

Why HDR: bright regions may exceed 1.0; 8-bit LDR clamps them, narrowing the bloom.

### Ping-Pong 双缓冲 / Ping-Pong Double Buffering

每个 ShaderPass 的逻辑是"读 readBuffer、写 writeBuffer、然后交换"。这样 Pass 之间天然串联，无需每个 Pass 自己分配纹理。`composer.render()` 内部：

Each ShaderPass reads `readBuffer`, writes `writeBuffer`, then swaps — passes chain naturally without each allocating its own texture. Inside `composer.render()`:

```text
for each pass:
  pass.render(readBuffer, writeBuffer)
  swap(readBuffer, writeBuffer)
```

### Pass 顺序为何重要 / Why Pass Order Matters

- `RenderPass` 必须第一（产生初始画面）。
- `UnrealBloomPass` 应在 `OutputPass` 之前——bloom 在线性 HDR 空间计算才正确，`OutputPass` 做完色调映射后值被压缩。
- 抗锯齿（FXAA）应在最后或接近最后，处理的是最终画面。
- `OutputPass` 永远最后，做 sRGB 转换。

### 像素化的实现原理 / How Pixelation Works

```glsl
// 把 UV 量化到大格子 / quantize UV to chunky grid
vec2 size = vec2(pixelSize);
vec2 quantUv = floor(vUv / size) * size + size * 0.5;
gl_FragColor = texture2D(tDiffuse, quantUv);
```

只采样每个格子的中心，得到马赛克。这就是"像素化"。

Sample only each cell's center → mosaic. That's pixelation.

### 色彩调制的实现原理 / How Color Grading Works

调色（color grading）本质是对输入颜色做矩阵变换或 LUT 查表。最简单的亮度/对比度/饱和度：

Color grading is essentially a matrix transform or LUT lookup on input color. Simplest brightness/contrast/saturation:

```glsl
uniform sampler2D tDiffuse;
uniform float uBrightness;   // 亮度 -1..1
uniform float uContrast;     // 对比度 -1..1
uniform float uSaturation;   // 饱和度 -1..1
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  // 亮度 / brightness
  c += uBrightness;
  // 对比度 / contrast
  c = (c - 0.5) * (1.0 + uContrast) + 0.5;
  // 饱和度：向灰度靠拢 / saturation: lerp toward grayscale
  float gray = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(gray), c, 1.0 + uSaturation);
  gl_FragColor = vec4(c, 1.0);
}
```

更高级的调色用 3D LUT（颜色查找表）做任意映射，电影级调色常用此法。

Advanced grading uses 3D LUTs for arbitrary color mapping — standard in film-grade color work.

### 后处理的性能代价 / Performance Cost of Postprocessing

每个 Pass = 一次全屏 draw call + 至少一次纹理采样。在 1080p 下，一次全屏 Pass 约处理 200 万片元。性能预算：

Each pass = one full-screen draw call + ≥1 texture sample. At 1080p, one full-screen pass processes ~2M fragments. Budget:

```text
1080p, 5 个 Pass：5 × 2M = 1000 万次片元着色器 / 10M fragment shader runs
移动端 720p，3 个 Pass：3 × 0.9M = 270 万次
```

优化手段 / optimization:
- 降低 `composer.setPixelRatio`（如 0.75）→ 线性减少片元。
- Bloom 只在低分辨率 target 上做模糊（`UnrealBloomPass` 内部已如此）。
- 合并简单 Pass：把 vignette + 调色 + 扫描线写进一个 ShaderPass，省两次全屏采样。
- 移动端少用 `AfterimagePass`（需保留前一帧）、`OutlinePass`（需额外 render target）。

## 常见陷阱 / Common Pitfalls

1. **忘了 `OutputPass`**：颜色偏暗或过饱和，因为缺少 sRGB 转换。 / Forgetting `OutputPass` yields dark/oversaturated colors.
2. **Pass 顺序错**：bloom 放在 OutputPass 之后，辉光范围失真。 / Bloom after OutputPass distorts the bloom range.
3. **resize 不调 `composer.setSize`**：窗口缩放后 target 分辨率不变，画面模糊。 / Not resizing composer → blurry output after window resize.
4. **`renderer.render` 与 `composer.render` 重复**：两者只能用一个，否则画两遍。 / Don't call both `renderer.render` and `composer.render`.
5. **bloom threshold 设 0**：整屏发光，失去重点。 / threshold=0 makes everything glow.
6. **HDR target 类型用 UnsignedByte**：bloom 亮区被钳到 1，效果弱。 / LDR target clamps bloom highlights.
7. **`pass.enabled=false` 没用**：其实有效，但若该 Pass 是最后一个且 `renderToScreen` 没设对，屏幕不更新。 / Setting `enabled=false` works, but the last pass must have `renderToScreen`.
8. **性能**：每个 Pass 都是一次全屏 draw + 一次纹理采样 pass，移动端慎用。 / Each pass is a full-screen draw; use sparingly on mobile.

## 调试技巧 / Debugging Tips

- **逐 Pass 检查**：临时把目标 Pass 之后的所有 Pass `enabled=false`，看该 Pass 输出。 / Disable passes after the one you're inspecting.
- **`pass.enabled` 开关**：用 GUI 一键切换，对比有无后处理。 / Toggle via GUI to compare.
- **检查 target**：`composer.readBuffer.texture` 可挂到一个 plane 上查看。 / Display `readBuffer.texture` on a plane.
- **先 OutputPass 再加效果**：确保基础管线正确再加 bloom 等。 / Establish the base pipeline before adding effects.
- **控制台看 Pass 数**：`composer.passes.length`，避免意外叠加。 / Log `composer.passes.length` to avoid accidental stacking.
- **移动端降分辨率**：`composer.setPixelRatio` 设低，bloom radius 调小。 / Lower pixel ratio on mobile.

## 练习 / Exercises

1. 在示例里加一个 `ShaderPass` 实现灰度后处理，用 GUI 切换。 / Add a grayscale ShaderPass toggled via GUI.
2. 用 `ShaderPass` 实现像素化，并让 `pixelSize` 可调。 / Implement pixelation with adjustable `pixelSize`.
3. 添加 `GlitchPass`，观察故障效果。 / Add `GlitchPass` and observe.
4. 把 `threshold` 调到 0.2 和 0.95，对比发光区域差异。 / Compare threshold 0.2 vs 0.95.
5. 手动创建一个 `WebGLRenderTarget`，把场景渲染到它，再贴到另一个场景的镜面上。 / Render scene to a render target and map it onto a mirror mesh.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/21-postprocessing/index.html`](../../examples/21-postprocessing/index.html)

核心：发光立方体场景 + EffectComposer + RenderPass + UnrealBloomPass + OutputPass，GUI 切换直接渲染与后处理、调节 bloom 参数。

Core: emissive-cube scene + EffectComposer + RenderPass + UnrealBloomPass + OutputPass; GUI toggles direct vs composer and adjusts bloom.

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.2,   // strength
  0.4,   // radius
  0.6,   // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// GUI 切换 / toggle
gui.add(params, 'useComposer').onChange(v => {
  bloom.enabled = v;
});

function animate() {
  if (params.useComposer) composer.render();
  else renderer.render(scene, camera);
}
```

## 参考资源 / References

- [Three.js Docs - EffectComposer](https://threejs.org/docs/#examples/en/postprocessing/EffectComposer)
- [Three.js Examples - Postprocessing](https://threejs.org/examples/#webgl_postprocessing)
- [Three.js Examples - Bloom (UnrealBloom)](https://threejs.org/examples/#webgl_postprocessing_unreal_bloom)
- [Three.js Manual - Postprocessing](https://threejs.org/manual/#en/post-processing)
- [LearnOpenGL - Bloom](https://learnopengl.com/Advanced-Lighting/Bloom)
- [LearnOpenGL - Gamma Correction](https://learnopengl.com/Advanced-Lighting/Gamma-Correction)
- [Three.js OutputPass (r152)](https://threejs.org/docs/#examples/en/postprocessing/OutputPass)
- [WebGL Fundamentals - Image processing](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html)

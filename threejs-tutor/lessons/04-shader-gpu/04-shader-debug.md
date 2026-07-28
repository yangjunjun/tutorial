# Shader 调试 / Shader Debugging

> 阶段 / Phase: 四、Shader 和 GPU 渲染 / Shader & GPU Rendering
> 预计用时 / Estimated: 2–3 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

Shader 没有 `console.log`，不能打断点，出错时往往只剩一片黑屏。但有一条万能调试法：**把中间变量映射成颜色，用眼睛看**。本节系统讲解 Shader 调试方法论——如何把复杂公式拆成中间变量、如何用颜色编码观察标量与向量、如何调试法线/UV/深度/位置，并以一个噪声地形为试验场，用 GUI 下拉切换不同调试通道，让你看清每个中间值。

Shaders have no `console.log` and no breakpoints; a bug often means a black screen. But there is one universal method: **map intermediate values to color and look with your eyes**. This lesson systematizes shader debugging — splitting formulas into intermediate variables, color-coding scalars and vectors, debugging normals/UV/depth/position — using a noise terrain as a testbed with a GUI dropdown to switch debug channels.

## 核心概念 / Core Concepts

### 1. 调试总思路 / The Master Method

```text
复杂公式 complex formula
  → 拆成中间变量 split into intermediate vars (v1, v2, v3 ...)
  → 把某个变量映射到 [0,1] 并赋给 gl_FragColor
  → 观察颜色，判断该变量是否正确
  → 逐级排查，定位错误环节
```

核心动作只有一句：`gl_FragColor = vec4( visualize(var), 1.0 )`。

The core action is a single line: `gl_FragColor = vec4( visualize(var), 1.0 )`.

### 2. 调试标量 / Debugging Scalars

标量（float）映射到灰度或彩虹色：

Map a float to grayscale or rainbow:

```glsl
float h = noise(vUv * 5.0);           // 假设范围 [-1,1]
// 灰度 / grayscale：先 remap 到 [0,1]
gl_FragColor = vec4(vec3(h * 0.5 + 0.5), 1.0);

// 彩虹 / rainbow：用 h 做 hue
vec3 rainbow = vec3(0.5) + 0.5 * cos(6.2831 * (h + vec3(0.0, 0.33, 0.67)));
gl_FragColor = vec4(rainbow, 1.0);
```

范围未知时，先加 `fract` 看周期，或用 `h * 0.5 + 0.5` 假设 `[-1,1]`，若全白说明值偏大，全黑说明偏小，据此缩放。

When the range is unknown, use `fract` to see periodicity, or assume `[-1,1]` with `h*0.5+0.5`: all white means too large, all black too small — scale accordingly.

### 3. 调试向量 / Debugging Vectors

三维向量（位置、法线、方向）直接当颜色，但需先 remap `[-1,1]→[0,1]`：

3D vectors (position, normal, direction) become color directly, remapping `[-1,1]→[0,1]`:

```glsl
// 法线 / normal
gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);

// 世界位置 / world position（范围大，需缩放）
gl_FragColor = vec4(worldPos * 0.2 + 0.5, 1.0);

// UV（已在 [0,1]）
gl_FragColor = vec4(vUv, 0.0, 1.0);

// 视图方向 / view direction
vec3 vDir = normalize(cameraPosition - worldPos);
gl_FragColor = vec4(vDir * 0.5 + 0.5, 1.0);
```

### 4. 调试法线 / Debugging Normals

法线是最常出错也最好排查的量。标准可视化：

Normals are the most error-prone yet easiest to inspect:

```glsl
// 顶点 / vertex：把世界法线传给片元
varying vec3 vNormal;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  ...
}
```

```glsl
// 片元 / fragment
varying vec3 vNormal;
void main() {
  vec3 N = normalize(vNormal);      // 一定要 normalize，插值后长度会变
  gl_FragColor = vec4(N * 0.5 + 0.5, 1.0);
  // 法线朝 +X 显示红，+Y 绿，+Z 蓝；若全紫说明法线异常
}
```

读色法：朝上的面应该是绿色（`+Y`），朝右红（`+X`），朝你蓝（`+Z`）。颜色错乱说明法线计算有误。

Reading colors: up-facing surfaces should be green (+Y), right red (+X), toward you blue (+Z). Wrong colors mean wrong normals.

### 5. 调试深度与位置 / Debugging Depth & Position

```glsl
// 片元深度 / fragment depth（[0,1]，近=0 远=1）
float d = gl_FragCoord.z;
gl_FragColor = vec4(vec3(d), 1.0);   // 通常很暗，需放大 d*10

// 视图空间 z（负值，越远越负）
float viewZ = -vViewPos.z;
gl_FragColor = vec4(vec3(viewZ * 0.1), 1.0);

// 裁剪空间 / NDC
vec3 ndc = gl_Position.xyz / gl_Position.w;
gl_FragColor = vec4(ndc * 0.5 + 0.5, 1.0);
```

### 6. 调试 UV 与重复 / Debugging UV & Tiling

```glsl
gl_FragColor = vec4(vUv, 0.0, 1.0);          // 红=X，绿=Y
gl_FragColor = vec4(fract(vUv * 5.0), 0.0, 1.0); // 放大 5 倍看重复
// 棋盘格验证 UV 方向 / checker to verify UV orientation
float checker = mod(floor(vUv.x * 10.0) + floor(vUv.y * 10.0), 2.0);
gl_FragColor = vec4(vec3(checker), 1.0);
```

### 7. 单通道隔离 / Single-Channel Isolation

只显示某一通道，排除其他干扰：

Show only one channel to isolate:

```glsl
// 只看红色通道的值 / only red channel
gl_FragColor = vec4(vec3(value), 1.0);   // 标量放红通道，其余 0
// 只看某个分量的贡献
gl_FragColor = vec4(normal.x, 0.0, 0.0, 1.0);
```

### 8. 编译期错误 / Compile-Time Errors

Shader 编译失败时，Three.js 会在控制台打印错误（需 `renderer.debug.checkShaderErrors = true`，默认开）。常见错误信息：

When a shader fails to compile, Three.js logs errors (requires `checkShaderErrors`, on by default):

```text
ERROR: 0:12: 'position' : undeclared identifier      → 忘记声明 attribute/uniform
ERROR: 0:20: 'assign' : cannot convert ...           → 类型不匹配
ERROR: 0:5: 'function' : ... no matching overloaded function → 函数参数类型错
```

### 9. 读色法：从颜色反推数值 / Reading Colors Back to Values

调试的瓶颈不是"输出颜色"，而是"看懂颜色"。建立颜色→数值的直觉是关键技能：

The bottleneck isn't outputting color — it's reading it. Build a color→value intuition:

```text
颜色 Color          含义 Meaning
纯黑 (0,0,0)        值为 -1（[-1,1]映射）或 0（[0,1]映射）或被 discard
纯白 (1,1,1)        值达到范围上限
均匀中灰            值恒定，没有变化 → 可能变量没被使用或插值丢失
红绿渐变            UV 在 x/y 方向变化正常（红=x，绿=y）
纯红 (1,0,0)        向量 = (1,0,0)：指向 +X
黄绿 (0,1,0)        指向 +Y（朝上）
蓝色 (0,0,1)        指向 +Z（朝相机）
紫色 (0.5,0,0.5)    法线在 XZ 平面，水平方向
全块同色            片元间无变化 → 可能 varying 没传或计算在顶点而非片元
```

当法线调试出现"彩虹但平滑"说明正确；若出现"块状/硬边"说明法线未 normalize 或几何法线错误。

Smooth rainbow normals = correct; blocky/hard edges = un-normalized or bad geometry normals.

### 10. 等值线与热力图 / Isolines & Heatmaps

数值范围大时，灰度难以分辨。加等值线或热力图能看清分布：

When values span a wide range, grayscale is hard to read; isolines or heatmaps help:

```glsl
float v = vHeight;                       // 待调试值 / value to debug
// 热力图 / heatmap
vec3 heat = vec3(0.5) + 0.5 * cos(6.2831 * (v + vec3(0.0, 0.33, 0.67)));
// 等值线：每隔 0.1 一条线 / isolines every 0.1
float line = smoothstep(0.48, 0.50, abs(fract(v * 10.0) - 0.5));
heat = mix(heat, vec3(1.0), line * 0.5);
gl_FragColor = vec4(heat, 1.0);
```

### 11. 分阶段调试法 / The Layered Debugging Workflow

遇到黑屏不要乱改，按固定流程排查：

Don't flail on a black screen; follow a fixed workflow:

```text
1. 编译是否通过？ → 看控制台 ERROR 行
2. 几何是否可见？ → 临时换成 MeshBasicMaterial 红色，确认非剔除/相机问题
3. 顶点位置对吗？ → 输出 position*0.5+0.5 当颜色
4. UV 对吗？     → 输出 vec4(vUv,0,1)
5. varying 传到了吗？ → 输出 varying 本身
6. uniform 值对吗？ → 输出 uniform 当颜色（uTime→sin 当灰度）
7. 中间计算对吗？ → 逐个中间变量输出
8. 最终合成对吗？ → 逐项加回，定位哪项出错
```

这套流程能 90% 的 shader bug 在 10 分钟内定位。关键纪律：**一次只改一个变量**。

This workflow localizes 90% of shader bugs in 10 minutes. The discipline: **change one variable at a time**.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `gl_FragColor = vec4(var, 1.0)` | 把变量当颜色输出 / Output a variable as color |
| `gl_FragCoord` | 片元像素坐标与深度 / Fragment pixel coords & depth |
| `gl_FragCoord.z` | 片元深度 [0,1] / Fragment depth |
| `renderer.debug.checkShaderErrors` | 开关编译错误检查 / Toggle compile error checking |
| `material.onBeforeCompile(shader)` | 拦截并修改 shader 源码 / Intercept & patch shader source |
| `renderer.info.programs` | 查看已编译程序 / Inspect compiled programs |
| `THREE.ShaderMaterial.defines` | 用 `#define DEBUG 1` 切换调试分支 / Toggle debug via defines |
| `console.log(shader.vertexShader)` | 在 `onBeforeCompile` 里打印完整 GLSL / Print full GLSL |

## 原理 / Principles

### 为什么颜色是 Shader 的"log" / Why Color Is the Shader's "Log"

GPU 对每个片元独立执行，无法把成千上万片元的值汇总成文本。但屏幕本身就是一个百万像素的颜色阵列——把变量映射成颜色，等于把"每个片元的变量值"铺满屏幕一次性展示。这是 GPU 架构决定的唯一高效可视化手段。

The GPU executes each fragment independently and can't aggregate millions of values into text. But the screen is already a million-pixel color array — mapping a variable to color lays out every fragment's value at once. This is the only efficient visualization the GPU's architecture allows.

### 范围归一化的数学 / Range Normalization Math

颜色分量是 `[0,1]`，而 Shader 变量范围各异。归一化策略：

Color channels are `[0,1]`; shader variables vary. Normalization strategies:

```text
已知 [a,b]：   t = (x - a) / (b - a)
已知对称 [-r,r]： t = x / (2r) + 0.5
未知范围：     t = fract(x)       // 看周期
未知范围：     t = x * 0.5 + 0.5  // 假设 [-1,1]，按全黑/全白再缩放
大范围：       t = 1.0 - exp(-x)  // 指数压缩
```

### 调试法线时为什么必须 normalize / Why Normalize When Debugging Normals

法线在顶点→片元经过光栅化插值，插值会改变向量长度（重心加权平均不保长）。若直接 `vNormal*0.5+0.5` 不 normalize，颜色会偏暗且不均匀。`normalize(vNormal)` 恢复单位长度，颜色才准确反映方向。

Normals are interpolated during rasterization; interpolation changes vector length (barycentric averaging isn't length-preserving). Without `normalize`, colors appear dark and uneven. `normalize(vNormal)` restores unit length so color faithfully reflects direction.

### 调试黑白屏的决策树 / Black/White Screen Decision Tree

```text
全黑 Black screen
├─ 编译错误？ → 控制台看 ERROR（最常见：undeclared identifier）
├─ 几何被剔除？ → 换 MeshBasicMaterial 红色，若仍黑 → 相机/远近/背面剔除问题
├─ position 范围错？ → 输出 position*0.5+0.5，若全黑说明顶点在 NDC 外
├─ uniform 未传？ → 输出 uniform 值当颜色，若全黑说明值为 0 或 NaN
└─ discard 误触？ → 注释掉所有 discard

全白 White screen
├─ 值溢出？ → 加 clamp(value, 0,1) 或缩小倍数
├─ NaN 传染？ → 任何含 NaN 的运算结果都是 NaN，渲染为黑或白
└─ 除零 → normalize(0) 产生 NaN，排查零向量

闪烁 Flicker
├─ mediump 精度不足 → 加 precision highp float
├─ Z-fighting → 加 polygonOffset 或拉开深度
└─ 时间步不稳 → 用 clock.getElapsedTime() 而非累加
```

### NaN 的传播与检测 / NaN Propagation & Detection

GLSL 中 NaN（Not a Number）一旦产生，会沿运算链传染到底，最终渲染成黑色或不确定颜色。常见 NaN 来源：`normalize(vec3(0))`、`0.0/0.0`、`pow(负数, 非整数)`、`log(0)`。检测 NaN 没有直接函数，但可用 `x != x` 判断：

In GLSL, NaN propagates through the entire computation chain, rendering as black or undefined. Sources: `normalize(vec3(0))`, `0/0`, `pow(negative, non-integer)`, `log(0)`. Detect via `x != x`:

```glsl
if (isnan(value)) gl_FragColor = vec4(1,0,1,1);  // 品红标记 NaN
// GLSL 无 isnan，用 / GLSL has no isnan; use:
if (value != value) gl_FragColor = vec4(1,0,1,1);
```

## 常见陷阱 / Common Pitfalls

1. **忘记归一化范围**：变量是 `[-1,1]` 却直接当颜色，负值被钳到 0，看不出结构。 / Forgetting to remap `[-1,1]` to `[0,1]` clamps negatives to 0, hiding structure.
2. **法线不 normalize**：插值后法线长度变化，颜色误导。 / Not normalizing interpolated normals misleads the eye.
3. **只看最终输出**：直接看 `gl_FragColor` 的一长串公式，无法定位错误环节。 / Inspecting only the final expression can't localize the bug.
4. **深度太暗看不清**：深度集中在 0.99 附近，需放大 `(d-0.9)*20`。 / Depth clusters near 0.99; scale `(d-0.9)*20` to see.
5. **`checkShaderErrors=false`**：为了性能关掉检查，编译失败静默黑屏。 / Disabling error checks yields silent black screens.
6. **以为能 `console.log`**：GLSL 里没有打印函数，只能用颜色。 / GLSL has no print; color is the only way.
7. **调试代码留在发布版**：调试分支拖慢片元着色器，发布前要用 `#ifdef DEBUG` 移除。 / Debug branches slow the fragment shader; gate with `#ifdef DEBUG`.

## 调试技巧 / Debugging Tips

- **分级调试**：先确认输入（UV/position），再确认中间量，最后确认输出。 / Debug in layers: inputs → intermediates → output.
- **用 `#define DEBUG_MODE n`**：一个宏切换多种调试通道，发布时关掉。 / Use a `#define` to switch channels, off in release.
- **画等值线**：`abs(fract(v*10.0)-0.5) < 0.02` 高亮某值附近，看变量分布。 / Draw isolines to see value distribution.
- **角点标色**：在 UV 四角放不同纯色，确认 UV 朝向。 / Put distinct colors at UV corners to verify orientation.
- **降分辨率**：用 `gl_FragCoord` 画大像素方块，减少片元数加快观察。 / Lower resolution to speed up iteration.
- **对照参考**：把同位置的法线与 `MeshNormalMaterial` 输出对比。 / Compare your normals against `MeshNormalMaterial`.
- **分通道输出**：把不同中间量放 R/G/B，一次看三个变量。 / Pack three intermediates into R/G/B.

## 练习 / Exercises

1. 在示例地形里加一个"等高线"调试模式，高亮 `h` 的整数等值。 / Add a contour debug mode highlighting integer levels of `h`.
2. 把视图方向 `viewDir` 映射成颜色，观察它是否随相机移动变化。 / Map `viewDir` to color and verify it changes with camera.
3. 故意写错法线（不乘 `normalMatrix`），观察调试颜色如何变化。 / Intentionally skip `normalMatrix` and observe the color error.
4. 用 `gl_FragCoord.z` 做深度可视化，并放大到可观察范围。 / Visualize `gl_FragCoord.z`, scaled to be visible.
5. 把三个中间量分别放入 R/G/B 通道同时观察。 / Pack three intermediates into R/G/B at once.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/20-shader-debug/index.html`](../../examples/20-shader-debug/index.html)

核心：噪声地形 Shader，GUI 下拉切换 7 种输出（法线/UV/深度/位置/高度/调试红通道/真实效果）。

Core: a noise-terrain shader with a GUI dropdown switching 7 outputs.

```glsl
// 片元 / fragment（节选 / excerpt）
uniform int uDebug;   // 0:final 1:normal 2:uv 3:depth 4:position 5:height 6:dbgRed
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPos;
varying float vHeight;
void main() {
  vec3 c;
  if      (uDebug == 0) c = lighting(vNormal, vHeight);          // 真实效果
  else if (uDebug == 1) c = normalize(vNormal) * 0.5 + 0.5;      // 法线
  else if (uDebug == 2) c = vec3(vUv, 0.0);                      // UV
  else if (uDebug == 3) c = vec3(gl_FragCoord.z * 8.0);          // 深度（放大）
  else if (uDebug == 4) c = vWorldPos * 0.3 + 0.5;               // 位置
  else if (uDebug == 5) c = vec3(vHeight * 0.5 + 0.5);           // 高度灰度
  else                  c = vec3(vHeight, 0.0, 0.0);             // 单通道红
  gl_FragColor = vec4(c, 1.0);
}
```

## 参考资源 / References

- [Three.js Docs - WebGLProgram debug](https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram)
- [The Book of Shaders - Debugging](https://thebookofshaders.com/05/)
- [ShaderToy - how to debug](https://www.shadertoy.com/howto)
- [LearnOpenGL - Debugging shaders](https://learnopengl.com/In-Practice/Debugging)
- [OpenGL Insights - Shader debugging](https://www.openglinsights.com/)
- [Three.js MeshNormalMaterial](https://threejs.org/docs/#api/en/materials/MeshNormalMaterial)
- [Inigo Quilez - Drawing functions](https://iquilezles.org/articles/artfunctions/)
- [ShaderToy Debugging guide](https://iquilezles.org/articles/isolines/)

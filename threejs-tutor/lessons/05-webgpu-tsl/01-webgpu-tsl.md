# WebGPU 与 TSL / WebGPU and TSL

> 阶段 / Phase: 五、WebGPU 与 TSL / WebGPU & TSL
> 预计用时 / Estimated: 4–6 小时 / hours
> 难度 / Difficulty: Advanced

## 概述 / Overview

WebGPU 是下一代 Web 图形 API，旨在取代 WebGL。它更贴近现代 GPU（Vulkan / Metal / D3D12），提供更低的 CPU 开销、计算着色器（Compute Shader）和更可控的资源管理。Three.js 从 r163 起正式将 `WebGPURenderer` 作为推荐渲染器，同时让 `WebGLRenderer` 也兼容节点材质（Node Material）和 TSL，以便平滑迁移。本节讲解从 WebGL 到 WebGPU 的学习路径、TSL 节点式表达、Node Material、Compute Shader 以及 WebGL/WebGPU 的差异与回退策略。

WebGPU is the next-generation web graphics API designed to replace WebGL. It maps more closely to modern GPUs (Vulkan / Metal / D3D12), offering lower CPU overhead, compute shaders, and more explicit resource control. Since r163, Three.js promotes `WebGPURenderer` as the recommended renderer while making `WebGLRenderer` compatible with Node Material and TSL for smooth migration. This lesson covers the WebGL→WebGPU learning path, TSL node-based expressions, Node Material, compute shaders, and WebGL/WebGPU differences with fallback strategy.

## 核心概念 / Core Concepts

### 1. 学习顺序 / Learning Order

不要一开始就跳进 WebGPU。正确的路径是：

Don't jump into WebGPU first. The correct path is:

```text
WebGLRenderer          // 先掌握传统渲染管线 / master the classic pipeline first
  → GLSL ShaderMaterial  // 手写 GLSL 理解 attribute/uniform/varying / write GLSL by hand
    → Node Material       // 用节点描述材质逻辑 / describe material logic with nodes
      → TSL               // 用 JS 函数式语法构建节点 / build nodes with JS functional syntax
        → WebGPURenderer  // 切换渲染后端 / switch the render backend
          → Compute        // GPU 通用计算 / general-purpose GPU compute
```

每一层都建立在前一层的理解之上。Node Material 和 TSL 可以同时运行在 WebGLRenderer 和 WebGPURenderer 上——这就是 Three.js 的迁移策略：先换材质写法，再换渲染后端。

Each layer builds on the previous. Node Material and TSL run on both WebGLRenderer and WebGPURenderer — that's Three.js's migration strategy: change how you write materials first, then switch the backend.

### 2. WebGL vs WebGPU 差异 / WebGL vs WebGPU Differences

```text
WebGL (基于 OpenGL ES 2.0/3.0)
  - 状态机模型：设置状态 → 绘制 → 设置状态 → 绘制
  - 着色器语言：GLSL
  - 无计算着色器（用 GPGPU 技巧模拟）
  - CPU 开销较高（每帧反复设置状态）
  - 浏览器支持：几乎所有现代浏览器

WebGPU (基于 Vulkan/Metal/D3D12)
  - 命令缓冲模型：录制命令 → 一次提交
  - 着色器语言：WGSL（WebGPU Shading Language）
  - 原生计算着色器（Compute Shader）
  - CPU 开销低，更适合大规模绘制
  - 浏览器支持：Chrome 113+, Edge 113+, Safari 18+, Firefox 仍在推进
```

关键差异在于 WebGPU 更"显式"：你需要更清楚地声明资源布局，但这换来的是更低的驱动开销和更可预测的性能。

The key difference is WebGPU is more "explicit": you declare resource layouts more clearly, but in exchange you get lower driver overhead and more predictable performance.

### 3. Node Material / Node Material

Node Material 是 Three.js 的"节点化材质系统"。传统 ShaderMaterial 你直接写 GLSL 字符串；Node Material 你用 JS 对象（节点）描述数据流，Three.js 负责编译成 GLSL（WebGL）或 WGSL（WebGPU）。

Node Material is Three.js's "node-based material system." With traditional ShaderMaterial you write GLSL strings directly; with Node Material you describe data flow with JS objects (nodes), and Three.js compiles them to GLSL (WebGL) or WGSL (WebGPU).

```js
import * as Nodes from 'three/nodes';

const material = new Nodes.MeshStandardNodeMaterial();

// 用 TSL 表达式替换内置属性 / override built-in properties with TSL expressions
material.colorNode = Nodes.texture(myTexture);           // 等价于 map / equivalent to map
material.emissiveNode = Nodes.float(0.5).mul(Nodes.normalLocal); // 发光 = 0.5 × 法线 / emissive
material.positionNode = Nodes.positionLocal.add(
  Nodes.normalLocal.mul(Nodes.sin(Nodes.timerLocal()).mul(0.1))  // 顶点沿法线波动 / wave along normal
);
```

每个 `xxxNode` 属性接受一个"节点表达式"。节点可以像函数一样组合（`add`, `mul`, `sub`, `div`），形成一棵表达式树，最终被编译成着色器代码。

Each `xxxNode` property accepts a "node expression." Nodes compose like functions (`add`, `mul`, `sub`, `div`), forming an expression tree that's ultimately compiled into shader code.

### 4. TSL (Three.js Shading Language) / TSL

TSL 是 Node Material 的"语法糖"。它让节点表达式看起来更像写代码，而不是堆叠对象：

TSL is syntactic sugar for Node Material. It makes node expressions look more like writing code than stacking objects:

```js
import { Fn, vec3, float, uv, time, sin, cos, mix, normalize, positionLocal, normalLocal } from 'three/tsl';

// 用 Fn() 定义一个可复用的 TSL 函数 / define a reusable TSL function with Fn()
const waveDisplace = Fn(([pos]) => {
  const wave = sin(pos.x.add(time().mul(2))).mul(0.2); // sin(pos.x + time*2) * 0.2
  return pos.add(normalLocal.mul(wave));                // pos + normal * wave
});

// 在材质中使用 / use in material
material.positionNode = waveDisplace(positionLocal);
```

TSL 的核心优势：类型安全的 JS 写法，同时编译到 GLSL 和 WGSL，一套代码两个后端。

TSL's core advantage: type-safe JS syntax that compiles to both GLSL and WGSL — one codebase, two backends.

### 5. WebGPURenderer / WebGPURenderer

```js
import { WebGPURenderer } from 'three/webgpu';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init(); // WebGPU 需要异步初始化 / WebGPU requires async init

// 检查是否真的用了 WebGPU / check if WebGPU is actually active
console.log(renderer.backend.isWebGPUBackend); // true / false
```

`WebGPURenderer` 的 API 与 `WebGLRenderer` 高度相似（`setSize`, `setPixelRatio`, `render`, `setAnimationLoop`），但内部实现完全不同。它也能渲染普通材质（`MeshStandardMaterial` 等），不强制使用 Node Material。

`WebGPURenderer`'s API closely mirrors `WebGLRenderer` (`setSize`, `setPixelRatio`, `render`, `setAnimationLoop`), but the internals are completely different. It can also render standard materials (`MeshStandardMaterial`) without requiring Node Material.

### 6. 回退策略 / Fallback Strategy

WebGPU 尚未在所有浏览器可用。生产代码必须有回退：

WebGPU isn't available in all browsers yet. Production code must have a fallback:

```js
async function createRenderer() {
  // 尝试 WebGPU / try WebGPU
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const { WebGPURenderer } = await import('three/webgpu');
        const renderer = new WebGPURenderer({ antialias: true });
        await renderer.init();
        console.log('✅ WebGPU backend active');
        return { renderer, backend: 'webgpu' };
      }
    } catch (e) {
      console.warn('WebGPU init failed, falling back:', e);
    }
  }
  // 回退到 WebGL / fall back to WebGL
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  console.log('✅ WebGL backend active');
  return { renderer, backend: 'webgl' };
}
```

### 7. Storage Buffer 与 Compute Shader / Storage Buffer & Compute Shader

WebGPU 的杀手锏：计算着色器可以在 GPU 上做通用计算，不经过渲染管线。经典应用是 GPU 粒子系统——CPU 只负责发射和绘制，粒子位置更新全部在 GPU 完成。

WebGPU's killer feature: compute shaders can do general-purpose computation on the GPU without going through the render pipeline. The classic application is GPU particle systems — the CPU only handles emission and drawing, while particle position updates happen entirely on the GPU.

```js
import { storage, Fn, instanceIndex, workgroupCount } from 'three/tsl';

// 1. 声明 storage buffer / declare storage buffer
const particleCount = 100000;
const positions = storage(new THREE.ArrayBuffer(particleCount * 3 * 4)); // float32 × 3

// 2. 用 TSL 写 compute kernel / write compute kernel in TSL
const computeUpdate = Fn(() => {
  const i = instanceIndex;
  const x = positions.element(i).x;
  const y = positions.element(i).y;
  const z = positions.element(i).z;
  // 更新位置（示例：简单的重力下落）/ update position (simple gravity)
  positions.element(i).y = y.sub(0.01);
});

// 3. 每帧执行 / execute each frame
computeUpdate.compute(particleCount);
```

### 8. 粒子系统演进路线 / Particle System Evolution

```text
1. 100 个 Mesh          — 最简单，但每个都是独立 draw call
2. 10,000 个 Points     — 一个 draw call，但更新位置在 CPU
3. InstancedMesh        — 一个 draw call，GPU 渲染，CPU 更新
4. Shader 粒子          — 一个 draw call，顶点着色器内计算位置
5. GPGPU 粒子 (WebGL)   — 用纹理存储状态，片段着色器计算
6. WebGPU Compute 粒子  — storage buffer + compute shader，最优方案
```

每一步都减少 CPU 负担，把更多工作转移到 GPU 并行执行。

Each step reduces CPU burden, shifting more work to GPU parallel execution.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `WebGPURenderer` | WebGPU 渲染后端 / WebGPU render backend |
| `renderer.init()` | 异步初始化（WebGPU 必须）/ async init (required for WebGPU) |
| `navigator.gpu` | 浏览器 WebGPU API 入口 / browser WebGPU API entry |
| `MeshStandardNodeMaterial` | 节点版 StandardMaterial / node-based StandardMaterial |
| `material.colorNode` | 用节点替换 color / replace color with a node |
| `material.positionNode` | 用节点替换顶点位置 / replace vertex position with a node |
| `Fn(([args]) => {...})` | TSL 函数定义 / TSL function definition |
| `storage(arrayBuffer)` | 声明 storage buffer / declare storage buffer |
| `node.compute(count)` | 执行 compute kernel / execute compute kernel |
| `Nodes.texture(tex)` | 将纹理包装为节点 / wrap a texture as a node |
| `Nodes.timerLocal()` | 时间节点（已运行秒数）/ time node (elapsed seconds) |
| `renderer.backend.isWebGPUBackend` | 判断当前后端 / check current backend |

## 原理 / Principles

### 为什么 Node Material 能跨后端 / Why Node Material Cross-Compiles

传统 `ShaderMaterial` 你写的是最终 GLSL 代码，绑死在 WebGL 上。Node Material 你写的是一棵"中间表示（IR）"树——Three.js 的节点编译器读取这棵树，根据当前后端生成 GLSL 或 WGSL。这与编译器的 AST→目标代码原理一致。

With traditional `ShaderMaterial`, you write final GLSL code, locked to WebGL. With Node Material, you write an intermediate representation (IR) tree — Three.js's node compiler reads the tree and generates GLSL or WGSL depending on the active backend. This mirrors a compiler's AST→target code pipeline.

```text
TSL 代码 (JS)
    │ TSL parser
    ▼
Node IR (表达式树 / expression tree)
    │ NodeBuilder
    ├──→ GLSL (WebGLRenderer)
    └──→ WGSL (WebGPURenderer)
```

### Compute Shader 的线程模型 / Compute Shader Thread Model

Compute shader 以"工作组（workgroup）"为单位执行。每个 workgroup 包含若干线程（如 64×1×1）。`instanceIndex`（Three.js TSL 中）或 `global_id`（WGSL 中）告诉你当前线程处理哪个数据。

Compute shaders execute in "workgroups." Each workgroup contains several threads (e.g., 64×1×1). `instanceIndex` (in Three.js TSL) or `global_id` (in WGSL) tells you which data item the current thread processes.

```text
100,000 个粒子
  → 分成 100000 / 64 ≈ 1563 个 workgroup
  → 每个 workgroup 64 线程并行
  → 每个线程用 instanceIndex 读写 storage buffer 中对应粒子
```

这就是为什么 GPU 能在单帧内更新十万级粒子——并行度极高。

That's why the GPU can update 100k+ particles per frame — massive parallelism.

### WebGPU 的命令缓冲模型 / WebGPU's Command Buffer Model

WebGL 是"即时模式"：每次 `gl.drawArrays` 立即执行。WebGPU 是"录制模式"：你录制一组命令到 `CommandEncoder`，然后用一次 `queue.submit()` 提交。这减少了 CPU↔GPU 的通信往返。

WebGL is "immediate mode": each `gl.drawArrays` executes immediately. WebGPU is "record mode": you record commands into a `CommandEncoder`, then submit them all at once with `queue.submit()`. This reduces CPU↔GPU round trips.

## 常见陷阱 / Common Pitfalls

1. **浏览器不支持 WebGPU 就崩溃**：Safari < 18、Firefox 默认未启用。必须 try/catch + 回退。 / Crashing on unsupported browsers — Safari < 18, Firefox not enabled by default. Must try/catch + fallback.
2. **忘了 `await renderer.init()`**：WebGPURenderer 必须异步初始化后才能渲染。 / Forgetting `await renderer.init()` — WebGPURenderer must be async-initialized before rendering.
3. **以为 Node Material = WebGPU**：Node Material 也运行在 WebGLRenderer 上，是迁移桥梁，不是 WebGPU 专属。 / Thinking Node Material = WebGPU — it also runs on WebGLRenderer; it's a bridge, not WebGPU-exclusive.
4. **TSL API 不稳定**：TSL 仍在快速迭代，r160 和 r170 的 API 可能不同。锁定版本。 / TSL API instability — still iterating fast; r160 and r170 may differ. Pin your version.
5. **Storage Buffer 大小超限**：不同 GPU 有 maxStorageBufferBindingSize 限制（通常 128MB），超了会报错。 / Storage buffer size limit — GPUs have maxStorageBufferBindingSize (~128MB); exceeding throws.
6. **Compute 结果不显示**：compute 更新了 buffer 但没把它连到材质的 positionNode。 / Compute result invisible — updated the buffer but forgot to connect it to material.positionNode.
7. **混合 GLSL ShaderMaterial 和 Node Material**：两者编译路径不同，混用可能出现奇怪问题。尽量统一。 / Mixing GLSL ShaderMaterial and Node Material — different compile paths; unify when possible.
8. **只学 WebGPU 忽略 WebGL**：现实项目中 90% 用户仍需 WebGL 回退。 / Only learning WebGPU, ignoring WebGL — 90% of real users still need WebGL fallback.

## 调试技巧 / Debugging Tips

- **检查后端**：`renderer.backend.isWebGPUBackend` 或 `renderer.capabilities` 确认实际在用哪个后端。 / Check `renderer.backend.isWebGPUBackend` to confirm which backend is active.
- **`navigator.gpu` 检测**：`if (navigator.gpu)` 只说明浏览器支持，不代表硬件/驱动可用，还需 `requestAdapter()`。 / `navigator.gpu` only means browser support; still need `requestAdapter()` for hardware.
- **TSL 节点日志**：`console.log(material.positionNode)` 可查看节点树结构。 / Log `material.positionNode` to inspect the node tree.
- **`renderer.info`**：WebGPURenderer 也有 info，查看 draw calls / triangles。 / WebGPURenderer also has `.info` for draw calls / triangles.
- **WebGPU 开发层**：Chrome 地址栏 `chrome://flags/#enable-unsafe-webgpu` 可强制开启。 / `chrome://flags/#enable-unsafe-webgpu` to force-enable in Chrome.
- **降级对比**：同一场景在 WebGPU 和 WebGL 下分别运行，对比帧率和渲染差异。 / Run the same scene on both backends, compare FPS and rendering.

## 练习 / Exercises

1. 将 Phase 4 的 ShaderMaterial 水面效果用 TSL 重写，同时在 WebGL 和 WebGPU 下运行。 / Reimplement the Phase 4 water ShaderMaterial in TSL; run on both WebGL and WebGPU.
2. 写一个 WebGPU compute 粒子系统，粒子受鼠标位置吸引。 / Write a WebGPU compute particle system where particles are attracted to the mouse.
3. 实现一个完整的 WebGPU→WebGL 回退逻辑，在 GUI 上显示当前后端。 / Implement WebGPU→WebGL fallback; display the active backend in GUI.
4. 用 `storage()` 写一个 compute shader 做 N-body 引力模拟。 / Use `storage()` to write a compute shader for N-body gravity simulation.
5. 对比同一场景在 WebGLRenderer 和 WebGPURenderer 下的 `renderer.info`。 / Compare `renderer.info` for the same scene on both renderers.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/22-webgpu-tsl/index.html`](../../examples/22-webgpu-tsl/index.html)

核心：尝试 WebGPURenderer，失败则回退 WebGLRenderer；用 Node Material + TSL 实现波动粒子球；GUI 显示当前后端并切换。

Core: attempt WebGPURenderer, fall back to WebGLRenderer; use Node Material + TSL for a wave-displaced particle sphere; GUI shows active backend and toggles.

```js
// 回退策略 / fallback strategy
async function createRenderer() {
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const { WebGPURenderer } = await import('three/webgpu');
        const r = new WebGPURenderer({ antialias: true });
        await r.init();
        return { renderer: r, backend: 'WebGPU' };
      }
    } catch (e) { console.warn('WebGPU failed', e); }
  }
  return { renderer: new THREE.WebGLRenderer({ antialias: true }), backend: 'WebGL' };
}

// TSL 波动位移 / TSL wave displacement
import { Fn, positionLocal, normalLocal, sin, time, float } from 'three/tsl';
const wave = Fn(() => {
  const t = time().mul(2);
  const d = sin(positionLocal.x.mul(3).add(t))
           .add(sin(positionLocal.z.mul(3).add(t)));
  return positionLocal.add(normalLocal.mul(d.mul(0.1)));
});
material.positionNode = wave();
```

## 参考资源 / References

- [Three.js Docs - WebGPURenderer](https://threejs.org/docs/?q=webgpu#api/en/renderers/webgpu/WebGPURenderer)
- [Three.js Docs - Node Material](https://threejs.org/docs/#api/en/materials/nodes/MeshStandardNodeMaterial)
- [Three.js TSL Docs](https://threejs.org/docs/#api/en/tsl)
- [WebGPU API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Three.js Examples - WebGPU](https://threejs.org/examples/?q=webgpu#webgpu)
- [WebGPU Best Practices](https://www.toptal.com/webgpu/webgpu-fundamentals)
- [Three.js Migration Guide (WebGL→WebGPU)](https://discourse.threejs.org/t/migration-from-webglrenderer-to-webgpurenderer/)

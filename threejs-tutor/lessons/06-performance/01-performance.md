# 性能优化 / Performance Optimization

> 阶段 / Phase: 六、性能优化 / Performance Optimization
> 预计用时 / Estimated: 4–6 小时 / hours
> 难度 / Difficulty: Advanced

## 概述 / Overview

性能优化不是项目完成后的附加步骤，而是 Three.js 的核心能力。本节遵循"先测量、再优化"的原则：先用 `renderer.info`、Chrome Performance、Spector.js、Stats.js 等工具找到瓶颈，再针对 Draw Call、顶点/像素负载、资源体积、内存四个方向逐一优化。最后以粒子系统的六阶段演进作为综合训练。

Performance optimization isn't an afterthought — it's a core Three.js competency. This lesson follows the "measure first, then optimize" principle: first locate the bottleneck with `renderer.info`, Chrome Performance, Spector.js, Stats.js, etc., then optimize across four directions — draw calls, vertex/pixel load, resource size, and memory. Finally, the six-stage particle system evolution serves as comprehensive training.

## 核心概念 / Core Concepts

### 1. 测量优先 / Measure First

优化前必须知道瓶颈在哪。Three.js 提供 `renderer.info`：

You must know where the bottleneck is before optimizing. Three.js provides `renderer.info`:

```js
renderer.info.render.calls     // draw call 数 / draw call count
renderer.info.render.triangles // 三角形数 / triangle count
renderer.info.render.points    // 点数 / point count
renderer.info.render.lines     // 线段数 / line count
renderer.info.memory.geometries // 几何体数 / geometry count
renderer.info.memory.textures   // 纹理数 / texture count
renderer.info.programs          // 着色器程序数 / shader programs
```

```js
// 每帧输出（开发时）/ log every frame (during development)
function logInfo() {
  const i = renderer.info;
  console.log(`draws=${i.render.calls} tris=${i.render.triangles} geos=${i.memory.geometries} texs=${i.memory.textures}`);
}
```

外部工具 / external tools:

| 工具 / Tool | 用途 / Purpose |
| --- | --- |
| Chrome Performance | 录制帧时间线，找 CPU 热点 / record frame timeline, find CPU hotspots |
| Chrome Memory | 堆快照，找 JS 内存泄漏 / heap snapshots, find JS memory leaks |
| Spector.js | 捕获单帧的完整 WebGL 调用 / capture one frame's full WebGL calls |
| Stats.js | 实时 FPS / MS / MB 面板 / real-time FPS/MS/MB panel |
| GPU 时间查询 | 测量 GPU 端耗时 / measure GPU-side time |
| 浏览器任务管理器 | 看 GPU 进程显存 / check GPU process memory |

### 2. Draw Call 优化 / Draw Call Optimization

每个 draw call 都有 CPU 开销（准备状态、上传 uniform、提交命令）。1000 个 draw call 在中端手机上就可能成为瓶颈。

Each draw call has CPU overhead (state setup, uniform upload, command submission). 1000 draw calls can bottleneck mid-range phones.

```text
优化手段 / Optimization methods:

InstancedMesh        — 同一几何体+材质渲染 N 次，1 个 draw call
合并 BufferGeometry    — 多个 Mesh 合成一个，1 个 draw call
材质复用              — 多个 Mesh 共享同一材质，减少 program 切换
纹理图集 (Atlas)      — 多张小纹理合成一张大图，减少纹理绑定切换
减少透明物体          — 透明物体需要排序，且常需特殊 blend mode
```

```js
// InstancedMesh：10000 个立方体，1 个 draw call / 10000 cubes, 1 draw call
const count = 10000;
const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
const mesh = new THREE.InstancedMesh(geo, mat, count);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40
  );
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}
mesh.instanceMatrix.needsUpdate = true;
scene.add(mesh);
```

```js
// 合并几何体 / merge geometries
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const geometries = [];
for (let i = 0; i < 100; i++) {
  const g = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  g.translate(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  );
  geometries.push(g);
}
const merged = mergeGeometries(geometries); // 1 个几何体 / 1 geometry
const mesh = new THREE.Mesh(merged, material); // 1 个 draw call
```

### 3. 顶点与像素负载 / Vertex & Pixel Load

```text
减少面数              — 低模 + 法线贴图
LOD (Level of Detail)  — 远处用低模
减少过度绘制 (Overdraw) — 透明物体、大精灵会叠加绘制
缩小阴影范围           — shadow.camera 的 frustum 越小越精确越快
降低 shadow map 分辨率  — 1024 → 512
降低 DPR              — renderer.setPixelRatio(1) 而非 2
视锥剔除 (Frustum Cull) — frustumCulled = true（默认）
遮挡剔除 (Occlusion)    — WebGPU 有原生支持，WebGL 需手动或用 baker
```

```js
// LOD / Level of Detail
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);    // 0-10m 用高模 / high detail within 10m
lod.addLevel(midDetailMesh, 10);    // 10-30m 用中模
lod.addLevel(lowDetailMesh, 30);    // 30m+ 用低模
scene.add(lod);
```

### 4. 资源体积优化 / Resource Size

```text
模型压缩：
  Draco (.drc)        — 压缩几何体，需 DRACOLoader 解码
  Meshopt              — 压缩几何体+形变目标，需 MeshoptDecoder
  glTF Transform       — 命令行批量优化 glTF

纹理压缩：
  KTX2 / Basis         — GPU 解压，跨平台，推荐
  WebP / AVIF          — 浏览器解压，文件小但非 GPU 格式
  合理尺寸              — 1024×1024 足矣，别用 4096+

按需加载：
  LoadingManager       — 进度跟踪
  分块加载 (chunks)     — 只加载可视区域
```

```js
// Draco 压缩模型加载 / load Draco-compressed model
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
```

### 5. 内存管理 / Memory Management

**最重要的规则**：从场景中 `remove()` 一个 Mesh ≠ GPU 资源已释放。必须手动 `dispose()`。

**The most important rule**: `remove()`-ing a Mesh from the scene ≠ GPU resources released. You must manually `dispose()`.

```js
// 正确的销毁 / correct disposal
function disposeMesh(mesh) {
  scene.remove(mesh);
  mesh.geometry?.dispose();      // 释放几何体 / free geometry
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => disposeMaterial(m));
  } else {
    disposeMaterial(mesh.material);
  }
}
function disposeMaterial(mat) {
  // 释放所有纹理 / dispose all textures
  for (const key in mat) {
    const val = mat[key];
    if (val && val.isTexture) val.dispose();
  }
  mat.dispose(); // 释放材质 / free material
}

// RenderTarget 也要释放 / render targets too
renderTarget.dispose();
// 整个 renderer 也要释放（页面卸载时）/ renderer too (on page unload)
renderer.dispose();
```

```js
// 递归销毁整个场景子树 / recursively dispose a scene subtree
function disposeObject3D(obj) {
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m => {
        for (const k in m) {
          if (m[k]?.isTexture) m[k].dispose();
        }
        m.dispose();
      });
    }
  });
}
```

### 6. 粒子系统六阶段演进 / Particle System Six-Stage Evolution

粒子是性能训练的最佳项目，因为它能清晰展示 CPU↔GPU 边界：

Particles are the best perf training project because they clearly expose the CPU↔GPU boundary:

```text
阶段 1: 100 个 Mesh
  → 100 draw calls，CPU 更新位置
  → 简单但极低效，1000 个就卡 / simple but very inefficient, 1000 = laggy

阶段 2: 10,000 个 Points (THREE.Points)
  → 1 draw call，CPU 遍历更新 position attribute
  → draw call 少了，但 CPU 仍是瓶颈 / fewer draw calls, but CPU still bottleneck

阶段 3: InstancedMesh
  → 1 draw call，GPU 渲染，CPU 更新 instanceMatrix
  → 适合刚性物体 / good for rigid objects

阶段 4: Shader 粒子 (Points + ShaderMaterial)
  → 1 draw call，位置在顶点着色器内计算（如 time + sin）
  → CPU 零负担，但逻辑受限于 shader / zero CPU load, but logic limited to shader

阶段 5: GPGPU 粒子 (WebGL)
  → 用纹理存储粒子状态，片段着色器计算下一帧状态
  → CPU 零负担，可做复杂物理 / zero CPU load, complex physics possible

阶段 6: WebGPU Compute 粒子
  → storage buffer + compute shader
  → 最优方案，百万级粒子 / optimal, millions of particles
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `renderer.info` | 渲染统计（draw calls / triangles / memory）/ render stats |
| `InstancedMesh(geo, mat, count)` | 实例化网格 / instanced mesh |
| `mesh.setMatrixAt(i, matrix)` | 设置第 i 个实例矩阵 / set i-th instance matrix |
| `mergeGeometries(geometries)` | 合并几何体 / merge geometries |
| `THREE.LOD()` | 细节层次 / level of detail |
| `lod.addLevel(mesh, distance)` | 添加 LOD 层级 / add LOD level |
| `geometry.dispose()` | 释放几何体 GPU 资源 / free geometry GPU resources |
| `material.dispose()` | 释放材质 GPU 资源 / free material GPU resources |
| `texture.dispose()` | 释放纹理 GPU 资源 / free texture GPU resources |
| `renderTarget.dispose()` | 释放渲染目标 / free render target |
| `renderer.dispose()` | 释放整个渲染器 / dispose the entire renderer |
| `DRACOLoader` | Draco 解码器 / Draco decoder |
| `renderer.setPixelRatio(dpr)` | 设置像素比 / set pixel ratio |

## 原理 / Principles

### 为什么大量小 Mesh 比一个大 Mesh 慢 / Why Many Small Meshes Are Slower

每个 Mesh = 一次 JavaScript 对象遍历 + 一次 draw call 准备 + 一次 GPU 提交。CPU 开销不在于三角形数，而在于 draw call 数。100 个 1000 三角形的 Mesh（100 draw calls）远比 1 个 100000 三角形的 Mesh（1 draw call）慢，即使总三角形数相同。

Each Mesh = one JS object traversal + one draw call setup + one GPU submission. The CPU cost is not about triangle count but draw call count. 100 meshes of 1000 triangles each (100 draw calls) is far slower than 1 mesh of 100000 triangles (1 draw call), even with the same total triangle count.

```text
100 × 1000 三角形（100 draw calls）:
  CPU: 100 × (状态设置 + uniform 上传 + 提交) ≈ 100 × 0.1ms = 10ms

1 × 100000 三角形（1 draw call）:
  CPU: 1 × (状态设置 + uniform 上传 + 提交) ≈ 0.1ms

GPU: 两者都是 100000 三角形，GPU 耗时几乎相同
```

### 为什么 remove() 后显存不降 / Why VRAM Doesn't Drop After remove()

Three.js 的 `scene.remove(mesh)` 只是把 Mesh 从场景树中移除，使它不再被渲染。但 GPU 端的 geometry buffer、texture、shader program 仍由 `WebGLRenderer` 的内部缓存持有。只有调用 `dispose()` 才会通知 GPU 释放。这是最常见的内存泄漏来源。

`scene.remove(mesh)` only removes the Mesh from the scene tree so it's no longer rendered. But the GPU-side geometry buffer, textures, and shader programs are still held by `WebGLRenderer`'s internal caches. Only calling `dispose()` notifies the GPU to free them. This is the most common memory leak source.

### Shadow Map 的性能代价 / Shadow Map Performance Cost

阴影需要从光源视角再渲染一遍场景——等于 draw call 翻倍。阴影贴图分辨率越高，GPU 片元处理越多。`shadow.mapSize` 从 2048 降到 512 可节省 16 倍片元。

Shadows require rendering the scene again from the light's perspective — effectively doubling draw calls. Higher shadow map resolution = more GPU fragment processing. Reducing `shadow.mapSize` from 2048 to 512 saves 16× fragments.

## 常见陷阱 / Common Pitfalls

1. **不测量就优化**：凭感觉改代码，可能优化了非瓶颈。 / Optimizing without measuring — you may optimize a non-bottleneck.
2. **忘了 dispose**：切换场景后显存持续增长，最终崩溃。 / Forgetting dispose — VRAM keeps growing after scene switches, eventually crashing.
3. **InstancedMesh 不更新**：改了矩阵但没设 `instanceMatrix.needsUpdate = true`。 / InstancedMesh not updating — changed matrices but forgot `needsUpdate = true`.
4. **合并后无法单独操作**：mergeGeometries 后无法单独移动某个子物体。 / Can't move parts after merging — mergeGeometries fuses everything.
5. **透明物体过多**：每个透明物体需要排序 + 特殊 blend，draw call 无法合并。 / Too many transparent objects — each needs sorting + special blend, can't merge draw calls.
6. **DPR 过高**：Retina 屏 `setPixelRatio(2)` 让片元数 ×4，移动端直接卡。 / DPR too high — Retina `setPixelRatio(2)` quadruples fragments, killing mobile performance.
7. **纹理未释放**：加载新纹理替换旧的，旧纹理仍在 GPU。 / Textures not disposed — loading new textures without disposing old ones.
8. **LOD 切换抖动**：距离在阈值附近来回跳，导致闪烁。用滞后区 (hysteresis) 解决。 / LOD flickering — distance oscillating at threshold; use hysteresis.

## 调试技巧 / Debugging Tips

- **`renderer.info` 每帧打印**：观察 draw call 是否符合预期。 / Print `renderer.info` every frame to verify draw call count.
- **Spector.js 抓帧**：看一帧内所有 WebGL 调用，找冗余状态切换。 / Use Spector.js to capture all WebGL calls in a frame.
- **Chrome Performance 录制**：找 CPU 热点函数。 / Record with Chrome Performance to find CPU hotspots.
- **逐个隐藏**：临时 `visible = false` 部分物体，看帧率变化。 / Hide objects one by one to isolate perf impact.
- **`renderer.info.programs.length`**：着色器程序过多说明材质没复用。 / Too many programs = materials not reused.
- **内存快照对比**：Chrome Memory 前后快照，找未释放的 Geometry/Material。 / Compare Chrome Memory snapshots to find undisposed resources.

## 练习 / Exercises

1. 在示例中将数量调到 50000，对比三种方法的帧率和 draw call。 / Set count to 50000 in the example, compare FPS and draw calls across three methods.
2. 实现一个 LOD 系统，远处自动切换低模。 / Implement a LOD system that auto-switches to low-poly at distance.
3. 写一个 `disposeScene()` 函数，递归释放所有资源。 / Write a `disposeScene()` that recursively disposes all resources.
4. 用 Draco 压缩一个 GLB 模型，对比压缩前后文件大小和加载时间。 / Compress a GLB with Draco, compare file size and load time.
5. 实现阶段 4 的 Shader 粒子（顶点着色器内计算位置），10000 粒子零 CPU 负担。 / Implement stage 4 Shader particles (position computed in vertex shader), 10000 particles with zero CPU load.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/23-performance/index.html`](../../examples/23-performance/index.html)

核心：用三种方式（独立 Mesh / 合并 Geometry / InstancedMesh）渲染 N 个立方体，GUI 切换方法和数量，实时显示 `renderer.info`。

Core: render N cubes three ways (individual Mesh / merged Geometry / InstancedMesh); GUI switches method and count; `renderer.info` displayed live.

```js
// 方法对比 / method comparison
const methods = {
  mesh: () => {
    // N 个独立 Mesh = N 个 draw call / N draw calls
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...randomPos());
      group.add(m);
    }
  },
  merged: () => {
    // 合并几何体 = 1 个 draw call / 1 draw call
    const geos = [];
    for (let i = 0; i < count; i++) {
      const g = geo.clone();
      g.translate(...randomPos());
      geos.push(g);
    }
    const merged = mergeGeometries(geos);
    group.add(new THREE.Mesh(merged, mat));
  },
  instanced: () => {
    // InstancedMesh = 1 个 draw call / 1 draw call
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) {
      dummy.position.set(...randomPos());
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    group.add(mesh);
  },
};

// 每帧输出 renderer.info / log renderer.info each frame
const i = renderer.info;
console.log(`draws=${i.render.calls} tris=${i.render.triangles}`);
```

## 参考资源 / References

- [Three.js Docs - renderer.info](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info)
- [Three.js Docs - InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh)
- [Three.js Docs - LOD](https://threejs.org/docs/#api/en/objects/LOD)
- [Three.js Examples - InstancedMesh](https://threejs.org/examples/?q=instan#webgl_instancing_dynamic)
- [Spector.js](https://spector.babylonjs.com/)
- [Stats.js](https://github.com/mrdoob/stats.js)
- [Three.js Manual - Performance](https://threejs.org/manual/#en/performance)
- [glTF Transform](https://gltf-transform.dev/)
- [Draco Compression](https://github.com/google/draco)

# 24 周学习计划 / 24-Week Study Plan

> 阶段 / Phase: 学习规划 / Study Planning
> 预计用时 / Estimated: 24 周 / weeks
> 难度 / Difficulty: Beginner → Advanced

## 概述 / Overview

这是一份系统的 24 周 Three.js 学习计划，从数学基础到商业级项目，每周有明确目标与交付物。计划遵循"先原理、后实践、不看资料重写、做成完整项目"的循环。每天 90–120 分钟，持之以恒 6 个月，你将从入门达到高级水平。

This is a systematic 24-week Three.js study plan, from math fundamentals to commercial-grade projects, with clear weekly goals and deliverables. The plan follows the cycle of "principles first, then practice, re-implement without references, build complete projects." With 90–120 minutes daily over 6 months, you'll go from beginner to advanced.

---

## 阶段总览 / Phase Overview

```text
第 1–4 周   数学和基础 / Math & Fundamentals
第 5–8 周   核心对象 / Core Objects
第 9–12 周  资源和交互 / Resources & Interaction
第 13–17 周 Shader / Shaders
第 18–20 周 性能 / Performance
第 21–22 周 WebGPU 和 TSL / WebGPU & TSL
第 23–24 周 综合项目 / Comprehensive Project
```

---

## 第 1–4 周：数学和基础 / Weeks 1–4: Math & Fundamentals

### 第 1 周：向量、坐标、三角函数 / Week 1: Vectors, Coordinates, Trigonometry

**学习内容 / Learning Content:**
- 世界坐标 / 局部坐标 / 相机坐标 / 屏幕坐标 / World / Local / Camera / Screen coordinates
- `Vector3`：加减、长度、单位化、点积、叉积 / `Vector3`: add, length, normalize, dot, cross
- 三角函数：sin / cos / 弧度 / 周期运动 / trigonometry: sin/cos/radians/periodic motion
- 极坐标与圆周运动 / polar coordinates & circular motion

**交付物 / Deliverables:**
- `01-vector-direction` — 向量方向与移动 demo
- `02-dot-product` — 点积判断前后方 demo
- `03-cross-product` — 叉积计算法线 demo
- `04-circular-motion` — 圆周/椭圆运动 demo

### 第 2 周：矩阵、层级、坐标转换 / Week 2: Matrices, Hierarchy, Coordinate Conversion

**学习内容 / Learning Content:**
- 平移 / 旋转 / 缩放矩阵 / translate / rotate / scale matrices
- 模型矩阵 / 视图矩阵 / 投影矩阵 / MVP / model / view / projection / MVP
- `matrixWorld` / `updateMatrixWorld()` / `localToWorld()` / `worldToLocal()`
- Scene Graph 父子层级变换继承 / parent-child transform inheritance

**交付物 / Deliverables:**
- `05-matrix-transform` — 矩阵变换可视化 demo
- `06-local-world` — 局部/世界坐标转换 demo
- `07-scene-graph` — 太阳系层级模型 demo

### 第 3 周：相机、投影、四元数 / Week 3: Camera, Projection, Quaternions

**学习内容 / Learning Content:**
- `PerspectiveCamera`：fov / aspect / near / far 的视觉与性能影响
- `OrthographicCamera`：用途与参数
- 欧拉角与万向节锁 / Euler angles & gimbal lock
- 四元数：`slerp` 插值 / `lookAt` / 平滑转向

**交付物 / Deliverables:**
- `08-perspective-camera` — 透视相机参数 demo
- `09-ortho-camera` — 正交相机 demo
- `10-quaternion-slerp` — 四元数平滑转向 demo

### 第 4 周：从零实现基础场景 / Week 4: Build a Basic Scene from Scratch

**学习内容 / Learning Content:**
- 不看资料，从零搭建 Scene + Camera + Renderer + Mesh + Light
- 渲染循环 + delta 时间 + resize 处理
- `OrbitControls` 基础交互
- 整合前三周知识

**交付物 / Deliverables:**
- `11-basic-scene` — 从零实现的完整基础场景（无参考资料）
- 完成项目 1：三维坐标教学工具 / Complete Project 1: 3D Coordinate Teaching Tool

---

## 第 5–8 周：核心对象 / Weeks 5–8: Core Objects

### 第 5 周：Scene Graph、Object3D / Week 5: Scene Graph, Object3D

**学习内容 / Learning Content:**
- `Object3D` 体系：Scene / Group / Mesh / Camera / Light / Points / Line / Sprite
- `add` / `remove` / `traverse` / `visible` / `layers` / `renderOrder` / `frustumCulled`
- 父子关系与变换继承

**交付物 / Deliverables:**
- `12-scene-graph-tree` — 多层级场景树 demo
- `13-layers` — 图层控制 demo

### 第 6 周：Geometry、BufferGeometry / Week 6: Geometry, BufferGeometry

**学习内容 / Learning Content:**
- `BufferGeometry` / `BufferAttribute`：position / normal / uv / index
- indexed vs non-indexed geometry
- 手写几何体：三角形 / 矩形 / 圆 / 网格平面 / 五角星
- `computeVertexNormals()` / `computeBoundingBox()` / `computeBoundingSphere()`

**交付物 / Deliverables:**
- `14-custom-triangle` — 手写三角形 demo
- `15-custom-grid` — 手写网格平面 demo
- `16-custom-star` — 手写五角星 demo

### 第 7 周：Material、Texture / Week 7: Material, Texture

**学习内容 / Learning Content:**
- 材质进阶：Basic → Lambert → Phong → Standard → Physical
- PBR：roughness / metalness / normal map / emissive
- 纹理：`TextureLoader` / `wrapS` / `wrapT` / `repeat` / `offset` / `colorSpace`
- UV 坐标 / mipmap / 各向异性 / NPOT

**交付物 / Deliverables:**
- `17-material-progression` — 材质复杂度对比 demo
- `18-uv-checker` — UV 检查器 demo
- `19-texture-transform` — 纹理变换 demo
- 完成项目 2：材质与灯光实验室 / Complete Project 2: Material & Lighting Lab

### 第 8 周：Lighting、Shadow、Renderer / Week 8: Lighting, Shadow, Renderer

**学习内容 / Learning Content:**
- 六种灯光类型与适用场景 / six light types
- 阴影：shadow map / light camera / bias / normalBias / acne / peter-panning
- `renderer.info` / `setPixelRatio` / `toneMapping` / `outputColorSpace`
- 渲染循环：`setAnimationLoop` + delta + 按需渲染

**交付物 / Deliverables:**
- `20-light-types` — 六种灯光对比 demo
- `21-shadow-debug` — 阴影调试器 demo
- `22-render-loop` — 帧率无关动画 demo

---

## 第 9–12 周：资源和交互 / Weeks 9–12: Resources & Interaction

### 第 9 周：GLTF、模型工作流 / Week 9: glTF, Model Workflow

**学习内容 / Learning Content:**
- 完整链路：Blender 建模 → 材质 → UV → 贴图 → 骨骼 → 导出 GLB → 压缩 → 加载
- `GLTFLoader` / `DRACOLoader` / `KTX2Loader` / `MeshoptDecoder` / `LoadingManager`
- 场景树检查 / 节点查找 / 材质替换 / 模型尺寸与中心处理 / 资源释放

**交付物 / Deliverables:**
- `23-gltf-load` — glTF 加载与场景树展示 demo
- `24-draco-compression` — Draco 压缩对比 demo

### 第 10 周：骨骼动画 / Week 10: Skeletal Animation

**学习内容 / Learning Content:**
- `AnimationMixer` / `AnimationClip` / `AnimationAction` / `KeyframeTrack`
- 播放 / 暂停 / 循环 / 淡入淡出 / 动画切换 / 动画混合
- 程序化动画与关键帧动画结合

**交付物 / Deliverables:**
- `25-animation-playback` — 动画播放控制 demo
- `26-animation-blend` — 动画淡入淡出 demo

### 第 11 周：Raycaster、Controls / Week 11: Raycaster, Controls

**学习内容 / Learning Content:**
- 射线流程：屏幕坐标 → NDC → Raycaster → 求交 → 交互反馈
- hover / click / drag / 框选 / 地面寻路 / 部件选择
- `OrbitControls` / `MapControls` / `PointerLockControls` / `TransformControls`
- 至少自己实现一次轨道相机

**交付物 / Deliverables:**
- `27-raycaster-click` — 点击选择 demo
- `28-raycaster-drag` — 拖拽物体 demo
- `29-custom-orbit` — 自实现轨道相机 demo
- 完成项目 3：模型查看器 / Complete Project 3: Model Viewer

### 第 12 周：HTML 与 3D 混合 / Week 12: HTML & 3D Mixing

**学习内容 / Learning Content:**
- 3D 坐标投影到屏幕 / HTML 标签跟随 3D 对象
- `CSS2DRenderer` / `CSS3DRenderer`
- 遮挡判断 / 多层 UI / DOM 与 Canvas 事件协调

**交付物 / Deliverables:**
- `30-css2d-label` — CSS2D 标签跟随 demo
- `31-css3d-object` — CSS3D 物体 demo
- `32-screen-project` — 3D→屏幕投影 demo

---

## 第 13–17 周：Shader / Weeks 13–17: Shaders

### 第 13 周：GPU 管线、GLSL 基础 / Week 13: GPU Pipeline, GLSL Basics

**学习内容 / Learning Content:**
- 渲染管线：JS → Buffer → Vertex Shader → Primitive Assembly → Rasterization → Fragment Shader → Depth/Blend → Framebuffer
- GLSL 数据类型 / 向量 / 矩阵 / uniform / attribute / varying
- 内置变量 / 纹理采样 / 插值

**交付物 / Deliverables:**
- `33-pipeline-viz` — 渲染管线可视化 demo
- `34-first-shader` — 第一个纯色 shader demo

### 第 14 周：顶点 Shader / Week 14: Vertex Shader

**学习内容 / Learning Content:**
- 顶点位移 / 波浪 / 扭曲 / 爆炸效果
- `position` / `normal` / `uv` attribute 的使用
- modelViewMatrix / projectionMatrix

**交付物 / Deliverables:**
- `35-vertex-wave` — 顶点波浪 demo
- `36-vertex-twist` — 顶点扭曲 demo

### 第 15 周：片元 Shader / Week 15: Fragment Shader

**学习内容 / Learning Content:**
- UV 渐变 / 纹理采样 / 圆形遮罩 / 扫描线
- 颜色混合 / 距离场 / 光照计算
- `ShaderMaterial` vs `RawShaderMaterial`

**交付物 / Deliverables:**
- `37-uv-gradient` — UV 渐变 demo
- `38-scan-line` — 扫描线 demo
- `39-dissolve` — 溶解效果 demo

### 第 16 周：噪声、程序化效果 / Week 16: Noise, Procedural Effects

**学习内容 / Learning Content:**
- Perlin / Simplex / Value noise
- 程序化火焰 / 水面 / 星空 / 地形
- FBM (Fractal Brownian Motion)

**交付物 / Deliverables:**
- `40-noise-field` — 噪声场可视化 demo
- `41-fire-shader` — 火焰 shader demo
- `42-water-shader` — 水面 shader demo
- `43-starfield` — 星空 shader demo

### 第 17 周：后处理 / Week 17: Postprocessing

**学习内容 / Learning Content:**
- `EffectComposer` / `RenderPass` / `OutputPass` / `UnrealBloomPass` / `ShaderPass`
- ping-pong / HDR / Pass 顺序
- 手写自定义 Pass

**交付物 / Deliverables:**
- `44-bloom-scene` — Bloom 场景 demo
- `45-custom-pass` — 自定义后处理 Pass demo
- 完成项目 10：后处理视觉作品（可提前）/ Complete Project 10: Postprocessing Art (optional early)

---

## 第 18–20 周：性能 / Weeks 18–20: Performance

### 第 18 周：性能测量 / Week 18: Performance Measurement

**学习内容 / Learning Content:**
- `renderer.info` 详解
- Chrome Performance / Memory / Spector.js / Stats.js
- GPU 时间查询 / 浏览器任务管理器
- 性能瓶颈定位方法论

**交付物 / Deliverables:**
- `46-perf-dashboard` — 性能监控面板 demo
- `47-spector-capture` — Spector.js 帧分析 demo

### 第 19 周：实例化、合批、LOD / Week 19: Instancing, Batching, LOD

**学习内容 / Learning Content:**
- `InstancedMesh` 实战
- `mergeGeometries` 合并几何体
- `LOD` 细节层次
- 材质复用 / 纹理图集

**交付物 / Deliverables:**
- `48-instanced-cubes` — 万级实例化 demo
- `49-merged-geometry` — 合并几何体 demo
- `50-lod-demo` — LOD 切换 demo
- 完成项目 4：无限公路场景 / Complete Project 4: Infinite Highway Scene

### 第 20 周：资源压缩和内存管理 / Week 20: Resource Compression & Memory Management

**学习内容 / Learning Content:**
- Draco / Meshopt / KTX2 / WebP / AVIF
- glTF Transform 批量优化
- `dispose()` 全链路 / 内存泄漏排查
- 粒子系统六阶段演进

**交付物 / Deliverables:**
- `51-draco-vs-meshopt` — 压缩格式对比 demo
- `52-dispose-test` — 资源销毁验证 demo
- `53-particle-evolution` — 粒子六阶段对比 demo
- 完成项目 8：GPU 粒子系统 / Complete Project 8: GPU Particle System

---

## 第 21–22 周：WebGPU 和 TSL / Weeks 21–22: WebGPU & TSL

### 第 21 周：Node Material、TSL / Week 21: Node Material, TSL

**学习内容 / Learning Content:**
- Node Material 体系 / `MeshStandardNodeMaterial`
- TSL 函数式语法 / `Fn()` / 节点组合
- 用 TSL 重写之前的 GLSL shader
- Node Material 在 WebGLRenderer 上运行

**交付物 / Deliverables:**
- `54-node-material` — Node Material 基础 demo
- `55-tsl-water` — TSL 重写水面 shader demo
- `56-tsl-fire` — TSL 重写火焰 shader demo

### 第 22 周：WebGPURenderer、Compute / Week 22: WebGPURenderer, Compute

**学习内容 / Learning Content:**
- `WebGPURenderer` + `init()` + 回退策略
- `navigator.gpu` 检测 / `requestAdapter()`
- Storage Buffer / Compute Shader / TSL `compute()`
- WebGPU vs WebGL 性能对比

**交付物 / Deliverables:**
- `57-webgpu-fallback` — WebGPU→WebGL 回退 demo
- `58-compute-particles` — WebGPU Compute 粒子 demo
- 完成项目 11：WebGPU Compute Demo / Complete Project 11: WebGPU Compute Demo

---

## 第 23–24 周：综合项目 / Weeks 23–24: Comprehensive Project

### 第 23–24 周：完整项目交付 / Weeks 23–24: Full Project Delivery

**任务 / Task:**
选择一个中级或高级项目（项目 5/6/7/9/12）完整交付，并撰写：

Choose one intermediate or advanced project (5/6/7/9/12) and deliver it fully, writing:

- [ ] 架构文档 / Architecture Doc（引擎结构、模块划分）
- [ ] 渲染流程 / Render Flow（场景图、材质、后处理链）
- [ ] 资源规范 / Resource Spec（模型/纹理规范、压缩方案）
- [ ] 性能预算 / Performance Budget（目标 FPS、draw call 上限、内存上限）
- [ ] 调试记录 / Debug Log（遇到的问题与解决方案）
- [ ] 兼容性报告 / Compatibility Report（浏览器矩阵、移动端测试结果）

**建议 / Suggestion:**
- 第 23 周：需求文档 + 技术规格 + 核心功能开发 / Week 23: Requirements + Tech Spec + Core Features
- 第 24 周：性能优化 + 兼容性验证 + 部署 + 文档 / Week 24: Optimization + Compatibility + Deploy + Docs

---

## 每天如何练习 / Daily Practice

每天 90–120 分钟，按以下比例分配：

Each day 90–120 minutes, allocated as follows:

```text
┌─────────────────────────────────────────────────────────┐
│  每日练习时间分配 / Daily Practice Time Allocation       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  20 min — 学习一个原理 / Learn one principle            │
│    读文档/源码，理解"为什么"而非"怎么做"                  │
│    Read docs/source; understand "why" not just "how"    │
│                                                         │
│  30 min — 照着资料实现 / Follow along                   │
│    跟着教程/示例写一遍，确保能跑通                         │
│    Follow tutorial/example, get it running              │
│                                                         │
│  30 min — 关闭资料重新实现 / Re-implement without refs  │
│    不看任何资料，凭理解重写，卡住才查                      │
│    Re-write from memory; only look up when stuck        │
│                                                         │
│  20 min — 增加调试面板和可视化 / Add debug & viz         │
│    加 GUI 参数、可视化辅助线、性能数据                     │
│    Add GUI params, viz helpers, perf stats              │
│                                                         │
│  20 min — 记录原理、问题和结论 / Record findings         │
│    写 README，记录核心公式、易错点、性能数据               │
│    Write README: formulas, pitfalls, perf data          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 每个知识点的独立 Demo / Independent Demo Per Knowledge Point

每个知识点都建立一个独立 Demo，命名规范：

Each knowledge point gets its own independent demo, naming convention:

```text
01-vector-direction       — 向量方向与移动
02-dot-product            — 点积
03-cross-product          — 叉积
04-local-world            — 局部/世界坐标
05-perspective-camera     — 透视相机
06-buffer-geometry        — BufferGeometry
07-uv                     — UV 坐标
08-normal                 — 法线
09-raycaster              — 射线检测
10-shadow-map             — 阴影贴图
...
```

### 每个 Demo 必须包含 / Each Demo Must Include

```text
□ README.md               — 项目说明 / project description
□ 原理说明 / Principles    — 为什么这样做、背后的数学/图形学
□ 核心公式 / Core Formulas — 关键数学公式或代码片段
□ 参数说明 / Parameters    — 可调参数及其影响
□ 易错点 / Pitfalls        — 常见错误与解决方案
□ 可运行代码 / Runnable Code — index.html 可直接打开运行
□ 调试面板 / Debug Panel   — GUI 可视化参数
□ 性能数据 / Perf Data     — FPS、draw calls、内存
```

这些 Demo 可以直接成为你的 Three.js 知识网站。

These demos can directly become your Three.js knowledge website.

---

## 判断是否真正掌握：15 个自测题 / Self-Check: 15 Mastery Questions

详见 / See: [自测题 / Self-Assessment Questions](../10-self-assessment/01-questions.md)

当你能独立回答以下 15 个问题时，才算进入高级阶段：

When you can independently answer these 15 questions, you've reached the advanced level:

1. 为什么透明物体会出现排序错误？/ Why do transparent objects have sorting errors?
2. 为什么模型从 Blender 导入后方向不对？/ Why are models oriented wrong after Blender export?
3. 为什么阴影边缘抖动或出现条纹？/ Why do shadow edges jitter or show banding?
4. `matrixWorld` 是什么时候更新的？/ When is `matrixWorld` updated?
5. `normalMatrix` 为什么是逆转置矩阵？/ Why is `normalMatrix` the inverse-transpose?
6. 为什么同样的动画在 60Hz 和 144Hz 上速度不同？/ Why does the same animation run at different speeds on 60Hz vs 144Hz?
7. 为什么一个场景只有 20 万个三角形却很卡？/ Why is a scene with only 200k triangles laggy?
8. 为什么大量小 Mesh 比一个大 Mesh 更慢？/ Why are many small meshes slower than one big mesh?
9. 为什么调用 `remove()` 后显存没有下降？/ Why doesn't VRAM drop after `remove()`?
10. 为什么法线贴图需要切线空间？/ Why do normal maps need tangent space?
11. 为什么 Bloom 会让整个画面发白？/ Why does bloom make the whole image white?
12. Raycaster 如何从二维鼠标生成三维射线？/ How does Raycaster generate a 3D ray from a 2D mouse?
13. WebGLRenderer 与 WebGPURenderer 应该如何选择？/ How to choose between WebGLRenderer and WebGPURenderer?
14. GLSL、Node Material 与 TSL 的关系是什么？/ What's the relationship between GLSL, Node Material, and TSL?
15. 如何设计一个可销毁、可切换、可测试的 Three.js 场景模块？/ How to design a disposable, switchable, testable scene module?

---

## 每周检查清单 / Weekly Checklist

```text
□ 本周原理是否理解（能向别人解释）？/ Are principles understood (can explain to others)?
□ 本周 Demo 是否完成（不看资料能跑）？/ Are demos complete (runs without references)?
□ 调试面板是否添加？/ Is debug panel added?
□ 性能数据是否记录？/ Is perf data recorded?
□ README 是否撰写？/ Is README written?
□ 易错点是否总结？/ Are pitfalls summarized?
```

## 参考资源 / References

- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Manual](https://threejs.org/manual/)
- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Source Code](https://github.com/mrdoob/three.js)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [LearnOpenGL](https://learnopengl.com/)
- [Three.js Journey](https://threejs-journey.com/)
- [Discover Three.js](https://discoverthreejs.com/)
- [Spector.js](https://spector.babylonjs.com/)
- [glTF Transform](https://gltf-transform.dev/)

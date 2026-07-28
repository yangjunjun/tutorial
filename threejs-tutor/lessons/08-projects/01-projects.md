# 必须完成的 12 个项目 / 12 Must-Do Projects

> 阶段 / Phase: 项目实战 / Project Practice
> 预计用时 / Estimated: 12–20 周 / weeks
> 难度 / Difficulty: Basic → Advanced

## 概述 / Overview

不要重复做旋转立方体。按照难度递增完成这 12 个项目，从基础到商业级，覆盖 Three.js 的所有核心能力。每个项目都应经历完整工程流程：需求文档 → 技术规格 → 任务拆分 → 开发 → 性能验证 → 兼容性验证 → 部署。

Don't keep making rotating cubes. Complete these 12 projects in increasing difficulty, from basic to commercial-grade, covering all core Three.js competencies. Each project should go through a full engineering workflow: Requirements Doc → Technical Spec → Task Breakdown → Development → Performance Verification → Compatibility Verification → Deployment.

### 通用开发流程 / Universal Development Workflow

```text
1. 需求文档 Requirements Doc
   - 目标用户、核心功能、非功能需求（性能/兼容性）
   - Target users, core features, non-functional requirements (perf/compat)

2. 技术规格 Technical Spec
   - 技术栈选型、架构图、数据流、资源规范
   - Tech stack, architecture diagram, data flow, resource spec

3. 任务拆分 Task Breakdown
   - 拆成可独立验证的小任务，估算时间
   - Split into independently verifiable tasks, estimate time

4. 开发 Development
   - 按阶段七的引擎架构实现，先核心后细节
   - Implement with Phase 7 engine architecture; core first, details later

5. 性能验证 Performance Verification
   - renderer.info、FPS、内存、低端设备测试
   - renderer.info, FPS, memory, low-end device testing

6. 兼容性验证 Compatibility Verification
   - 浏览器矩阵（Chrome/Firefox/Safari/Edge）、移动端、WebGL 回退
   - Browser matrix, mobile, WebGL fallback

7. 部署 Deployment
   - CDN、缓存策略、按需加载、监控
   - CDN, cache strategy, lazy loading, monitoring
```

---

## 基础项目 / Basic Projects

### 项目 1：三维坐标教学工具 / 3D Coordinate Teaching Tool

> 难度 / Difficulty: ★☆☆☆☆ Beginner
> 训练目标 / Training Goals: 数学基础可视化、Scene Graph、相机系统

**功能列表 / Feature List:**
- 三维坐标轴（X 红 / Y 绿 / Z 蓝）可视化 / 3D axis visualization (X red / Y green / Z blue)
- 网格地面（GridHelper，可调密度）/ grid floor (adjustable density)
- 局部坐标与世界坐标切换显示 / toggle local vs world coordinates
- 物体平移、旋转、缩放（TransformControls）/ translate, rotate, scale via TransformControls
- 实时矩阵显示（modelMatrix / matrixWorld）/ real-time matrix display
- 正交相机与透视相机切换 / orthographic vs perspective camera toggle
- 鼠标点击获取三维坐标 / click to get 3D coordinates

**技术重点 / Tech Focus:**
- `Vector3`、`Matrix4`、`Euler`、`Quaternion` 的实际应用
- `Object3D.position/rotation/scale` vs `matrix` vs `matrixWorld` 的关系
- `Raycaster` 屏幕坐标→世界坐标转换
- 正交/透视相机的 `projectionMatrix` 差异

**建议步骤 / Suggested Steps:**
1. 搭建场景：坐标轴 + 网格 + 基础物体 / setup scene: axes + grid + base object
2. 实现 TransformControls 拖拽 / implement TransformControls dragging
3. 实时读取并显示 `object.matrix` 元素 / read and display matrix elements live
4. 添加正交/透视切换 / add ortho/perspective toggle
5. 实现 Raycaster 点击取点 / implement Raycaster click-to-point

---

### 项目 2：材质与灯光实验室 / Material & Lighting Lab

> 难度 / Difficulty: ★★☆☆☆ Beginner-Intermediate
> 训练目标 / Training Goals: PBR 材质、灯光系统、阴影、色调映射

**功能列表 / Feature List:**
- PBR 参数实时调节（roughness / metalness / clearcoat / transmission）/ real-time PBR parameter control
- 灯光参数调节（类型 / 强度 / 颜色 / 位置）/ light parameter control (type/intensity/color/position)
- 阴影开关与参数调节（mapSize / bias / normalBias）/ shadow toggle & params
- HDR 环境贴图加载与强度调节 / HDR environment loading & intensity
- Tone Mapping 切换（ACESFilmic / Reinhard / Linear / None）/ tone mapping switch
- 曝光调节 / exposure control
- 材质预设保存与加载 / save & load material presets

**技术重点 / Tech Focus:**
- `MeshStandardMaterial` / `MeshPhysicalMaterial` 的 PBR 参数
- 六种灯光类型（Ambient / Hemisphere / Directional / Point / Spot / RectArea）
- `PMREMGenerator` 处理 HDR 环境光
- `renderer.toneMapping` 与 `toneMappingExposure`
- 阴影 `shadow.mapSize`、`shadow.bias`、`shadow.normalBias`

**建议步骤 / Suggested Steps:**
1. 搭建测试球体 + 平面场景 / setup test sphere + plane scene
2. 添加所有灯光类型，GUI 切换 / add all light types, GUI switch
3. 实现 PBR 参数面板 / implement PBR parameter panel
4. 加载 HDR 环境贴图 / load HDR environment
5. 实现 Tone Mapping 切换与曝光 / implement tone mapping & exposure
6. 添加阴影调试面板 / add shadow debug panel

---

### 项目 3：模型查看器 / Model Viewer

> 难度 / Difficulty: ★★☆☆☆ Beginner-Intermediate
> 训练目标 / Training Goals: glTF 工作流、动画系统、场景树遍历

**功能列表 / Feature List:**
- GLB/glTF 文件拖拽加载 / drag-and-drop GLB/glTF loading
- 动画列表显示与播放控制（播放/暂停/循环/速度）/ animation list & playback control
- 材质列表显示与参数编辑 / material list display & editing
- 场景节点树（可展开/折叠/高亮）/ scene node tree (expand/collapse/highlight)
- 部件选择（点击高亮 + 轮廓描边）/ part selection (highlight + outline)
- 截图功能（toDataURL 导出）/ screenshot (toDataURL export)
- 环境切换（HDR / 纯色 / 渐变）/ environment switch (HDR / solid / gradient)
- 自动适配相机（模型居中 + 缩放）/ auto-fit camera (center + scale)

**技术重点 / Tech Focus:**
- `GLTFLoader`、`DRACOLoader`、`KTX2Loader`
- `AnimationMixer`、`AnimationClip`、`AnimationAction`
- `gltf.scene.traverse()` 遍历节点树
- `Raycaster` 部件选择 + `OutlinePass` 描边
- `Box3` 计算模型包围盒，自动定位相机

**建议步骤 / Suggested Steps:**
1. 实现 GLB 拖拽加载 / implement GLB drag-and-drop load
2. 遍历场景树，构建 UI 树 / traverse scene, build UI tree
3. 接入 AnimationMixer，列出动画 / setup AnimationMixer, list animations
4. 实现 Raycaster 部件选择 + 描边 / implement Raycaster selection + outline
5. 实现截图与环境切换 / implement screenshot & environment switch
6. 实现 Box3 自动适配相机 / implement Box3 auto-fit camera

---

## 中级项目 / Intermediate Projects

### 项目 4：无限公路场景 / Infinite Highway Scene

> 难度 / Difficulty: ★★★☆☆ Intermediate
> 训练目标 / Training Goals: 相机跟随、纹理滚动、对象池、程序化生成

**功能列表 / Feature List:**
- 无限延伸的公路（纹理滚动）/ infinite road (texture scrolling)
- 道路两侧随机生成建筑/树木（对象池复用）/ random buildings/trees (object pool reuse)
- 相机跟随车辆第三人称视角 / third-person camera following vehicle
- 雾效实现远处淡出 / fog for distance fade
- 动态光照（昼夜变化可选）/ dynamic lighting (optional day/night cycle)
- 速度调节与路面标线动画 / speed control & lane marking animation

**技术重点 / Tech Focus:**
- `texture.offset.y += delta * speed` 纹理滚动
- 对象池模式：预创建 N 个物体，循环复用 / object pool: pre-create N, recycle
- `Camera` 跟随：`camera.position.lerp(target, 0.1)` 平滑跟随
- `Fog` / `FogExp2` 性能与视觉效果
- 程序化生成：随距离生成、超过视野回收

**建议步骤 / Suggested Steps:**
1. 创建公路平面 + 滚动纹理 / create road plane + scrolling texture
2. 实现对象池管理建筑 / implement object pool for buildings
3. 实现相机跟随车辆 / implement camera follow
4. 添加雾效与光照 / add fog & lighting
5. 实现速度控制与路面标线 / implement speed control & lane markings
6. 性能优化：减少远处物体面数 / optimize: reduce distant geometry detail

---

### 项目 5：海浪和天气系统 / Ocean & Weather System

> 难度 / Difficulty: ★★★★☆ Intermediate-Advanced
> 训练目标 / Training Goals: Shader、粒子、噪声、后处理

**功能列表 / Feature List:**
- GPU 海浪 shader（Gerstner 波或噪声波形）/ GPU ocean shader (Gerstner waves or noise)
- 海面反射与折射（或近似模拟）/ sea reflection & refraction (or approximation)
- 天气切换（晴天/多云/雨/雪/雾）/ weather switch (sunny/cloudy/rain/snow/fog)
- 粒子雨雪系统（Points + shader）/ rain/snow particle system
- 后处理：Bloom + 色调分级 / postprocessing: bloom + color grading
- 昼夜循环（太阳位置 + 天空色变化）/ day/night cycle (sun position + sky color)
- 海面泡沫与浪花 / sea foam & spray

**技术重点 / Tech Focus:**
- Gerstner 波浪模型或 Perlin/Simplex 噪声
- 顶点着色器位移 + 片元着色器颜色
- `Points` 粒子系统 + `PointsMaterial` 或自定义 ShaderMaterial
- `EffectComposer` + `UnrealBloomPass` + `ShaderPass`（调色）
- 天空盒或 `Sky` shader（大气散射）

**建议步骤 / Suggested Steps:**
1. 实现基础海面 shader（顶点位移）/ implement base ocean shader (vertex displacement)
2. 添加法线计算与光照 / add normal computation & lighting
3. 实现天气粒子系统 / implement weather particle system
4. 接入后处理 Bloom + 调色 / add postprocessing bloom + grading
5. 实现昼夜循环 / implement day/night cycle
6. 性能优化：降低远处海面细分 / optimize: reduce distant tessellation

---

### 项目 6：三维产品依赖图 / 3D Product Dependency Graph

> 难度 / Difficulty: ★★★☆☆ Intermediate
> 训练目标 / Training Goals: HTML 与 3D 混合、数据可视化、交互

**功能列表 / Feature List:**
- 产品/服务/组件三维节点布局 / 3D node layout for products/services/components
- 依赖关系连线（三维贝塞尔曲线）/ dependency lines (3D bezier curves)
- 射线选择节点高亮 / raycaster node selection & highlight
- HTML 标签跟随 3D 节点（CSS2DRenderer）/ HTML labels following 3D nodes
- 聚焦相机（点击节点平滑飞过去）/ focus camera (smooth fly-to on click)
- 搜索过滤节点 / search & filter nodes
- 自动布局算法（力导向 / 层次 / 圆形）/ auto-layout (force-directed / hierarchical / circular)
- 节点信息面板 / node info panel

**技术重点 / Tech Focus:**
- `CSS2DRenderer` / `CSS3DRenderer` HTML 标签跟随
- `Raycaster` 选择 + `OutlinePass` 高亮
- 三维曲线：`THREE.CubicBezierCurve3` / `CatmullRomCurve3`
- `Camera` 飞行动画：`tween.js` 或手动 `lerp` + `lookAt`
- 力导向布局算法
- 性能：大量连线用 `LineSegments` 合并

**建议步骤 / Suggested Steps:**
1. 定义数据结构（节点 + 边）/ define data structure (nodes + edges)
2. 实现三维节点布局 / implement 3D node layout
3. 绘制依赖连线 / draw dependency lines
4. 实现 CSS2DRenderer 标签 / implement CSS2DRenderer labels
5. 实现射线选择 + 聚焦相机 / implement raycaster selection + focus camera
6. 实现搜索过滤 / implement search & filter
7. 性能优化：合并连线、LOD 标签 / optimize: merge lines, LOD labels

---

### 项目 7：小型第三人称场景 / Mini Third-Person Scene

> 难度 / Difficulty: ★★★☆☆ Intermediate
> 训练目标 / Training Goals: 角色动画、状态机、相机跟随、碰撞

**功能列表 / Feature List:**
- 角色模型加载（glTF + 骨骼动画）/ character model (glTF + skeletal animation)
- 状态机（idle / walk / run / jump）/ state machine (idle/walk/run/jump)
- 第三人称相机跟随与碰撞 / third-person camera follow & collision
- 地面碰撞检测 / ground collision detection
- WASD + 鼠标控制 / WASD + mouse control
- 路径移动 NPC / path-following NPC
- 简单场景（建筑/障碍物）/ simple scene (buildings/obstacles)

**技术重点 / Tech Focus:**
- `AnimationMixer` + 多 `AnimationAction` 切换与混合
- 状态机模式：状态转换、动画淡入淡出
- `PointerLockControls` 或自定义第三人称相机
- Raycaster 地面检测（向下射线）/ raycaster ground detection (downward ray)
- `Raycaster` 或 AABB 碰撞检测

**建议步骤 / Suggested Steps:**
1. 加载角色 glTF + 动画 / load character glTF + animations
2. 实现状态机与动画切换 / implement state machine & animation switching
3. 实现第三人称相机 / implement third-person camera
4. 实现地面碰撞检测 / implement ground collision
5. 添加 WASD 输入控制 / add WASD input control
6. 实现 NPC 路径移动 / implement NPC path movement
7. 添加场景障碍物 / add scene obstacles

---

## 高级项目 / Advanced Projects

### 项目 8：GPU 粒子系统 / GPU Particle System

> 难度 / Difficulty: ★★★★☆ Advanced
> 训练目标 / Training Goals: GPU 并行计算、Shader、性能极限

**功能列表 / Feature List:**
- 百万级粒子渲染（目标 60fps）/ million-particle rendering (target 60fps)
- 力场：吸引、排斥、涡流 / force fields: attract, repel, vortex
- 鼠标交互（粒子跟随或避让）/ mouse interaction (follow or avoid)
- 形状变换（球→立方体→文字）/ shape morphing (sphere→cube→text)
- 粒子生命周期与颜色渐变 / particle lifecycle & color gradient
- 性能对比面板（CPU vs GPU 更新）/ perf comparison panel (CPU vs GPU update)
- GPGPU 或 WebGPU Compute 实现 / GPGPU or WebGPU Compute implementation

**技术重点 / Tech Focus:**
- `Points` + `ShaderMaterial`，位置在顶点着色器内计算
- GPGPU：用纹理存储粒子状态，`GPUComputationRenderer`
- 或 WebGPU：`storage()` + `compute()` TSL
- `BufferGeometry` 动态更新 `position` / `color` / `size` attribute
- 优化：`frustumCulled = false`（粒子整体不剔除）

**建议步骤 / Suggested Steps:**
1. 实现 CPU 版本（10000 Points）作为基线 / implement CPU version (10000 Points) as baseline
2. 升级为 Shader 粒子（顶点着色器计算位置）/ upgrade to shader particles
3. 实现 GPGPU 版本 / implement GPGPU version
4. 添加力场与鼠标交互 / add force fields & mouse interaction
5. 实现形状变换 / implement shape morphing
6. 性能测试：逐步增加到百万级 / perf test: scale up to millions
7. （可选）WebGPU Compute 版本 / (optional) WebGPU Compute version

---

### 项目 9：地形系统 / Terrain System

> 难度 / Difficulty: ★★★★☆ Advanced
> 训练目标 / Training Goals: 高度图、LOD、大世界、实例化

**功能列表 / Feature List:**
- 高度图生成地形（Canvas 或图片）/ heightmap terrain generation
- 多层纹理混合（沙/草/岩石/雪）/ multi-layer texture blending
- LOD 地形（近处高模远处低模）/ LOD terrain
- 天空盒或大气散射天空 / skybox or atmospheric scattering sky
- 植被实例化（树木/草 InstancedMesh）/ instanced vegetation (trees/grass)
- 大世界坐标处理（浮点精度）/ large world coordinate handling
- 地形编辑（鼠标抬升/降低）/ terrain editing (raise/lower)

**技术重点 / Tech Focus:**
- 高度图 → `PlaneGeometry` 顶点位移
- `ShaderMaterial` 多层纹理混合（基于高度/坡度）
- `LOD` 或 clipmap terrain
- `InstancedMesh` 植被渲染
- 浮点精度：相机相对原点 / floating origin
- `PlaneGeometry` 动态修改 `position` attribute

**建议步骤 / Suggested Steps:**
1. 用高度图生成基础地形 / generate base terrain from heightmap
2. 计算法线并添加光照 / compute normals & add lighting
3. 实现多层纹理混合 shader / implement multi-layer blend shader
4. 添加天空 / add sky
5. 实现植被实例化 / implement instanced vegetation
6. 实现 LOD 或分块加载 / implement LOD or chunk loading
7. 实现地形编辑工具 / implement terrain editing tool

---

### 项目 10：后处理视觉作品 / Postprocessing Visual Art

> 难度 / Difficulty: ★★★★☆ Advanced
> 训练目标 / Training Goals: 后处理管线、自定义 Shader、视觉表达

**功能列表 / Feature List:**
- Bloom 辉光效果 / bloom glow effect
- 景深 / depth of field
- 色彩分级（亮度/对比度/饱和度/LUT）/ color grading (brightness/contrast/saturation/LUT)
- 扫描线 / CRT 效果 / scanlines / CRT effect
- 故障效果 / glitch effect
- 自定义全屏 Pass（如水墨/油画/像素化）/ custom full-screen pass (ink/oil/pixelate)
- Pass 链可视化与实时切换 / pass chain visualization & live switching
- 录制 GIF 或视频导出 / GIF/video export

**技术重点 / Tech Focus:**
- `EffectComposer` + `RenderPass` + `OutputPass` 管线
- `UnrealBloomPass` 参数调优
- `ShaderPass` 自定义全屏效果
- `WebGLRenderTarget` + ping-pong
- Pass 性能预算与移动端降级

**建议步骤 / Suggested Steps:**
1. 搭建基础场景 + EffectComposer / setup base scene + EffectComposer
2. 实现 Bloom + 景深 / implement bloom + DoF
3. 实现色彩分级 ShaderPass / implement color grading ShaderPass
4. 实现扫描线/故障/像素化 / implement scanline/glitch/pixelate
5. 实现 Pass 链 GUI 可视化 / implement pass chain GUI visualization
6. 性能优化：合并简单 Pass / optimize: merge simple passes
7. 实现截图/录制导出 / implement screenshot/recording export

---

### 项目 11：WebGPU Compute Demo / WebGPU Compute Demo

> 难度 / Difficulty: ★★★★★ Advanced
> 训练目标 / Training Goals: WebGPU、Compute Shader、回退策略

**功能列表 / Feature List:**
- WebGPU Compute 粒子模拟（N-body 引力或流体）/ WebGPU compute particle simulation (N-body or fluid)
- Storage Buffer 存储粒子状态 / storage buffer for particle state
- Compute Kernel 更新粒子位置 / compute kernel updates positions
- WebGL 回退（GPGPU 或 CPU 模拟）/ WebGL fallback (GPGPU or CPU)
- 后端切换 GUI（显示当前活跃后端）/ backend switch GUI (shows active backend)
- 性能对比：WebGPU vs WebGL vs CPU / perf comparison
- 百万级粒子探索 / million-particle exploration

**技术重点 / Tech Focus:**
- `WebGPURenderer` + `renderer.init()`
- TSL `storage()` + `Fn()` + `compute()`
- `navigator.gpu` 检测与 `requestAdapter()` 回退
- `WebGLRenderer` + `GPUComputationRenderer` 回退路径
- Node Material 跨后端编译

**建议步骤 / Suggested Steps:**
1. 检测 WebGPU 支持并初始化 / detect WebGPU support & init
2. 实现 Storage Buffer + Compute Kernel / implement storage buffer + compute kernel
3. 用 Node Material 渲染粒子 / render particles with Node Material
4. 实现 WebGL 回退路径 / implement WebGL fallback path
5. 添加后端切换 GUI / add backend switch GUI
6. 性能对比测试 / performance comparison testing
7. 逐步增加粒子数到百万级 / scale up to millions

---

### 项目 12：完整商业级项目 / Full Commercial-Grade Project

> 难度 / Difficulty: ★★★★★ Advanced
> 训练目标 / Training Goals: 全流程工程化交付

从以下选择一个 / Choose one:

```text
□ 数字孪生 Digital Twin         □ 数据中心可视化 Data Center Viz
□ 三维地图 3D Map               □ 在线展厅 Online Showroom
□ 工业设备监控 Industrial Monitor □ 3D 编辑器 3D Editor
□ 模型标注系统 Model Annotation
```

**必须包含 / Must Include:**

- [ ] 需求文档 / Requirements Doc（用户故事、功能列表、非功能需求）
- [ ] 技术规格 / Technical Spec（架构图、技术栈、数据流、API 设计）
- [ ] 任务拆分 / Task Breakdown（WBS，每个任务可独立验证）
- [ ] 引擎架构 / Engine Architecture（Phase 7 的 Experience + SceneModule 模式）
- [ ] 资源规范 / Resource Spec（模型压缩、纹理尺寸、命名规范）
- [ ] 性能预算 / Performance Budget（目标 FPS、draw call 上限、内存上限）
- [ ] 性能验证 / Performance Verification（renderer.info、低端设备测试）
- [ ] 兼容性验证 / Compatibility Verification（浏览器矩阵、移动端、WebGL 回退）
- [ ] 部署方案 / Deployment（CDN、缓存、按需加载、监控告警）
- [ ] 文档 / Documentation（架构文档、渲染流程、调试记录）

**技术重点 / Tech Focus:**
- Phase 7 引擎架构的完整实践
- 资源管理：加载/缓存/释放全链路
- 性能预算与持续监控
- 多人协作的代码组织
- CI/CD 与自动化测试
- 线上问题排查（Sentry / 自建监控）

**建议步骤 / Suggested Steps:**
1. 撰写需求文档与技术规格 / write requirements doc & technical spec
2. 搭建项目骨架（Vite + TS + Vue3 + 引擎）/ scaffold project (Vite + TS + Vue3 + engine)
3. 实现核心功能模块 / implement core feature modules
4. 资源制作与优化管线 / resource creation & optimization pipeline
5. 性能调优与兼容性测试 / performance tuning & compatibility testing
6. 部署上线 / deploy to production
7. 编写架构文档与运维手册 / write architecture docs & ops manual

---

## 项目难度与建议时间 / Project Difficulty & Suggested Time

| # | 项目 / Project | 难度 / Difficulty | 建议时间 / Time |
| --- | --- | --- | --- |
| 1 | 三维坐标教学工具 / Coordinate Tool | ★☆☆☆☆ | 1 周 / week |
| 2 | 材质与灯光实验室 / Material Lab | ★★☆☆☆ | 1–2 周 / weeks |
| 3 | 模型查看器 / Model Viewer | ★★☆☆☆ | 2 周 / weeks |
| 4 | 无限公路场景 / Infinite Highway | ★★★☆☆ | 2 周 / weeks |
| 5 | 海浪和天气系统 / Ocean & Weather | ★★★★☆ | 3 周 / weeks |
| 6 | 三维产品依赖图 / Dependency Graph | ★★★☆☆ | 2–3 周 / weeks |
| 7 | 小型第三人称场景 / Third-Person Scene | ★★★☆☆ | 2–3 周 / weeks |
| 8 | GPU 粒子系统 / GPU Particles | ★★★★☆ | 2–3 周 / weeks |
| 9 | 地形系统 / Terrain System | ★★★★☆ | 3 周 / weeks |
| 10 | 后处理视觉作品 / Postprocessing Art | ★★★★☆ | 2 周 / weeks |
| 11 | WebGPU Compute Demo / WebGPU Compute | ★★★★★ | 3 周 / weeks |
| 12 | 完整商业级项目 / Commercial Project | ★★★★★ | 4–6 周 / weeks |

## 参考资源 / References

- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Manual](https://threejs.org/manual/)
- [Three.js Journey](https://threejs-journey.com/)
- [Bruno Simon Portfolio](https://bruno-simon.com/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [glTF Transform](https://gltf-transform.dev/)
- [Spector.js](https://spector.babylonjs.com/)
- [Discover Three.js](https://discoverthreejs.com/)

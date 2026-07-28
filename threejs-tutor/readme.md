# 如何系统掌握 Three.js

“完全掌握 Three.js”不应该理解成记住全部 API。Three.js 当前仍在快速迭代，官方网站显示当前版本为 **r185**，同时已经形成 `WebGLRenderer`、`WebGPURenderer`、TSL、后处理、WebXR 等多条技术线。真正的掌握标准是：

> 面对一个 3D Web 需求，能够分析视觉效果、选择实现方案、建立数学模型、编写渲染代码、定位性能问题，并独立完成工程化交付。

Three.js 官方定位是通用、轻量、跨浏览器的 JavaScript 3D 库；目前核心渲染方向包括 WebGL 和 WebGPU。([Three.js][1])

> 📚 **完整教程索引 / Full Tutorial Index**：每个主题都配有双语（中文/English）讲解与可运行示例，位于 `lessons/` 与 `examples/` 目录。
>
> | 阶段 / Phase | 课程 / Lesson | 示例 / Example |
> | --- | --- | --- |
> | 一、数学基础 | [向量与坐标](lessons/01-math-fundamentals/01-vectors.md) | [examples/01-vectors](examples/01-vectors/index.html) |
> | | [三角函数](lessons/01-math-fundamentals/02-trigonometry.md) | [examples/02-trigonometry](examples/02-trigonometry/index.html) |
> | | [矩阵变换](lessons/01-math-fundamentals/03-matrices.md) | [examples/03-matrices](examples/03-matrices/index.html) |
> | | [欧拉角与四元数](lessons/01-math-fundamentals/04-euler-quaternion.md) | [examples/04-quaternion](examples/04-quaternion/index.html) |
> | | [相机与投影](lessons/01-math-fundamentals/05-camera-projection.md) | [examples/05-camera-projection](examples/05-camera-projection/index.html) |
> | 二、核心对象 | [Scene Graph](lessons/02-core-objects/01-scene-graph.md) | [examples/06-scene-graph](examples/06-scene-graph/index.html) |
> | | [Geometry](lessons/02-core-objects/02-geometry.md) | [examples/07-geometry](examples/07-geometry/index.html) |
> | | [Material](lessons/02-core-objects/03-material.md) | [examples/08-material](examples/08-material/index.html) |
> | | [Texture](lessons/02-core-objects/04-texture.md) | [examples/09-texture](examples/09-texture/index.html) |
> | | [Lighting 与阴影](lessons/02-core-objects/05-lighting-shadow.md) | [examples/10-lighting-shadow](examples/10-lighting-shadow/index.html) |
> | | [渲染循环](lessons/02-core-objects/06-render-loop.md) | [examples/11-render-loop](examples/11-render-loop/index.html) |
> | 三、模型交互 | [glTF 工作流](lessons/03-models-animation-interaction/01-gltf-workflow.md) | [examples/12-gltf-workflow](examples/12-gltf-workflow/index.html) |
> | | [动画系统](lessons/03-models-animation-interaction/02-animation-system.md) | [examples/13-animation-system](examples/13-animation-system/index.html) |
> | | [Raycaster 交互](lessons/03-models-animation-interaction/03-raycaster-interaction.md) | [examples/14-raycaster](examples/14-raycaster/index.html) |
> | | [Controls](lessons/03-models-animation-interaction/04-controls.md) | [examples/15-controls](examples/15-controls/index.html) |
> | | [HTML 与 3D 混合](lessons/03-models-animation-interaction/05-html-3d-mix.md) | [examples/16-html-3d-mix](examples/16-html-3d-mix/index.html) |
> | 四、Shader GPU | [渲染管线](lessons/04-shader-gpu/01-render-pipeline.md) | [examples/17-render-pipeline](examples/17-render-pipeline/index.html) |
> | | [GLSL 基础](lessons/04-shader-gpu/02-glsl-basics.md) | [examples/18-glsl-basics](examples/18-glsl-basics/index.html) |
> | | [ShaderMaterial](lessons/04-shader-gpu/03-shader-material.md) | [examples/19-shader-material](examples/19-shader-material/index.html) |
> | | [Shader 调试](lessons/04-shader-gpu/04-shader-debug.md) | [examples/20-shader-debug](examples/20-shader-debug/index.html) |
> | | [后处理](lessons/04-shader-gpu/05-postprocessing.md) | [examples/21-postprocessing](examples/21-postprocessing/index.html) |
> | 五、WebGPU/TSL | [WebGPU 与 TSL](lessons/05-webgpu-tsl/01-webgpu-tsl.md) | [examples/22-webgpu-tsl](examples/22-webgpu-tsl/index.html) |
> | 六、性能优化 | [性能优化](lessons/06-performance/01-performance.md) | [examples/23-performance](examples/23-performance/index.html) |
> | 七、工程架构 | [工程化与架构](lessons/07-engineering-architecture/01-architecture.md) | [examples/24-architecture](examples/24-architecture/index.html) |
> | 项目与计划 | [12 个项目](lessons/08-projects/01-projects.md) · [24 周计划](lessons/09-study-plan/01-plan.md) · [自测题](lessons/10-self-assessment/01-questions.md) | — |

---

## 一、你需要掌握的六层能力

```text
第 6 层：大型项目与架构
第 5 层：性能优化与调试
第 4 层：Shader、后处理、WebGPU
第 3 层：模型、动画、交互、物理
第 2 层：Three.js 核心对象体系
第 1 层：数学、图形学、浏览器基础
```

很多人卡在 Three.js，是因为只学了第 2 层：

```js
new Scene()
new PerspectiveCamera()
new Mesh()
new WebGLRenderer()
```

但不知道这些对象背后的坐标变换、GPU 管线、材质模型和内存管理。

你的学习方式应该是：

```text
效果观察
→ 拆解原理
→ 最小实现
→ 参数可视化
→ 不看资料重写
→ 做成完整项目
→ 分析性能
```

这与你习惯的“抽象知识可视化”非常契合。

---

# 二、第一阶段：补齐数学和图形学基础

建议用 **3～4 周**。

不需要先系统学完大学线性代数，但必须理解以下内容。

## 1. 坐标和向量

掌握：

* 世界坐标
* 局部坐标
* 相机坐标
* 屏幕坐标
* 向量加减
* 向量长度
* 单位向量
* 点积
* 叉积
* 法向量
* 投影

你需要能解释：

```js
object.position.add(direction.multiplyScalar(speed))
```

本质上是什么：

```text
新位置 = 旧位置 + 单位方向 × 移动距离
```

重点实践：

1. 两点之间移动
2. 物体朝向目标
3. 判断目标位于物体前方还是后方
4. 计算两个方向的夹角
5. 计算平面法线
6. 鼠标点击映射到三维空间

---

## 2. 三角函数

重点掌握：

```text
sin
cos
tan
弧度
角度
周期运动
圆周运动
极坐标
```

Three.js 中几乎所有周期动画都离不开：

```js
const x = Math.cos(time) * radius
const z = Math.sin(time) * radius
```

需要独立完成：

* 圆周运动
* 椭圆运动
* 波浪
* 呼吸效果
* 摆动
* 螺旋线
* 相机环绕

---

## 3. 矩阵变换

至少理解：

```text
平移矩阵
旋转矩阵
缩放矩阵
模型矩阵
视图矩阵
投影矩阵
MVP 变换
矩阵乘法顺序
```

核心流程：

```text
局部坐标
  ↓ Model Matrix
世界坐标
  ↓ View Matrix
相机坐标
  ↓ Projection Matrix
裁剪坐标
  ↓ 透视除法
NDC
  ↓ Viewport
屏幕坐标
```

Three.js 帮你自动完成了大部分计算，但调试以下问题时必须理解矩阵：

* 模型为什么绕奇怪的点旋转
* 父子节点变换为什么相互影响
* 为什么先旋转再平移和先平移再旋转结果不同
* 如何把世界坐标转换到局部坐标
* 如何把 3D 标签定位到 HTML 页面

需要熟悉：

```js
object.matrix
object.matrixWorld
object.updateMatrix()
object.updateMatrixWorld()
object.localToWorld()
object.worldToLocal()
vector.applyMatrix4()
```

---

## 4. 欧拉角、四元数

你需要明确区分：

```text
Euler：适合人工理解和设置角度
Quaternion：适合组合旋转、插值和程序控制
```

重点理解：

* 绕 X/Y/Z 轴旋转
* 旋转顺序
* 万向节锁
* 四元数插值 `slerp`
* `lookAt`
* 朝向跟随
* 相机平滑转向

练习：

```js
object.quaternion.slerp(targetQuaternion, 0.1)
```

实现一个物体平滑转向鼠标指向的位置。

---

## 5. 相机与投影

理解：

### 透视相机

```js
new THREE.PerspectiveCamera(fov, aspect, near, far)
```

掌握每个参数的视觉和性能影响。

### 正交相机

```js
new THREE.OrthographicCamera(left, right, top, bottom, near, far)
```

典型用途：

* 地图
* CAD
* 2.5D 场景
* UI 图标
* 像素风
* 模型查看器辅助视图

练习：制作一个页面，可以实时切换透视相机与正交相机。

---

# 三、第二阶段：彻底掌握 Three.js 核心对象体系

建议用 **4～6 周**。

Three.js 官方文档、Manual 和 Examples 应当分别承担不同作用：

| 资源       | 用法       |
| -------- | -------- |
| Manual   | 建立知识体系   |
| Docs     | 查询具体 API |
| Examples | 学习真实实现   |
| 源码       | 理解内部机制   |

官方 Manual 从环境搭建、场景创建、模型加载，到纹理、灯光等主题进行了系统组织。([Three.js][2])

---

## 1. Scene Graph

这是 Three.js 最核心的抽象。

```text
Object3D
├── Scene
├── Group
├── Mesh
├── Camera
├── Light
├── Bone
├── Points
├── Line
└── Sprite
```

你需要真正理解：

* 父子关系
* 局部坐标
* 世界坐标
* 变换继承
* `add/remove`
* `traverse`
* `visible`
* `layers`
* `renderOrder`
* `frustumCulled`

练习项目：

> 制作一个太阳系层级模型。

```text
Scene
└── Sun
    └── EarthOrbit
        └── Earth
            └── MoonOrbit
                └── Moon
```

不要直接计算月球的世界位置，要利用父子层级完成。

---

## 2. Geometry

重点学习：

```text
BufferGeometry
BufferAttribute
position
normal
uv
index
groups
boundingBox
boundingSphere
drawRange
```

必须手写几何体，而不是只使用：

```js
new THREE.BoxGeometry()
```

至少手写：

1. 三角形
2. 矩形
3. 圆
4. 网格平面
5. 五角星
6. 自定义道路
7. 曲线管道

理解 indexed geometry：

```text
非索引几何体：
每个三角形重复存储顶点

索引几何体：
顶点只存储一次
通过 index 复用
```

尝试使用：

```js
geometry.computeVertexNormals()
geometry.computeBoundingBox()
geometry.computeBoundingSphere()
geometry.toNonIndexed()
```

---

## 3. Material

建议按渲染复杂度学习：

```text
MeshBasicMaterial
    ↓
MeshLambertMaterial
    ↓
MeshPhongMaterial
    ↓
MeshStandardMaterial
    ↓
MeshPhysicalMaterial
    ↓
ShaderMaterial
    ↓
NodeMaterial / TSL
```

重点理解：

* 材质和灯光的关系
* PBR
* roughness
* metalness
* normal map
* emissive
* alpha
* blending
* depth test
* depth write
* side
* transparent
* tone mapping
* color space

一个常见误区是把“颜色不对”归因于贴图，实际上可能涉及：

```text
颜色空间
环境光
色调映射
曝光
材质参数
纹理编码
```

练习：

> 做一个材质实验室。

页面中实时调整：

* 金属度
* 粗糙度
* 环境贴图强度
* 曝光
* 色调映射
* 光源方向

---

## 4. Texture

掌握：

```text
TextureLoader
CubeTexture
DataTexture
CanvasTexture
VideoTexture
RenderTarget Texture
```

参数：

```js
texture.wrapS
texture.wrapT
texture.repeat
texture.offset
texture.rotation
texture.center
texture.minFilter
texture.magFilter
texture.anisotropy
texture.colorSpace
```

同时理解：

* UV 坐标
* 纹理采样
* mipmap
* 图像尺寸
* NPOT
* 压缩纹理
* HDR 环境图
* PMREM

练习：

1. 制作 UV 检查器
2. 动态 CanvasTexture
3. 视频贴图
4. 滚动道路纹理
5. 水面法线贴图
6. HDR 环境光照

---

## 5. Lighting 和阴影

灯光类型：

```text
AmbientLight
HemisphereLight
DirectionalLight
PointLight
SpotLight
RectAreaLight
```

必须理解：

```text
灯光不是“让物体变亮”
而是参与材质的光照计算
```

阴影需要理解：

* shadow map
* light camera
* shadow bias
* normal bias
* map size
* shadow acne
* peter-panning
* 阴影范围与性能

制作一个阴影调试器，把光源相机范围可视化。

---

## 6. 渲染循环

掌握以下三种时间概念：

```text
帧数
时间
时间增量 delta
```

推荐：

```js
renderer.setAnimationLoop(animate)

function animate(time: number) {
  renderer.render(scene, camera)
}
```

不要写成：

```js
object.rotation.y += 0.01
```

因为运动速度会依赖刷新率。

应该使用：

```js
object.rotation.y += angularSpeed * delta
```

还要理解：

* 固定时间步长
* 可变时间步长
* 插值
* 游戏循环
* 页面隐藏时暂停
* 按需渲染

---

# 四、第三阶段：模型、动画和交互

建议用 **4～6 周**。

---

## 1. glTF / GLB 模型工作流

Web 3D 中优先掌握 glTF/GLB。

需要学习完整链路：

```text
Blender 建模
→ 材质整理
→ UV
→ 贴图
→ 骨骼动画
→ 导出 GLB
→ 压缩
→ Three.js 加载
→ 场景管理
```

掌握：

```text
GLTFLoader
DRACOLoader
KTX2Loader
MeshoptDecoder
LoadingManager
```

重点不是“加载出来”，而是：

* 检查场景树
* 查找指定节点
* 替换材质
* 控制动画
* 处理模型尺寸
* 处理模型中心点
* 处理坐标轴
* 释放资源

---

## 2. Animation System

掌握：

```text
AnimationMixer
AnimationClip
AnimationAction
KeyframeTrack
```

需要实现：

* 播放
* 暂停
* 循环
* 淡入淡出
* 动画切换
* 动画混合
* 多角色动画
* 程序化动画

例如角色从 idle 切换到 run：

```js
idleAction.fadeOut(0.3)
runAction.reset().fadeIn(0.3).play()
```

---

## 3. Raycaster 和交互

掌握完整流程：

```text
鼠标屏幕坐标
→ NDC
→ Raycaster
→ 射线
→ 场景求交
→ 交点
→ 交互反馈
```

```js
pointer.x = event.clientX / width * 2 - 1
pointer.y = -(event.clientY / height) * 2 + 1

raycaster.setFromCamera(pointer, camera)
const intersections = raycaster.intersectObjects(objects, true)
```

需要实现：

* hover
* click
* drag
* 框选
* 地面寻路
* 模型部件选择
* 测距
* 标注
* 鼠标拖动物体

---

## 4. Controls

熟悉：

```text
OrbitControls
MapControls
TrackballControls
PointerLockControls
TransformControls
DragControls
```

但不要只会调用 Controls。至少自己实现一次：

* 轨道相机
* 第一人称相机
* 相机平滑跟随
* 相机路径动画

这样才能理解：

```text
target
方位角
极角
相机距离
阻尼
输入映射
```

---

## 5. HTML 与 3D 混合

掌握：

* 3D 坐标投影到屏幕
* HTML 标签跟随 3D 对象
* CSS2DRenderer
* CSS3DRenderer
* 遮挡判断
* 多层 UI
* DOM 与 Canvas 事件协调

这对数据可视化、产品依赖图、数字孪生非常重要。

---

# 五、第四阶段：Shader 和 GPU 渲染

建议用 **6～10 周**。

这是从“会用 Three.js”到“能够创造视觉效果”的分界线。

---

## 1. 先学渲染管线

理解：

```text
JavaScript
→ Buffer
→ Vertex Shader
→ Primitive Assembly
→ Rasterization
→ Fragment Shader
→ Depth / Blend
→ Framebuffer
```

要明确：

* CPU 负责什么
* GPU 负责什么
* 顶点着色器执行多少次
* 片元着色器执行多少次
* attribute 是什么
* uniform 是什么
* varying 是什么

---

## 2. GLSL 基础

学习顺序：

1. 数据类型
2. 向量
3. 矩阵
4. `uniform`
5. `attribute`
6. `varying`
7. 内置变量
8. 纹理采样
9. 插值
10. 噪声

第一个 Shader：

```glsl
void main() {
    gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
}
```

逐步实现：

1. 纯色
2. UV 渐变
3. 时间动画
4. 波浪顶点
5. 纹理采样
6. 圆形遮罩
7. 扫描线
8. 溶解
9. 火焰
10. 水面
11. 星空
12. 地形

---

## 3. ShaderMaterial 和 RawShaderMaterial

区别：

```text
ShaderMaterial
Three.js 自动注入部分变量和定义

RawShaderMaterial
更接近原始 GLSL
```

建议先用 `ShaderMaterial`，然后用 `RawShaderMaterial` 重写一次。

---

## 4. Shader 调试

需要形成以下方法：

```text
复杂公式
→ 拆成中间变量
→ 把变量映射成颜色
→ 观察结果
```

例如调试法线：

```glsl
gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
```

调试 UV：

```glsl
gl_FragColor = vec4(vUv, 0.0, 1.0);
```

---

## 5. 后处理

掌握：

```text
EffectComposer
RenderPass
OutputPass
UnrealBloomPass
ShaderPass
RenderTarget
```

实现：

* Bloom
* FXAA
* 景深
* 边缘描边
* 像素化
* 故障效果
* 色彩分级
* 雨滴镜头
* 屏幕扭曲

重点理解后处理不是给单个模型加特效，而是：

```text
场景先渲染到纹理
→ 纹理经过一个或多个全屏 Pass
→ 输出到屏幕
```

---

# 六、第五阶段：WebGPU 和 TSL

不要一开始就用 WebGPU，但在掌握 WebGLRenderer、材质和 Shader 后，应当进入这一阶段。

Three.js 官方现在将 `WebGPURenderer` 定义为 `WebGLRenderer` 的新替代方案；默认优先使用 WebGPU，不支持时可以回退到 WebGL 2。([Three.js][3])

同时，当前 `WebGLRenderer` 已经包含与节点材质、TSL 兼容的能力，用于为迁移到 `WebGPURenderer` 做准备。([Three.js][4])

学习顺序：

```text
WebGLRenderer
→ GLSL ShaderMaterial
→ Node Material
→ TSL
→ WebGPURenderer
→ Compute
```

重点理解：

* TSL 的节点式表达
* Node Material
* WebGPU 渲染后端
* storage buffer
* compute shader
* GPU 粒子系统
* WebGL 与 WebGPU 的差异

现阶段不要只学习 WebGPU。现实项目仍然需要理解 WebGL、兼容性、回退和现有材质体系。

---

# 七、第六阶段：性能优化

性能优化不是项目完成后的附加步骤，而是 Three.js 核心能力。

## 1. 先学会测量

使用：

```js
renderer.info
```

观察：

```text
draw calls
triangles
points
lines
geometries
textures
programs
```

同时使用：

* Chrome Performance
* Chrome Memory
* Spector.js
* Stats.js
* GPU 时间查询
* 浏览器任务管理器

---

## 2. 重点优化方向

### Draw Call

优化手段：

```text
InstancedMesh
Batching
合并 Geometry
材质复用
纹理图集
减少透明物体
```

### 顶点和像素负载

```text
减少面数
LOD
减少像素过度绘制
缩小阴影范围
降低 shadow map
降低 DPR
视锥剔除
遮挡剔除
```

### 资源体积

```text
GLB
Draco
Meshopt
KTX2
WebP / AVIF
合理纹理尺寸
按需加载
```

### 内存

必须会释放：

```js
geometry.dispose()
material.dispose()
texture.dispose()
renderTarget.dispose()
renderer.dispose()
```

注意：

```text
从 Scene 中 remove 一个 Mesh
≠
GPU 资源已经释放
```

---

## 3. 粒子系统

粒子是性能训练的最佳项目。

依次实现：

1. 100 个 Mesh
2. 10,000 个 Points
3. InstancedMesh
4. Shader 粒子
5. GPGPU 粒子
6. WebGPU Compute 粒子

通过对比理解 CPU、draw call 和 GPU 并行计算。

---

# 八、第七阶段：工程化和架构

以你的前端背景，建议直接使用：

```text
Vite
TypeScript
Three.js
Vue 3
Pinia 可选
Web Worker 可选
Blender
glTF Transform
```

但学习早期应保持 Three.js 核心代码与 Vue 解耦。

推荐结构：

```text
src/
├── engine/
│   ├── Experience.ts
│   ├── Renderer.ts
│   ├── Camera.ts
│   ├── SceneManager.ts
│   ├── ResourceManager.ts
│   ├── InputManager.ts
│   ├── Time.ts
│   └── EventBus.ts
├── worlds/
│   ├── MainWorld.ts
│   └── objects/
├── shaders/
├── loaders/
├── utils/
├── components/
└── views/
```

核心生命周期：

```ts
interface SceneModule {
  init(): Promise<void>
  update(delta: number, elapsed: number): void
  resize(width: number, height: number): void
  dispose(): void
}
```

不要让 Vue 组件直接管理大量 Mesh：

```vue
<script setup>
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera()
// 数百行 Three.js 代码
</script>
```

推荐：

```text
Vue：
页面、表单、面板、路由、业务状态

Three.js Engine：
场景、资源、相机、渲染循环、交互、销毁
```

---

# 九、必须完成的 12 个项目

不要重复做旋转立方体。按照难度递增完成这些项目。

## 基础项目

### 1. 三维坐标教学工具

功能：

* 坐标轴
* 网格
* 局部坐标与世界坐标
* 平移、旋转、缩放
* 矩阵显示
* 正交/透视相机切换

### 2. 材质与灯光实验室

功能：

* PBR 参数
* 灯光参数
* 阴影
* HDR
* Tone Mapping
* 调试面板

### 3. 模型查看器

功能：

* GLB 加载
* 动画控制
* 材质列表
* 节点树
* 部件选择
* 截图
* 环境切换

---

## 中级项目

### 4. 无限公路场景

训练：

* 相机
* 纹理滚动
* 对象池
* 雾
* 光照
* 程序化生成

### 5. 海浪和天气系统

训练：

* Shader
* 粒子
* 噪声
* 后处理
* 音效
* 昼夜变化

### 6. 三维产品依赖图

结合你的现有业务：

* 产品
* 服务
* 组件
* 依赖连线
* 布局
* 射线选择
* 标签
* 聚焦
* 搜索
* 性能优化

### 7. 小型第三人称场景

训练：

* 角色动画
* 状态机
* 相机跟随
* 碰撞
* 地面检测
* 路径移动

---

## 高级项目

### 8. GPU 粒子系统

实现：

* 吸引
* 排斥
* 涡流
* 鼠标交互
* 形状变换
* 100 万级粒子探索

### 9. 地形系统

训练：

* 高度图
* 多层纹理
* LOD
* 天空
* 植被实例化
* 大世界坐标

### 10. 后处理视觉作品

实现：

* Bloom
* 景深
* 色彩分级
* 扫描
* 故障
* 自定义 Pass

### 11. WebGPU Compute Demo

实现：

* GPU 模拟
* Storage Buffer
* 粒子更新
* WebGL 回退策略

### 12. 完整商业级项目

选择一个：

* 数字孪生
* 数据中心可视化
* 三维地图
* 在线展厅
* 工业设备监控
* 3D 编辑器
* 模型标注系统

需要包含：

```text
需求文档
→ Technical Spec
→ 任务拆分
→ 开发
→ 性能验证
→ 兼容性验证
→ 部署
```

---

# 十、建议的 24 周学习计划

## 第 1～4 周：数学和基础

```text
第 1 周：向量、坐标、三角函数
第 2 周：矩阵、层级、坐标转换
第 3 周：相机、投影、四元数
第 4 周：从零实现基础场景
```

交付：

* 坐标系统演示
* 相机投影演示
* 向量运动演示

---

## 第 5～8 周：核心对象

```text
第 5 周：Scene Graph、Object3D
第 6 周：Geometry、BufferGeometry
第 7 周：Material、Texture
第 8 周：Lighting、Shadow、Renderer
```

交付：

* 自定义几何体编辑器
* 材质实验室

---

## 第 9～12 周：资源和交互

```text
第 9 周：GLTF、模型工作流
第 10 周：骨骼动画
第 11 周：Raycaster、Controls
第 12 周：HTML 与 3D 混合
```

交付：

* 完整模型查看器

---

## 第 13～17 周：Shader

```text
第 13 周：GPU 管线、GLSL
第 14 周：顶点 Shader
第 15 周：片元 Shader
第 16 周：噪声、程序化效果
第 17 周：后处理
```

交付：

* 水面
* 火焰
* 星空
* 溶解
* Bloom 场景

---

## 第 18～20 周：性能

```text
第 18 周：性能测量
第 19 周：实例化、合批、LOD
第 20 周：资源压缩和内存管理
```

交付：

* 十万对象优化实验
* 性能对比报告

---

## 第 21～22 周：WebGPU 和 TSL

```text
第 21 周：Node Material、TSL
第 22 周：WebGPURenderer、Compute
```

交付：

* TSL 材质
* WebGPU 粒子实验

---

## 第 23～24 周：综合项目

完成一个完整项目，并写：

* 架构文档
* 渲染流程
* 资源规范
* 性能预算
* 调试记录
* 兼容性报告

---

# 十一、每天如何练习

建议每天 90～120 分钟：

```text
20 分钟：学习一个原理
30 分钟：照着资料实现
30 分钟：关闭资料重新实现
20 分钟：增加调试面板和可视化
20 分钟：记录原理、问题和结论
```

每个知识点都建立一个独立 Demo：

```text
01-vector-direction
02-dot-product
03-cross-product
04-local-world
05-perspective-camera
06-buffer-geometry
07-uv
08-normal
09-raycaster
10-shadow-map
...
```

每个 Demo 必须包括：

```text
README.md
原理说明
核心公式
参数说明
易错点
可运行代码
调试面板
性能数据
```

这可以直接成为你的 Three.js 知识网站。

---

# 十二、判断自己是否真正掌握

当你能独立回答下面的问题，才算进入高级阶段：

1. 为什么透明物体会出现排序错误？
2. 为什么模型从 Blender 导入后方向不对？
3. 为什么阴影边缘抖动或出现条纹？
4. `matrixWorld` 是什么时候更新的？
5. `normalMatrix` 为什么是逆转置矩阵？
6. 为什么同样的动画在 60Hz 和 144Hz 上速度不同？
7. 为什么一个场景只有 20 万个三角形却很卡？
8. 为什么大量小 Mesh 比一个大 Mesh 更慢？
9. 为什么调用 `remove()` 后显存没有下降？
10. 为什么法线贴图需要切线空间？
11. 为什么 Bloom 会让整个画面发白？
12. Raycaster 如何从二维鼠标生成三维射线？
13. WebGLRenderer 与 WebGPURenderer 应该如何选择？
14. GLSL、Node Material 与 TSL 的关系是什么？
15. 如何设计一个可销毁、可切换、可测试的 Three.js 场景模块？

---

# 最关键的学习原则

## 不背 API

API 只在用到时查官方文档。

## 不只看视频

每看一个效果，必须自己重写。

## 不只做视觉效果

每个效果都解释它的数学、渲染和性能原理。

## 不过早依赖封装

早期不要把 React Three Fiber、TresJS 或大型引擎封装作为主线。先直接掌握 Three.js。

## 要阅读官方示例源码

Three.js 官方提供大量示例和编辑器；示例不是展示页，而是重要的实现参考。([Three.js][1])

## 要阅读 Three.js 源码

建议从这些类开始：

```text
Vector3
Matrix4
Object3D
BufferGeometry
BufferAttribute
Mesh
Raycaster
WebGLRenderer
WebGLPrograms
WebGLTextures
AnimationMixer
```

不需要通读整个仓库。采用：

```text
遇到问题
→ 查文档
→ 看示例
→ 进入对应源码
→ 调试调用链
```

---

## 最适合你的主线

结合你的前端和可视化经验，推荐把最终方向设为：

> **Three.js 交互式知识可视化 + 工业数据可视化 + Shader 视觉表达**

不要把目标限制成“制作漂亮 3D 页面”。更高价值的能力是：

```text
把抽象结构、关系、过程、系统状态
转换成可观察、可交互、可解释的三维模型
```

这会把你现有的 Vue、TypeScript、G6、Canvas、动画和知识网站经验连接起来。

[1]: https://threejs.org/?utm_source=chatgpt.com "Three.js – JavaScript 3D Library"
[2]: https://threejs.org/manual/?utm_source=chatgpt.com "Manual"
[3]: https://threejs.org/docs/pages/WebGPURenderer.html?utm_source=chatgpt.com "WebGPURenderer – three.js docs"
[4]: https://threejs.org/docs/pages/WebGLRenderer.html?utm_source=chatgpt.com "WebGLRenderer – three.js docs"

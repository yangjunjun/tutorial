# 坐标和向量 / Coordinates & Vectors

> 阶段 / Phase: 一、数学和图形学基础 / Math & Graphics Fundamentals
> 预计用时 / Estimated: 3-4 小时 / 3-4 hours
> 难度 / Difficulty: Beginner

## 概述 / Overview

向量是 3D 图形学的原子。Three.js 中几乎每一个动作——物体移动、相机朝向、光线反射、碰撞检测——都建立在向量运算之上。本节将从坐标系开始，系统讲解 `THREE.Vector3` 的加减、长度、归一化、点积、叉积、法向量与投影，并解释为什么 `object.position.add(direction.multiplyScalar(speed))` 等价于"新位置 = 旧位置 + 单位方向 × 移动距离"。

Vectors are the atoms of 3D graphics. Almost every action in Three.js — object movement, camera orientation, light reflection, collision detection — is built on vector operations. This lesson starts from coordinate systems and systematically covers `THREE.Vector3` addition/subtraction, length, normalization, dot product, cross product, normals, and projection, explaining why `object.position.add(direction.multiplyScalar(speed))` equals "new position = old position + unit direction × distance".

## 核心概念 / Core Concepts

### 1. 四种坐标系 / Four Coordinate Systems

Three.js 中存在四类常用坐标系，理解它们的区别是调试变换问题的前提：

In Three.js there are four commonly used coordinate systems; understanding their differences is the prerequisite for debugging transform issues:

- **世界坐标 / World coordinates**：场景全局坐标系，原点固定在 `(0,0,0)`，Y 轴默认朝上。`object.position` 在没有父节点时就是世界坐标。
- **局部坐标 / Local coordinates**：相对于父节点的坐标。子物体的 `position` 是局部坐标，需经父级 `matrixWorld` 变换后才得到世界坐标。
- **相机坐标 / Camera (view) coordinates**：以相机为原点，相机朝向 -Z 方向时的坐标系。常用于裁剪、深度排序。
- **屏幕坐标 / Screen coordinates**：像素坐标，左上角 `(0,0)`。由 NDC 经视口变换得到。

Three.js 默认右手坐标系：右拇指 X、食指 Y、中指 Z，三指互相垂直。

Three.js uses a right-handed coordinate system by default: right thumb = X, index = Y, middle = Z, all mutually perpendicular.

```js
// 读取世界坐标 / Read world position (traverses parent chain)
const worldPos = new THREE.Vector3();
object.getWorldPosition(worldPos);
console.log(worldPos); // (x, y, z) in world space / 世界空间下的 (x,y,z)

// 世界坐标 → 局部坐标 / World → Local
const localPos = object.worldToLocal(worldPos.clone());

// 局部坐标 → 世界坐标 / Local → World
const worldPos2 = object.localToWorld(localPos.clone());
```

### 2. 向量加减与位移 / Vector Addition & Displacement

向量相加在几何上就是"首尾相接"的平移。移动物体的最常见写法：

Vector addition is geometrically "tip-to-tail" translation. The most common way to move an object:

```js
// direction: 单位方向向量 / unit direction vector
// speed: 每秒移动距离(米) / distance per second (meters)
// delta: 帧间隔(秒) / frame interval (seconds)
object.position.add(direction.clone().multiplyScalar(speed * delta));
```

等价公式 / Equivalent formula:

```
newPos = oldPos + unitDir × distance
```

注意 `direction.multiplyScalar(s)` 会**就地修改** `direction`。若 `direction` 需要复用，必须 `.clone()`，否则下一帧方向会被污染。

Note that `direction.multiplyScalar(s)` mutates `direction` **in place**. If `direction` is reused, you must `.clone()`, otherwise it gets polluted in the next frame.

### 3. 长度与归一化 / Length & Normalization

```js
const v = new THREE.Vector3(3, 4, 0);
const len = v.length();          // 5  / 模长 / magnitude
const unit = v.clone().normalize(); // (0.6, 0.8, 0) 单位向量 / unit vector
```

`normalize()` 等价于 `v.divideScalar(v.length())`。零向量归一化会得到 `NaN`，需先判空。

`normalize()` equals `v.divideScalar(v.length())`. Normalizing a zero vector yields `NaN` — always check first.

### 4. 点积 / Dot Product

点积衡量两个向量的"相似程度"，是判断前后、夹角、投影的核心工具：

The dot product measures "similarity" between two vectors; it is the core tool for front/back testing, angle computation, and projection:

```js
const d = a.dot(b); // a·b = |a||b|cosθ
```

- `d > 0`：夹角 < 90°，方向相近 / angle < 90°, similar direction
- `d = 0`：垂直 / perpendicular
- `d < 0`：夹角 > 90°，方向相反 / angle > 90°, opposite direction

若 `a`、`b` 已归一化，则 `a.dot(b) = cosθ`，可直接用 `Math.acos` 求夹角。

If `a` and `b` are normalized, `a.dot(b) = cosθ`; you can get the angle via `Math.acos`.

```js
// 判断目标在物体前方还是后方 / Is target in front or behind?
const toTarget = target.clone().sub(object.position).normalize();
const forward = new THREE.Vector3();
object.getWorldDirection(forward); // 物体朝向 / object's forward
const dot = forward.dot(toTarget);
if (dot > 0) console.log('在前方 / In front');
else console.log('在后方 / Behind');
```

### 5. 叉积 / Cross Product

叉积返回一个同时垂直于两个输入向量的向量，常用于求平面法线、判断左右、计算力矩：

The cross product returns a vector perpendicular to both inputs; it is used for computing normals, left/right testing, and torque:

```js
const normal = new THREE.Vector3().crossVectors(a, b); // |n| = |a||b|sinθ
// 方向由右手定则确定 / direction by right-hand rule
```

叉积的模长等于两向量张成的平行四边形面积。

The magnitude of the cross product equals the area of the parallelogram spanned by the two vectors.

```js
// 计算三角形法线 / Compute triangle normal
const p0 = new THREE.Vector3(0,0,0);
const p1 = new THREE.Vector3(1,0,0);
const p2 = new THREE.Vector3(0,1,0);
const edge1 = p1.clone().sub(p0);
const edge2 = p2.clone().sub(p0);
const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
// (0,0,1) 朝向屏幕外 / pointing out of screen
```

### 6. 法向量 / Normals

法向量是垂直于表面的单位向量，决定了光照计算中的反射方向。Three.js 的 `Geometry` 会自动生成顶点法线，但理解其原理有助于编写 Shader 和修正光照异常。

A normal is a unit vector perpendicular to a surface, determining the reflection direction in lighting. Three.js generates vertex normals automatically, but understanding them helps when writing shaders or fixing lighting artifacts.

```js
// 用 FaceNormal 辅助线可视化法线 / Visualize normal with ArrowHelper
const arrow = new THREE.ArrowHelper(normal, p0, 0.5, 0x00ff00);
scene.add(arrow);
```

### 7. 投影 / Projection

将向量 `v` 投影到方向 `u` 上：

Project vector `v` onto direction `u`:

```
proj_u(v) = (v·u / |u|²) × u
```

若 `u` 已归一化，简化为 `(v·u) × u`。

If `u` is normalized, this simplifies to `(v·u) × u`.

鼠标点击 → 3D 平面 是最典型的投影应用：用 `Raycaster` 求射线与平面的交点。

Click-to-3D-plane is the canonical projection application: use `Raycaster` to intersect a ray with a plane.

```js
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 地面 / ground
const hit = new THREE.Vector3();
raycaster.setFromCamera(mouseNDC, camera);
raycaster.ray.intersectPlane(plane, hit); // hit 即 3D 交点 / hit is the 3D point
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.Vector3` | 三维向量类 / 3D vector class |
| `v.add(a)` / `v.sub(a)` | 加减（就地）/ add/subtract (in place) |
| `v.multiplyScalar(s)` | 数乘（就地）/ scalar multiply (in place) |
| `v.length()` / `v.lengthSq()` | 模长 / 模长平方（省开方）/ magnitude / squared magnitude |
| `v.normalize()` | 归一化（就地）/ normalize (in place) |
| `v.dot(b)` | 点积 / dot product |
| `v.crossVectors(a,b)` | 叉积（结果存入 v）/ cross product |
| `v.distanceTo(b)` / `distanceToSquared(b)` | 距离 / 距离平方 |
| `v.lerp(b, t)` | 线性插值 / linear interpolation |
| `v.angleTo(b)` | 夹角（弧度）/ angle (radians) |
| `v.clone()` | 返回副本 / return a copy |
| `object.getWorldPosition(v)` | 取世界坐标 / get world position |
| `object.getWorldDirection(v)` | 取朝向单位向量 / get forward unit vector |
| `object.localToWorld(v)` | 局部→世界 / local to world |
| `object.worldToLocal(v)` | 世界→局部 / world to local |
| `THREE.Raycaster` | 射线投射 / ray casting |
| `THREE.Plane` | 平面表示 / plane representation |
| `THREE.ArrowHelper` | 向量可视化 / vector visualization |

## 数学/原理 / Math & Principles

### 向量基本运算 / Vector Operations

设 `a = (ax, ay, az)`，`b = (bx, by, bz)`：

```
a + b = (ax+bx, ay+by, az+bz)
a · b = ax·bx + ay·by + az·bz           (标量 / scalar)
a × b = (ay·bz-az·by, az·bx-ax·bz, ax·by-ay·bx)  (向量 / vector)
|a|   = √(ax²+ay²+az²)
â     = a / |a|                          (单位向量 / unit vector)
```

### 位移公式 / Displacement Formula

匀速直线运动：

```
newPos = oldPos + velocity × delta
       = oldPos + (unitDir × speed) × delta
```

- `velocity`：速度向量（带方向）/ velocity vector (directional)
- `speed`：速率标量 / speed scalar
- `delta`：帧间隔时间 / frame time delta

### 点积几何意义 / Dot Product Geometry

```
a · b = |a| |b| cosθ
```

- 归一化后 `a · b = cosθ`
- 投影长度：`|proj| = a · b̂`
- 投影向量：`proj = (a · b̂) b̂`

### 叉积几何意义 / Cross Product Geometry

```
|a × b| = |a| |b| sinθ    (平行四边形面积 / parallelogram area)
```

方向由右手定则：四指从 `a` 转向 `b`，拇指方向即 `a × b`。

Direction by right-hand rule: curl fingers from `a` to `b`; thumb points along `a × b`.

### 坐标系变换链 / Coordinate Transform Chain

```
局部坐标 (Local)
  │  × parentMatrixWorld
  ▼
世界坐标 (World)
  │  × camera.matrixWorldInverse
  ▼
相机坐标 (View)
  │  × projectionMatrix
  ▼
裁剪坐标 (Clip)
  │  ÷ w  (透视除法 / perspective divide)
  ▼
NDC [-1,1]
  │  × viewport
  ▼
屏幕像素 (Screen)
```

## 常见陷阱 / Common Pitfalls

1. **就地修改导致向量被污染 / In-place mutation pollutes vectors**：`a.add(b)` 修改的是 `a`。共享方向向量时务必 `.clone()`。 / `a.add(b)` mutates `a`. Always `.clone()` shared direction vectors.
2. **归一化零向量得到 NaN / Normalizing zero vector gives NaN**：移动前检查 `lengthSq() > 0`。 / Check `lengthSq() > 0` before moving.
3. **混淆局部与世界坐标 / Confusing local & world coordinates**：`object.position` 在有父节点时只是局部坐标，需 `getWorldPosition`。 / `object.position` is local when parented; use `getWorldPosition`.
4. **`multiplyScalar` 顺序错误 / Wrong multiplyScalar order**：`direction.multiplyScalar(s)` 改变 direction 本身。若想保留原向量：`direction.clone().multiplyScalar(s)`。 / It mutates `direction`; clone first to preserve it.
5. **点积判断方向时忘记归一化 / Forgetting to normalize before dot product**：归一化后 `dot=cosθ` 才直接对应角度。 / Only after normalization does `dot=cosθ` map directly to angle.
6. **叉积顺序决定符号 / Cross product order matters**：`a×b = -(b×a)`，法线方向取决于顶点环绕顺序。 / `a×b = -(b×a)`; normal direction depends on winding order.
7. **Raycaster NDC 未归一化 / Raycaster NDC not normalized**：鼠标坐标必须映射到 `[-1,1]`，否则射线方向错误。 / Mouse coords must be mapped to `[-1,1]`.

## 调试技巧 / Debugging Tips

- 用 `console.log(v.toArray())` 输出向量数值，避免打印整个对象。 / Use `v.toArray()` for clean console output.
- 用 `ArrowHelper(dir, origin, length, color)` 可视化任意向量，验证方向是否正确。 / Use `ArrowHelper` to visualize any vector.
- 用 `v.lengthSq()` 代替 `v.length()` 做距离比较，省一次 `Math.sqrt`。 / Use `lengthSq()` for distance comparison to save a `sqrt`.
- 检查 NaN：`if (isNaN(v.x)) debugger;` —— 向量运算中 NaN 会快速传播。 / Check NaN early; it propagates fast.
- 用 `CameraHelper` 可视化相机视锥，排查投影问题。 / Use `CameraHelper` to inspect the frustum.
- 法线可视化：`new VertexNormalsHelper(mesh, 0.3, 0x00ff00)`。 / Visualize normals with `VertexNormalsHelper`.

## 练习 / Exercises

1. 让一个小球在两个固定点之间来回往返移动（用 `lerp` + 三角函数或手动方向翻转）。 / Make a sphere bounce between two fixed points using `lerp` + trig or manual direction flip.
2. 用点积判断一个移动目标是否进入物体的"前方锥形视野"。 / Use dot product to detect when a target enters a forward cone of view.
3. 用叉积计算三个点构成的三角形的面积和法线。 / Use cross product to compute a triangle's area and normal.
4. 实现鼠标点击地面 → 在点击处生成标记（Raycaster + Plane）。 / Click on ground to spawn a marker (Raycaster + Plane).
5. 用 `subVectors` + `normalize` 实现一个物体始终朝向移动方向（类似 lookAt 但手写）。 / Hand-roll a "face direction" using `subVectors` + `normalize`.
6. 用 `distanceTo` 做两个物体的接近报警（距离 < 阈值时变色）。 / Use `distanceTo` to trigger a proximity alert.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/01-vectors/index.html`](../../examples/01-vectors/index.html)

核心片段 / Core snippet:

```js
// 小球在 A、B 两点间匀速往返 / Sphere moves between A and B at constant speed
const A = new THREE.Vector3(-3, 0.5, 0);
const B = new THREE.Vector3(3, 0.5, 0);
const speed = 2.5; // m/s

// 每帧方向：A→B 或 B→A / direction each frame
const dir = B.clone().sub(A).normalize(); // (1,0,0)
const moving = A.clone();

// moving.add(dir.clone().multiplyScalar(speed * delta));
// 等价：moving = moving + unitDir × distance
// / equivalent: moving = moving + unitDir × distance

// 到达 B 后翻转方向 / flip direction on reaching B
if (moving.distanceTo(B) < 0.05) dir.negate();

// 用 ArrowHelper 可视化速度向量 / visualize velocity with ArrowHelper
arrow.setDirection(dir);
arrow.setLength(speed);

// 点积演示：判断小球在 B 的前方还是后方 / dot demo: front or back of B?
const toSphere = moving.clone().sub(B).normalize();
const forward = new THREE.Vector3(1, 0, 0);
const dot = forward.dot(toSphere); // >0 前方 / front, <0 后方 / back

// 叉积演示：可视化 forward × up = right / cross demo
const up = new THREE.Vector3(0, 1, 0);
const right = new THREE.Vector3().crossVectors(forward, up).normalize();

// 鼠标点击 → 3D 地面交点 / click → 3D ground point
const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
ray.setFromCamera(mouseNDC, camera);
const hit = new THREE.Vector3();
if (ray.ray.intersectPlane(ground, hit)) {
  marker.position.copy(hit);
}
```

## 参考资源 / References

- [Three.js Docs - Vector3](https://threejs.org/docs/#api/en/math/Vector3)
- [Three.js Docs - Raycaster](https://threejs.org/docs/#api/en/core/Raycaster)
- [Three.js Manual - Creating a scene](https://threejs.org/manual/#en/creating-a-scene)
- [Vector Math Primer - OpenGL Wiki](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [3D Math Primer for Graphics and Game Development](https://gamemath.com/)

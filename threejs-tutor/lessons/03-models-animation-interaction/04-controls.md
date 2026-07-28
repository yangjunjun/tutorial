# Controls / 相机控制器

> 阶段 / Phase: 三、模型、动画和交互 / Models, Animation & Interaction
> 预计用时 / Estimated: 5-7 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

Three.js 提供了一堆 Controls：`OrbitControls`、`MapControls`、`TrackballControls`、`PointerLockControls`、`TransformControls`、`DragControls`。但只会 `new OrbitControls()` 是不够的——你得自己实现一次轨道相机，才能真正理解 target、方位角、极角、距离、阻尼、输入映射这些概念。本节先拆解 OrbitControls 的数学原理并手写一个，再横向对比其它控制器，最后讲清何时用哪个。

Three.js ships many Controls: `OrbitControls`, `MapControls`, `TrackballControls`, `PointerLockControls`, `TransformControls`, `DragControls`. But merely calling `new OrbitControls()` isn't enough — you must implement an orbit camera yourself once to truly understand target, azimuth, polar angle, distance, damping, and input mapping. This lesson dissects the math of OrbitControls, hand-writes one, then compares the other controllers and explains when to use which.

## 核心概念 / Core Concepts

### 1. 球坐标表示相机位置 / Spherical Coordinates for Camera

轨道相机的核心：相机始终看向一个 `target`，其位置用球坐标 `(radius, theta, phi)` 描述：

The core of an orbit camera: the camera always looks at a `target`, and its position is described in spherical coords `(radius, theta, phi)`:

```text
radius = 相机到 target 的距离 / distance from camera to target
theta  = 方位角 azimuth（绕 Y 轴）/ azimuth (around Y)
phi    = 极角 polar（从 +Y 轴向下量）/ polar (from +Y axis, downward)
```

球坐标转笛卡尔：

Spherical → Cartesian:

```js
// 约定：phi 从 +Y 起算，phi=0 在正上方 / phi measured from +Y; phi=0 at top
const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
const y = target.y + radius * Math.cos(phi);
const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
camera.position.set(x, y, z);
camera.lookAt(target);
```

> Three.js 内置的 `THREE.Spherical` 类正是干这个的，`Spherical.set(radius, phi, theta)` + `Vector3.setFromSpherical`。

> Three.js ships `THREE.Spherical` for exactly this; use `Spherical.set(radius, phi, theta)` + `Vector3.setFromSpherical`.

### 2. 输入映射 / Input Mapping

鼠标拖动改变 theta/phi，滚轮改变 radius：

Mouse drag changes theta/phi; wheel changes radius:

```text
pointerMove deltaX  →  theta -= deltaX * rotateSpeed
pointerMove deltaY  →  phi   -= deltaY * rotateSpeed
wheel deltaY        →  radius *= (1 + deltaY * zoomSpeed)
```

关键细节：

Key details:

- **phi 钳制**：`phi ∈ [eps, π - eps]`，否则相机翻到正上下方导致 `lookAt` 方向奇异（up 向量与视线共线）。
- **theta 不限**：可无限旋转，靠 `theta % (2π)` 归一。
- **radius 钳制**：`[minDistance, maxDistance]`，避免穿模或飞太远。

- **phi clamp**: `phi ∈ [eps, π - eps]`; otherwise the camera flips straight above/below causing `lookAt` singularity (up vector parallel to view dir).
- **theta unlimited**: free rotation, normalize with `theta % (2π)`.
- **radius clamp**: `[minDistance, maxDistance]` to avoid clipping or flying away.

### 3. 阻尼 / Damping

直接把目标 theta/phi 赋给相机会"硬切"。阻尼的做法：维护"目标球坐标"，每帧用 lerp 把"当前球坐标"朝目标逼近一小步，产生平滑跟手感。

Directly assigning target theta/phi to the camera feels "hard". Damping: keep a "target spherical", and each frame lerp the "current spherical" toward it a small step, producing smooth follow.

```js
// 当前值朝目标值平滑 / current eases toward target
spherical.theta += (target.theta - spherical.theta) * dampingFactor;
spherical.phi   += (target.phi   - spherical.phi)   * dampingFactor;
radius          += (targetRadius - radius)          * dampingFactor;
// dampingFactor 通常 0.05~0.15 / typically 0.05~0.15
```

> 用阻尼后必须每帧调用 `controls.update()`，否则不收敛。

> With damping you MUST call `controls.update()` every frame or it won't converge.

### 4. 手写轨道相机 / Hand-written Orbit Camera

```js
class SimpleOrbit {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.target = new THREE.Vector3(0, 1.5, 0);
    this.spherical = new THREE.Spherical(8, Math.PI / 3, Math.PI / 4); // r, phi, theta
    this.targetSpherical = this.spherical.clone();
    this.enableDamping = true;
    this.dampingFactor = 0.1;
    this.rotateSpeed = 0.005;
    this.zoomSpeed = 0.001;
    this.minDistance = 2;
    this.maxDistance = 30;
    this.minPolarAngle = 0.1;
    this.maxPolarAngle = Math.PI - 0.1;
    this._bind();
    this.update();
  }
  _bind() {
    let dragging = false, lastX = 0, lastY = 0;
    this.dom.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointerup',   () => { dragging = false; });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this.targetSpherical.theta -= dx * this.rotateSpeed;
      this.targetSpherical.phi   -= dy * this.rotateSpeed;
      this.targetSpherical.phi = THREE.MathUtils.clamp(
        this.targetSpherical.phi, this.minPolarAngle, this.maxPolarAngle);
    });
    this.dom.addEventListener('wheel', e => {
      this.targetSpherical.radius *= (1 + e.deltaY * this.zoomSpeed);
      this.targetSpherical.radius = THREE.MathUtils.clamp(
        this.targetSpherical.radius, this.minDistance, this.maxDistance);
      e.preventDefault();
    }, { passive: false });
  }
  update() {
    if (this.enableDamping) {
      this.spherical.theta   += (this.targetSpherical.theta   - this.spherical.theta)   * this.dampingFactor;
      this.spherical.phi     += (this.targetSpherical.phi     - this.spherical.phi)     * this.dampingFactor;
      this.spherical.radius  += (this.targetSpherical.radius  - this.spherical.radius)  * this.dampingFactor;
    } else {
      this.spherical.copy(this.targetSpherical);
    }
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
}
```

### 5. 控制器横向对比 / Controller Comparison

| 控制器 / Controller | 特点 / Feature | 适用 / Use case |
| --- | --- | --- |
| OrbitControls | 围绕 target 旋转，总是 up=Y，不翻滚 | 通用 3D 查看 / General 3D viewer |
| MapControls | 类 OrbitControls，但平移改为在地面平面上 pan | 地图、俯视 / Maps, top-down |
| TrackballControls | 无 up 限制，可自由翻滚 | 自由观察分子/模型 / Free inspection |
| PointerLockControls | FPS 风格，鼠标锁定中心 | 第一人称游戏 / FPS |
| TransformControls | gizmo 平移/旋转/缩放物体 | 编辑器 / Editor |
| DragControls | 拖动物体 | 拖拽交互 / Drag interaction |

### 6. OrbitControls vs MapControls

两者代码 95% 相同，唯一区别：右键拖拽时，OrbitControls 做的是"绕 target 平移视角"（orbit pan），MapControls 做的是"沿地面平移 target"（map pan）。切换只需 `controls.screenSpacePanning = false` + 不同的 pan 实现。

They share 95% code; the only difference: right-drag — OrbitControls does "orbit pan" (pan the view around target), MapControls does "map pan" (slide target along ground). Switch via `controls.screenSpacePanning` and a different pan impl.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.Spherical` | 球坐标 (radius, phi, theta) / Spherical coords |
| `Vector3.setFromSpherical` | 球坐标→笛卡尔 / Spherical to Cartesian |
| `OrbitControls` | 官方轨道控制器 / Official orbit controller |
| `controls.target` | 相机注视点 / Look-at target |
| `controls.enableDamping` | 启用阻尼 / Enable damping |
| `controls.dampingFactor` | 阻尼系数 / Damping factor |
| `controls.minPolarAngle/maxPolarAngle` | 极角限制 / Polar angle limits |
| `controls.minDistance/maxDistance` | 距离限制 / Distance limits |
| `MapControls` | 地图平移控制器 / Map pan controller |
| `PointerLockControls` | FPS 风格控制器 / FPS controller |

## 工作流 / Workflow

1. 选择控制器类型：通用查看 → Orbit；地图 → Map；自由翻滚 → Trackball；FPS → PointerLock。
2. 设置 `target`（决定相机绕谁转）。
3. 配置限制：`minDistance/maxDistance`、`minPolarAngle/maxPolarAngle` 防止穿模/翻滚。
4. 开 `enableDamping` + 每帧 `update()` 获得平滑感。
5. 调 `rotateSpeed/zoomSpeed/panSpeed` 适配手感。
6. 需要自定义时，复制手写 `SimpleOrbit` 类按需改输入映射。

## 常见陷阱 / Common Pitfalls

1. **开了阻尼却忘了 `update()`** / Damping on but no `update()` — 相机不动或抖。
2. **极角不钳制导致翻滚奇异** / Polar not clamped → gimbal flip — 相机到正上下方时 up 向量与视线共线，画面翻转。
3. **target 设错** / Wrong target — 相机绕错误点转，模型飞出视野。
4. **wheel 不 preventDefault** / Wheel not prevented — 页面跟着滚。
5. **pointermove 监在 canvas 上** / pointermove on canvas only — 拖出 canvas 后失效，应监在 window 上（up/move）。
6. **多控制器同时启用** / Multiple controllers active — 比如 OrbitControls + TransformControls 争抢鼠标事件。
7. **距离限制未设** / No distance limits — 滚轮可无限缩放，穿模或飞走。

## 调试技巧 / Debugging Tips

- GUI 显示当前 `spherical.radius/theta/phi`，看输入是否生效。
- 画一条 `target` 到相机的线（`ArrowHelper`），确认 target 位置。
- 抖动时先关阻尼，确认是否阻尼系数过大。
- 极角翻转时打印 `phi`，确认是否需要收紧 `maxPolarAngle`。
- 对比官方 OrbitControls：把手写相机和官方相机并排，同一参数下应运动一致。

## 练习 / Exercises

1. 给 `SimpleOrbit` 加右键平移（pan target）功能。
2. 实现 `minAzimuthAngle/maxAzimuthAngle` 方位角限制。
3. 把手写相机改成第一人称：target 跟随相机位置 + 方向移动。
4. 实现"相机路径动画"：沿预设球坐标序列平滑移动。
5. 用 `PointerLockControls` 做一个简单的 WASD 漫游。
6. 对比 `enableDamping` true/false 的手感差异，量化收敛步数。

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/15-controls/index.html`](../../examples/15-controls/index.html)

```js
// 手写轨道相机核心 / Hand-written orbit camera core
class SimpleOrbit {
  constructor(camera, dom) {
    this.camera = camera; this.dom = dom;
    this.target = new THREE.Vector3(0, 1.5, 0);
    this.spherical = new THREE.Spherical(8, Math.PI / 3, Math.PI / 4);
    this.targetSpherical = this.spherical.clone();
    this.enableDamping = true;
    this.dampingFactor = 0.1;
    this.minDistance = 2; this.maxDistance = 30;
    this.minPolarAngle = 0.1; this.maxPolarAngle = Math.PI - 0.1;
    this._bind();
  }
  _bind() {
    let down = false, lx = 0, ly = 0;
    this.dom.addEventListener('pointerdown', e => { down = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', () => down = false);
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      this.targetSpherical.theta -= dx * 0.005;
      this.targetSpherical.phi = THREE.MathUtils.clamp(
        this.targetSpherical.phi - dy * 0.005,
        this.minPolarAngle, this.maxPolarAngle);
    });
    this.dom.addEventListener('wheel', e => {
      this.targetSpherical.radius = THREE.MathUtils.clamp(
        this.targetSpherical.radius * (1 + e.deltaY * 0.001),
        this.minDistance, this.maxDistance);
      e.preventDefault();
    }, { passive: false });
  }
  update() {
    if (this.enableDamping) {
      const f = this.dampingFactor;
      this.spherical.theta  += (this.targetSpherical.theta  - this.spherical.theta)  * f;
      this.spherical.phi    += (this.targetSpherical.phi    - this.spherical.phi)    * f;
      this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * f;
    } else {
      this.spherical.copy(this.targetSpherical);
    }
    const off = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(off);
    this.camera.lookAt(this.target);
  }
}
```

## 参考资源 / References

- [Three.js Docs - OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [Three.js Docs - MapControls](https://threejs.org/docs/#examples/en/controls/MapControls)
- [Three.js Docs - PointerLockControls](https://threejs.org/docs/#examples/en/controls/PointerLockControls)
- [Three.js Manual - Cameras](https://threejs.org/manual/#en/cameras)
- [Three.js Example - Controls list](https://threejs.org/examples/#misc_controls_orbit)

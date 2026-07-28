# 欧拉角与四元数 / Euler Angles & Quaternions

> 阶段 / Phase: 一、数学和图形学基础 / Math & Graphics Fundamentals
> 预计用时 / Estimated: 3 小时 / 3 hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

旋转是 3D 中最容易出错的变换。Three.js 同时提供 `Euler` 和 `Quaternion` 两种旋转表示：欧拉角直观、易手动设置，但存在万向节锁和旋转顺序依赖；四元数数学上更复杂，却能稳定地组合旋转、平滑插值，是动画和相机的首选。本节将对比两者，演示万向节锁，并用 `quaternion.slerp` 实现物体平滑朝向鼠标。

Rotation is the trickiest transform in 3D. Three.js provides both `Euler` and `Quaternion`: Euler angles are intuitive and easy to set manually, but suffer from gimbal lock and rotation-order dependence; quaternions are mathematically heavier but enable stable rotation composition and smooth interpolation, making them the first choice for animation and cameras. This lesson compares the two, demonstrates gimbal lock, and uses `quaternion.slerp` to smoothly orient an object toward the mouse.

## 核心概念 / Core Concepts

### 1. 欧拉角 / Euler Angles

欧拉角用三个角度 `(x, y, z)` 描述旋转，每个角绕一个轴。Three.js 的 `Euler` 默认顺序是 `'XYZ'`，即先绕 X、再绕 Y、最后绕 Z（**内在旋转**：每次旋转都基于上一次旋转后的坐标系）。

Euler angles describe rotation with three angles `(x, y, z)`, each around an axis. Three.js `Euler` defaults to order `'XYZ'`: rotate X first, then Y, then Z (**intrinsic rotation**: each rotation is about the previously-rotated axes).

```js
mesh.rotation = new THREE.Euler(x, y, z, 'XYZ');
// 等价写法 / equivalent
mesh.rotation.set(x, y, z, 'XYZ');
// 也可单独赋值 / or set individually
mesh.rotation.x = Math.PI / 4;
```

可用顺序：`'XYZ'`、`'YZX'`、`'ZXY'`、`'XZY'`、`'YXZ'`、`'ZYX'`。顺序不同，最终姿态不同。

Available orders: `'XYZ'`, `'YZX'`, `'ZXY'`, `'XZY'`, `'YXZ'`, `'ZYX'`. Different orders yield different final orientations.

### 2. 万向节锁 / Gimbal Lock

当中间轴旋转到 ±90° 时，第一轴和第三轴会"对齐"，丢失一个自由度。例如 `'XYZ'` 顺序下 Y=90° 时，X 轴和 Z 轴重合，绕 X 转等价于绕 Z 反向转——此时无法再独立控制某个方向，表现为物体"卡住"或"翻转"。

When the middle axis rotates to ±90°, the first and third axes align, losing one degree of freedom. For example, with `'XYZ'` order at Y=90°, the X and Z axes coincide — rotating around X equals rotating around Z in reverse — so you can no longer independently control a direction. The object appears "stuck" or "flips".

这是欧拉角用于动画插值时的核心痛点，也是相机跟随容易"翻车"的原因。

This is the core pain point of Euler angles in animation interpolation, and why camera-follow often "flips".

### 3. 四元数 / Quaternion

四元数用 4 个数 `(x, y, z, w)` 表示旋转，无万向节锁，可平滑插值。可理解为"绕单位轴 `u` 旋转角度 `θ`"：

Quaternions use 4 numbers `(x, y, z, w)` to represent rotation, with no gimbal lock and smooth interpolation. They can be understood as "rotate by angle `θ` around unit axis `u`":

```
q = (sin(θ/2)·ux, sin(θ/2)·uy, sin(θ/2)·uz, cos(θ/2))
```

`w` 是实部，`(x,y,z)` 是虚部。`|q| = 1`（单位四元数）才表示纯旋转。

`w` is the real part; `(x,y,z)` is the imaginary part. Only `|q| = 1` (unit quaternion) represents a pure rotation.

```js
const q = new THREE.Quaternion();
q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); // 绕 Y 转 90°
mesh.quaternion.copy(q);

// 或从欧拉角转换 / or convert from Euler
q.setFromEuler(new THREE.Euler(Math.PI/2, 0, 0));
```

### 4. Euler vs Quaternion 使用场景 / When to Use Which

| 场景 / Scenario | 推荐 / Recommended | 原因 / Reason |
| --- | --- | --- |
| 手动设置单次角度 / Set angles manually | Euler | 直观 / intuitive |
| 读取 Inspector 角度 / Inspect angles | Euler | 易读 / readable |
| 组合多个旋转 / Compose rotations | Quaternion | 乘法无锁 / mult has no lock |
| 平滑插值动画 / Smooth interpolation | Quaternion | `slerp` 稳定 / stable slerp |
| 相机跟随 / Camera follow | Quaternion | 避免翻滚 / avoids flip |
| 物理引擎 / Physics | Quaternion | 与角速度兼容 / compatible with angular velocity |

### 5. 四元数乘法 = 旋转组合 / Quaternion Multiplication = Rotation Composition

```js
const qTotal = new THREE.Quaternion().multiplyQuaternions(q2, q1); // 先 q1 后 q2 / q1 then q2
// 等价于 / equivalent to matrix: M = M2 × M1
```

乘法顺序：`q2.multiply(q1)` 表示**先应用 q1，再应用 q2**（与矩阵乘法一致的右先左后规则）。

Order: `q2.multiply(q1)` means **apply q1 first, then q2** (same right-to-left rule as matrices).

### 6. slerp 球面线性插值 / Spherical Linear Interpolation

`slerp` 在两个四元数之间沿球面最短弧线插值，是平滑转向的标准方法：

`slerp` interpolates along the shortest great-circle arc between two quaternions — the standard method for smooth turning:

```js
// 每帧让当前朝向靠近目标朝向 / each frame, nudge current toward target
mesh.quaternion.slerp(targetQuaternion, 0.1); // 0.1 = 平滑系数 / smoothing factor
```

- `t=0`：完全保持当前 / stay at current
- `t=1`：直接跳到目标 / snap to target
- `t=0.1`：每帧靠近 10%，呈指数衰减 / 10% per frame, exponential decay

### 7. lookAt 与朝向 / lookAt & Orientation

```js
mesh.lookAt(targetPosition); // 让 -Z 朝向目标 / point -Z toward target
camera.lookAt(targetPosition);
```

`lookAt` 内部用四元数实现。注意 Three.js 物体默认"正面"是 -Z 方向（相机看向 -Z）。要让物体的 +Z 或 +Y 朝向目标，需额外旋转修正。

`lookAt` is implemented with quaternions internally. Note Three.js objects face -Z by default (cameras look down -Z). To point +Z or +Y at a target, apply a corrective rotation.

### 8. 旋转顺序与 Three.js 内部 / Rotation Order & Three.js Internals

`Object3D` 同时维护 `rotation`(Euler) 和 `quaternion`。修改任一个，另一个会自动同步（通过 `onChange` 回调）。最终用于 `matrix` 的是 `quaternion`。

`Object3D` maintains both `rotation` (Euler) and `quaternion`. Modifying either auto-syncs the other via `onChange`. The `matrix` uses `quaternion`.

```js
mesh.rotation.y = 1;          // 自动更新 quaternion / auto-syncs quaternion
mesh.quaternion.set(q);       // 自动更新 rotation / auto-syncs rotation
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.Euler(x,y,z,order)` | 欧拉角 / Euler angles |
| `euler.order` | 旋转顺序 / rotation order |
| `THREE.Quaternion(x,y,z,w)` | 四元数 / quaternion |
| `q.setFromAxisAngle(axis, angle)` | 由轴角构造 / from axis-angle |
| `q.setFromEuler(euler)` | 由欧拉角构造 / from Euler |
| `q.setFromUnitVectors(a, b)` | 从方向 a 转到 b / rotate from a to b |
| `q.multiply(q2)` / `multiplyQuaternions(a,b)` | 旋转组合 / compose |
| `q.slerp(target, t)` | 球面插值（就地）/ slerp (in place) |
| `q.invert()` | 逆旋转 / inverse rotation |
| `q.normalize()` | 归一化 / normalize |
| `q.angleTo(q2)` | 两旋转夹角 / angle between |
| `object.rotation` | 欧拉角属性 / Euler property |
| `object.quaternion` | 四元数属性 / quaternion property |
| `object.lookAt(v)` | 朝向目标 / face target |
| `object.getWorldQuaternion(q)` | 取世界四元数 / get world quaternion |

## 数学/原理 / Math & Principles

### 欧拉角旋转矩阵（XYZ 顺序） / Euler Rotation Matrix (XYZ order)

```
R = Rz(z) × Ry(y) × Rx(x)
```

注意顺序：`XYZ` 意味着**先 X 后 Y 后 Z**，但矩阵相乘是 `Rz × Ry × Rx`（右先作用）。

Note: `XYZ` means **X first, then Y, then Z**, but the matrix product is `Rz × Ry × Rx` (right acts first).

### 万向节锁条件 / Gimbal Lock Condition

对 `XYZ` 顺序，当 `y = ±π/2` 时：

```
R = Rz × Ry(±π/2) × Rx
  → Rx 与 Rz 退化到同一平面，自由度从 3 降到 2
```

### 四元数与轴角 / Quaternion & Axis-Angle

```
q = (x, y, z, w) = (sin(θ/2)·u, cos(θ/2))

其中 u 是单位旋转轴，θ 是旋转角
where u is the unit rotation axis, θ is the angle
```

### 四元数乘法 / Quaternion Multiplication

```
q1 = (v1, w1),  q2 = (v2, w2)
q1 × q2 = (w1·v2 + w2·v1 + v1×v2,  w1·w2 - v1·v2)
```

结果仍为单位四元数（若输入都是单位）。

Result stays unit if inputs are unit.

### slerp 公式 / Slerp Formula

```
slerp(q0, q1, t) = (sin((1-t)·Ω)·q0 + sin(t·Ω)·q1) / sin(Ω)
其中 Ω = angleBetween(q0, q1)
```

`slerp` 沿两个四元数在四维球面上的大圆弧插值，保证角速度恒定。

`slerp` interpolates along the great-circle arc on the 4D sphere, ensuring constant angular velocity.

### lookAt 等价构造 / lookAt Equivalent Construction

```js
// 让物体 -Z 朝向 target / point -Z toward target
const dir = target.clone().sub(object.position).normalize();
const q = new THREE.Quaternion();
q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
object.quaternion.slerp(q, 0.1); // 平滑 / smooth
```

## 常见陷阱 / Common Pitfalls

1. **用欧拉角做插值动画 / Interpolating Euler angles**：三个角独立 lerp 会导致路径扭曲、翻转。改用 `quaternion.slerp`。 / Independently lerping 3 angles causes扭曲; use `slerp`.
2. **忽视旋转顺序 / Ignoring rotation order**：同样 `(x,y,z)` 在 `XYZ` 和 `ZYX` 下姿态完全不同。 / Same `(x,y,z)` differs across orders.
3. **万向节锁下相机翻滚 / Camera flips at gimbal lock**：相机俯仰到 ±90° 时 roll 失控。用四元数或限制 pitch。 / Limit pitch or use quaternion.
4. **`lookAt` 后物体朝向反 / Object faces wrong way after lookAt**：默认朝 -Z，模型正面若是 +Z 需修正。 / Default faces -Z; correct if model faces +Z.
5. **四元数未归一化 / Unnormalized quaternion**：累积乘法后 `|q|` 偏离 1，物体会缩放变形。定期 `normalize()`。 / Normalize after repeated mults.
6. **`multiply` 顺序错 / Wrong multiply order**：`q2.multiply(q1)` 是先 q1 后 q2，与直觉相反。 / `q2.multiply(q1)` applies q1 first.
7. **同时改 `rotation` 和 `quaternion` / Mutating both**：虽然会同步，但混用易出 bug，建议统一用一种。 / Stick to one representation.
8. **`slerp` 的 t 过大 / slerp t too large**：`t=1` 等于直接赋值，失去平滑；通常 0.05~0.2。 / Keep t in 0.05~0.2.

## 调试技巧 / Debugging Tips

- 用 GUI 下拉切换 `rotation.order`，实时观察万向节锁。 / Switch `rotation.order` in GUI to observe gimbal lock live.
- 把 `quaternion` 的 `(x,y,z,w)` 显示在屏幕上，验证 slerp 收敛。 / Display `(x,y,z,w)` to verify slerp convergence.
- 用 `AxesHelper` 可视化物体局部坐标轴，确认朝向。 / Use `AxesHelper` to confirm orientation.
- 故意把中间轴设到 89.9°，观察锁死现象。 / Set middle axis to 89.9° to trigger lock.
- 对比 Euler lerp 和 quaternion slerp 的路径差异（画轨迹）。 / Compare Euler-lerp vs slerp paths by drawing trails.
- `getWorldQuaternion` 排查父节点旋转影响。 / Use `getWorldQuaternion` to debug parent influence.

## 练习 / Exercises

1. 用 GUI 把一个立方体的 Y 轴设到 90°，切换 `rotation.order`，观察姿态变化与万向节锁。 / Set Y to 90°, switch order, observe gimbal lock.
2. 实现一个物体用 `quaternion.slerp` 平滑朝向鼠标在地面的投影点。 / Make an object slerp toward the mouse's ground projection.
3. 用 `setFromUnitVectors` 让箭头从指向 +X 平滑转到指向 +Y。 / Rotate an arrow from +X to +Y via `setFromUnitVectors` + slerp.
4. 对比 Euler 三轴独立 lerp 与 quaternion slerp 的旋转路径。 / Compare Euler-lerp vs slerp paths.
5. 用 `multiplyQuaternions` 组合"先自转 30°再公转 60°"的旋转。 / Compose "self-rotate 30° then orbit 60°" via multiply.
6. 实现相机始终看向移动物体，但避免俯仰到 90° 翻滚。 / Make camera track a moving object without flipping at 90°.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/04-quaternion/index.html`](../../examples/04-quaternion/index.html)

核心片段 / Core snippet:

```js
// 欧拉角立方体（演示万向节锁）/ Euler cube (gimbal lock demo)
eulerCube.rotation.x = params.ex;
eulerCube.rotation.y = params.ey; // 设到 ±π/2 触发锁 / set to ±π/2 to trigger lock
eulerCube.rotation.z = params.ez;
eulerCube.rotation.order = params.order; // 切换顺序 / switch order

// 四元数立方体（平滑朝向鼠标）/ Quaternion cube (slerp to mouse)
const mouseWorld = getMouseGroundPoint(); // 射线求交 / raycast
const dir = mouseWorld.clone().sub(quatCube.position).normalize();
const targetQ = new THREE.Quaternion();
// 物体正面是 +Z，故从 +Z 转到 dir / object faces +Z, rotate from +Z to dir
targetQ.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
// slerp 平滑靠近 / smooth slerp
quatCube.quaternion.slerp(targetQ, params.slerpFactor);

// 显示四元数值 / display quaternion values
overlay.textContent = `q = (${q.x.toFixed(3)}, ${q.y.toFixed(3)}, ${q.z.toFixed(3)}, ${q.w.toFixed(3)})`;
```

## 参考资源 / References

- [Three.js Docs - Quaternion](https://threejs.org/docs/#api/en/math/Quaternion)
- [Three.js Docs - Euler](https://threejs.org/docs/#api/en/math/Euler)
- [Understanding Quaternions - 3D Game Engine Programming](https://www.3dgep.com/understanding-quaternions/)
- [Gimbal Lock - Wikipedia](https://en.wikipedia.org/wiki/Gimbal_lock)
- [Quaternion Slerp - Wikipedia](https://en.wikipedia.org/wiki/Slerp)
- [3D Math Primer - Chapter 8 Quaternions](https://gamemath.com/book/orientation.html)

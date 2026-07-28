# 三角函数 / Trigonometry

> 阶段 / Phase: 一、数学和图形学基础 / Math & Graphics Fundamentals
> 预计用时 / Estimated: 2-3 小时 / 2-3 hours
> 难度 / Difficulty: Beginner

## 概述 / Overview

`Math.sin` 和 `Math.cos` 是 3D 动画的脉搏。圆周运动、波浪、呼吸缩放、摆动、螺旋线、相机环绕——这些最常见的效果背后都是同一个数学结构：用角度参数化位置。本节将把三角函数从"课本公式"变成"可调参数的可视化工具"，让你能直觉地理解 `Math.cos(time) * radius` 为什么会让物体绕圈走。

`Math.sin` and `Math.cos` are the heartbeat of 3D animation. Circular motion, waves, breathing scale, swinging, spirals, camera orbiting — all share one mathematical structure: parameterizing position by angle. This lesson turns trigonometry from "textbook formulas" into "adjustable, visualized tools", giving you an intuitive grasp of why `Math.cos(time) * radius` makes an object travel in a circle.

## 核心概念 / Core Concepts

### 1. 弧度与角度 / Radians vs Degrees

数学函数 `Math.sin/cos/tan` 接收**弧度**，不是角度。圆周 = `2π` 弧度 = `360°`。

The `Math.sin/cos/tan` functions take **radians**, not degrees. A full circle = `2π` rad = `360°`.

```js
const deg = 90;
const rad = deg * Math.PI / 180;          // 角度→弧度 / deg→rad
const back = rad * 180 / Math.PI;         // 弧度→角度 / rad→deg

// Three.js 提供 THREE.MathUtils 工具 / Three.js provides utils
const r = THREE.MathUtils.degToRad(90);   // π/2
const d = THREE.MathUtils.radToDeg(Math.PI / 2); // 90
```

关键直觉 / Key intuition: `1 弧度 ≈ 57.3°`，是弧长等于半径时对应的圆心角。/ `1 radian ≈ 57.3°`, the angle whose arc length equals the radius.

### 2. 单位圆与正余弦 / Unit Circle & sin/cos

在单位圆上，角度 `θ` 对应的点坐标为 `(cosθ, sinθ)`。这是所有周期运动的根：

On the unit circle, angle `θ` maps to point `(cosθ, sinθ)`. This is the root of all periodic motion:

```js
const angle = time; // time 本身就是弧度 / time is already radians
const x = Math.cos(angle) * radius; // 横轴 / horizontal
const y = Math.sin(angle) * radius; // 纵轴 / vertical
```

- `cos` 从 1 开始（θ=0 时最大） / `cos` starts at 1 (max at θ=0)
- `sin` 从 0 开始，θ=π/2 时达到 1 / `sin` starts at 0, peaks at θ=π/2
- 两者周期均为 `2π` / both have period `2π`
- `sin²θ + cos²θ = 1`（恒等式 / identity）

### 3. 圆周运动 / Circular Motion

```js
// 在 XZ 平面绕原点做圆周运动 / circular motion in XZ plane around origin
const t = elapsed * speed; // speed 控制角速度 / speed controls angular velocity
obj.position.x = Math.cos(t) * radius;
obj.position.z = Math.sin(t) * radius;
obj.position.y = height;
```

### 4. 椭圆运动 / Elliptical Motion

把 X、Z 方向的半径设成不同值，圆变椭圆：

Set different radii for X and Z to turn a circle into an ellipse:

```js
obj.position.x = Math.cos(t) * radiusX;
obj.position.z = Math.sin(t) * radiusZ; // radiusX ≠ radiusZ → 椭圆 / ellipse
```

### 5. 波浪运动 / Wave Motion

只让一个轴随 `sin` 变化，物体在另一轴方向排开，就形成波浪：

Vary only one axis with `sin` while spreading objects along another axis to form a wave:

```js
mesh.position.x = i * spacing;        // 沿 X 排列 / arrange along X
mesh.position.y = Math.sin(i * 0.5 - elapsed * 2) * amplitude; // Y 起伏 / Y oscillation
```

### 6. 呼吸缩放 / Breathing Scale

```js
const breath = 1 + Math.sin(elapsed * 2) * 0.15; // 0.85 ~ 1.15
mesh.scale.setScalar(breath);
```

`sin` 输出范围 `[-1,1]`，乘以振幅后加到基准值，就得到平滑的往复缩放。

`sin` outputs `[-1,1]`; multiply by amplitude and add to baseline for smooth oscillation.

### 7. 摆动 / Swing

```js
// 绕 Z 轴左右摆动 / swing left-right around Z axis
mesh.rotation.z = Math.sin(elapsed * 1.5) * Math.PI / 6; // ±30°
```

### 8. 螺旋线 / Spiral

让半径随时间增大，角度也随时间增大，轨迹就是螺旋：

Increase both radius and angle over time to trace a spiral:

```js
const t = elapsed * speed;
const r = t * 0.3; // 半径线性增长 / radius grows linearly
obj.position.x = Math.cos(t) * r;
obj.position.z = Math.sin(t) * r;
obj.position.y = t * 0.1; // 同时上升 / also rises
```

### 9. 相机环绕 / Camera Orbit

```js
const r = 8;
camera.position.x = Math.cos(elapsed * 0.3) * r;
camera.position.z = Math.sin(elapsed * 0.3) * r;
camera.position.y = 4;
camera.lookAt(0, 0, 0);
```

### 10. 极坐标 / Polar Coordinates

极坐标用 `(r, θ)` 表示位置，与笛卡尔坐标的转换：

Polar coordinates `(r, θ)` convert to Cartesian as:

```
x = r·cosθ
y = r·sinθ
r = √(x²+y²)
θ = atan2(y, x)
```

`Math.atan2(y, x)` 自动处理象限，比 `atan(y/x)` 更安全。

`Math.atan2(y, x)` handles quadrants automatically; safer than `atan(y/x)`.

### 11. tan 与视角 / tan & Field of View

`tan` 在 Three.js 中最常出现在相机 `fov` 计算里：

`tan` appears most often in Three.js camera `fov` calculations:

```
tan(fov/2) = (visibleHeight/2) / distance
```

理解这个关系，才能按距离精确控制画面可见高度。

Understanding this lets you precisely control visible height at a given distance.

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `Math.sin(x)` / `Math.cos(x)` | 正弦/余弦（弧度）/ sine/cosine (radians) |
| `Math.tan(x)` | 正切 / tangent |
| `Math.atan2(y, x)` | 四象限反正切 / 4-quadrant arctangent |
| `Math.PI` | 圆周率 π ≈ 3.14159 / pi |
| `THREE.MathUtils.degToRad(d)` | 角度→弧度 / degrees to radians |
| `THREE.MathUtils.radToDeg(r)` | 弧度→角度 / radians to degrees |
| `THREE.MathUtils.lerp(a,b,t)` | 线性插值 / linear interpolation |
| `THREE.MathUtils.clamp(v,min,max)` | 钳制 / clamp |
| `THREE.MathUtils.mapLinear(x,a1,a2,b1,b2)` | 线性映射 / linear mapping |
| `obj.rotation.x/y/z` | 欧拉角（弧度）/ Euler angles (radians) |
| `obj.position.set(x,y,z)` | 设置位置 / set position |
| `obj.scale.setScalar(s)` | 均匀缩放 / uniform scale |

## 数学/原理 / Math & Principles

### 单位圆 / Unit Circle

```
        y
        ▲
        │  (cosθ, sinθ)
        │      ●
        │     /│
        │    / │
        │   /  │  sinθ
        │  /θ  │
        │ /    │
        ┼──────────► x
          cosθ

半径 r=1 时：x = cosθ, y = sinθ
半径 r 时：x = r·cosθ, y = r·sinθ
```

### 周期与频率 / Period & Frequency

```
角速度 ω (rad/s) → 旋转一周耗时 T = 2π/ω
频率 f = 1/T = ω/(2π)
```

`elapsed * speed` 中 `speed` 即角速度 `ω`。

In `elapsed * speed`, `speed` is the angular velocity `ω`.

### 波浪叠加 / Wave Superposition

多个不同频率的 `sin` 叠加可模拟更复杂的运动：

Summing multiple `sin` of different frequencies simulates complex motion:

```
y = A1·sin(ω1·t) + A2·sin(ω2·t)
```

### 椭圆参数方程 / Ellipse Parametric Form

```
x = a·cosθ   (a = 半长轴 / semi-major)
y = b·sinθ   (b = 半短轴 / semi-minor)
```

### 螺旋线参数方程 / Spiral Parametric Form

```
x = (r0 + k·t)·cos(ω·t)
y = h·t            (上升 / rise)
z = (r0 + k·t)·sin(ω·t)
```

### tan 与 fov / tan & fov

```
        │← visibleHeight →│
        │                  │
        │      camera      │
        │     ╱ fov/2      │
        │    ╱─────────────│─── distance
        │  ╱                │
        │╱                  │

visibleHeight = 2 · distance · tan(fov/2)
```

## 常见陷阱 / Common Pitfalls

1. **传角度给 `Math.sin` / Passing degrees to `Math.sin`**：必须先转弧度。 / Must convert to radians first.
2. **`Math.atan(y/x)` 丢象限 / `atan` loses quadrant**：当 `x<0` 时结果差 π。用 `atan2(y,x)`。 / Off by π when `x<0`. Use `atan2`.
3. **`sin/cos` 范围误用 / Misunderstanding `sin/cos` range**：输出是 `[-1,1]`，要缩放和偏移才能映射到所需区间。 / Output is `[-1,1]`; scale & offset to map to target range.
4. **圆周运动方向反 / Wrong rotation direction**：`cos(t),sin(t)` 是逆时针(从 +X 轴看)；要顺时针用 `cos(-t),sin(-t)` 或交换 sin/cos。 / `cos,sin` is CCW; use negative or swap for CW.
5. **帧率影响速度 / Frame rate affects speed**：用 `elapsed` 而非帧计数，否则高刷新率下转得更快。 / Use `elapsed` time, not frame count.
6. **螺旋半径无限增大 / Spiral radius grows unbounded**：需用 `clamp` 或周期性重置。 / Use `clamp` or periodic reset.
7. **`rotation` 是弧度不是角度 / `rotation` is radians not degrees**：`mesh.rotation.y = 90` 是约 5157°，不是 90°。 / `90` rad ≠ `90°`.

## 调试技巧 / Debugging Tips

- 在 GUI 暴露 `speed`、`radius`、`amplitude`，实时观察波形变化。 / Expose params in GUI to observe wave changes live.
- 用 `Line` 画出运动轨迹，验证曲线形状。 / Draw a trail `Line` to verify curve shape.
- `console.log(Math.sin(t).toFixed(3))` 确认输出范围。 / Confirm output range with `toFixed`.
- 多个物体用相位差 `i * 0.5` 形成"波浪队列"。 / Use phase offsets for wave trains.
- 暂停动画（`renderer.setAnimationLoop(null)`）逐帧分析。 / Pause to inspect frame-by-frame.

## 练习 / Exercises

1. 让 5 个小球排成一行，用相位差产生"波浪队列"。 / Arrange 5 spheres in a row; use phase offsets to make a wave train.
2. 实现椭圆轨道，GUI 可调半长轴和半短轴。 / Implement elliptical orbit with adjustable semi-axes via GUI.
3. 用螺旋线让物体边旋转边上升，达到顶部后重置。 / Spiral an object upward; reset at top.
4. 让相机绕场景中心环绕，GUI 控制环绕速度和半径。 / Orbit the camera around scene center with GUI controls.
5. 用 `sin` 实现物体的呼吸缩放，叠加 `sin` 的二次谐波让效果更有机。 / Implement breathing scale; add a second harmonic for organic feel.
6. 用 `tan(fov/2)` 计算给定距离的可见高度，让一个面板始终铺满视口。 / Use `tan(fov/2)` to size a plane that fills the viewport at a given distance.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/02-trigonometry/index.html`](../../examples/02-trigonometry/index.html)

核心片段 / Core snippet:

```js
const t = elapsed * params.speed;

// 1. 圆周运动 / circular motion
circleBall.position.set(
  Math.cos(t) * params.radius,
  0.5,
  Math.sin(t) * params.radius
);

// 2. 椭圆运动 / elliptical motion
ellipseBall.position.set(
  Math.cos(t) * params.radiusX,
  0.5,
  Math.sin(t) * params.radiusZ
);

// 3. 波浪队列 / wave train
waveBalls.forEach((b, i) => {
  b.position.x = (i - waveBalls.length / 2) * 0.8;
  b.position.y = 0.5 + Math.sin(i * 0.6 - t * 2) * params.amplitude;
});

// 4. 呼吸缩放 / breathing scale
breathCube.scale.setScalar(1 + Math.sin(t * 2) * 0.2);

// 5. 螺旋上升 / spiral
const sr = t * 0.25;
spiralBall.position.set(
  Math.cos(t * 1.5) * sr,
  ((t * 0.15) % 4) + 0.3,
  Math.sin(t * 1.5) * sr
);

// 6. 相机环绕 / camera orbit (toggle)
if (params.cameraOrbit) {
  camera.position.x = Math.cos(t * 0.4) * 10;
  camera.position.z = Math.sin(t * 0.4) * 10;
  camera.lookAt(0, 0.5, 0);
}
```

## 参考资源 / References

- [MDN - Math.sin()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin)
- [Three.js Docs - MathUtils](https://threejs.org/docs/#api/en/math/MathUtils)
- [Three.js Manual - Animation loop](https://threejs.org/manual/#en/animation-loop)
- [Wikipedia - Unit circle](https://en.wikipedia.org/wiki/Unit_circle)
- [Wikipedia - Parametric equation](https://en.wikipedia.org/wiki/Parametric_equation)

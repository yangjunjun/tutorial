# 渲染循环与帧率无关动画 / Render Loop & Frame-rate-Independent Animation

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 2–3 小时 / 2–3 hours
> 难度 / Difficulty: Beginner→Intermediate

## 概述 / Overview

渲染循环是 Three.js 的心跳——每帧更新状态、渲染一帧。但"每帧"到底多快？在 60Hz 显示器上约 16.67ms，在 144Hz 上约 6.94ms。如果你用 `rotation.y += 0.01` 做动画，在高刷屏上物体会转得更快。本节解决这个根本问题：如何让动画速度与帧率无关，以及如何正确管理渲染循环的生命周期。

The render loop is Three.js's heartbeat—each frame updates state and renders once. But how fast is "each frame"? ~16.67ms on 60Hz, ~6.94ms on 144Hz. If you animate with `rotation.y += 0.01`, objects spin faster on high-refresh displays. This lesson solves that fundamental problem: making animation speed frame-rate-independent and managing the render loop lifecycle.

## 核心概念 / Core Concepts

### 1. 三个时间概念 / Three Time Concepts

```js
const clock = new THREE.Clock();

// 1. delta（增量）：距离上一帧的时间差，单位秒 / delta: time since last frame, in seconds
const delta = clock.getDelta();        // e.g. 0.0167 (60fps) or 0.0069 (144fps)

// 2. elapsed（总时长）：从 Clock 创建起的总时间 / elapsed: total time since clock start
const elapsed = clock.getElapsedTime(); // e.g. 3.5 (seconds)

// 3. 帧计数 / frame count: how many frames have passed
let frameCount = 0;
renderer.setAnimationLoop(() => { frameCount++; });
```

| 概念 / Concept | 获取 / How to get | 用途 / Use |
| --- | --- | --- |
| delta | `clock.getDelta()` | 帧率无关动画 / frame-rate independent animation |
| elapsed | `clock.getElapsedTime()` | 周期性动画（sin/cos）/ periodic animation |
| frame count | 手动计数 / manual counter | FPS 统计 / FPS stats |

### 2. setAnimationLoop / 用 setAnimationLoop

```js
// ✅ 推荐 / recommended
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

// 停止 / stop
renderer.setAnimationLoop(null);
```

`setAnimationLoop` 是 Three.js r113+ 推荐的方式，它内部使用 `requestAnimationFrame`，并且兼容 WebXR（VR/AR 需要 `setAnimationLoop`）。

`setAnimationLoop` is the recommended approach since r113. It uses `requestAnimationFrame` internally and is WebXR-compatible (VR/AR requires `setAnimationLoop`).

```js
// ❌ 旧写法（不兼容 WebXR）/ old way (not WebXR-compatible)
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

### 3. 帧率无关动画 / Frame-Rate-Independent Animation

**核心公式 / Core formula:**

```js
// ❌ 错误：帧率相关 / wrong: frame-rate dependent
mesh.rotation.y += 0.01;
// 60fps: 0.6 rad/s | 144fps: 1.44 rad/s → 高刷屏转得更快！

// ✅ 正确：帧率无关 / correct: frame-rate independent
const angularSpeed = 0.6;  // 弧度/秒 / radians per second
mesh.rotation.y += angularSpeed * delta;
// 60fps: 0.6 × 0.0167 ≈ 0.01 | 144fps: 0.6 × 0.0069 ≈ 0.0048
// 每帧增量不同，但每秒总量都是 0.6 rad ✓
```

```js
// 通用公式 / general formula
// 任意属性的变化量 = 期望速度(单位/秒) × delta(秒)
position += speed * delta;          // 移动 / movement
rotation += angularSpeed * delta;   // 旋转 / rotation
scale += growthRate * delta;        // 缩放 / scaling

// 周期动画用 elapsed / periodic animation uses elapsed
const wave = Math.sin(elapsed * frequency);
```

### 4. 固定时间步 vs 可变时间步 / Fixed vs Variable Timestep

```text
可变时间步 Variable Timestep (Three.js 默认):
  每帧 delta 不同，直接用 delta 更新。
  优点：简单，平滑。
  缺点：物理模拟可能不稳定（大 delta 时穿透、抖动）。

固定时间步 Fixed Timestep (物理引擎常用):
  以固定间隔（如 1/60s）更新逻辑，渲染独立插值。
  优点：物理稳定，可复现。
  缺点：需要插值，代码复杂。
```

```js
// 固定时间步示例 / fixed timestep example
const FIXED_DT = 1 / 60;
let accumulator = 0;
let physicsState = { pos: 0 };

renderer.setAnimationLoop(() => {
  const frameDelta = clock.getDelta();
  accumulator += frameDelta;
  while (accumulator >= FIXED_DT) {
    // 固定步长更新物理 / fixed-step physics update
    physicsState.pos += velocity * FIXED_DT;
    accumulator -= FIXED_DT;
  }
  // 渲染时可做插值 / interpolate for rendering
  const alpha = accumulator / FIXED_DT;
  mesh.position.x = physicsState.pos;  // 简化：省略插值 / simplified: no interpolation
  renderer.render(scene, camera);
});
```

### 5. 标签页隐藏时暂停 / Pause on Tab Hidden

当用户切换到其他标签页，`requestAnimationFrame` 会被浏览器暂停（或降到极低频率）。但如果你用 `Clock`，`getDelta()` 在回来时可能返回一个巨大的值（如 30 秒），导致动画"跳帧"。

When the user switches tabs, `requestAnimationFrame` is paused (or throttled to ~1fps). But if you use `Clock`, `getDelta()` may return a huge value (e.g. 30s) on return, causing animation "jumps."

```js
// 方案 1：限制 delta 上限 / clamp delta
const delta = Math.min(clock.getDelta(), 0.1);  // 最大 100ms

// 方案 2：页面隐藏时暂停 / pause on hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.setAnimationLoop(null);  // 停止渲染 / stop
  } else {
    clock.getDelta();  // 丢弃积攒的大 delta / discard accumulated delta
    renderer.setAnimationLoop(animate);  // 恢复 / resume
  }
});
```

### 6. 按需渲染 / On-Demand Rendering

静态场景不需要每帧渲染。只在有变化时才 `render()`，可以大幅降低 GPU 占用和功耗。

Static scenes don't need per-frame rendering. Only `render()` when something changes, dramatically reducing GPU usage and power.

```js
// 按需渲染 / on-demand rendering
let needsRender = true;

function requestRender() { needsRender = true; }

controls.addEventListener('change', requestRender);  // 相机移动时 / on camera move
gui.onChange(requestRender);                          // GUI 调整时 / on GUI change

renderer.setAnimationLoop(() => {
  if (!needsRender) return;  // 无变化时跳过 / skip if no change
  needsRender = false;
  controls.update();
  renderer.render(scene, camera);
});

// 动画场景：动画期间持续请求 / animated scene: keep requesting during animation
function animate() {
  needsRender = true;
  requestAnimationFrame(animate);
}
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `renderer.setAnimationLoop(cb)` | 设置渲染循环 / set render loop |
| `renderer.setAnimationLoop(null)` | 停止渲染循环 / stop loop |
| `THREE.Clock` | 计时器 / timer |
| `clock.getDelta()` | 距上帧的时间差(秒) / delta since last frame |
| `clock.getElapsedTime()` | 总时间(秒) / total elapsed time |
| `clock.start()` / `stop()` | 启动 / 停止 / start / stop |
| `requestAnimationFrame(cb)` | 浏览器原生帧循环 / native frame loop |
| `document.visibilitychange` | 标签页可见性事件 / tab visibility event |
| `document.hidden` | 标签页是否隐藏 / is tab hidden |

## 原理 / Principles

### 为什么 `+= 0.01` 是错的 / Why `+= 0.01` Is Wrong

```text
60Hz 显示器：每帧 16.67ms，每秒 60 帧
  rotation.y += 0.01 → 每秒增加 0.6 弧度

144Hz 显示器：每帧 6.94ms，每秒 144 帧
  rotation.y += 0.01 → 每秒增加 1.44 弧度

结果：144Hz 上物体转速是 60Hz 的 2.4 倍！
```

帧率无关的核心是：**每帧的增量 = 期望速度 × 实际帧时间**。这样无论帧率多高，每秒的总量恒定。

The core of frame-rate independence: **per-frame increment = desired speed × actual frame time**. This keeps the per-second total constant regardless of frame rate.

### `requestAnimationFrame` 的浏览器行为 / Browser Behavior of `requestAnimationFrame`

- 同步到显示器刷新率（通常 60Hz，高刷屏更高）。/ Synced to display refresh rate.
- 标签页不可见时降到 ~1Hz 或完全暂停。/ Throttled/paused when tab hidden.
- 后台标签页不会完全停止（省电），但频率极低。/ Background tabs run at ~1fps.
- 电池模式可能降低帧率。/ Battery mode may reduce fps.

## 常见陷阱 / Common Pitfalls

1. **`+= 0.01` 帧率依赖 / Frame-rate dependent**：高刷屏上动画变快。用 `+= speed * delta`。/ Use delta-based animation.
2. **回来时跳帧 / Jump on return**：标签页切换后 `delta` 巨大，动画跳变。用 `Math.min(delta, 0.1)` 限制。/ Clamp delta.
3. **`getDelta()` 重复调用 / Double `getDelta()`**：`getDelta()` 每次调用都重置计时，一帧内调两次第二次返回 ~0。/ Don't call `getDelta()` twice per frame.
4. **`getElapsedTime()` 和 `getDelta()` 混用 / Mixing elapsed & delta**：`getElapsedTime()` 不会重置 delta 计时，但理解不清会混淆。/ Understand the difference.
5. **物理模拟用可变步长 / Variable-step physics**：大 delta 时物理穿透/抖动。用固定步长。/ Use fixed timestep for physics.
6. **静态场景仍每帧渲染 / Static scene per-frame render**：浪费 GPU。用按需渲染。/ Use on-demand rendering.
7. **忘记 `controls.update()` / Missing controls update**：`OrbitControls` 的 damping 需要每帧 `update()`。/ Damping needs per-frame update.
8. **`setAnimationLoop(null)` 后不恢复 / Not resuming**：暂停后忘记重新设回回调。/ Remember to resume.

## 调试技巧 / Debugging Tips

- 在画面角上显示 FPS 和 delta，确认帧率稳定。/ Display FPS and delta on-screen.
- 临时把 `delta` 固定为 `1/60`，验证动画是否帧率无关。/ Fix delta to 1/60 to test.
- 切换标签页 10 秒再回来，观察是否跳帧。/ Switch tabs for 10s and check for jumps.
- 用 Chrome DevTools 的 "CPU throttle" 模拟低帧率。/ Use DevTools CPU throttling.
- `renderer.info.render.frame` 查看渲染统计。/ Check render stats.

## 练习 / Exercises

1. 写一个 FPS 计数器，显示当前帧率和平均帧率。/ Write an FPS counter.
2. 做两个立方体：一个用 `+= 0.01`，一个用 `+= speed * delta`，在高刷屏上对比。/ Compare frame-based vs delta-based.
3. 实现标签页隐藏暂停、回来恢复，且无跳帧。/ Implement pause-on-hidden without jumps.
4. 实现按需渲染：静态场景只在相机移动时渲染。/ Implement on-demand rendering.
5. 用固定时间步做一个简单的物理弹球，验证大 delta 下不穿透。/ Fixed-timestep bouncing ball.
6. 用 `elapsed` 做一个呼吸灯效果（sin 波）。/ Breathing effect with sin(elapsed).

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/11-render-loop/index.html`](../../examples/11-render-loop/index.html)

```js
// 两个立方体对比 / two cubes comparison
const cubeA = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
cubeA.position.x = -1.2;
scene.add(cubeA);

const cubeB = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x44ff44 })
);
cubeB.position.x = 1.2;
scene.add(cubeB);

const angularSpeed = 1.0;  // 弧度/秒 / rad/s

const params = {
  mode: 'delta',       // 'delta' or 'frame'
  fpsCap: 0,           // 0 = no cap
  pauseOnHidden: true,
};

// FPS 计数 / FPS counter
let frameCount = 0;
let fpsTime = 0;
let fps = 0;

// FPS 限制 / FPS cap
let lastFrameTime = 0;
const frameInterval = () => 1000 / params.fpsCap;

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);  // 限制大 delta / clamp
  const elapsed = clock.getElapsedTime();

  // FPS 统计 / FPS stats
  frameCount++;
  fpsTime += delta;
  if (fpsTime >= 0.5) {
    fps = Math.round(frameCount / fpsTime);
    frameCount = 0; fpsTime = 0;
  }

  if (params.mode === 'delta') {
    cubeA.rotation.y += angularSpeed * delta;      // ✅ 帧率无关
    cubeB.rotation.y += angularSpeed * delta;
  } else {
    cubeA.rotation.y += 0.01;                       // ❌ 帧率依赖
    cubeB.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// 标签页隐藏暂停 / pause on hidden
document.addEventListener('visibilitychange', () => {
  if (params.pauseOnHidden) {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      clock.getDelta();  // 丢弃积攒 delta / discard
      renderer.setAnimationLoop(animate);
    }
  }
});
```

## 参考资源 / References

- [Three.js Docs — WebGLRenderer.setAnimationLoop](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.setAnimationLoop)
- [Three.js Docs — Clock](https://threejs.org/docs/#api/en/core/Clock)
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN — Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Game Programming Patterns — Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)

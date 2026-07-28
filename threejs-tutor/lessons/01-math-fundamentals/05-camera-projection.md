# 相机与投影 / Camera & Projection

> 阶段 / Phase: 一、数学和图形学基础 / Math & Graphics Fundamentals
> 预计用时 / Estimated: 2-3 小时 / 2-3 hours
> 难度 / Difficulty: Beginner-Intermediate

## 概述 / Overview

相机决定了"看到什么"和"怎么看到"。Three.js 提供两种主要相机：透视相机模拟人眼，近大远小；正交相机没有透视收缩，平行线保持平行。理解 `fov`、`aspect`、`near`、`far` 如何影响画面与性能，以及正交相机的 `left/right/top/bottom` 边界含义，是构建地图、CAD、2.5D、像素风场景的基础。本节最后通过实时切换两种相机并可视化视锥体，建立直观认识。

The camera determines "what is seen" and "how it's seen". Three.js provides two main cameras: the perspective camera simulates the human eye (near = bigger); the orthographic camera has no perspective foreshortening (parallel lines stay parallel). Understanding how `fov`, `aspect`, `near`, `far` affect image and performance, and what the orthographic `left/right/top/bottom` bounds mean, is the foundation for maps, CAD, 2.5D, and pixel-art scenes. This lesson ends with live switching between the two cameras and a frustum visualization for intuitive understanding.

## 核心概念 / Core Concepts

### 1. 透视相机 / PerspectiveCamera

```js
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
```

四个参数 / Four parameters:

- **fov**（field of view）：垂直视场角，单位**度**。人眼舒适区约 50°~75°；越大越"广角"，边缘拉伸越明显。 / Vertical field of view in **degrees**. Comfortable range ~50°~75°; larger = wider angle, more edge distortion.
- **aspect**：宽高比 = `width / height`。错误的比例会让画面被拉伸。 / Aspect ratio = `width/height`. Wrong ratio stretches the image.
- **near**：近裁剪面距离。小于此距离的物体被裁掉。 / Near clip plane distance. Objects closer than this are clipped.
- **far**：远裁剪面距离。大于此距离的物体被裁掉。 / Far clip plane distance. Objects farther are clipped。

```
        近裁剪面 near            远裁剪面 far
            │                      │
            │   ←—— 可见区域 ——→    │
            │                      │
                 ╲            ╱
                  ╲          ╱
                   ╲  fov  ╱
                    ╲    ╱
                     camera
```

### 2. fov 的视觉与性能影响 / fov Visual & Performance Impact

- fov 过大（>90°）：广角畸变，边缘物体拉伸，类似鱼眼。 / Too large: fisheye distortion, edge stretching.
- fov 过小（<30°）：望远镜效果，空间感被压缩。 / Too small: telescopic, compressed depth.
- fov 与相机距离联动：要"看清物体且不畸变"，常用做法是固定 fov（如 50°），调整相机距离。 / To see clearly without distortion, fix fov (e.g. 50°) and adjust distance.

### 3. near / far 的性能影响 / near/far Performance Impact

- **near 过小**（如 0.0001）：深度缓冲精度被浪费在近处，远处出现 z-fighting（闪烁的条纹）。这是最常见的渲染 bug 之一。 / Too small near wastes depth precision near camera, causing z-fighting (flickering stripes) far away. One of the most common render bugs.
- **far 过大**：同样降低深度精度，且可能渲染不必要的远处物体。 / Too large far also reduces depth precision and may render unnecessary distant objects.
- 经验法则 / Rule of thumb: `far / near < 1000`（典型值 near=0.1, far=1000）。 / Keep ratio under 1000.

### 4. 正交相机 / OrthographicCamera

```js
const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
```

六个参数 / Six parameters:

- **left / right**：左右裁剪面 X 坐标 / left/right clip X coords
- **top / bottom**：上下裁剪面 Y 坐标 / top/bottom clip Y coords
- **near / far**：近远裁剪面距离 / near/far distances

正交相机的投影线互相平行，因此**没有近大远小**。物体无论远近，在屏幕上大小相同。

Orthographic camera projection lines are parallel, so **no foreshortening**. Objects appear the same screen size regardless of distance.

```
        ┌─────┐         ┌─────┐
        │ obj │         │ obj │   ← 大小相同 / same size
        └─────┘         └─────┘
          ║               ║
          ║   平行投影线   ║
          ║   parallel    ║
          ║               ║
         camera
```

### 5. 正交相机的典型用途 / Orthographic Use Cases

| 场景 / Use case | 原因 / Reason |
| --- | --- |
| 2D 地图 / 2D maps | 无透视，便于测量 / no perspective, easy measurement |
| CAD / 工程制图 | 平行线保持平行 / parallel lines stay parallel |
| 2.5D 等距视角 / Isometric | 经典等距游戏视角 / classic iso game view |
| UI / 图标 / pixel art | 像素精确，不变形 / pixel-exact, no distortion |
| 模型查看器辅助视图 / Modeler aux views | 三视图 / top/front/side views |
| 小地图 / minimap | 俯视无畸变 / top-down without distortion |

### 6. 正交相机的"缩放" / Orthographic "Zoom"

正交相机没有"靠近物体"的缩放概念，而是通过调整 `left/right/top/bottom` 范围来"放大缩小"——范围越小，看到的区域越小，相当于放大。常用 `zoom` 属性：

Orthographic cameras don't "zoom" by moving closer; instead they adjust the `left/right/top/bottom` bounds — smaller bounds = smaller visible area = zoom in. The `zoom` property does this uniformly:

```js
camera.zoom = 2; // 视口缩小到 1/2，相当于放大 2 倍 / viewport halved = 2× zoom
camera.updateProjectionMatrix();
```

### 7. 视锥体 / Frustum

透视相机的可见区域是一个截头锥体（frustum）——被 near 和 far 两个平面截断的金字塔。正交相机的可见区域是一个长方体。用 `CameraHelper` 可视化：

The perspective camera's visible volume is a frustum — a pyramid truncated by near and far planes. The orthographic camera's volume is a box. Visualize with `CameraHelper`:

```js
const helper = new THREE.CameraHelper(camera);
scene.add(helper);
```

### 8. 透视 ↔ 正交切换 / Switching Perspective ↔ Orthographic

切换时需保持视觉连续性。常用做法：让正交相机的 `top/bottom` 根据"相机到目标距离 + 当前 fov"计算，使两者看到的内容范围一致：

When switching, preserve visual continuity. A common approach: compute orthographic `top/bottom` from "distance to target × tan(fov/2)" so both cameras frame the same content:

```js
const distance = camera.position.distanceTo(target);
const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(fov) / 2);
const halfWidth = halfHeight * aspect;
orthoCamera.left = -halfWidth;
orthoCamera.right = halfWidth;
orthoCamera.top = halfHeight;
orthoCamera.bottom = -halfHeight;
orthoCamera.updateProjectionMatrix();
```

这正是 `tan(fov/2)` 公式的实战应用。

This is the practical application of the `tan(fov/2)` formula.

### 9. 更新投影矩阵 / Updating Projection Matrix

任何相机参数变化后，必须调用 `updateProjectionMatrix()`，否则画面不更新：

After any camera parameter change, call `updateProjectionMatrix()` or the image won't update:

```js
camera.fov = 60;
camera.updateProjectionMatrix(); // 必须调用 / must call
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.PerspectiveCamera(fov, aspect, near, far)` | 透视相机 / perspective camera |
| `THREE.OrthographicCamera(l, r, t, b, near, far)` | 正交相机 / orthographic camera |
| `camera.fov` / `aspect` / `near` / `far` | 透视参数 / perspective params |
| `camera.left/right/top/bottom` | 正交边界 / ortho bounds |
| `camera.zoom` | 统一缩放 / uniform zoom |
| `camera.updateProjectionMatrix()` | 重算投影矩阵 / recompute projection |
| `camera.position` / `lookAt(v)` | 位置与朝向 / position & orientation |
| `THREE.CameraHelper(camera)` | 视锥可视化 / frustum visualization |
| `camera.getWorldDirection(v)` | 朝向单位向量 / forward unit vector |
| `THREE.MathUtils.degToRad(d)` | 角度→弧度 / deg→rad |

## 数学/原理 / Math & Principles

### 透视投影 / Perspective Projection

```
tan(fov/2) = (visibleHeight/2) / distance

→ visibleHeight = 2 · distance · tan(fov/2)
→ visibleWidth  = visibleHeight · aspect
```

### 透视投影矩阵 / Perspective Matrix

```
P = ┌ 1/(aspect·tan(fov/2))    0                  0                          0                  ┐
    │ 0                         1/tan(fov/2)       0                          0                  │
    │ 0                         0                 -(far+near)/(far-near)    -2·far·near/(far-near)│
    └ 0                         0                 -1                          0                  ┘
```

### 正交投影矩阵 / Orthographic Matrix

```
P = ┌ 2/(r-l)    0           0          -(r+l)/(r-l) ┐
    │ 0          2/(t-b)     0          -(t+b)/(t-b) │
    │ 0          0           -2/(f-n)   -(f+n)/(f-n) │
    └ 0          0           0           1            ┘
```

### 深度缓冲与 z-fighting / Depth Buffer & z-fighting

深度缓冲用 `1/z` 分布精度，靠近 near 的精度高，靠近 far 的精度低。当 near 极小、far 极大时，远处两个相近深度的面无法区分，出现闪烁条纹（z-fighting）。

The depth buffer distributes precision as `1/z`: high near `near`, low near `far`. When near is tiny and far huge, two close surfaces far away become indistinguishable, causing flickering stripes (z-fighting).

```
精度分布 / precision distribution:
near ────██████████████──░░░░░░──░░──░─░──── far
     高精度 / high         低精度 / low
```

### NDC 范围 / NDC Range

投影后顶点经透视除法得到 NDC，范围 `[-1, 1]` 三个轴。`x=-1` 是左边缘，`y=+1` 是上边缘，`z=-1` 是 near 平面，`z=+1` 是 far 平面。

After projection and perspective divide, vertices become NDC in `[-1, 1]` on all axes. `x=-1` = left edge, `y=+1` = top edge, `z=-1` = near plane, `z=+1` = far plane.

## 常见陷阱 / Common Pitfalls

1. **忘记 `updateProjectionMatrix`**：改了 fov/near/far 但画面没变。 / Changed params but image unchanged.
2. **near 设成 0**：投影矩阵除零，画面全黑或崩溃。near 必须 > 0。 / near=0 divides by zero; must be > 0.
3. **near 过小导致 z-fighting**：远处面闪烁。提高 near 到合理值（如 0.1~1）。 / Raise near to fix distant flicker.
4. **aspect 不随窗口更新**：拉伸窗口后画面变形。resize 时要更新 aspect。 / Update aspect on resize.
5. **正交边界不随宽高比变化**：竖屏时画面被压扁。应按 aspect 调整 left/right。 / Adjust left/right by aspect.
6. **切换相机后 OrbitControls 没绑定新相机**：controls 仍操作旧相机。重新创建或更新 controls.object。 / Rebind controls to new camera.
7. **far 过小裁掉场景**：远处物体突然消失。检查场景尺寸。 / Distant objects vanish; check scene size.
8. **fov 用弧度**：`PerspectiveCamera` 的 fov 是**度**，不是弧度。 / fov is in **degrees**, not radians.
9. **正交相机用 position 靠近来"放大"**：无效，正交无透视。用 `zoom` 或缩小边界。 / Use `zoom`, not position.

## 调试技巧 / Debugging Tips

- 用 `CameraHelper` 可视化视锥，直观看到 near/far/fov 范围。 / Visualize frustum to see bounds.
- 出现 z-fighting：调大 near，或给两个面加 `polygonOffset`。 / Raise near or use `polygonOffset`.
- 切换相机时保持 `position` 和 `lookAt` 一致，避免跳变。 / Keep position/lookAt consistent across switch.
- 用 `camera.getWorldDirection` 验证朝向。 / Verify orientation.
- 在 GUI 暴露所有参数，实时观察影响。 / Expose all params in GUI.
- 正交尺寸公式 `halfHeight = dist · tan(fov/2)` 是切换连续性的关键，务必掌握。 / Master the ortho sizing formula for smooth switching.

## 练习 / Exercises

1. 用 GUI 调 fov 从 10° 到 120°，观察广角畸变。 / Sweep fov 10°~120° and observe distortion.
2. 故意把 near 设成 0.001，在远处放两个相近平面，观察 z-fighting。 / Set near=0.001, place two close planes far away, observe z-fighting.
3. 实现实时切换透视/正交相机，且切换时画面不跳变。 / Implement seamless perspective↔ortho switch.
4. 用正交相机做一个 2.5D 等距视角场景。 / Build a 2.5D isometric scene with ortho camera.
5. 用 `CameraHelper` 可视化视锥，调整 near/far 观察形状变化。 / Visualize frustum, adjust near/far.
6. 用 `tan(fov/2)` 计算让一个 plane 在给定距离铺满视口。 / Size a plane to fill viewport at a given distance using `tan(fov/2)`.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/05-camera-projection/index.html`](../../examples/05-camera-projection/index.html)

核心片段 / Core snippet:

```js
// 两台相机共享同一 position & target / two cameras share position & target
const perspective = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
perspective.position.set(8, 6, 10);
const ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
ortho.position.copy(perspective.position);

let active = perspective;

// 切换时按距离+fov 计算正交边界，保持连续 / compute ortho bounds on switch for continuity
function syncOrthoFromPerspective() {
  const dist = perspective.position.distanceTo(controls.target);
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2);
  const halfW = halfH * perspective.aspect;
  ortho.left = -halfW; ortho.right = halfW;
  ortho.top = halfH; ortho.bottom = -halfH;
  ortho.updateProjectionMatrix();
}

// GUI 调参 / GUI params
camera.fov = 60;
camera.updateProjectionMatrix(); // 必须调用 / must call

// CameraHelper 可视化视锥 / frustum visualization
const helper = new THREE.CameraHelper(active);
scene.add(helper);
// 切换相机后重建 helper / rebuild helper after switch
```

## 参考资源 / References

- [Three.js Docs - PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera)
- [Three.js Docs - OrthographicCamera](https://threejs.org/docs/#api/en/cameras/OrthographicCamera)
- [Three.js Manual - Cameras](https://threejs.org/manual/#en/cameras)
- [LearnOpenGL - Camera](https://learnopengl.com/Getting-started/Camera)
- [Song Ho - OpenGL Projection Matrix](http://www.songho.ca/opengl/gl_projectionmatrix.html)
- [Depth Buffer Precision - OpenGL Wiki](https://www.khronos.org/opengl/wiki/Depth_Buffer_Precision)

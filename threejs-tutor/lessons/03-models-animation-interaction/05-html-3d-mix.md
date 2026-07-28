# HTML 与 3D 混合 / HTML & 3D Mixing

> 阶段 / Phase: 三、模型、动画和交互 / Models, Animation & Interaction
> 预计用时 / Estimated: 5-7 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

很多场景需要在 3D 物体旁边显示文字标签、数据卡片、菜单——这就是 HTML 与 3D 混合。核心问题是：3D 世界坐标如何变成屏幕上的 HTML 位置？本节先**手动实现**投影（`vector.project(camera)` + CSS 定位），再做遮挡判断（标签被 3D 物体挡住时隐藏），最后介绍 `CSS2DRenderer`/`CSS3DRenderer` 何时用。这对数据可视化、产品依赖图、数字孪生非常关键。

Many scenes need text labels, data cards, or menus next to 3D objects — that's HTML/3D mixing. The core question: how does a 3D world coord become an HTML screen position? This lesson first implements projection **manually** (`vector.project(camera)` + CSS positioning), then adds occlusion detection (hide labels blocked by 3D objects), and finally covers when to use `CSS2DRenderer`/`CSS3DRenderer`. This is essential for data viz, product dependency graphs, and digital twins.

## 核心概念 / Core Concepts

### 1. 3D → 屏幕投影 / 3D to Screen Projection

`Vector3.project(camera)` 把世界坐标变换到 NDC（x,y,z ∈ [-1,1]）。再映射到像素坐标即可定位 HTML 元素。

`Vector3.project(camera)` transforms a world coord to NDC (x,y,z ∈ [-1,1]). Map that to pixels to position an HTML element.

```js
const v = new THREE.Vector3();
const pos = new THREE.Vector3();

function project3DToScreen(worldPos, camera, width, height) {
  // 1. 世界 → 相机 → 裁剪空间(NDC) / world → camera → clip space (NDC)
  pos.copy(worldPos).project(camera);
  // 2. NDC → 像素 / NDC → pixels
  const x = (pos.x * 0.5 + 0.5) * width;
  const y = (-pos.y * 0.5 + 0.5) * height;   // y 翻转 / flip y
  // pos.z < -1 或 > 1 表示在视锥外（相机后方或远裁面外）
  // pos.z < -1 or > 1 means outside frustum (behind camera or beyond far plane)
  const visible = pos.z > -1 && pos.z < 1;
  return { x, y, visible, ndcZ: pos.z };
}
```

### 2. HTML 标签跟随 / HTML Label Following

每帧把 3D 对象位置投影到屏幕，用 `transform: translate(x,y)` 移动一个绝对定位的 `<div>`。`transform` 比 `left/top` 性能好（不触发 layout）。

Every frame, project the 3D object's position to screen and move an absolutely positioned `<div>` via `transform: translate(x,y)`. `transform` outperforms `left/top` (no layout reflow).

```js
// labelEls: HTMLElement[], anchors: Object3D[] (the 3D points they follow)
function updateLabels() {
  const w = innerWidth, h = innerHeight;
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].getWorldPosition(worldVec);
    const p = project3DToScreen(worldVec, camera, w, h);
    const el = labelEls[i];
    if (!p.visible) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.style.transform = `translate(-50%,-50%) translate(${p.x}px,${p.y}px)`;
  }
}
```

### 3. 遮挡判断 / Occlusion Detection

投影只告诉"标签在屏幕哪里"，不告诉"它前面有没有 3D 物体挡着"。要做遮挡，从相机到标签锚点发一条射线，若沿途先碰到了别的物体，则标签被挡住。

Projection only tells "where on screen", not "is something in front blocking it". To detect occlusion, cast a ray from the camera toward the label's anchor; if it hits something else first, the label is occluded.

```js
const ocRay = new THREE.Raycaster();
const camPos = new THREE.Vector3();
function isOccluded(worldPos, occluders) {
  camera.getWorldPosition(camPos);
  const dir = worldPos.clone().sub(camPos);
  const dist = dir.length();
  dir.normalize();
  ocRay.set(camPos, dir);
  ocRay.far = dist - 0.05; // 略短，避免命中锚点自身 / slightly short to miss the anchor itself
  const hits = ocRay.intersectObjects(occluders, true);
  return hits.length > 0; // 有东西挡在前面 / something is in front
}
```

> 性能提示：大量标签时每帧对每个标签都做射线检测会很慢。优化：只在相机移动时检测、用更稀疏的几何代理、或用 GPU ID buffer。

> Performance: ray-testing every label every frame is slow for many labels. Optimize: only test on camera move, use cheaper proxy geometry, or use a GPU ID buffer.

### 4. CSS2DRenderer 与 CSS3DRenderer / CSS2D & CSS3D Renderers

Three.js 提供两个 addon 把上述逻辑封装好：

Three.js ships two addons that wrap the above logic:

| Renderer | 特点 / Feature | 适用 / Use case |
| --- | --- | --- |
| `CSS2DRenderer` | HTML 元素贴在 3D 点上，无透视缩放 | 标签、注释 / Labels, annotations |
| `CSS3DRenderer` | HTML 元素作为 3D 物体参与变换（有透视、可旋转）| 3D 网页、卡片墙 / 3D web, card walls |

```js
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const div = document.createElement('div');
div.className = 'label';
div.textContent = 'Head';
const label = new CSS2DObject(div);
label.position.set(0, 1, 0);
model.add(label); // 直接挂在 3D 对象上 / attach to 3D object

// 渲染循环里 / in render loop
labelRenderer.render(scene, camera);
```

> `CSS2DRenderer` 的 `domElement` 要叠在 WebGL canvas 上方且 `pointer-events: none`，否则会挡住鼠标事件。需要点击标签时，给具体标签元素单独开 `pointer-events: auto`。

> `CSS2DRenderer`'s `domElement` must overlay the WebGL canvas with `pointer-events: none`, or it blocks mouse events. To make a label clickable, set `pointer-events: auto` on that specific label element.

### 5. 为什么先手动实现 / Why Implement Manually First

`CSS2DRenderer` 是黑盒：它内部就是 `project` + `transform`。先手写一遍，你才能：定位"标签飘了"的 bug、做自定义遮挡、控制 z-index 层级、在非 Three.js 渲染器里复用、做性能优化。理解原理后再用封装，才不会踩坑。

`CSS2DRenderer` is a black box: internally it's `project` + `transform`. Implementing it manually first lets you: debug "label drifting", do custom occlusion, control z-index layering, reuse outside Three.js, and optimize. Use the wrapper only after understanding the principle.

### 6. 事件协调 / DOM & Canvas Event Coordination

HTML 标签叠在 canvas 上会拦截鼠标事件。两种协调方式：

HTML labels over the canvas intercept mouse events. Two coordination strategies:

- **标签层 `pointer-events: none`**：默认全部穿透，点击交由 canvas 处理；需要交互的标签单独开 `auto`。
- **事件代理**：标签层接收事件，用 raycaster 把点击转发给 3D。

```js
// 点击标签聚焦相机到对应物体 / click label to focus camera on its object
div.addEventListener('click', () => {
  focusCameraOn(anchorObject);
});
function focusCameraOn(obj) {
  const p = new THREE.Vector3();
  obj.getWorldPosition(p);
  controls.target.copy(p);
  // 平滑移动相机（用 GSAP 或 lerp）/ smoothly move camera
}
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `Vector3.project(camera)` | 世界→NDC / World to NDC |
| `Vector3.unproject(camera)` | NDC→世界（反向）/ NDC to world (inverse) |
| `Raycaster` | 遮挡检测 / Occlusion detection |
| `CSS2DRenderer` (addon) | 2D 标签渲染器 / 2D label renderer |
| `CSS2DObject` | 绑定到 3D 点的 HTML 元素 / HTML element bound to a 3D point |
| `CSS3DRenderer` (addon) | 3D HTML 渲染器 / 3D HTML renderer |
| `CSS3DObject` | 参与 3D 变换的 HTML / HTML participating in 3D transforms |
| `element.style.transform` | 移动标签 / Move label (translate) |

## 工作流 / Workflow

1. **创建标签 DOM**：绝对定位 `<div>`，`pointer-events: none` 默认穿透。
2. **每帧投影**：`getWorldPosition` + `project` + `transform: translate`。
3. **视锥剔除**：`ndcZ` 超出 [-1,1] 时 `display: none`。
4. **遮挡判断**：raycaster 从相机到锚点，看是否被挡。
5. **交互**：可点击标签开 `pointer-events: auto`，点击触发相机聚焦。
6. **封装**：理解后可换 `CSS2DRenderer` 减少代码。
7. **响应 resize**：投影依赖画布尺寸，resize 时同步标签层尺寸。

## 常见陷阱 / Common Pitfalls

1. **投影后 y 不翻转** / Forgot to flip y — NDC y 向上，屏幕 y 向下，不翻转标签上下颠倒。
2. **resize 后标签错位** / Labels drift after resize — 投影用了过期的 width/height。
3. **标签层挡住 canvas 事件** / Label layer blocks canvas events — 忘了 `pointer-events: none`。
4. **相机后方标签仍显示** / Labels behind camera still show — 没用 `ndcZ` 剔除，标签出现在屏幕对面。
5. **遮挡判断命中锚点自身** / Occlusion ray hits the anchor itself — `ray.far` 设成距离本身，会命中锚点；要减一点余量。
6. **大量标签每帧射线检测卡顿** / Many labels ray-tested per frame lag — 没做节流或用便宜代理几何。
7. **CSS3DRenderer 与 WebGL z-fighting** | CSS3D and WebGL depth fighting — CSS3D 无法与 WebGL 深度缓冲混合，遮挡需手动处理。
8. **transform 用 left/top** / Using left/top — 触发 layout，大量标签时卡顿。

## 调试技巧 / Debugging Tips

- 给标签加边框，看它是否精确贴在锚点投影处。
- 打印 `ndcZ`，确认视锥剔除生效。
- 画一条从相机到锚点的线（`Line`），辅助遮挡判断可视化。
- 标签错位时先检查 width/height 是否用 `getBoundingClientRect` 而非 `innerWidth`（画布非全屏）。
- 遮挡误判时把 `occluders` 数组打印，确认是否包含了不该参与的物体（如地面）。

## 练习 / Exercises

1. 给上一节的盒子加 HTML 名称标签，跟随 3D 位置。
2. 实现遮挡：标签被盒子挡住时半透明显示。
3. 点击标签，相机平滑聚焦到对应物体（用 lerp 动画 target）。
4. 用 `CSS2DRenderer` 重写，对比代码量与行为。
5. 实现一个"数据卡片"：悬停物体时在旁边显示详细信息。
6. 用 `CSS3DRenderer` 做一个 3D 旋转的卡片墙。

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/16-html-3d-mix/index.html`](../../examples/16-html-3d-mix/index.html)

```js
// 手动投影 + 遮挡判断核心 / Manual projection + occlusion core
const worldVec = new THREE.Vector3();
const camPos = new THREE.Vector3();
const ocRay = new THREE.Raycaster();
const labels = []; // { el, anchor, occluders }

function updateLabels() {
  camera.getWorldPosition(camPos);
  const w = innerWidth, h = innerHeight;
  for (const L of labels) {
    L.anchor.getWorldPosition(worldVec);
    // 投影到 NDC / project to NDC
    const ndc = worldVec.clone().project(camera);
    const inFront = ndc.z > -1 && ndc.z < 1;
    // 遮挡检测 / occlusion test
    const dir = worldVec.clone().sub(camPos);
    const dist = dir.length(); dir.normalize();
    ocRay.set(camPos, dir);
    ocRay.far = dist - 0.05;
    const blocked = ocRay.intersectObjects(L.occluders, true).length > 0;
    // 定位 / position
    if (!inFront) { L.el.style.display = 'none'; continue; }
    L.el.style.display = 'block';
    const x = (ndc.x * 0.5 + 0.5) * w;
    const y = (-ndc.y * 0.5 + 0.5) * h;
    L.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
    L.el.style.opacity = blocked ? '0.25' : '1';
  }
}

// 点击标签聚焦相机 / click label to focus camera
labels.forEach(L => {
  L.el.addEventListener('click', () => {
    const p = new THREE.Vector3();
    L.anchor.getWorldPosition(p);
    // 平滑插值 target / lerp target smoothly
    animateTarget(p);
  });
});

function animateTarget(to) {
  const from = controls.target.clone();
  const t0 = performance.now();
  function step() {
    const k = Math.min((performance.now() - t0) / 600, 1);
    const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
    controls.target.lerpVectors(from, to, e);
    if (k < 1) requestAnimationFrame(step);
  }
  step();
}
```

## 参考资源 / References

- [Three.js Docs - CSS2DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
- [Three.js Docs - CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer)
- [Three.js Manual - HTML overlay](https://threejs.org/manual/#en/html)
- [Three.js Example - CSS2D labels](https://threejs.org/examples/#css2d_label)
- [Three.js Example - CSS3D periodic table](https://threejs.org/examples/#css3d_periodictable)

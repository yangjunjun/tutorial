# Raycaster 交互 / Raycaster & Interaction

> 阶段 / Phase: 三、模型、动画和交互 / Models, Animation & Interaction
> 预计用时 / Estimated: 5-8 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

Web 3D 的交互几乎都建立在"鼠标→射线→求交"这一管道上。本节讲透从屏幕像素到三维交点的完整流程，并实现 hover 高亮、点击选择、地面拖拽、框选、测距、部件选择等常见交互。掌握后，你能为任何 3D 场景加上"可点、可拖、可量"的能力。

Nearly all Web 3D interaction rests on one pipeline: mouse → ray → intersection. This lesson fully explains the flow from screen pixels to a 3D hit point, then implements hover highlight, click selection, ground drag, box-select, measurement, and part selection. After mastering it, you can make any 3D scene clickable, draggable, and measurable.

## 核心概念 / Core Concepts

### 1. 屏幕坐标 → NDC → 射线 / Screen → NDC → Ray

鼠标 `clientX/clientY` 是以左上为原点的像素坐标。Three.js 需要归一化设备坐标 NDC：x、y ∈ [-1, 1]，原点在画布中心、y 轴向上。

Mouse `clientX/clientY` are pixel coords with origin at top-left. Three.js needs Normalized Device Coordinates (NDC): x, y ∈ [-1, 1], origin at canvas center, y-axis up.

```js
const pointer = new THREE.Vector2();
function onPointerMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  // 注意：用 rect 而非 innerWidth，画布可能不是全屏 / Use rect, canvas may not be fullscreen
  pointer.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
}
```

`Raycaster.setFromCamera(pointer, camera)` 内部做了"逆投影"：把 NDC 点用相机投影矩阵的逆映射回世界空间，得到从相机出发、穿过该像素的射线（origin + direction）。

`Raycaster.setFromCamera(pointer, camera)` internally does an "inverse projection": it maps the NDC point back to world space using the inverse of the camera's projection matrix, yielding a ray (origin + direction) starting at the camera and passing through that pixel.

### 2. 求交 / Intersection

```js
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(pointer, camera);
// 第二参 true 表示递归子节点 / 2nd arg true = recursive
const hits = raycaster.intersectObjects(selectableObjects, true);

if (hits.length > 0) {
  const hit = hits[0];              // 最近的交点 / nearest hit
  hit.object;                       // 被击中的对象 / hit object
  hit.point;                        // 世界坐标交点 / world hit point
  hit.distance;                     // 到相机距离 / distance from camera
  hit.face?.normal;                 // 命中面法线（几何空间）/ face normal (geometry space)
  hit.instanceId;                   // InstancedMesh 的实例 id / instance id
}
```

### 3. hover 高亮 / Hover Highlight

hover 的标准做法：每帧（或 `pointermove`）求交，记下命中对象，给它加 emissive 或换材质；离开时还原。注意 hover 频繁，要做"是否变化"判断避免每帧重设材质。

Hover standard: raycast every frame (or on `pointermove`), track the hit object, boost its emissive or swap material; restore on leave. Hover is frequent — check "did it change" to avoid resetting materials every frame.

```js
let hovered = null;
function updateHover() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(boxes, false);
  const obj = hits.length ? hits[0].object : null;
  if (obj !== hovered) {
    if (hovered) hovered.material.emissive.setHex(0x000000);
    hovered = obj;
    if (hovered) hovered.material.emissive.setHex(0x444422);
  }
}
```

### 4. 点击选择 / Click Selection

区分"点击"与"拖拽"：记录 `pointerdown` 位置，`pointerup` 时若位移小于阈值（如 4px）才算点击。否则拖拽时也会误触发选择。

Distinguish "click" from "drag": record `pointerdown` position; on `pointerup`, if movement < threshold (e.g. 4px), treat as click. Otherwise dragging would also trigger selection.

```js
let downPos = null;
canvas.addEventListener('pointerdown', e => { downPos = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 4) return;            // 是拖拽，忽略 / it's a drag, ignore
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(boxes, true);
  if (hits.length) selectObject(hits[0].object);
});
```

### 5. 地面拖拽 / Drag on Ground Plane

拖拽物体时，要在某个平面上移动它。用 `raycaster.ray.intersectPlane(plane, target)` 求射线与地面的交点，把物体放到该点。常配合 `Plane.setFromNormalAndCoplanarPoint`。

When dragging an object, you move it along some plane. Use `raycaster.ray.intersectPlane(plane, target)` to find where the ray hits the ground, then place the object there. Often paired with `Plane.setFromNormalAndCoplanarPoint`.

```js
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 平面 / y=0 plane
const hitPoint = new THREE.Vector3();
let dragging = null, offset = new THREE.Vector3();

canvas.addEventListener('pointermove', e => {
  setPointer(e);
  if (dragging) {
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(groundPlane, hitPoint);
    dragging.position.copy(hitPoint).add(offset); // 保持抓取偏移 / preserve grab offset
  }
});
```

### 6. 框选 / Box Select

记录拖拽起止的 NDC，构造 `SelectionBox`（Three.js addon）或在屏幕空间用矩形筛选所有对象投影。注意框选对大量对象要做视锥剔除优化。

Record drag start/end in NDC, build a `SelectionBox` (Three.js addon) or filter objects by screen-space rectangle. For many objects, do frustum culling first.

### 7. 测距与标注 / Measurement & Annotation

两次点击产生两个交点，`p1.distanceTo(p2)` 得距离；用 `Line` 画测距线，HTML 标签显示数值（见第 5 节 HTML/3D 混合）。

Two clicks give two hit points; `p1.distanceTo(p2)` yields distance. Draw a `Line` for the measure line and an HTML label for the value (see lesson 5 on HTML/3D mixing).

### 8. 可视化射线 / Visualizing the Ray

调试时把射线画出来，确认方向正确：

For debugging, draw the ray to confirm direction:

```js
const rayHelper = new THREE.ArrowHelper(
  raycaster.ray.direction, raycaster.ray.origin, 20, 0xff00ff, 0.5, 0.3
);
scene.add(rayHelper);
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `Raycaster` | 射线投射器 / Raycaster |
| `Raycaster.setFromCamera(ndc, camera)` | 由相机+NDC 生成射线 / Build ray from camera + NDC |
| `intersectObjects(objs, recursive)` | 与对象数组求交 / Intersect with object array |
| `intersectObject(obj, recursive)` | 与单个对象求交 / Intersect with single object |
| `Ray.intersectPlane(plane, target)` | 射线与平面求交 / Ray vs plane intersection |
| `Plane.setFromNormalAndCoplanarPoint` | 构造平面 / Construct a plane |
| `Vector3.project(camera)` | 世界→NDC（用于标注）/ World → NDC (for labels) |
| `ArrowHelper` | 可视化射线 / Visualize ray |
| `SelectionBox` (addon) | 框选辅助 / Box-select helper |

## 工作流 / Workflow

1. **采集指针**：`pointermove` 更新 NDC；`pointerdown/up` 记录点击/拖拽起点。
2. **求交**：`raycaster.setFromCamera` + `intersectObjects`。
3. **判定意图**：移动距离 < 阈值 = 点击；否则拖拽。
4. **hover 反馈**：emissive/轮廓/光标变化。
5. **选择**：记录 selected，加 wireframe outline 或高亮。
6. **拖拽**：若 selected 可移动且指针在地面上，`intersectPlane` 更新位置。
7. **可视调试**：`ArrowHelper` 画射线，`Box3Helper` 画命中包围盒。

## 常见陷阱 / Common Pitfalls

1. **NDC 计算未减 canvas 偏移** / NDC without canvas offset — 画布非全屏时用 `clientX/innerWidth` 会偏，必须用 `getBoundingClientRect`。
2. **忘记 `recursive`** / Forgetting recursive — 默认不递归子节点，Group/模型点不中。
3. **拖拽与点击混淆** / Drag vs click confusion — 不加位移阈值，拖拽会误选。
4. **hover 每帧重设材质** / Resetting material every frame — 性能差且闪烁，要做"是否变化"判断。
5. **intersectPlane 返回 null** / Plane parallel to ray — 射线与地面平行时返回 null，必须判空。
6. **拖拽时物体跳到鼠标点** / Object jumps to cursor — 没保留按下时的抓取偏移，应在 pointerdown 算 `offset = obj.position - hitPoint`。
7. **InstancedMesh 用错 API** / Wrong API for InstancedMesh — 实例化网格要用 `hit.instanceId` + `setMatrixAt`，不能直接改 `instance.position`。
8. **射线被透明物体挡住** / Ray blocked by transparent objects — 透明物体仍参与求交；用 `layers` 或在求交数组里排除。

## 调试技巧 / Debugging Tips

- 用 `ArrowHelper` 把射线画出来，看方向是否对。
- `console.log(hits)` 看命中列表、distance 排序。
- 临时给每个对象加 `BoxHelper`，确认包围盒与可见区域一致。
- hover 不生效时检查：对象是否在 `intersectObjects` 数组里、`recursive` 是否开、材质是否 `visible`。
- 拖拽跳跃时打印 `hitPoint` 与 `offset`，确认 offset 计算时机。

## 练习 / Exercises

1. 实现 hover 改光标为 pointer，离开恢复。
2. 给选中对象加 `EdgesGeometry` 描边而非换材质。
3. 实现框选：拖出矩形，选中其内所有对象的投影。
4. 实现测距：两次点击画线并标注距离（HTML 标签）。
5. 实现部件选择：点击机器人某部位，高亮该部件并显示名称。
6. 用 `intersectPlane` 实现地面寻路标记点（点击地面放标记）。

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/14-raycaster/index.html`](../../examples/14-raycaster/index.html)

```js
// 核心交互状态 / Core interaction state
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();

let hovered = null;
let selected = null;
let dragging = null;
const dragOffset = new THREE.Vector3();
let downXY = null;

function setPointer(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('pointermove', e => {
  setPointer(e);
  if (dragging) {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
      dragging.position.copy(hitPoint).add(dragOffset);
    }
  }
});

canvas.addEventListener('pointerdown', e => {
  setPointer(e);
  downXY = { x: e.clientX, y: e.clientY };
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(boxes, params.recursive);
  if (hits.length) {
    selected = hits[0].object;
    // 计算抓取偏移 / compute grab offset
    raycaster.ray.intersectPlane(groundPlane, hitPoint);
    dragOffset.copy(selected.position).sub(hitPoint);
    dragging = selected;
    controls.enabled = false; // 拖拽时禁用轨道 / disable orbit while dragging
  }
});

canvas.addEventListener('pointerup', e => {
  const moved = downXY ? Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y) : 0;
  const wasDragging = dragging;
  dragging = null;
  controls.enabled = true;
  downXY = null;
  // 纯点击（位移小）才更新选择高亮 / pure click updates selection highlight
  if (moved < 4 && wasDragging) updateSelectionOutline();
});
```

## 参考资源 / References

- [Three.js Docs - Raycaster](https://threejs.org/docs/#api/en/core/Raycaster)
- [Three.js Manual - Picking](https://threejs.org/manual/#en/picking)
- [Three.js Example - Raycasting](https://threejs.org/examples/#webgl_interactive_cubes)
- [Three.js Example - BoxSelection](https://threejs.org/examples/#webgl_interactive_boxselection)
- [Three.js Example - DragControls](https://threejs.org/examples/#misc_controls_drag)

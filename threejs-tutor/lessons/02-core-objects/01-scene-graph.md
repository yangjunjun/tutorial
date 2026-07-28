# 场景图与 Object3D 层级 / Scene Graph & Object3D Hierarchy

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 3–4 小时 / 3–4 hours
> 难度 / Difficulty: Beginner

## 概述 / Overview

场景图（Scene Graph）是 Three.js 最核心的抽象。所有出现在屏幕上的东西——网格、灯光、相机、骨骼、粒子、精灵——都是 `Object3D` 的子类，它们通过父子关系组成一棵树。理解这棵树，就理解了 Three.js 一半的工作方式：变换会被继承、可见性会被继承、`traverse` 可以遍历整棵子树、`layers` 决定相机能不能看到某个节点。

The Scene Graph is the single most important abstraction in Three.js. Everything that appears on screen—meshes, lights, cameras, bones, points, sprites—is a subclass of `Object3D`, arranged in a tree through parent-child links. Master this tree and you understand half of Three.js: transforms are inherited, visibility is inherited, `traverse` walks a whole subtree, and `layers` decide whether a camera can see a node.

本节通过一个太阳系层级模型，演示如何用父子变换而不是手动世界坐标计算来组织复杂运动。

This lesson uses a solar-system hierarchy to show how to drive complex motion through parent-child transforms instead of manually computing world positions.

## 核心概念 / Core Concepts

### 1. Object3D 继承体系 / The Object3D Hierarchy

`Object3D` 是所有 3D 对象的基类。它持有一组变换（`position`、`rotation`、`quaternion`、`scale`）和一个 `children` 数组。常见子类如下：

`Object3D` is the base class for every 3D object. It holds a transform set (`position`, `rotation`, `quaternion`, `scale`) and a `children` array. Common subclasses:

```text
Object3D
├── Scene          // 场景根节点 / scene root
├── Group          // 分组 / logical group
├── Mesh           // 几何 + 材质 / geometry + material
├── Camera         // 相机基类 / camera base
├── Light          // 灯光基类 / light base
├── Bone           // 骨骼 / skinned bone
├── Points         // 粒子点集 / point cloud
├── Line           // 线段 / line segments
└── Sprite         // 始终朝向相机的精灵 / camera-facing sprite
```

```js
// 所有这些都可以 add/remove 子节点 / all of them can add & remove children
const group = new THREE.Group();          // Group 也是 Object3D
const mesh  = new THREE.Mesh(geo, mat);   // Mesh 也是 Object3D
group.add(mesh);                          // 建立父子关系 / parent-child link
scene.add(group);                         // scene 是根 / scene is the root
```

### 2. 局部坐标 vs 世界坐标 / Local vs World Coordinates

每个 `Object3D` 的 `position`/`rotation`/`scale` 都是**相对于父节点**的局部变换。世界变换 = 从根到该节点的所有局部变换矩阵相乘。

Every `Object3D`'s `position`/`rotation`/`scale` is **relative to its parent**. The world transform is the product of all local matrices along the path from root to node.

```js
mesh.position.set(2, 0, 0);               // 距离父节点 2 个单位 / 2 units from parent
console.log(mesh.position);               // 局部坐标 / local   → (2,0,0)
mesh.getWorldPosition(new THREE.Vector3()); // 世界坐标 / world → 受祖先影响
```

```js
// 手动更新世界矩阵（通常由渲染器自动完成）
// manually update world matrix (renderer does this automatically each frame)
mesh.updateMatrixWorld(true);
// matrixWorld 就是世界变换矩阵 / the world transform matrix
console.log(mesh.matrixWorld);
```

### 3. 变换继承 / Transform Inheritance

子节点会自动继承父节点的平移、旋转、缩放。这是场景图最强大的特性：你只需旋转"地球轨道"这个父节点，地球、月球轨道、月球全部跟着转。

Children automatically inherit the parent's translation, rotation, and scale. This is the killer feature: rotate the "Earth Orbit" parent and Earth, Moon-Orbit, and Moon all follow.

```js
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const earthOrbit = new THREE.Group();     // 不可见的轨道枢轴 / invisible orbit pivot
sun.add(earthOrbit);                      // 挂在太阳下 / child of Sun

const earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.set(5, 0, 0);              // 地球距离枢轴 5 单位 / 5 units from pivot
earthOrbit.add(earth);

const moonOrbit = new THREE.Group();
earth.add(moonOrbit);                     // 月球轨道挂在地球下 / moon orbit child of Earth

const moon = new THREE.Mesh(moonGeo, moonMat);
moon.position.set(1.5, 0, 0);
moonOrbit.add(moon);

// 每帧只需旋转枢轴 / each frame: just rotate the pivots
earthOrbit.rotation.y += 0.01;            // 地球绕太阳 / Earth around Sun
moonOrbit.rotation.y  += 0.05;            // 月球绕地球 / Moon around Earth
```

> 月球的世界位置由 `scene → sun → earthOrbit → earth → moonOrbit → moon` 链自动算出，无需手写一行三角函数。The moon's world position is computed automatically through the chain—no trigonometry needed.

### 4. add / remove / traverse

```js
parent.add(child);              // 添加子节点 / add child
parent.remove(child);           // 移除子节点 / remove child
child.parent                    // 父节点引用 / parent reference

// 遍历子树 / walk the subtree
scene.traverse((obj) => {
  if (obj.isMesh) {
    obj.material.opacity = 0.5;        // 批量修改 / batch modify
  }
});

// 只遍历直接子节点 / only direct children
scene.children.forEach((c) => console.log(c.type));
```

### 5. visible / layers / renderOrder / frustumCulled

```js
obj.visible = false;           // 隐藏（子树也不渲染）/ hide (subtree skipped)

// 图层：相机与对象用 32 位 layers 匹配 / 32-bit layer mask
camera.layers.enable(1);       // 相机看 layer 1 / camera sees layer 1
obj.layers.set(1);             // 对象只在 layer 1 / object on layer 1

obj.renderOrder = 10;          // 数值大的后渲染（半透明排序用）/ higher renders later
obj.frustumCulled = false;     // 关闭视锥剔除 / disable frustum culling
```

```js
// 经典用法：用 layers 让主相机只看 3D，预览相机只看辅助线
// classic: main camera sees only 3D, preview camera sees only helpers
mainCamera.layers.set(0);
helperCamera.layers.set(1);
gridHelper.layers.set(1);      // 辅助网格只在预览相机里 / helpers only in preview
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `Object3D.add(child)` | 添加子节点（会自动从旧父节点移除）/ add child (auto-removed from old parent) |
| `Object3D.remove(child)` | 移除子节点 / remove child |
| `Object3D.position` | 局部位置 `Vector3` / local position |
| `Object3D.rotation` | 欧拉角 `Euler` / Euler angles |
| `Object3D.quaternion` | 四元数旋转 / quaternion rotation |
| `Object3D.scale` | 局部缩放 / local scale |
| `Object3D.matrix` | 局部变换矩阵 / local matrix |
| `Object3D.matrixWorld` | 世界变换矩阵 / world matrix |
| `Object3D.updateMatrixWorld()` | 强制更新世界矩阵 / force world matrix update |
| `Object3D.getWorldPosition(v)` | 取世界坐标 / get world position |
| `Object3D.getWorldDirection(v)` | 取世界朝向 / get world direction |
| `Object3D.traverse(cb)` | 深度优先遍历子树 / depth-first traverse |
| `Object3D.traverseVisible(cb)` | 只遍历可见节点 / traverse visible only |
| `Object3D.visible` | 是否渲染 / render toggle |
| `Object3D.layers` | 32 位图层掩码 / 32-bit layer mask |
| `Object3D.renderOrder` | 渲染顺序（透明物体排序）/ render sort order |
| `Object3D.frustumCulled` | 是否参与视锥剔除 / frustum culling toggle |
| `Scene` | 场景图根节点，含 `background`/`fog`/`environment` / scene root |

## 原理 / Principles

### 世界矩阵的递归计算 / Recursive World Matrix

每个 `Object3D` 维护两个矩阵：`matrix`（局部）和 `matrixWorld`（世界）。

Each `Object3D` keeps two matrices: `matrix` (local) and `matrixWorld` (world).

```text
matrix = T(position) · R(rotation) · S(scale)
matrixWorld = parent.matrixWorld · matrix
```

渲染前，渲染器调用 `scene.updateMatrixWorld()`，自顶向下递归更新整棵树。你在 `render` 之前修改 `position`/`rotation`/`scale`，渲染器会自动把局部变换标记为"脏"并重算矩阵。

Before rendering, the renderer calls `scene.updateMatrixWorld()`, recursively updating the tree top-down. When you change `position`/`rotation`/``scale` before `render`, the transform is flagged dirty and matrices are recomputed.

```js
// 等价的手动写法 / the manual equivalent
obj.updateMatrix();                  // 局部 → matrix
obj.updateMatrixWorld(true);         // 递归更新子树 / recursive update
```

### 为什么不要手动算世界坐标 / Why Not Compute World Positions Manually

新手常犯的错误是绕过层级，自己用 `sin`/`cos` 算月球位置再赋值给 `mesh.position`。这在只有两个物体时可行，一旦加入轨道倾角、自转、卫星的卫星，数学就会爆炸式复杂。而用场景图，每个枢轴只关心自己的局部旋转，组合关系由矩阵乘法自动处理。

A common beginner mistake is bypassing the hierarchy and computing the moon's position with `sin`/`cos`, then assigning it to `mesh.position`. This works for two objects but explodes in complexity once you add orbital tilt, self-rotation, or moons of moons. With the scene graph, each pivot only cares about its own local rotation; composition is handled automatically by matrix multiplication.

## 常见陷阱 / Common Pitfalls

1. **忘记 `add` / Forgetting to `add`**：创建了几何体却没 `scene.add(mesh)`，屏幕一片黑。/ You created a mesh but never called `scene.add(mesh)`—black screen.
2. **混淆局部与世界坐标 / Confusing local & world**：`mesh.position` 是局部的，想拿世界坐标必须用 `getWorldPosition()`。/ `mesh.position` is local; use `getWorldPosition()` for world coords.
3. **`add` 后又 `add` 到另一个父 / Re-parenting**：`add` 会自动从旧父移除，但如果你缓存了旧父的 `children` 引用，可能踩坑。/ `add` auto-removes from the old parent, but cached `children` references can bite you.
4. **`traverse` 性能 / `traverse` performance**：每帧 `traverse` 上万个节点很慢，尽量用扁平数组缓存需要更新的对象。/ `traverse`-ing 10k nodes every frame is slow; cache hot objects in a flat array.
5. **`visible=false` 不等于"不占内存" / `visible` is not disposal**：隐藏只是不渲染，几何体和纹理仍在显存。用 `dispose()` 才真正释放。/ Hiding doesn't free memory; call `dispose()`.
6. **`layers` 只影响相机，不影响灯光 / `layers` & lights**：灯光没有 layers 概念，它照所有物体。/ Lights ignore layers—they illuminate everything.
7. **`renderOrder` 对不透明物体几乎无效 / `renderOrder` & opaque**：不透明物体按前到后排序以利用深度测试，`renderOrder` 主要影响透明物体。/ Opaque objects are sorted front-to-back; `renderOrder` mainly matters for transparency.

## 调试技巧 / Debugging Tips

- 用 `scene.traverse(o => console.log(o.type, o.name))` 打印整棵树，确认层级结构正确。/ Print the whole tree to verify hierarchy.
- `THREE.AxesHelper(1)` 挂到任何 `Object3D` 上，可以直观看到局部坐标轴朝向。/ Attach `AxesHelper` to see local axes.
- 在浏览器控制台输入 `scene.children`，实时检查根节点。/ Inspect `scene.children` live.
- 如果物体"看不见"，依次检查：`visible`、`layers`、`frustumCulled`、相机 `near/far`、材质 `transparent`+`opacity`。/ Checklist for invisible objects.
- `obj.getWorldPosition(new THREE.Vector3())` 打印世界坐标，对比预期。/ Print world position to compare with expectation.

## 练习 / Exercises

1. 在太阳系示例中加入火星及其两颗卫星，验证层级正确。/ Add Mars and its two moons to the solar system.
2. 用 `layers` 实现主相机只看行星、辅助相机只看轨道辅助线，按 `Tab` 切换。/ Use `layers` so main camera sees planets, helper camera sees orbit lines.
3. 用 `traverse` 批量给所有行星设置 `emissive`，让它们在无灯光时也可见。/ Use `traverse` to set `emissive` on all planets.
4. 给地球加一个自转，验证自转不影响月球公转（因为月球挂在 `earth` 下，自转会带动月球——想想怎么用额外的枢轴解决）。/ Add Earth self-rotation; observe how it drags the moon, then fix with an extra pivot.
5. 用 `renderOrder` 让半透明的大气层始终在地球之后渲染。/ Use `renderOrder` to render a transparent atmosphere after Earth.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/06-scene-graph/index.html`](../../examples/06-scene-graph/index.html)

```js
// ====== 太阳系层级 / Solar system hierarchy ======
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa33 })
);
scene.add(sun);

// 地球轨道枢轴（不可见）/ Earth orbit pivot (invisible)
const earthOrbit = new THREE.Group();
sun.add(earthOrbit);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.8 })
);
earth.position.set(5, 0, 0);
earthOrbit.add(earth);

// 月球轨道枢轴 / Moon orbit pivot
const moonOrbit = new THREE.Group();
earth.add(moonOrbit);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 })
);
moon.position.set(1.3, 0, 0);
moonOrbit.add(moon);

// 轨道辅助线 / orbit rings
const orbitRing = (r) => {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x446688 })
  );
};
sun.add(orbitRing(5));          // 地球轨道线 / Earth orbit ring
earth.add(orbitRing(1.3));      // 月球轨道线 / Moon orbit ring

// GUI 控制 / GUI controls
const params = { speed: 1, showOrbits: true };
gui.add(params, 'speed', 0, 3, 0.01).name('轨道速度 / Orbit Speed');
gui.add(params, 'showOrbits').name('显示轨道 / Show Orbits').onChange(v => {
  scene.traverse(o => { if (o.isLine) o.visible = v; });
});

// 渲染循环 / render loop
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  earthOrbit.rotation.y += 0.3 * params.speed * dt;   // 帧率无关 / frame-rate independent
  moonOrbit.rotation.y  += 1.5 * params.speed * dt;
  controls.update();
  renderer.render(scene, camera);
});
```

## 参考资源 / References

- [Three.js Docs — Object3D](https://threejs.org/docs/#api/en/core/Object3D)
- [Three.js Docs — Scene](https://threejs.org/docs/#api/en/scenes/Scene)
- [Three.js Manual — Creating a scene](https://threejs.org/manual/#en/creating-a-scene)
- [Three.js Manual — Scenegraph](https://threejs.org/manual/#en/scenegraph)
- [MDN — WebGL coordinate spaces](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection)

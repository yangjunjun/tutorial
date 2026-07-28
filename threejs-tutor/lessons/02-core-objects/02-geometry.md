# 几何体与 BufferGeometry / Geometry & BufferGeometry

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 3–4 小时 / 3–4 hours
> 难度 / Difficulty: Beginner→Intermediate

## 概述 / Overview

几何体定义了"形状"——顶点在哪里、法线朝哪、UV 怎么映射、哪些顶点组成三角形。Three.js 中所有几何体（无论 `BoxGeometry` 还是 glTF 导入的模型）最终都归约为 `BufferGeometry`：一组 GPU 缓冲区。理解 `BufferGeometry` 就能手写任意形状，也能在模型出现问题时直接查、改顶点数据。

Geometry defines "shape"—where vertices are, where normals point, how UVs map, and which vertices form triangles. Every geometry in Three.js (whether `BoxGeometry` or a glTF import) reduces to `BufferGeometry`: a set of GPU buffers. Understanding `BufferGeometry` lets you hand-write any shape and directly inspect/fix vertex data when models break.

本节将从零手写一个五角星和一个网格平面，并可视化顶点法线，同时演示索引几何体与非索引几何体的区别。

This lesson hand-writes a five-pointed star and a grid plane from scratch, visualizes vertex normals, and demonstrates the difference between indexed and non-indexed geometry.

## 核心概念 / Core Concepts

### 1. BufferGeometry 与 BufferAttribute

`BufferGeometry` 是一个容器，里面存放若干 `BufferAttribute`。每个 attribute 是一块类型化数组（`Float32Array`、`Uint32Array` 等），通过名字被 shader 访问。

`BufferGeometry` is a container holding several `BufferAttribute`s. Each attribute is a typed array (`Float32Array`, `Uint32Array`, etc.) accessed by name in the shader.

```js
const geo = new THREE.BufferGeometry();

// position：每个顶点 3 个 float (x,y,z) / 3 floats per vertex
const positions = new Float32Array([
  0, 0, 0,    // 顶点 0 / vertex 0
  1, 0, 0,    // 顶点 1
  0, 1, 0,    // 顶点 2
]);
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 法线方向 / normals
const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

// UV 纹理坐标 / UV coords
const uvs = new Float32Array([0, 0, 1, 0, 0, 1]);
geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
```

### 2. 内置 attribute 名称 / Built-in Attribute Names

| 名称 / Name | 维度 / Size | 作用 / Purpose |
| --- | --- | --- |
| `position` | 3 | 顶点位置 / vertex position |
| `normal` | 3 | 顶点法线（影响光照）/ vertex normal (affects lighting) |
| `uv` | 2 | 纹理坐标 / texture coordinate |
| `color` | 3 | 顶点颜色 / vertex color |
| `tangent` | 3 | 切线（法线贴图用）/ tangent (for normal maps) |
| `index` | 1 | 顶点索引（复用顶点）/ vertex index (reuse) |

### 3. Indexed vs Non-Indexed Geometry

```text
非索引 Non-indexed:
  position = [v0, v1, v2,  v0, v2, v3]   // 每个三角形独立写 3 个顶点
  直接按顺序画三角形，顶点可能重复

索引 Indexed:
  position = [v0, v1, v2, v3]             // 每个顶点只存一次
  index    = [0, 1, 2,  0, 2, 3]          // 用索引引用顶点
  顶点不重复，节省内存与带宽
```

```js
// 索引几何体 / indexed geometry
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geo.setIndex([0, 1, 2, 0, 2, 3]);        // 两个三角形 / two triangles

// 转为非索引 / convert to non-indexed
const nonIndexed = geo.toNonIndexed();
console.log(nonIndexed.attributes.position.count);  // 6 (vs indexed 的 4)
```

> **何时用索引 / When to use index**：当相邻三角形共享顶点（且共享法线/UV）时，索引能大幅减少数据量。当每个三角形的面法线不同时（如立方体的硬边缘），非索引更合适。Use index when triangles share vertices (and normals/UVs); use non-indexed when each face needs its own normal (hard edges like a cube).

### 4. 手写三角形 / Hand-writing a Triangle

```js
const triGeo = new THREE.BufferGeometry();
triGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  0, 1, 0,    // 顶 / top
  -1, -1, 0,  // 左下 / bottom-left
  1, -1, 0,   // 右下 / bottom-right
]), 3));
triGeo.computeVertexNormals();           // 自动算法线 / auto-compute normals
```

### 5. 手写矩形（两个三角形）/ Hand-writing a Rectangle

```js
const rectGeo = new THREE.BufferGeometry();
rectGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  -1, -1, 0,   1, -1, 0,   1, 1, 0,   -1, 1, 0
]), 3));
rectGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
  0, 0,   1, 0,   1, 1,   0, 1
]), 2));
rectGeo.setIndex([0, 1, 2, 0, 2, 3]);    // 两个三角形组成矩形 / two tris form a quad
rectGeo.computeVertexNormals();
```

### 6. 手写网格平面 / Hand-writing a Grid Plane

```js
function makeGridPlane(size = 4, divisions = 4) {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];
  const step = size / divisions;
  const half = size / 2;

  for (let iy = 0; iy <= divisions; iy++) {
    for (let ix = 0; ix <= divisions; ix++) {
      const x = -half + ix * step;
      const y = -half + iy * step;
      positions.push(x, 0, y);           // y=0 的平面 / plane on y=0
      uvs.push(ix / divisions, iy / divisions);
    }
  }
  // 每个格子两个三角形 / two triangles per cell
  for (let iy = 0; iy < divisions; iy++) {
    for (let ix = 0; ix < divisions; ix++) {
      const a = ix + iy * (divisions + 1);
      const b = a + 1;
      const c = a + (divisions + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
```

### 7. 手写五角星 / Hand-writing a Five-pointed Star

五角星的核心思路：外圆顶点和内圆顶点交替排列，中心点作为扇形的公共顶点。

The star's core idea: alternate outer-radius and inner-radius vertices around a circle, with the center as the shared fan apex.

```js
function makeStar(outerR = 1, innerR = 0.4, points = 5) {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const indices = [];
  // 中心顶点 / center vertex (index 0)
  positions.push(0, 0, 0);
  // 交替推入外/内圆顶点 / push alternating outer/inner vertices
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    positions.push(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
  // 每个三角形：中心 → 当前 → 下一个 / triangle: center → current → next
  for (let i = 0; i < points * 2; i++) {
    indices.push(0, 1 + i, 1 + ((i + 1) % (points * 2)));
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();           // 平面法线朝 +Z / flat normal +Z
  return geo;
}
```

### 8. 包围盒与包围球 / Bounding Box & Sphere

```js
geo.computeBoundingBox();               // 算出 min/max / compute min/max
geo.computeBoundingSphere();            // 算出中心和半径 / compute center & radius

console.log(geo.boundingBox.min, geo.boundingBox.max);
console.log(geo.boundingSphere.radius);

// 用途：视锥剔除、射线检测、自动相机距离
// used for: frustum culling, raycasting, auto camera framing
```

### 9. groups 与 drawRange

`groups` 允许一个几何体用多套材质绘制（每个 group 指定一段 `start, count, materialIndex`）。`drawRange` 限制只绘制顶点的一部分。

`groups` let one geometry be drawn with multiple materials (each group specifies `start, count, materialIndex`). `drawRange` limits drawing to a subset of vertices.

```js
// 多材质几何体 / multi-material geometry
geo.addGroup(0, 6, 0);                  // 前 2 个三角形用材质 0
geo.addGroup(6, 6, 1);                  // 后 2 个三角形用材质 1
const mesh = new THREE.Mesh(geo, [mat0, mat1]);

// 只画前 3 个顶点 / draw only first 3 vertices
geo.setDrawRange(0, 3);
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `BufferGeometry` | 几何体容器 / geometry container |
| `BufferAttribute(array, itemSize)` | 顶点属性 / vertex attribute |
| `setAttribute(name, attr)` | 设置属性 / set attribute |
| `getAttribute(name)` | 取属性 / get attribute |
| `setIndex(array)` | 设置索引 / set index |
| `toNonIndexed()` | 转为非索引 / convert to non-indexed |
| `computeVertexNormals()` | 自动算法线 / auto-compute normals |
| `computeBoundingBox()` | 计算包围盒 / compute bounding box |
| `computeBoundingSphere()` | 计算包围球 / compute bounding sphere |
| `addGroup(start, count, matIdx)` | 添加材质组 / add material group |
| `setDrawRange(start, count)` | 限制绘制范围 / limit draw range |
| `dispose()` | 释放 GPU 内存 / free GPU memory |
| `BufferGeometryUtils.mergeGeometries()` | 合并多个几何体 / merge geometries |

## 原理 / Principles

### 法线计算原理 / How `computeVertexNormals` Works

对于索引几何体，Three.js 遍历每个三角形，用两条边的叉积算出面法线，然后累加到该三角形的三个顶点上，最后归一化。共享顶点的法线是相邻面法线的平均——这就是为什么立方体如果用索引几何体，边缘会看起来"圆滑"（错误）。硬边缘需要拆分顶点。

For indexed geometry, Three.js iterates each triangle, computes the face normal via edge cross-product, accumulates it to the triangle's three vertices, then normalizes. Shared vertices get averaged normals—which is why an indexed cube looks "smooth" (wrong) at edges. Hard edges require vertex splitting.

```js
// 面法线 = (v1-v0) × (v2-v0) / face normal
const edge1 = v1.clone().sub(v0);
const edge2 = v2.clone().sub(v0);
const faceNormal = edge1.cross(edge2).normalize();
```

### 为什么必须 `dispose()` / Why You Must `dispose()`

`BufferGeometry` 上传到 GPU 后占据显存。即使 JS 端的引用被 GC 回收，GPU 端的缓冲区不会自动释放。换场景、换模型时必须手动 `geo.dispose()`，否则显存泄漏直至崩溃。

`BufferGeometry` occupies VRAM after upload. Even when JS references are GC'd, GPU buffers are not freed automatically. You must call `geo.dispose()` when swapping scenes/models, or VRAM leaks until crash.

## 常见陷阱 / Common Pitfalls

1. **忘记 `computeVertexNormals` / Forgetting normals**：没算法线时材质全黑（Lambert/Standard 无光照响应）。/ Without normals, lit materials render black.
2. **索引与顶点数不匹配 / Index out of range**：`index` 引用了不存在的顶点，渲染崩溃或花屏。/ Index references nonexistent vertices → crash or garbage.
3. **缠绕方向 / Winding order**：Three.js 默认逆时针（CCW）为正面。顺时针的面会被 `side: FrontSide` 剔除，看起来像"消失了"。/ Three.js treats CCW as front; CW faces are culled and "disappear."
4. **NPOT 纹理 + 错误 UV / Bad UVs**：UV 超出 `[0,1]` 而-wrap 模式是 `ClampToEdge`，会看到拉伸的边缘条纹。/ UVs beyond `[0,1]` with `ClampToEdge` cause stretched edges.
5. **共享顶点导致硬边缘变圆滑 / Shared vertices smooth hard edges**：立方体用 8 个顶点 + 索引，法线被平均，边缘看起来像球。需要 24 个顶点（每面 4 个独立顶点）。/ An indexed cube with 8 vertices averages normals; use 24 vertices for hard edges.
6. **`Float32Array` 精度 / Float32 precision**：大世界坐标下 `Float32` 会有抖动，考虑 `Float64BufferAttribute` 或原点分块。/ Large-world coordinates jitter with Float32; consider Float64 or origin-chunking.
7. **忘 `dispose` / Missing dispose**：动态生成几何体每帧 new 不 dispose，显存暴涨。/ Creating geometry per frame without dispose leaks VRAM.

## 调试技巧 / Debugging Tips

- `console.log(geo.attributes.position.count)` 查看顶点数，对比预期。/ Check vertex count vs expectation.
- `geo.computeBoundingSphere(); console.log(geo.boundingSphere)` 看包围球是否合理（太大=有离群点，太小=坐标错）。/ Inspect bounding sphere for outliers.
- 用 `VertexNormalsHelper` 或 `ArrowHelper` 可视化法线方向。/ Visualize normals with helpers.
- 用 `wireframe: true` 材质检查三角形划分是否正确。/ Use `wireframe` to verify triangulation.
- 如果面"看不见"，临时把 `side` 改成 `DoubleSide` 排查缠绕方向。/ Temporarily use `DoubleSide` to diagnose winding.

## 练习 / Exercises

1. 手写一个六边形，然后改成 `n` 边形函数。/ Hand-write a hexagon, then generalize to `n`-gon.
2. 手写一个圆环（Torus）的简化版，只用 position + index。/ Hand-write a simplified torus.
3. 把五角星改为非索引几何体，观察顶点数变化。/ Convert the star to non-indexed, compare counts.
4. 用 `groups` 给网格平面的每个格子分配不同材质。/ Use `groups` to give each grid cell a different material.
5. 用 `setDrawRange` 实现一个"逐渐绘制"的动画效果。/ Use `setDrawRange` for a progressive-draw animation.
6. 手写一个 3D 立方体（24 顶点，硬边缘），不用 `BoxGeometry`。/ Hand-write a 3D cube with hard edges (24 vertices).

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/07-geometry/index.html`](../../examples/07-geometry/index.html)

```js
// 五角星 / star
function makeStar(outerR, innerR, points) {
  const geo = new THREE.BufferGeometry();
  const positions = [0, 0, 0];          // 中心 / center
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    positions.push(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
  const indices = [];
  for (let i = 0; i < points * 2; i++) {
    indices.push(0, 1 + i, 1 + ((i + 1) % (points * 2)));
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 网格平面 / grid plane
function makeGridPlane(size, divisions) {
  const positions = [], uvs = [], indices = [];
  const step = size / divisions, half = size / 2;
  for (let iy = 0; iy <= divisions; iy++)
    for (let ix = 0; ix <= divisions; ix++) {
      positions.push(-half + ix * step, 0, -half + iy * step);
      uvs.push(ix / divisions, iy / divisions);
    }
  for (let iy = 0; iy < divisions; iy++)
    for (let ix = 0; ix < divisions; ix++) {
      const a = ix + iy * (divisions + 1), b = a + 1, c = a + (divisions + 1), d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 用法 / usage
const starGeo = makeStar(1.5, 0.6, 5);
const starMesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({
  color: 0xffcc44, side: THREE.DoubleSide, flatShading: true
}));
scene.add(starMesh);

// 法线可视化 / visualize normals
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
const helper = new VertexNormalsHelper(starMesh, 0.3, 0x00ff00);
scene.add(helper);

// 切换索引/非索引 / toggle indexed / non-indexed
const nonIndexed = starGeo.toNonIndexed();
console.log('indexed verts:', starGeo.attributes.position.count);       // 11
console.log('non-indexed verts:', nonIndexed.attributes.position.count); // 30
```

## 参考资源 / References

- [Three.js Docs — BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [Three.js Docs — BufferAttribute](https://threejs.org/docs/#api/en/core/BufferAttribute)
- [Three.js Manual — Custom BufferGeometry](https://threejs.org/manual/#en/custom-buffergeometry)
- [Three.js Manual — Primitives](https://threejs.org/manual/#en/primitives)
- [WebGL Fundamentals — Geometry](https://webglfundamentals.org/webgl/lessons/webgl-geometry.html)

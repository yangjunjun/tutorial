# 矩阵变换 / Matrix Transformations

> 阶段 / Phase: 一、数学和图形学基础 / Math & Graphics Fundamentals
> 预计用时 / Estimated: 3-4 小时 / 3-4 hours
> 难度 / Difficulty: Beginner-Intermediate

## 概述 / Overview

Three.js 的每一帧渲染都在做矩阵乘法。当你写 `mesh.position.set(1,2,3)` 和 `mesh.rotation.y = 0.5` 时，Three.js 内部把它们组合成一个 4×4 模型矩阵，再与视图矩阵、投影矩阵相乘，最终把顶点送到 GPU。理解矩阵变换，是解决"为什么物体绕奇怪的点旋转""为什么父子节点变换互相影响""为什么先旋转再平移和先平移再旋转结果不同"的关键。

Every rendered frame in Three.js performs matrix multiplications. When you write `mesh.position.set(1,2,3)` and `mesh.rotation.y = 0.5`, Three.js internally combines them into a 4×4 model matrix, multiplies it with the view and projection matrices, and sends vertices to the GPU. Understanding matrix transformations is the key to solving "why does my object rotate around a weird point", "why do parent-child transforms affect each other", and "why does rotate-then-translate differ from translate-then-rotate".

## 核心概念 / Core Concepts

### 1. 为什么要用 4×4 矩阵 / Why 4×4 Matrices

3D 点用 `(x,y,z)`，但平移无法用 3×3 线性变换表达。引入齐次坐标 `(x,y,z,w)`，`w=1` 表示点，`w=0` 表示方向。4×4 矩阵统一了平移、旋转、缩放：

3D points use `(x,y,z)`, but translation cannot be expressed by a 3×3 linear transform. Homogeneous coordinates `(x,y,z,w)` are introduced: `w=1` for points, `w=0` for directions. The 4×4 matrix unifies translation, rotation, and scaling:

```
| m11 m12 m13 tx |     | x |     | x' |
| m21 m22 m23 ty |  ×  | y |  =  | y' |
| m31 m32 m33 tz |     | z |     | z' |
|  0   0   0   1 |     | 1 |     | 1  |
```

左上 3×3 子矩阵负责旋转+缩放，第四列 `(tx,ty,tz)` 负责平移。

The upper-left 3×3 submatrix handles rotation+scale; the fourth column `(tx,ty,tz)` handles translation.

### 2. 三种基本变换 / Three Basic Transforms

```js
// 平移矩阵 / translation matrix
const T = new THREE.Matrix4().makeTranslation(x, y, z);

// 旋转矩阵 / rotation matrix
const R = new THREE.Matrix4().makeRotationAxis(axis, angle); // 绕任意轴 / around any axis
const Rx = new THREE.Matrix4().makeRotationX(angle);
const Ry = new THREE.Matrix4().makeRotationY(angle);
const Rz = new THREE.Matrix4().makeRotationZ(angle);

// 缩放矩阵 / scale matrix
const S = new THREE.Matrix4().makeScale(sx, sy, sz);
```

### 3. 矩阵乘法顺序至关重要 / Matrix Multiply Order Matters

矩阵乘法**不满足交换律**：`M1 × M2 ≠ M2 × M1`。这解释了为什么"先旋转再平移"和"先平移再旋转"结果完全不同。

Matrix multiplication is **not commutative**: `M1 × M2 ≠ M2 × M1`. This is why "rotate then translate" differs from "translate then rotate".

```js
// 方式A：先平移再旋转 / translate then rotate (绕原点旋转后的位置)
// 等价于 M = R × T ：先平移到，再绕原点旋转 / applies T first, then R around origin
const M_A = new THREE.Matrix4().multiplyMatrices(R, T);

// 方式B：先旋转再平移 / rotate then translate (物体自转后整体平移)
const M_B = new THREE.Matrix4().multiplyMatrices(T, R);
```

Three.js 的约定：`matrix = T × R × S`（先缩放、再旋转、最后平移），这与 `position`、`rotation`、`scale` 属性的组合顺序一致。变换作用于顶点时，**列向量在右边**：`v' = M × v`，因此写法 `M = T × R × S` 意味着顶点先被 S 作用，再 R，再 T。

Three.js convention: `matrix = T × R × S` (scale first, then rotate, then translate), matching how `position`, `rotation`, `scale` combine. When transforming a vertex (column vector on the right): `v' = M × v`, so `M = T × R × S` means the vertex is scaled first, then rotated, then translated.

### 4. 绕任意点旋转 / Rotation Around an Arbitrary Pivot

要让物体绕点 P 旋转，而不是绕原点：先把物体平移到 P 为原点（`T(-P)`），旋转，再平移回去（`T(P)`）：

To rotate an object around a pivot P instead of the origin: translate so P becomes the origin (`T(-P)`), rotate, then translate back (`T(P)`):

```
M = T(P) × R × T(-P)
```

```js
const pivot = new THREE.Vector3(2, 0, 0);
const M = new THREE.Matrix4()
  .makeTranslation(pivot.x, pivot.y, pivot.z)     // T(P)
  .multiply(new THREE.Matrix4().makeRotationY(angle)) // R
  .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)); // T(-P)
mesh.applyMatrix4(M);
```

更简单的做法是把 mesh 挂到一个父 Group，Group 放在 pivot 处，旋转 Group 即可。

A simpler approach: parent the mesh to a Group positioned at the pivot, then rotate the Group.

### 5. 父子节点变换继承 / Parent-Child Transform Inheritance

子节点的 `matrix` 是局部变换，`matrixWorld` 是从根到该节点所有矩阵的乘积：

A child's `matrix` is local; `matrixWorld` is the product of all matrices from root to this node:

```
child.matrixWorld = parent.matrixWorld × child.matrix
```

所以父节点旋转，子节点会跟着旋转；子节点自己的 `position` 是相对父节点的局部坐标。

So when the parent rotates, the child follows; the child's own `position` is local relative to the parent.

```js
const parent = new THREE.Group();
parent.position.set(2, 0, 0);
scene.add(parent);

const child = new THREE.Mesh(geo, mat);
child.position.set(0, 1, 0); // 局部坐标 / local
parent.add(child);

parent.updateMatrixWorld(true);
console.log(child.matrixWorld); // 包含父级平移 / includes parent translation
```

### 6. 完整渲染管线 / Full Rendering Pipeline

```
局部坐标 (Local)
  │  × modelMatrix (= T×R×S)
  ▼
世界坐标 (World)
  │  × viewMatrix (camera.matrixWorldInverse)
  ▼
相机坐标 (View/Eye)
  │  × projectionMatrix
  ▼
裁剪坐标 (Clip, vec4, 有 w 分量 / has w)
  │  ÷ w (透视除法 / perspective divide)
  ▼
NDC 标准设备坐标 [-1,1]
  │  × (viewport × depthRange)
  ▼
屏幕像素坐标 (Screen)
```

### 7. 关键 API / Key APIs

```js
object.matrix;                  // 局部矩阵 / local matrix (自动从 position/rotation/scale 计算)
object.matrixWorld;             // 世界矩阵 / world matrix
object.matrixAutoUpdate;        // 默认 true，每帧自动更新 / auto-update each frame (default true)
object.updateMatrix();          // 从 position/rotation/scale 重算 matrix / recompute matrix
object.updateMatrixWorld(true); // 强制更新自身及子节点 / force update self & children

object.localToWorld(v);         // 局部坐标 → 世界坐标 / local → world
object.worldToLocal(v);         // 世界坐标 → 局部坐标 / world → local

v.applyMatrix4(M);              // 用矩阵变换向量 / transform vector by matrix

camera.matrixWorldInverse;      // 视图矩阵 / view matrix
camera.projectionMatrix;        // 投影矩阵 / projection matrix
```

### 8. matrixAutoUpdate = false 的场景 / When to Disable Auto-Update

当你用 `applyMatrix4` 直接操作 `matrix` 时，需关闭自动更新，否则下一帧 `matrix` 会被 `position/rotation/scale` 覆盖：

When you manipulate `matrix` directly via `applyMatrix4`, disable auto-update, otherwise the next frame overwrites `matrix` from `position/rotation/scale`:

```js
mesh.matrixAutoUpdate = false;
mesh.updateMatrix(); // 手动 / manual
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `THREE.Matrix4` | 4×4 矩阵类 / 4×4 matrix class |
| `M.makeTranslation(x,y,z)` | 构造平移矩阵 / build translation matrix |
| `M.makeRotationX/Y/Z(a)` | 构造旋转矩阵 / build rotation matrix |
| `M.makeRotationAxis(axis, a)` | 绕任意轴旋转 / rotate around arbitrary axis |
| `M.makeScale(sx,sy,sz)` | 构造缩放矩阵 / build scale matrix |
| `M.multiply(N)` | `this = this × N` |
| `M.multiplyMatrices(A,B)` | `this = A × B` |
| `M.premultiply(N)` | `this = N × this` |
| `M.copy(N)` | 复制 / copy |
| `M.invert()` | 求逆（就地）/ invert (in place) |
| `M.transpose()` | 转置 / transpose |
| `M.compose(pos, quat, scale)` | 由位置/旋转/缩放组合 / compose from pos/quat/scale |
| `M.decompose(pos, quat, scale)` | 分解 / decompose |
| `object.matrix` / `matrixWorld` | 局部/世界矩阵 / local / world matrix |
| `object.updateMatrix()` / `updateMatrixWorld()` | 手动更新 / manual update |
| `object.localToWorld(v)` / `worldToLocal(v)` | 坐标转换 / coordinate conversion |
| `v.applyMatrix4(M)` | 向量变换 / vector transform |
| `camera.matrixWorldInverse` | 视图矩阵 / view matrix |
| `camera.projectionMatrix` | 投影矩阵 / projection matrix |

## 数学/原理 / Math & Principles

### 4×4 齐次变换矩阵结构 / 4×4 Homogeneous Transform Structure

```
┌                       ┐
│  R(3×3)    t(3×1)     │   R = 旋转+缩放子矩阵 / rotation+scale submatrix
│                         │   t = 平移列 / translation column
│  0  0  0    1          │
└                       ┘
```

### 平移矩阵 / Translation

```
T(x,y,z) = ┌ 1 0 0 x ┐
           │ 0 1 0 y │
           │ 0 0 1 z │
           └ 0 0 0 1 ┘
```

### 绕 X 轴旋转 / Rotation around X

```
Rx(θ) = ┌ 1    0       0      0 ┐
        │ 0  cosθ   -sinθ    0 │
        │ 0  sinθ    cosθ    0 │
        └ 0    0       0      1 ┘
```

### 缩放矩阵 / Scale

```
S(sx,sy,sz) = ┌ sx  0   0   0 ┐
              │ 0  sy   0   0 │
              │ 0   0  sz   0 │
              └ 0   0   0   1 ┘
```

### 组合顺序 / Composition Order

Three.js 物体最终矩阵：

```
M_model = T(position) × R(rotation) × S(scale)
```

作用在顶点 `v` 上（列向量在右）：

```
v_world = M_model × v_local
        = T × R × S × v_local   ← 先缩放 v，再旋转，再平移
```

注意：**矩阵乘法从右往左作用**。`T × R × S` 表示顶点先被 S 处理。

Note: **matrix multiplication applies right-to-left**. `T × R × S` means the vertex is processed by S first.

### 视图矩阵 / View Matrix

视图矩阵是相机世界矩阵的逆：

```
viewMatrix = inverse(camera.matrixWorld) = camera.matrixWorldInverse
```

### 投影矩阵 / Projection Matrix

透视投影矩阵（简化）：

```
P_perspective:
  [2n/(r-l)    0          (r+l)/(r-l)        0          ]
  [0           2n/(t-b)   (t+b)/(t-b)        0          ]
  [0           0          -(f+n)/(f-n)       -2fn/(f-n) ]
  [0           0          -1                 0          ]
```

### MVP 组合 / MVP Composition

```
gl_Position = projectionMatrix × viewMatrix × modelMatrix × vec4(position, 1.0)
            = P × V × M × v
```

### 绕任意点旋转 / Rotation Around Pivot

```
M = T(pivot) × R × T(-pivot)
```

## 常见陷阱 / Common Pitfalls

1. **以为矩阵乘法可交换 / Assuming matrix mult is commutative**：`T×R ≠ R×T`，旋转中心因此不同。 / `T×R ≠ R×T`; rotation center differs.
2. **绕非原点旋转出错 / Wrong rotation center**：直接 `mesh.rotation.y += a` 是绕自身原点(局部0,0,0)转。要绕外部点必须用 pivot Group 或 `T(p)×R×T(-p)`。 / Direct rotation is around local origin; use pivot Group or matrix trick for external points.
3. **忘了 `updateMatrixWorld`**：手动读取子节点 `matrixWorld` 前必须强制更新，否则拿到上一帧的值。 / Force update before reading `matrixWorld` or you get last frame's value.
4. **`applyMatrix4` 后 `position` 不变 / `position` unchanged after `applyMatrix4`**：`applyMatrix4` 直接改 `matrix`，要同步到 `position` 需 `decompose`。 / `applyMatrix4` edits `matrix`; use `decompose` to sync `position`.
5. **`matrixAutoUpdate` 冲突 / Auto-update conflict**：手动改 `matrix` 但没关 `matrixAutoUpdate`，下一帧被覆盖。 / Manual matrix edits get overwritten if `matrixAutoUpdate` stays true.
6. **混淆 `multiply` 和 `premultiply`**：`A.multiply(B)` 是 `A=A×B`；`A.premultiply(B)` 是 `A=B×A`。方向相反。 / `multiply` vs `premultiply` produce opposite orders.
7. **缩放为负导致法线翻转 / Negative scale flips normals**：`scale(-1,1,1)` 会让背面变正面，光照异常，需 `material.side = DoubleSide`。 / Negative scale flips winding; use `DoubleSide`.
8. **视图矩阵方向反 / View matrix direction**：视图矩阵把世界搬到相机空间，相机看向 -Z。 / View matrix moves world into camera space; camera looks down -Z.

## 调试技巧 / Debugging Tips

- 用 `console.log(M.elements)` 输出 16 个数（列主序）。 / Output 16 elements (column-major).
- 把矩阵以文本形式 overlay 到屏幕上，实时观察变化（见示例）。 / Overlay matrix as text on screen (see example).
- 用 `AxesHelper` 和 `ArrowHelper` 可视化物体局部坐标系，确认旋转效果。 / Use `AxesHelper` to visualize local axes.
- `M.decompose(pos, quat, scale)` 把矩阵拆回 position/rotation/scale，对照预期。 / Decompose to verify expected values.
- 父子链问题：临时隐藏父节点，单独调试子节点局部变换。 / Hide parent to debug child in isolation.
- 用 `matrixWorld` 与手动 `localToWorld` 结果对比，验证理解。 / Compare `matrixWorld` with `localToWorld`.

## 练习 / Exercises

1. 用矩阵乘法分别实现"先平移再旋转"和"先旋转再平移"，观察结果差异。 / Implement both orders and observe the difference.
2. 让一个立方体绕一个外部 pivot 点做圆周运动（用 `T(p)×R×T(-p)`）。 / Make a cube orbit an external pivot using the matrix trick.
3. 建立父子节点，旋转父节点，观察子节点世界坐标变化。 / Build parent-child; rotate parent; observe child's world coords.
4. 用 `compose` 和 `decompose` 互逆验证矩阵结构。 / Verify `compose`/`decompose` round-trip.
5. 关闭 `matrixAutoUpdate`，手动用 `applyMatrix4` 做累积变换。 / Disable auto-update and accumulate transforms via `applyMatrix4`.
6. 把世界坐标用 `worldToLocal` 转到物体局部，验证数值正确。 / Convert world to local with `worldToLocal` and verify.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/03-matrices/index.html`](../../examples/03-matrices/index.html)

核心片段 / Core snippet:

```js
// pivot group：子立方体绕 pivot 旋转 / child cube orbits the pivot
const pivot = new THREE.Group();
pivot.position.set(0, 0, 0); // 旋转中心 / rotation center
scene.add(pivot);

const cube = new THREE.Mesh(boxGeo, boxMat);
cube.position.set(2, 0, 0); // 局部偏移 / local offset (orbit radius)
pivot.add(cube);

// 旋转 pivot → cube 绕原点公转 / rotating pivot orbits the cube
pivot.rotation.y += delta * 0.8;
// cube 自转 / cube self-rotation
cube.rotation.x += delta * 1.2;

pivot.updateMatrixWorld(true);

// 把矩阵显示到屏幕 / display matrix on screen
const m = cube.matrixWorld; // 16 个数 / 16 elements
overlay.textContent = matrixToText(m);

// 顺序对比：手动构造 vs 直接属性 / order comparison
const T = new THREE.Matrix4().makeTranslation(2, 0, 0);
const R = new THREE.Matrix4().makeRotationY(angle);
// A: 先平移再旋转 = R × T (绕原点旋转平移后的位置)
const mA = new THREE.Matrix4().multiplyMatrices(R, T);
// B: 先旋转再平移 = T × R (自转后整体平移)
const mB = new THREE.Matrix4().multiplyMatrices(T, R);
```

## 参考资源 / References

- [Three.js Docs - Matrix4](https://threejs.org/docs/#api/en/math/Matrix4)
- [Three.js Docs - Object3D.matrix](https://threejs.org/docs/#api/en/core/Object3D.matrix)
- [Three.js Manual - Matrix transformations](https://threejs.org/manual/#en/math)
- [LearnOpenGL - Coordinate Systems](https://learnopengl.com/Getting-started/Coordinate-Systems)
- [Song Ho - OpenGL Transformation](http://www.songho.ca/opengl/gl_transform.html)
- [3D Math Primer - Chapter 4 Matrices](https://gamemath.com/book/matrixbasics.html)

# 判断是否真正掌握：15 个自测题 / 15 Mastery Self-Check Questions

> 阶段 / Phase: 自我评估 / Self-Assessment
> 预计用时 / Estimated: 持续 / Ongoing
> 难度 / Difficulty: Advanced

## 概述 / Overview

当你能独立回答以下 15 个问题时，才算真正进入 Three.js 高级阶段。这些问题不是死记硬背的 API，而是对底层原理、渲染管线、性能、工程化的深度理解。每题附有详细的双语解答、关键 API 参考和相关课程链接。

When you can independently answer these 15 questions, you've truly reached the advanced level of Three.js. These aren't API memorization — they test deep understanding of underlying principles, the render pipeline, performance, and engineering. Each question includes a detailed bilingual answer, key API references, and related lesson links.

---

## 问题 1：为什么透明物体会出现排序错误？ / Q1: Why Do Transparent Objects Have Sorting Errors?

### 解答 / Answer

Three.js 对不透明物体从前向后排序渲染（利用深度测试减少过度绘制），但对透明物体必须从后向前渲染——因为透明物体需要混合（blending），后渲染的物体要和前面已渲染的物体混合。如果顺序错误，混合结果就不对。

Three.js renders opaque objects front-to-back (leveraging depth testing to reduce overdraw), but transparent objects must be rendered back-to-front — because transparency requires blending, and later-rendered objects blend with what's already drawn. If the order is wrong, the blend result is incorrect。

问题在于 Three.js 的透明排序是基于物体中心点到相机的距离（`object.position`），而不是像素级的深度。当两个透明物体相交或包围盒重叠时，按中心点排序可能错误。此外，单个物体内部的三角形也不排序——一个半透明球体自身就会有排序问题。

The problem is Three.js sorts transparent objects by the distance from their center point (`object.position`) to the camera, not per-pixel depth. When two transparent objects intersect or their bounding boxes overlap, center-based sorting can be wrong. Additionally, triangles within a single object aren't sorted — a semi-transparent sphere has internal sorting issues。

**解决方法 / Solutions:**
- 尽量减少透明物体数量 / minimize transparent object count
- 让透明物体不相交 / prevent transparent objects from intersecting
- 使用 `alphaTest` 代替 `transparent`（硬边透明，如树叶）/ use `alphaTest` instead of `transparent` (hard-edge transparency, e.g. foliage)
- `material.depthWrite = false` 让透明物体不写深度（但会加剧排序问题）/ `depthWrite = false` prevents depth writing (but worsens sorting)
- 使用 `Order Independent Transparency`（OIT）技术（如 Weighted Blended OIT）/ use OIT techniques (e.g., Weighted Blended OIT)

**关键 API / Key APIs:** `material.transparent`, `material.alphaTest`, `material.depthWrite`, `object.renderOrder`
**相关课程 / Related Lesson:** [材质 / Material](../02-core-objects/03-material.md)

---

## 问题 2：为什么模型从 Blender 导入后方向不对？ / Q2: Why Are Models Oriented Wrong After Blender Export?

### 解答 / Answer

Blender 使用 Z 轴向上的右手坐标系（Z 是"上"，Y 是"前/后"），而 Three.js 使用 Y 轴向上的右手坐标系（Y 是"上"，Z 是"前/后"）。导出 glTF 时，Blender 默认会应用一个 -90° X 轴旋转来转换坐标系，但如果导出设置不对（如勾选了"+Y Up"但应用方式错误），或者模型在 Blender 内部就没有对齐，导入后就会出现朝向错误。

Blender uses a Z-up right-handed coordinate system (Z is "up", Y is "forward/back"), while Three.js uses a Y-up right-handed system (Y is "up", Z is "forward/back"). On glTF export, Blender applies a -90° X-axis rotation by default to convert coordinate systems, but if export settings are wrong (e.g., "+Y Up" checked but applied incorrectly), or if the model wasn't aligned inside Blender, the orientation will be wrong after import。

**解决方法 / Solutions:**
- 在 Blender 中导出时确保勾选 "+Y Up" / ensure "+Y Up" is checked on Blender export
- 导出前在 Blender 中将模型旋转到正确朝向并 `Apply Rotation` (Ctrl+A → Rotation)
- 导入 Three.js 后用 `gltf.scene.rotation.x = -Math.PI / 2` 修正 / fix in Three.js with rotation
- 或用 `gltf.scene.traverse(child => { child.rotation.x = -Math.PI/2 })` 递归修正
- 最佳实践：在 Blender 中建模时就对齐 Y-up，避免导出后修正

glTF 规范本身规定 Y-up，所以问题通常出在 Blender 导出设置或建模阶段没对齐。检查 `GLTFLoader` 导入的 `scene.rotation` 是否非零，可以判断导出时是否加了旋转。

The glTF spec itself mandates Y-up, so the issue usually lies in Blender export settings or modeling without alignment. Checking `scene.rotation` after `GLTFLoader` import reveals if a rotation was baked in。

**关键 API / Key APIs:** `GLTFLoader`, `object.rotation`, Blender "+Y Up" export option
**相关课程 / Related Lesson:** [glTF 工作流 / glTF Workflow](../03-models-animation-interaction/01-gltf-workflow.md)

---

## 问题 3：为什么阴影边缘抖动或出现条纹？ / Q3: Why Do Shadow Edges Jitter or Show Banding?

### 解答 / Answer

阴影的本质是从光源视角渲染一张深度图（shadow map），然后在主相机渲染时比较片元到光源的距离与 shadow map 中的深度。如果距离大于 shadow map 记录的值，说明该点被遮挡，在阴影中。阴影条纹（shadow acne）是因为 shadow map 分辨率有限，在斜面上多个片元采样到同一个 shadow texel，有的判定为照亮、有的判定为阴影，形成交替条纹。

Shadows work by rendering a depth map (shadow map) from the light's perspective, then comparing each fragment's distance to the light against the shadow map during the main render. If the distance exceeds the stored depth, the fragment is occluded — in shadow. Shadow acne occurs because shadow map resolution is finite; on slanted surfaces, multiple fragments sample the same shadow texel, some判定 lit and some shadowed, creating alternating bands。

**解决方法 / Solutions:**
- `light.shadow.bias = -0.0001`（负值偏移，让阴影往物体内部偏）/ negative bias shifts shadow inward
- `light.shadow.normalBias = 0.02`（沿法线偏移，更适合曲面）/ normal bias, better for curved surfaces
- 增大 `light.shadow.mapSize`（如 2048×2048）/ increase shadow map resolution
- 缩小 `light.shadow.camera` 的 frustum 范围（越紧越精确）/ tighten shadow camera frustum
- `renderer.shadowMap.type = THREE.PCFSoftShadowMap`（柔和阴影）/ use soft shadows

抖动（jitter）通常发生在移动物体时，因为 shadow map 每帧重新渲染，分辨率不足导致边缘像素在照亮/阴影间跳变。增大 mapSize 和缩小 frustum 是最有效的解法。

Jitter typically happens when objects move — the shadow map is re-rendered each frame, and insufficient resolution causes edge pixels to flicker between lit and shadowed. Increasing mapSize and tightening the frustum are the most effective fixes。

**关键 API / Key APIs:** `light.shadow.bias`, `light.shadow.normalBias`, `light.shadow.mapSize`, `light.shadow.camera`, `renderer.shadowMap.type`
**相关课程 / Related Lesson:** [灯光与阴影 / Lighting & Shadow](../02-core-objects/05-lighting-shadow.md)

---

## 问题 4：`matrixWorld` 是什么时候更新的？ / Q4: When Is `matrixWorld` Updated?

### 解答 / Answer

Three.js 的 `Object3D` 有两个关键矩阵：`matrix`（局部变换，由 position/rotation/scale 组合）和 `matrixWorld`（世界变换，等于父节点 `matrixWorld` × 自身 `matrix`）。`matrixWorld` 不是实时更新的——它在 `renderer.render(scene, camera)` 内部调用 `scene.updateMatrixWorld()` 时才更新。

Three.js's `Object3D` has two key matrices: `matrix` (local transform, composed from position/rotation/scale) and `matrixWorld` (world transform, = parent's `matrixWorld` × own `matrix`). `matrixWorld` is NOT updated in real-time — it's updated when `renderer.render(scene, camera)` internally calls `scene.updateMatrixWorld()`。

这意味着如果你在 `render` 之前手动读取 `object.matrixWorld`，可能拿到的是上一帧的值。如果你修改了 `object.position` 后立即需要正确的 `matrixWorld`，必须手动调用 `object.updateMatrixWorld()` 或 `object.updateMatrix()`。

This means if you read `object.matrixWorld` before `render`, you may get last frame's value. If you modify `object.position` and need the correct `matrixWorld` immediately, you must manually call `object.updateMatrixWorld()` or `object.updateMatrix()`。

```js
object.position.x = 5;
// 此时 matrixWorld 还是旧的 / matrixWorld is still stale here
object.updateMatrixWorld(); // 强制更新 / force update
console.log(object.matrixWorld); // 现在是正确的 / now correct
```

还有一个细节：如果 `object.matrixAutoUpdate = true`（默认），`updateMatrixWorld()` 会先调用 `updateMatrix()`（从 position/rotation/scale 重建 `matrix`），再乘以父节点。设为 `false` 则跳过，你需手动管理 `matrix`——这在动画大量物体时可省 CPU。

Also: if `object.matrixAutoUpdate = true` (default), `updateMatrixWorld()` first calls `updateMatrix()` (rebuilds `matrix` from position/rotation/scale), then multiplies by parent. Setting it `false` skips this — you manage `matrix` manually, saving CPU when animating many objects。

**关键 API / Key APIs:** `object.matrix`, `object.matrixWorld`, `object.updateMatrix()`, `object.updateMatrixWorld()`, `object.matrixAutoUpdate`
**相关课程 / Related Lesson:** [矩阵变换 / Matrices](../01-math-fundamentals/03-matrices.md), [Scene Graph](../02-core-objects/01-scene-graph.md)

---

## 问题 5：`normalMatrix` 为什么是逆转置矩阵？ / Q5: Why Is `normalMatrix` the Inverse-Transpose?

### 解答 / Answer

法线是方向向量，不是位置向量。当你对顶点位置做 `M` 变换（model matrix）时，法线不能直接用 `M` 变换——因为如果 `M` 包含非均匀缩放（如 x 轴缩放 2 倍），直接用 `M` 变换法线会让法线不再垂直于表面。

Normals are direction vectors, not position vectors. When you transform vertex positions with matrix `M` (model matrix), normals can't be transformed with `M` directly — if `M` contains non-uniform scaling (e.g., 2× on x-axis), transforming the normal with `M` would make it no longer perpendicular to the surface。

数学推导：法线 `n` 垂直于切线 `t`，即 `n·t = 0`（`nᵀt = 0`）。变换后切线 `t' = Mt`。我们需要找到矩阵 `G` 使得 `n' = Gn` 仍垂直于 `t'`，即 `(Gn)ᵀ(Mt) = 0`，展开得 `nᵀGᵀMt = 0`。因为 `nᵀt = 0`，所以需要 `GᵀM = I`，即 `Gᵀ = M⁻¹`，所以 `G = (M⁻¹)ᵀ = (Mᵀ)⁻¹`——这就是逆转置矩阵。

Math: normal `n` is perpendicular to tangent `t`, i.e., `n·t = 0` (`nᵀt = 0`). After transform, tangent `t' = Mt`. We need matrix `G` such that `n' = Gn` remains perpendicular to `t'`: `(Gn)ᵀ(Mt) = 0` → `nᵀGᵀMt = 0`. Since `nᵀt = 0`, we need `GᵀM = I`, i.e., `Gᵀ = M⁻¹`, so `G = (M⁻¹)ᵀ = (Mᵀ)⁻¹` — the inverse-transpose。

如果只有均匀缩放和旋转（无非均匀缩放），逆转置就等于原矩阵的上 3×3 部分，所以可以直接用 `mat3(modelMatrix)`。Three.js 的 `normalMatrix` 是 `modelViewMatrix` 的逆转置的 3×3 部分，在着色器中自动提供。

If there's only uniform scaling and rotation (no non-uniform scaling), the inverse-transpose equals the upper 3×3 of the original matrix, so `mat3(modelMatrix)` works. Three.js's `normalMatrix` is the 3×3 inverse-transpose of `modelViewMatrix`, automatically provided in shaders。

**关键 API / Key APIs:** `normalMatrix` (shader uniform), `Matrix4.invert()`, `Matrix3.getNormalMatrix()`
**相关课程 / Related Lesson:** [矩阵变换 / Matrices](../01-math-fundamentals/03-matrices.md), [GLSL 基础 / GLSL Basics](../04-shader-gpu/02-glsl-basics.md)

---

## 问题 6：为什么同样的动画在 60Hz 和 144Hz 上速度不同？ / Q6: Why Does the Same Animation Run at Different Speeds on 60Hz vs 144Hz?

### 解答 / Answer

如果你写的动画是 `object.rotation.y += 0.01`，那么每帧加 0.01。在 60Hz 显示器上每秒 60 帧，每秒转 0.6 弧度；在 144Hz 显示器上每秒 144 帧，每秒转 1.44 弧度——快了 2.4 倍。这是因为动画速度依赖帧率，而不是真实时间。

If you write `object.rotation.y += 0.01`, you add 0.01 per frame. On a 60Hz display (60 fps), that's 0.6 rad/s; on 144Hz (144 fps), it's 1.44 rad/s — 2.4× faster. This is because animation speed depends on frame rate, not real time。

**正确做法 / Correct approach:** 使用 `delta`（帧间隔时间）：

```js
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta(); // 上一帧到现在的秒数 / seconds since last frame
  object.rotation.y += angularSpeed * delta; // 角速度 × 时间 = 角度 / angular speed × time = angle
}
```

这样无论 60Hz 还是 144Hz，每秒转的角度都是 `angularSpeed` 弧度，速度一致。

This way, regardless of 60Hz or 144Hz, the rotation per second is `angularSpeed` radians — consistent。

注意 `delta` 可能不稳定（如切 tab 回来后 `delta` 很大），应钳制：`delta = Math.min(delta, 0.1)`。对于物理模拟，还需要固定时间步长（fixed timestep）以保证稳定性。

Note `delta` can be unstable (e.g., large after tab switch); clamp it: `delta = Math.min(delta, 0.1)`. For physics simulation, use a fixed timestep for stability。

**关键 API / Key APIs:** `THREE.Clock.getDelta()`, `THREE.Clock.getElapsedTime()`, `renderer.setAnimationLoop()`
**相关课程 / Related Lesson:** [渲染循环 / Render Loop](../02-core-objects/06-render-loop.md)

---

## 问题 7：为什么一个场景只有 20 万个三角形却很卡？ / Q7: Why Is a Scene with Only 200k Triangles Laggy?

### 解答 / Answer

三角形数不是唯一的性能指标。20 万三角形本身对现代 GPU 毫无压力（百万级才需要关注），卡顿通常来自以下原因：

Triangle count isn't the only performance metric. 200k triangles is trivial for modern GPUs (millions before concern); lag usually comes from:

1. **Draw Call 过多 / Too many draw calls:** 如果 20 万三角形分散在 5000 个小 Mesh 中，就是 5000 个 draw call。每个 draw call 有 CPU 开销（状态设置、uniform 上传），5000 个在中端设备上就卡。用 `InstancedMesh` 或 `mergeGeometries` 合并到几十个 draw call。
2. **透明物体过多 / Too many transparent objects:** 透明物体需要从后向前排序，且无法利用深度测试提前剔除。大量透明粒子是最常见的卡顿源。
3. **阴影 / Shadows:** 阴影会让 draw call 翻倍（从光源视角再渲染一遍）。如果多个光源都投射阴影，draw call × 光源数。
4. **Shader 过于复杂 / Overly complex shaders:** 如果每个片元执行大量计算（多次纹理采样、循环、噪声），像素负载就高。
5. **过度绘制 / Overdraw:** 大量透明物体或重叠物体导致同一像素被反复绘制。
6. **CPU 瓶颈 / CPU bottleneck:** 每帧在 JS 中遍历大量对象、更新矩阵、做物理计算。

诊断方法：看 `renderer.info.render.calls`——如果 calls 远大于预期，就是 draw call 问题。用 Chrome Performance 录制看 CPU 热点。

Diagnosis: check `renderer.info.render.calls` — if far more than expected, it's a draw call issue. Use Chrome Performance to find CPU hotspots。

**关键 API / Key APIs:** `renderer.info`, `InstancedMesh`, `mergeGeometries()`, Chrome Performance
**相关课程 / Related Lesson:** [性能优化 / Performance](../06-performance/01-performance.md)

---

## 问题 8：为什么大量小 Mesh 比一个大 Mesh 更慢？ / Q8: Why Are Many Small Meshes Slower Than One Big Mesh?

### 解答 / Answer

因为 draw call 的 CPU 开销不在于三角形数，而在于 draw call 数量本身。每个 draw call 需要：JavaScript 遍历场景树找到该 Mesh → 准备 shader program → 上传 uniform（modelMatrix、viewMatrix、projectionMatrix 等）→ 设置渲染状态（blend、depth、cull）→ 调用 `gl.drawElements`。这些 CPU 工作量与三角形数无关。

Because draw call CPU overhead doesn't depend on triangle count, but on the number of draw calls. Each draw call requires: JS scene tree traversal to find the Mesh → prepare shader program → upload uniforms (modelMatrix, viewMatrix, projectionMatrix, etc.) → set render state (blend, depth, cull) → call `gl.drawElements`. This CPU work is independent of triangle count。

```text
100 个 1000 三角形 Mesh = 100 draw calls:
  CPU: 100 × (遍历 + uniform 上传 + 状态设置 + 提交) ≈ 100 × 0.1ms = 10ms

1 个 100000 三角形 Mesh = 1 draw call:
  CPU: 1 × (遍历 + uniform 上传 + 状态设置 + 提交) ≈ 0.1ms

GPU: 两者都是 100000 三角形，GPU 耗时几乎相同
```

GPU 处理 10 万三角形和 100 个 1000 三角形几乎一样快——GPU 的并行度极高。瓶颈在 CPU 端的 draw call 准备。所以 `InstancedMesh`（1 个 draw call 渲染 N 个相同几何体）和 `mergeGeometries`（合并成一个几何体）能大幅提升性能。

The GPU processes 100k triangles and 100×1000 triangles nearly equally fast — GPUs have massive parallelism. The bottleneck is CPU-side draw call preparation. So `InstancedMesh` (1 draw call for N identical geometries) and `mergeGeometries` (merge into one geometry) dramatically improve performance。

**关键 API / Key APIs:** `InstancedMesh`, `mergeGeometries()`, `renderer.info.render.calls`
**相关课程 / Related Lesson:** [性能优化 / Performance](../06-performance/01-performance.md)

---

## 问题 9：为什么调用 `remove()` 后显存没有下降？ / Q9: Why Doesn't VRAM Drop After `remove()`?

### 解答 / Answer

`scene.remove(mesh)` 只是把 Mesh 对象从 Three.js 的场景树中移除，使它不再参与渲染遍历。但 Mesh 引用的 `geometry`（GPU 顶点缓冲）和 `material`（shader program、纹理）仍然存在于 GPU 显存中——因为 Three.js 不知道你是否还会用它们，所以不会自动释放。

`scene.remove(mesh)` only removes the Mesh from Three.js's scene tree so it's no longer traversed for rendering. But the `geometry` (GPU vertex buffers) and `material` (shader programs, textures) referenced by the Mesh still exist in GPU VRAM — Three.js doesn't know if you'll use them again, so it doesn't auto-release。

这是最常见的 Three.js 内存泄漏。正确做法是手动 `dispose()`：

This is the most common Three.js memory leak. The correct approach is manual `dispose()`:

```js
scene.remove(mesh);
mesh.geometry.dispose();  // 释放 GPU 顶点缓冲 / free GPU vertex buffers
mesh.material.dispose();  // 释放 shader program / free shader program
// 如果材质有纹理，也要释放 / if material has textures, dispose them too
for (const key in mesh.material) {
  if (mesh.material[key]?.isTexture) mesh.material[key].dispose();
}
```

`renderer.info.memory.geometries` 和 `renderer.info.memory.textures` 可以验证是否真正释放——dispose 后这两个值应减少。

`renderer.info.memory.geometries` and `renderer.info.memory.textures` verify actual release — these should decrease after dispose。

注意：`geometry` 和 `material` 如果被多个 Mesh 共享，dispose 一个会影响所有共享者。共享时要确认所有使用者都不再需要。

Note: if `geometry`/`material` are shared by multiple Meshes, disposing one affects all sharers. Confirm all users are done before disposing shared resources。

**关键 API / Key APIs:** `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.info.memory`
**相关课程 / Related Lesson:** [性能优化 / Performance](../06-performance/01-performance.md), [工程化与架构 / Architecture](../07-engineering-architecture/01-architecture.md)

---

## 问题 10：为什么法线贴图需要切线空间？ / Q10: Why Do Normal Maps Need Tangent Space?

### 解答 / Answer

法线贴图存储的是"扰动后的法线"——相对于表面局部坐标系的法线方向，而不是世界坐标法线。这个局部坐标系就是"切线空间（Tangent Space）"，由三个基向量定义：Tangent（切线，沿 UV 的 U 方向）、Bitangent（副切线，沿 V 方向）和 Normal（法线）。法线贴图中的 RGB 值编码的是在这个空间中的法线方向。

Normal maps store "perturbed normals" — normals relative to the surface's local coordinate system, not world-space normals. This local system is "Tangent Space," defined by three basis vectors: Tangent (along UV's U direction), Bitangent (along V direction), and Normal. The RGB values in a normal map encode the normal direction in this space。

为什么不用世界空间？因为法线贴图是在建模时烘焙的，模型会移动、旋转、变形。如果法线贴图存储世界空间法线，模型一动就不对了。切线空间是"跟随表面"的——无论模型怎么变换，法线贴图都正确。同一个法线贴图还能复用到不同模型上。

Why not world space? Because normal maps are baked during modeling, and the model moves, rotates, deforms. If the normal map stored world-space normals, it'd be wrong as soon as the model moves. Tangent space "follows the surface" — regardless of transform, the normal map stays correct. The same normal map can also be reused on different models。

在着色器中，需要将切线空间法线转换到世界空间（或视图空间）做光照计算。这需要 TBN 矩阵（Tangent-Bitangent-Normal），由几何体的 tangent、normal attribute 构建。Three.js 的 `MeshStandardMaterial` 会自动处理，但自定义 `ShaderMaterial` 需要手动构建 TBN 矩阵。

In shaders, you need to convert tangent-space normals to world/view space for lighting. This requires the TBN matrix (Tangent-Bitangent-Normal), built from the geometry's tangent and normal attributes. Three.js's `MeshStandardMaterial` handles this automatically, but custom `ShaderMaterial` requires manual TBN construction。

**关键 API / Key APIs:** `geometry.attributes.tangent`, `geometry.computeTangents()`, TBN matrix in shaders
**相关课程 / Related Lesson:** [Geometry](../02-core-objects/02-geometry.md), [GLSL 基础 / GLSL Basics](../04-shader-gpu/02-glsl-basics.md)

---

## 问题 11：为什么 Bloom 会让整个画面发白？ / Q11: Why Does Bloom Make the Whole Image White?

### 解答 / Answer

Bloom 的工作原理是：提取画面中亮于阈值的区域 → 模糊 → 叠加回原图。如果阈值设得太低（如 0），整屏都"亮"，模糊后叠加回来就让所有区域都变亮，最终发白。

Bloom works by: extracting regions brighter than a threshold → blurring → adding back to the original. If the threshold is too low (e.g., 0), the entire screen is "bright," blurring and adding back makes everything brighter, eventually washing out to white。

常见原因 / Common causes:
1. **`threshold` 太低 / threshold too low:** `UnrealBloomPass` 的 threshold 设为 0 或接近 0，所有像素都参与发光。
2. **缺少 `OutputPass` / missing OutputPass:** Bloom 在线性 HDR 空间计算，如果没有 `OutputPass` 做色调映射和 sRGB 转换，颜色会过亮。
3. **`strength` 过高 / strength too high:** 叠加量太大。
4. **材质 `emissive` 过强 / emissive too strong:** 如果所有物体都有高 emissive，整屏都亮。
5. **颜色空间错误 / wrong color space:** 如果纹理 colorSpace 设错（如 sRGB 当 linear），亮度计算失真。

**解决方法 / Solutions:**
- `threshold` 设 0.6–1.0（只有真正亮的区域发光）/ set threshold 0.6–1.0
- 必须在 Pass 链末尾加 `OutputPass` / always add `OutputPass` at end of chain
- `strength` 适度（0.5–1.5）/ moderate strength
- 使用 `HalfFloatType` render target（HDR）/ use HDR render target
- 确认 `texture.colorSpace = THREE.SRGBColorSpace`（颜色贴图）/ verify color space

**关键 API / Key APIs:** `UnrealBloomPass(strength, radius, threshold)`, `OutputPass`, `WebGLRenderTarget(type: HalfFloatType)`
**相关课程 / Related Lesson:** [后处理 / Postprocessing](../04-shader-gpu/05-postprocessing.md)

---

## 问题 12：Raycaster 如何从二维鼠标生成三维射线？ / Q12: How Does Raycaster Generate a 3D Ray from a 2D Mouse?

### 解答 / Answer

鼠标给出的是屏幕像素坐标 `(clientX, clientY)`，需要经过三步转换变成三维射线：

The mouse gives screen pixel coordinates `(clientX, clientY)`, which go through three conversion steps to become a 3D ray:

**步骤 1：屏幕坐标 → NDC（Normalized Device Coordinates）**

```js
// NDC 范围 [-1, 1]，左下角 (-1,-1)，右上角 (1,1)
pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
pointer.y = -(event.clientY / window.innerHeight) * 2 + 1; // Y 翻转 / Y flipped
```

**步骤 2：NDC → 相机空间射线**

`Raycaster.setFromCamera(pointer, camera)` 内部做的是"反投影"：把 NDC 坐标用投影矩阵的逆变换转回相机空间。对于透视相机，射线原点是相机位置，方向是从相机穿过 NDC 点指向远处；对于正交相机，射线方向是相机朝向，原点根据 NDC 偏移。

`Raycaster.setFromCamera(pointer, camera)` internally does "unprojection": transforms NDC back to camera space using the inverse projection matrix. For perspective cameras, the ray origin is the camera position, direction from camera through the NDC point; for orthographic, direction is camera facing, origin offset by NDC。

**步骤 3：相机空间 → 世界空间**

射线再用相机的 `matrixWorld`（视图矩阵的逆）变换到世界空间，得到世界坐标中的射线 `origin` 和 `direction`。

The ray is then transformed by the camera's `matrixWorld` (inverse of view matrix) into world space, yielding world-space `origin` and `direction`。

```js
raycaster.setFromCamera(pointer, camera);
const intersects = raycaster.intersectObjects(objects, true);
// intersects[0].point — 世界空间交点 / world-space intersection point
// intersects[0].face.normal — 交点面法线 / intersection face normal
// intersects[0].distance — 原点到交点距离 / origin-to-point distance
```

射线与物体的求交测试：对 Mesh 的每个三角形做射线-三角形相交计算（Möller–Trumbore 算法）。`intersectObjects` 会返回所有交点，按距离排序。

Ray-object intersection: tests each triangle of the Mesh using the Möller–Trumbore algorithm. `intersectObjects` returns all intersections sorted by distance。

**关键 API / Key APIs:** `Raycaster.setFromCamera()`, `Raycaster.intersectObjects()`, `Raycaster.intersectObject()`
**相关课程 / Related Lesson:** [Raycaster 交互 / Raycaster Interaction](../03-models-animation-interaction/03-raycaster-interaction.md)

---

## 问题 13：WebGLRenderer 与 WebGPURenderer 应该如何选择？ / Q13: How to Choose Between WebGLRenderer and WebGPURenderer?

### 解答 / Answer

截至 2026 年，WebGLRenderer 仍然是兼容性最广的选择——几乎所有现代浏览器都支持。WebGPURenderer 在 Chrome 113+、Edge 113+、Safari 18+ 可用，Firefox 仍在推进。如果你的用户群体包含旧浏览器或 Firefox 用户，必须用 WebGLRenderer 或做回退。

As of 2026, WebGLRenderer remains the most compatible choice — virtually all modern browsers support it. WebGPURenderer is available in Chrome 113+, Edge 113+, Safari 18+, with Firefox still in progress. If your users include older browsers or Firefox users, you must use WebGLRenderer or implement fallback。

**选择 WebGPURenderer 的理由 / Reasons to choose WebGPURenderer:**
- 需要 Compute Shader（GPU 通用计算，如百万级粒子模拟）/ need compute shaders (GPGPU, e.g., million-particle simulation)
- 极低 CPU 开销需求（大量 draw call）/ very low CPU overhead needed (many draw calls)
- 想用 TSL 统一着色器写法（跨后端）/ want TSL unified shader writing (cross-backend)
- 目标用户都在支持的浏览器上 / target users are all on supported browsers

**选择 WebGLRenderer 的理由 / Reasons to choose WebGLRenderer:**
- 最大兼容性 / maximum compatibility
- 大量现有 GLSL shader 资产 / lots of existing GLSL shader assets
- 第三方库（R3F、drei 等）生态更成熟 / more mature third-party ecosystem
- 移动端支持更稳定 / more stable mobile support

**推荐策略 / Recommended strategy:**
用 Node Material + TSL 写材质（可在两个后端运行），运行时检测 WebGPU 支持并选择后端，失败回退 WebGL。这样一套材质代码，两个后端。

Use Node Material + TSL for materials (runs on both backends), detect WebGPU support at runtime and choose backend, falling back to WebGL. One material codebase, two backends。

**关键 API / Key APIs:** `WebGPURenderer`, `WebGLRenderer`, `navigator.gpu`, `requestAdapter()`, Node Material
**相关课程 / Related Lesson:** [WebGPU 与 TSL / WebGPU & TSL](../05-webgpu-tsl/01-webgpu-tsl.md)

---

## 问题 14：GLSL、Node Material 与 TSL 的关系是什么？ / Q14: What's the Relationship Between GLSL, Node Material, and TSL?

### 解答 / Answer

三者是 Three.js 着色器系统的三代演进，不是互斥的：

These three are successive generations of Three.js's shader system, not mutually exclusive:

**GLSL (ShaderMaterial / RawShaderMaterial):**
你直接写 GLSL 字符串。优点是完全控制、WebGL 原生。缺点是绑死 WebGL（WebGPU 用 WGSL），字符串无类型检查，难以复用组合。这是最底层的方式。

You write GLSL strings directly. Pros: full control, native to WebGL. Cons: locked to WebGL (WebGPU uses WGSL), no type checking on strings, hard to reuse/compose. This is the lowest-level approach。

**Node Material:**
你用 JS 对象（"节点"）描述材质数据流，Three.js 的节点编译器将其编译成 GLSL（WebGL）或 WGSL（WebGPU）。节点可以组合（`add`, `mul` 等），形成表达式树。优点是跨后端、可复用。`MeshStandardNodeMaterial` 是节点版的标准材质。

You describe material data flow with JS objects ("nodes"), and Three.js's node compiler compiles them to GLSL (WebGL) or WGSL (WebGPU). Nodes compose (`add`, `mul`, etc.) into an expression tree. Pros: cross-backend, reusable. `MeshStandardNodeMaterial` is the node-based standard material。

**TSL (Three.js Shading Language):**
TSL 是 Node Material 的语法糖——用 JS 函数式语法（`Fn()`, `vec3()`, `sin()` 等）构建节点，让表达式更像写代码。TSL 代码在运行时构建节点树，再由编译器生成 GLSL/WGSL。TSL 是推荐的新写法，但仍在快速迭代。

TSL is syntactic sugar for Node Material — uses JS functional syntax (`Fn()`, `vec3()`, `sin()`, etc.) to build nodes, making expressions more code-like. TSL code builds a node tree at runtime, which the compiler turns into GLSL/WGSL. TSL is the recommended new syntax, but still iterating fast。

```text
演进关系 / Evolution:

GLSL 字符串 (ShaderMaterial)
  → 节点对象 (Node Material)     ← 跨后端编译
    → TSL 函数式语法              ← 更自然的写法
      → 编译到 GLSL 或 WGSL
```

迁移策略：先用 Node Material 重写现有 ShaderMaterial（获得跨后端能力），再逐步用 TSL 语法简化。不是一次性替换。

Migration strategy: first rewrite existing ShaderMaterial with Node Material (gain cross-backend), then gradually simplify with TSL syntax. Not an all-at-once replacement。

**关键 API / Key APIs:** `ShaderMaterial`, `MeshStandardNodeMaterial`, `Fn()`, `three/nodes`, `three/tsl`
**相关课程 / Related Lesson:** [ShaderMaterial](../04-shader-gpu/03-shader-material.md), [WebGPU 与 TSL / WebGPU & TSL](../05-webgpu-tsl/01-webgpu-tsl.md)

---

## 问题 15：如何设计一个可销毁、可切换、可测试的 Three.js 场景模块？ / Q15: How to Design a Disposable, Switchable, Testable Scene Module?

### 解答 / Answer

核心是定义统一的 `SceneModule` 生命周期接口，让 SceneManager 能统一管理初始化、更新、缩放和销毁：

The core is defining a unified `SceneModule` lifecycle interface so SceneManager can uniformly manage init, update, resize, and dispose:

```ts
interface SceneModule {
  init(): Promise<void>;                          // 异步初始化（可加载资源）
  update(delta: number, elapsed: number): void;   // 每帧更新
  resize(width: number, height: number): void;    // 窗口缩放
  dispose(): void;                                 // 销毁，释放所有资源
}
```

**可销毁 (Disposable):**
`dispose()` 必须递归释放所有 geometry、material、texture、renderTarget。验证方法：dispose 后检查 `renderer.info.memory.geometries` 和 `textures` 是否归零。最容易遗漏的是：材质上的纹理、renderTarget、`InstancedMesh` 的 `instanceColor`。

`dispose()` must recursively release all geometry, material, texture, and renderTarget. Verification: after dispose, check `renderer.info.memory.geometries` and `textures` return to zero. Most commonly missed: textures on materials, renderTargets, `InstancedMesh.instanceColor`。

**可切换 (Switchable):**
SceneManager 维护当前场景模块，`switchTo(newModule)` 时先调用旧模块的 `dispose()`，再调用新模块的 `init()`。切换时不应有资源残留——用 `renderer.info` 验证。EventBus 事件也要在 dispose 中解绑。

SceneManager holds the current module; `switchTo(newModule)` calls old module's `dispose()` first, then new module's `init()`. No resource residue after switch — verify with `renderer.info`. EventBus subscriptions must be unsubscribed in dispose。

**可测试 (Testable):**
SceneModule 是纯 TypeScript 类，不依赖 Vue/React。可以在 Node 或 jsdom 环境中实例化，调用 `init()` / `update()` / `dispose()`，断言 `renderer.info.memory` 变化。测试不需要真实渲染——mock renderer 即可验证 dispose 逻辑。

SceneModule is a pure TypeScript class with no Vue/React dependency. It can be instantiated in Node or jsdom, calling `init()` / `update()` / `dispose()`, asserting `renderer.info.memory` changes. Testing doesn't need real rendering — mock the renderer to verify dispose logic。

```ts
// 测试示例 / test example
test('DemoWorld disposes all resources', async () => {
  const world = new DemoWorld(resources, eventBus);
  await world.init();
  const before = mockRenderer.info.memory.geometries;
  world.dispose();
  const after = mockRenderer.info.memory.geometries;
  expect(after).toBeLessThan(before);
  expect(after).toBe(0); // 归零 / back to zero
});
```

**引擎与 UI 解耦 / Decouple Engine from UI:**
Vue/React 组件只管 UI 状态（面板、表单、路由），通过 EventBus 或 Pinia 与引擎通信。引擎的 Experience 类管理渲染循环、场景切换、资源销毁——即使 UI 组件卸载，引擎也能正确清理。这是项目从"Demo"走向"产品"的关键架构。

Vue/React components only manage UI state (panels, forms, routing), communicating with the engine via EventBus or Pinia. The engine's Experience class manages the render loop, scene switching, and resource disposal — even if UI components unmount, the engine cleans up correctly. This is the key architecture for moving from "demo" to "product"。

**关键 API / Key APIs:** `SceneModule` interface, `SceneManager`, `EventBus`, `renderer.info.memory`, `geometry.dispose()`, `material.dispose()`
**相关课程 / Related Lesson:** [工程化与架构 / Engineering & Architecture](../07-engineering-architecture/01-architecture.md)

---

## 参考资源 / References

- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Manual](https://threejs.org/manual/)
- [Three.js Source Code](https://github.com/mrdoob/three.js)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [LearnOpenGL](https://learnopengl.com/)
- [Three.js Discourse](https://discourse.threejs.org/)
- [Discover Three.js](https://discoverthreejs.com/)

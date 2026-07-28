# 灯光与阴影 / Lighting & Shadows

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 3–4 小时 / 3–4 hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

灯光不是简单地"把场景变亮"。它参与材质计算：漫反射、高光、PBR 反射都依赖光源的方向、强度和颜色。不同光源类型（环境光、半球光、方向光、点光、聚光灯、面光源）有不同的物理模型和性能开销。阴影则是将光源视角的深度图渲染一次，再在主渲染中比较深度——理解阴影就是要理解"阴影就是第二个相机"。

Lighting is not simply "making the scene brighter." It participates in material calculation: diffuse, specular, and PBR reflection all depend on light direction, intensity, and color. Different light types (ambient, hemisphere, directional, point, spot, rect-area) have different physical models and costs. Shadows render a depth map from the light's perspective, then compare depths in the main pass—understanding shadows means understanding "a shadow is a second camera."

本节搭建一个阴影调试器：方向光 + 阴影，实时调整 shadow map 大小、bias、normal bias、相机范围，可视化阴影相机视锥，演示 shadow acne 与 peter-panning。

This lesson builds a shadow debugger: directional light + shadow, with live controls for shadow map size, bias, normal bias, and camera range, visualizing the shadow camera frustum and demonstrating shadow acne vs peter-panning.

## 核心概念 / Core Concepts

### 1. 光源类型 / Light Types

| 类型 / Type | 说明 / Description | 是否投射阴影 / Shadow | 性能 / Cost |
| --- | --- | --- | --- |
| `AmbientLight` | 环境光，均匀照亮所有物体，无方向 / uniform, no direction | 否 / No | 最低 / lowest |
| `HemisphereLight` | 半球光，天空色 + 地面色 / sky + ground color | 否 / No | 低 / low |
| `DirectionalLight` | 方行光（平行光），模拟太阳 / parallel rays, sun-like | 是 / Yes | 中 / medium |
| `PointLight` | 点光源，全向照射 / omnidirectional | 是 / Yes | 高（6 面 cube shadow）/ high |
| `SpotLight` | 聚光灯，锥形范围 / cone-shaped | 是 / Yes | 中-高 / medium-high |
| `RectAreaLight` | 面光源，矩形区域 / rectangular area | 否（r160 前）/ No | 高 / high |

```js
// 环境光：补暗部，不产生明暗对比 / ambient: fills shadows, no contrast
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// 半球光：天空色从上方，地面色从下方 / hemisphere: sky from above, ground from below
scene.add(new THREE.HemisphereLight(0x88aaff, 0x443322, 0.5));

// 方向光：模拟太阳，所有光线平行 / directional: parallel rays like the sun
const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(5, 10, 7);
dir.castShadow = true;
scene.add(dir);

// 点光源：全向衰减 / point: omnidirectional with attenuation
const point = new THREE.PointLight(0xff8844, 2, 10, 2);  // color, intensity, distance, decay
point.position.set(0, 3, 0);
scene.add(point);

// 聚光灯：锥形 + 半影 / spot: cone with penumbra
const spot = new THREE.SpotLight(0xffffff, 5, 20, Math.PI / 6, 0.3, 2);
// color, intensity, distance, angle, penumbra, decay
spot.position.set(0, 5, 0);
spot.target.position.set(0, 0, 0);
scene.add(spot, spot.target);
```

### 2. 灯光参与材质计算 / Lighting Participates in Material Calculation

```text
最终颜色 = 环境光贡献 + 漫反射(法线·光向) + 高光(反射·视向)
         + PBR 反射(环境贴图) + 自发光
```

- `MeshBasicMaterial` 不参与光照计算——无论什么灯都看起来一样。/ `MeshBasicMaterial` ignores all lights.
- `MeshLambertMaterial` 只计算漫反射。/ Lambert: diffuse only.
- `MeshPhongMaterial` 漫反射 + 高光。/ Phong: diffuse + specular.
- `MeshStandardMaterial`/`PhysicalMaterial` 完整 PBR。/ Full PBR.

> 没有灯光时，`MeshStandardMaterial` 看起来全黑（除非有 `envMap` 或 `emissive`）。/ Without lights, PBR materials are black (unless env/emissive).

### 3. 阴影原理 / Shadow Principles

阴影的本质：从光源位置渲染一遍场景的深度图（shadow map），主渲染时把每个片元转换到光源空间，比较深度。如果片元深度 > shadow map 中记录的深度，说明该点被遮挡，处于阴影中。

Shadow essence: render the scene's depth from the light's position (shadow map). In the main pass, convert each fragment to light space and compare depths. If the fragment's depth is greater than the shadow map's stored depth, it's occluded—in shadow.

```text
阴影 = 光源相机看不见的地方
shadow = where the light camera cannot see
```

```js
// 开启阴影 / enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // 软阴影 / soft shadows

// 光源投射阴影 / light casts shadow
dir.castShadow = true;

// 物体投射与接收阴影 / objects cast & receive
mesh.castShadow = true;
floor.receiveShadow = true;

// 阴影相机参数 / shadow camera params
dir.shadow.mapSize.set(2048, 2048);     // 阴影贴图分辨率 / shadow map resolution
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 50;
dir.shadow.camera.left = -10;
dir.shadow.camera.right = 10;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -10;
dir.shadow.bias = -0.0005;             // 阴影偏移 / shadow bias
dir.shadow.normalBias = 0.02;           // 法线偏移 / normal bias
```

### 4. 阴影相机 / Shadow Camera

方向光的阴影相机是 `OrthographicCamera`（平行投影），点光是 `PerspectiveCamera`（透视投影）。阴影相机定义了"阴影覆盖范围"——范围太大，shadow map 精度下降（阴影模糊）；范围太小，覆盖不到的物体没阴影。

Directional light's shadow camera is `OrthographicCamera`; point light's is `PerspectiveCamera`. The shadow camera defines the shadow coverage area—too large and shadow map precision drops (blurry shadows); too small and objects outside have no shadow.

```js
// 可视化阴影相机 / visualize shadow camera
const shadowHelper = new THREE.CameraHelper(dir.shadow.camera);
scene.add(shadowHelper);

// 更新阴影相机后必须更新 helper / update helper after changing camera
dir.shadow.camera.updateProjectionMatrix();
shadowHelper.update();
```

### 5. Shadow Acne 与 Peter-Panning

```text
Shadow Acne（阴影痘疤）：
  由于 shadow map 精度有限，自阴影深度比较出现条纹状伪影。
  原因：bias 太小（或为 0）。
  解决：增大 bias（负值）或 normalBias。

Peter-Panning（阴影脱离）：
  物体与阴影之间出现间隙，像悬浮。
  原因：bias 太大，把阴影推离了物体。
  解决：减小 bias。
```

```js
// 调试口诀 / debugging mantra:
// 条纹 → 增大 |bias| / stripes → increase |bias|
// 悬浮 → 减小 |bias| / floating → decrease |bias|
// 推荐：先用 normalBias 消除条纹，再用 bias 微调
```

### 6. 软阴影 / Soft Shadows

```js
renderer.shadowMap.type = THREE.PCFShadowMap;        // 硬阴影 / hard
renderer.shadowMap.type = THREE.PCFSoftShadowMap;    // PCF 软阴影（常用）/ soft (common)
renderer.shadowMap.type = THREE.VSMShadowMap;        // 方差阴影（更柔但可能有漏光）/ VSM (softer, may leak)
renderer.shadowMap.type = THREE.BasicShadowMap;      // 最基础 / basic
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `AmbientLight(color, intensity)` | 环境光 / ambient |
| `HemisphereLight(skyColor, groundColor, intensity)` | 半球光 / hemisphere |
| `DirectionalLight(color, intensity)` | 方向光 / directional |
| `PointLight(color, intensity, distance, decay)` | 点光源 / point |
| `SpotLight(color, intensity, distance, angle, penumbra, decay)` | 聚光灯 / spot |
| `RectAreaLight(color, intensity, width, height)` | 面光源 / rect area |
| `light.castShadow` | 是否投射阴影 / cast shadow |
| `light.shadow.mapSize` | 阴影贴图分辨率 / shadow map resolution |
| `light.shadow.camera` | 阴影相机（正交/透视）/ shadow camera |
| `light.shadow.bias` | 深度偏移 / depth bias |
| `light.shadow.normalBias` | 法线偏移 / normal bias |
| `light.shadow.radius` | PCF 软阴影半径 / PCF radius |
| `mesh.castShadow` / `receiveShadow` | 投射 / 接收阴影 / cast / receive |
| `renderer.shadowMap.enabled` | 全局阴影开关 / global shadow toggle |
| `renderer.shadowMap.type` | 阴影类型 / shadow type |
| `CameraHelper` | 可视化阴影相机 / visualize shadow camera |

## 原理 / Principles

### 阴影贴图的两步渲染 / Two-Pass Shadow Rendering

```text
Pass 1 — Shadow Map（从光源视角）:
  对每个投射阴影的光源，渲染一次场景深度图到 RenderTarget
  只写深度，不写颜色
  方向光 → 正交相机；点光 → 6 面立方体

Pass 2 — 主渲染（从相机视角）:
  对每个片元：
    1. 转换到光源空间 (lightViewProj × worldPos)
    2. 采样 shadow map 中对应位置的深度
    3. 如果 片元深度 > 记录深度 + bias → 在阴影中
    4. 用 PCF 等技术在相邻区域采样，做软阴影
```

### 为什么 shadow map 精度是核心矛盾 / Why Shadow Map Precision Is the Core Trade-off

Shadow map 分辨率固定（如 2048×2048），但阴影覆盖范围可变。范围越大，每个 texel 覆盖的世界空间越大，阴影越粗糙（出现 acne、块状边缘）。范围越小，精度越高，但超出范围的物体没有阴影。这就是为什么方向光阴影需要精确设置 `left/right/top/bottom` 来包围场景。

Shadow map resolution is fixed (e.g. 2048×2048) but coverage varies. Larger coverage = each texel covers more world space = coarser shadows (acne, blocky edges). Smaller coverage = higher precision but objects outside have no shadow. This is why directional shadow cameras need precise `left/right/top/bottom` bounds.

## 常见陷阱 / Common Pitfalls

1. **没开 `renderer.shadowMap.enabled` / Shadow not enabled**：`castShadow` 设了但全局没开。/ Set `castShadow` but forgot global enable.
2. **`castShadow`/`receiveShadow` 混淆 / Cast vs receive**：地板只设了 `castShadow` 没设 `receiveShadow`，地上没阴影。/ Floor set `castShadow` but not `receiveShadow`.
3. **Shadow acne / 痘疤**：`bias=0` 导致条纹。增大 `bias`（负值）或 `normalBias`。/ Zero bias causes stripes.
4. **Peter-panning / 悬浮**：`bias` 太大，阴影脱离物体。/ Too-large bias detaches shadow.
5. **阴影范围太大 / Shadow area too large**：`left/right` 设 ±50，2048 分辨率不够，阴影模糊。/ Large bounds with small map = blurry.
6. **阴影锯齿 / Blocky shadows**：`mapSize` 太小或 `PCFShadowMap`（硬）。用 `PCFSoftShadowMap`。/ Small map or hard shadow type.
7. **点光阴影性能差 / Point light shadow cost**：6 面 cube shadow，开销大。尽量少用。/ 6-face cube shadow is expensive.
8. **`RectAreaLight` 不投影 / RectAreaLight no shadow**：r160 前 `RectAreaLight` 不支持阴影。/ No shadow support before r160.
9. **改阴影相机后不更新 / Not updating after change**：改了 `shadow.camera` 参数后没调 `updateProjectionMatrix()` 和 `helper.update()`。/ Must call update after changing params.
10. **`MeshBasicMaterial` 不接收阴影 / Basic doesn't receive**：`MeshBasicMaterial` 默认不接收阴影（光照不参与）。/ Basic material doesn't receive shadows properly.

## 调试技巧 / Debugging Tips

- 用 `CameraHelper(dir.shadow.camera)` 可视化阴影相机视锥，确认覆盖范围。/ Visualize shadow frustum.
- 先把 `mapSize` 调到 4096 排查精度问题，确认后再降。/ Temporarily raise mapSize to 4096.
- `bias` 从 `-0.0001` 开始，逐步增大直到 acne 消失。/ Start bias at -0.0001, increase until acne gone.
- `normalBias` 优先调，它比 `bias` 更不容易产生 peter-panning。/ Prefer `normalBias` over `bias`.
- 阴影"看不见"时检查：全局开关 → castShadow → receiveShadow → 相机范围 → mapSize → bias。/ Shadow-invisible checklist.
- 临时设 `renderer.shadowMap.type = THREE.BasicShadowMap` 看硬阴影边缘。/ Use BasicShadowMap to see hard edges.

## 练习 / Exercises

1. 用 3 种光源（环境 + 半球 + 方向）组合，观察明暗层次。/ Combine ambient + hemisphere + directional.
2. 做一个点光源在房间中移动，观察阴影变化。/ Move a point light through a room.
3. 故意把 `bias` 设成 `-0.01`，观察 peter-panning。/ Set bias to -0.01 to see peter-panning.
4. 把 `mapSize` 从 512 切到 4096，观察边缘质量变化。/ Compare mapSize 512 vs 4096.
5. 用 `SpotLight` 做一个舞台聚光灯效果，带阴影。/ Make a stage spotlight with shadow.
6. 调整阴影相机 `left/right/top/bottom`，找到最小覆盖范围。/ Find minimal shadow camera bounds.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/10-lighting-shadow/index.html`](../../examples/10-lighting-shadow/index.html)

```js
// 阴影调试器核心 / shadow debugger core
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight.position.set(4, 6, 3);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 30;
dirLight.shadow.camera.left = -8;
dirLight.shadow.camera.right = 8;
dirLight.shadow.camera.top = 8;
dirLight.shadow.camera.bottom = -8;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

// 阴影相机辅助 / shadow camera helper
const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
scene.add(shadowHelper);

// 投射阴影的物体 / shadow-casting objects
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x44aaff, roughness: 0.5 })
);
box.position.y = 0.5;
box.castShadow = true;
scene.add(box);

// 接收阴影的地板 / shadow-receiving floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// GUI
const params = {
  mapSize: 2048,
  bias: -0.0005,
  normalBias: 0.02,
  range: 8,
  shadowType: 'PCFSoft',
  showHelper: true,
};
gui.add(params, 'mapSize', [512, 1024, 2048, 4096]).onChange(v => {
  dirLight.shadow.mapSize.set(v, v);
  dirLight.shadow.map?.dispose();
  dirLight.shadow.map = null;
});
gui.add(params, 'bias', -0.005, 0, 0.0001).onChange(v => dirLight.shadow.bias = v);
gui.add(params, 'normalBias', 0, 0.1, 0.001).onChange(v => dirLight.shadow.normalBias = v);
gui.add(params, 'range', 2, 20, 0.5).onChange(v => {
  dirLight.shadow.camera.left = -v;
  dirLight.shadow.camera.right = v;
  dirLight.shadow.camera.top = v;
  dirLight.shadow.camera.bottom = -v;
  dirLight.shadow.camera.updateProjectionMatrix();
  shadowHelper.update();
});
```

## 参考资源 / References

- [Three.js Docs — Lights](https://threejs.org/docs/#api/en/lights/Light)
- [Three.js Docs — DirectionalLightShadow](https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow)
- [Three.js Manual — Lights](https://threejs.org/manual/#en/lights)
- [Three.js Manual — Shadows](https://threejs.org/manual/#en/shadows)
- [LearnOpenGL — Shadow Mapping](https://learnopengl.com/Advanced-Lighting/Shadows)
- [Three.js Shadow Examples](https://threejs.org/examples/?q=shadow)

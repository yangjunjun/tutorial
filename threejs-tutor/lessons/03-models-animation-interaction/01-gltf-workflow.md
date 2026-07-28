# glTF 工作流 / glTF Workflow

> 阶段 / Phase: 三、模型、动画和交互 / Models, Animation & Interaction
> 预计用时 / Estimated: 8-12 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

本节聚焦 Web 3D 事实标准模型格式 glTF/GLB 的完整工作流。重点不是"把模型加载出来"，而是从建模端到运行时的全链路管理：Blender 建模 → 材质整理 → UV → 贴图 → 骨骼动画 → 导出 GLB → 压缩（Draco/KTX2/Meshopt）→ Three.js 加载 → 场景树检查 → 节点查找 → 材质替换 → 动画控制 → 尺寸/中心/坐标轴处理 → 资源释放。掌握这条链路，才能在生产环境中真正驾驭模型资产。

This lesson covers the full pipeline of glTF/GLB, the de-facto model format for Web 3D. The focus is NOT just "loading a model", but the complete chain from authoring (Blender) to runtime management: modeling → materials → UV → textures → skeletal animation → GLB export → compression (Draco / KTX2 / Meshopt) → Three.js loading → scene-graph inspection → node lookup → material replacement → animation control → size/center/axis handling → resource disposal. Mastering this pipeline is what separates toy demos from production-ready model management.

## 核心概念 / Core Concepts

### 1. glTF 与 GLB 的区别 / glTF vs GLB

glTF 是基于 JSON 的开放 3D 格式，外部引用 `.bin`（几何）和贴图文件；GLB 把所有资源打包进单个二进制文件，更适合 Web 传输。两者底层结构一致，都是 `scene → node → mesh → primitive → material/attribute` 的层级。

glTF is a JSON-based open 3D format that externally references `.bin` (geometry) and texture files; GLB bundles everything into a single binary file, better suited for web delivery. Both share the same hierarchy: `scene → node → mesh → primitive → material/attribute`.

```js
// glTF 顶层结构 / Top-level glTF structure
// {
//   scenes: [...], nodes: [...], meshes: [...],
//   materials: [...], animations: [...], skins: [...],
//   images: [...], textures: [...], accessors: [...]
// }
```

### 2. 压缩方案对比 / Compression Schemes

Web 模型通常需要压缩以减小体积。三种主流方案可叠加使用：

Web models usually need compression to reduce size. Three mainstream schemes can be combined:

| 方案 / Scheme | 压缩对象 / Target | 解码器 / Decoder | 适用场景 / Use case |
| --- | --- | --- | --- |
| Draco | 几何顶点/索引 / Geometry vertices & indices | DRACOLoader | 高面数网格 / High-poly meshes |
| KTX2 (Basis) | 贴图 / Textures | KTX2Loader | 贴图体积大 / Large textures |
| Meshopt | 几何 + 形变目标 / Geometry + morph targets | MeshoptDecoder | 需要形变或更优解码 / Morph targets or faster decode |

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
// 配置 Draco 解码器（从 unpkg/gstatic 加载 wasm）/ Configure Draco decoder
const draco = new DRACOLoader();
draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(draco);

// 配置 KTX2 解码器（需检测渲染器能力）/ Configure KTX2 decoder
const ktx2 = new KTX2Loader()
  .setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/')
  .detectSupport(renderer);
loader.setKTX2Loader(ktx2);

// Meshopt 是纯 JS，直接设置 / Meshopt is pure JS, just set it
loader.setMeshoptDecoder(MeshoptDecoder);
```

### 3. 加载完成后的场景树检查 / Inspecting the Scene Graph After Load

`gltf.scene` 是一个 `Group`，包含完整的节点树。生产代码必须遍历它来查找节点、收集网格、统计材质，而不是假设结构。

`gltf.scene` is a `Group` containing the full node tree. Production code must traverse it to find nodes, collect meshes, and tally materials — never assume a fixed structure.

```js
loader.load(url, (gltf) => {
  const model = gltf.scene;

  // 1. 遍历所有节点 / Traverse all nodes
  model.traverse((node) => {
    console.log(node.name, node.type);
    if (node.isMesh) {
      // 2. 收集网格 / Collect meshes
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  // 3. 按名称查找节点 / Find node by name
  const head = model.getObjectByName('Head');
  if (head) head.material = new THREE.MeshStandardMaterial({ color: 0xff5555 });

  // 4. 处理尺寸：计算包围盒并归一化 / Normalize size via bounding box
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxDim; // 目标最大边为 2 单位 / Target max edge = 2 units
  model.scale.setScalar(scale);

  // 5. 处理中心点：移到原点 / Re-center to origin
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(scale));

  scene.add(model);
});
```

### 4. 动画控制 / Animation Control

`gltf.animations` 是 `AnimationClip[]`。用 `AnimationMixer` 驱动，每个 clip 创建一个 `AnimationAction`。详见下一节动画系统。

`gltf.animations` is an `AnimationClip[]`. Drive them with an `AnimationMixer`, creating one `AnimationAction` per clip. See the next lesson for the full animation system.

```js
const mixer = new THREE.AnimationMixer(model);
const actions = {};
gltf.animations.forEach((clip) => {
  actions[clip.name] = mixer.clipAction(clip);
});
actions['Idle']?.play();

// 每帧更新 / Update every frame
mixer.update(delta);
```

### 5. 资源释放 / Resource Disposal

模型加载会创建大量 GPU 资源（geometry、material、texture）。从场景移除 `model` 不会自动释放显存，必须手动 `dispose`，否则内存泄漏。

Loading a model creates many GPU resources (geometry, material, texture). Removing `model` from the scene does NOT free VRAM — you must call `dispose()` manually, or you leak memory.

```js
function disposeModel(model) {
  model.traverse((node) => {
    if (node.isMesh) {
      node.geometry?.dispose();
      const mat = node.material;
      if (Array.isArray(mat)) mat.forEach(disposeMaterial);
      else disposeMaterial(mat);
    }
  });
  // 从父节点移除 / Remove from parent
  model.parent?.remove(model);
}

function disposeMaterial(mat) {
  // 释放所有贴图 / Dispose all textures
  for (const key in mat) {
    const val = mat[key];
    if (val && val.isTexture) val.dispose();
  }
  mat.dispose();
}
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `GLTFLoader` | 加载 glTF/GLB 文件，支持压缩扩展 / Load glTF/GLB with compression extensions |
| `DRACOLoader` | 解码 Draco 压缩几何 / Decode Draco-compressed geometry |
| `KTX2Loader` | 解码 KTX2/Basis 贴图 / Decode KTX2/Basis textures |
| `MeshoptDecoder` | 解码 Meshopt 压缩 / Decode Meshopt compression |
| `LoadingManager` | 统一管理多加载器进度与错误 / Unified progress/error tracking across loaders |
| `Object3D.traverse` | 递归遍历子树 / Recursively walk subtree |
| `Object3D.getObjectByName` | 按名称查找节点 / Find node by name |
| `Box3.setFromObject` | 计算世界包围盒 / Compute world bounding box |
| `AnimationMixer` | 驱动动画剪辑 / Drive animation clips |

## 工作流 / Workflow

1. **建模端 / Authoring**：在 Blender 中建模、展 UV、贴图、绑骨、做动画。导出时选择 `glTF 2.0 (.glb)`，勾选 `Compression (Draco)`，贴图用 KTX2/Basis 转码。
2. **传输 / Delivery**：GLB 单文件最省心；如需分包用 `.gltf` + `.bin` + textures。CDN 上开启 gzip/brotli。
3. **加载 / Loading**：`GLTFLoader` 配好 DRACO/KTX2/Meshopt 解码器；用 `LoadingManager` 监听进度。
4. **检查 / Inspect**：`traverse` 打印节点树；用 `getObjectByName` 定位部件。
5. **归一化 / Normalize**：`Box3` 算尺寸，缩放到目标大小，平移到原点；必要时旋转校正坐标轴（Blender Z-up → Three.js Y-up，glTF 导出器通常已处理）。
6. **材质 / Materials**：替换为项目 PBR 材质，统一阴影开关。
7. **动画 / Animation**：建 `AnimationMixer`，按名取 `AnimationAction`，实现切换/混合。
8. **释放 / Dispose**：切场景或卸载模型时，遍历 `dispose` geometry/material/texture。

## 常见陷阱 / Common Pitfalls

1. **忘记配 DRACOLoader 导致解码报错** / Forgetting to set DRACOLoader causes decode error — Draco 压缩的模型没有解码器会直接抛异常。
2. **模型尺寸/朝向不对** / Wrong size or orientation — 不做 `Box3` 归一化，模型可能巨大或偏离原点。
3. **未 dispose 导致显存泄漏** / Not disposing leaks VRAM — 反复加载模型不释放，浏览器显存持续增长直至崩溃。
4. **假设节点结构固定** / Assuming a fixed node structure — 不同导出器/版本节点命名不同，必须用 `traverse` + 名称匹配而非硬编码路径。
5. **KTX2 未 detectSupport** / KTX2 without detectSupport — 不调用 `detectSupport(renderer)` 会用软件转码，性能差。
6. **动画不更新 mixer** / Not updating mixer — 忘记每帧 `mixer.update(delta)`，动画静止。
7. **材质共享导致批量替换出错** / Shared materials — 多个网格共享同一材质实例，替换一个会影响全部；替换前先 `clone()`。

## 调试技巧 / Debugging Tips

- 在 `traverse` 里 `console.table` 输出 `{name, type, mesh?}`，快速看清结构。
- 用 `scene.add(new THREE.BoxHelper(node, 0xff0000))` 可视化任意节点包围盒。
- 加载后 `console.log(gltf)` 看 `animations`、`skins`、`cameras` 是否符合预期。
- 用 `renderer.info` 查看几何体/纹理/绘制调用数量，验证 dispose 是否生效。
- 模型朝向错误时，先检查导出器的 up-axis 设置，再考虑在运行时 `model.rotation.x = -Math.PI/2` 校正。

## 练习 / Exercises

1. 加载一个 Draco 压缩的 GLB，打印所有网格名称与三角面数。
2. 实现一个函数 `loadModelNormalized(url, targetSize)`，自动归一化尺寸并居中。
3. 加载模型后，把所有 `MeshStandardMaterial` 的 `roughness` 统一改为 0.8。
4. 实现 `disposeModel`，加载新模型前先释放旧模型，并用 `renderer.info` 验证显存回收。
5. 加载带动画的 GLB，播放第一个 clip 并支持暂停/恢复。

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/12-gltf-workflow/index.html`](../../examples/12-gltf-workflow/index.html)

```js
// 程序化构建一个"机器人"模型，模拟 glTF 加载后的场景树
// Procedurally build a "robot" model that mimics a loaded glTF scene graph
function buildRobot() {
  const root = new THREE.Group();
  root.name = 'Robot';

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x4fa8ff, metalness: 0.3, roughness: 0.5 })
  );
  body.name = 'Body';
  body.position.y = 1.4;
  root.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xffcc66, metalness: 0.2, roughness: 0.6 })
  );
  head.name = 'Head';
  head.position.y = 2.4;
  root.add(head);

  // 手臂作为子节点，方便后续动画 / Arms as children for later animation
  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x88ddaa });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.name = 'LeftArm';
  leftArm.position.set(-0.8, 1.8, 0);
  leftArm.rotation.z = 0.3;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat.clone());
  rightArm.name = 'RightArm';
  rightArm.position.set(0.8, 1.8, 0);
  rightArm.rotation.z = -0.3;
  root.add(rightArm);

  return root;
}

// 遍历打印节点树 / Traverse and print node tree
function printTree(obj, depth = 0) {
  console.log(`${'  '.repeat(depth)}${obj.name} [${obj.type}]`);
  obj.children.forEach((c) => printTree(c, depth + 1));
}

// 释放资源 / Dispose resources
function disposeObject(obj) {
  obj.traverse((n) => {
    if (n.isMesh) {
      n.geometry?.dispose();
      const m = n.material;
      (Array.isArray(m) ? m : [m]).forEach((mat) => {
        for (const k in mat) if (mat[k]?.isTexture) mat[k].dispose();
        mat.dispose();
      });
    }
  });
}
```

## 参考资源 / References

- [Three.js Docs - GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Three.js Manual - Loading 3D models](https://threejs.org/manual/#en/load-gltf)
- [glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [gltTF Transform](https://gltf-transform.dev/) — 程序化处理 glTF 的工具链
- [Blender glTF Exporter Docs](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf.html)

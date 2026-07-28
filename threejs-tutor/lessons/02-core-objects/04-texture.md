# 纹理与采样 / Texture & Sampling

> 阶段 / Phase: 二、Three.js 核心对象体系 / Core Object System
> 预计用时 / Estimated: 3–4 小时 / 3–4 hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

纹理是把 2D 图像（或数据）贴到 3D 表面的机制。它不仅决定"颜色从哪来"，还涉及 UV 坐标、采样过滤、包裹模式、mipmap、颜色空间、压缩格式等一系列底层概念。理解纹理，才能解决"贴图拉伸""边缘锯齿""远处闪烁""颜色偏暗"等问题。

Texture is the mechanism of mapping 2D images (or data) onto 3D surfaces. It involves not just "where color comes from" but UV coordinates, sampling filters, wrap modes, mipmaps, color space, and compressed formats. Mastering texture lets you fix stretched UVs, jagged edges, distant shimmer, and dark colors.

本节演示 UV 检查器纹理 + 动态 `CanvasTexture`，实时调整 `repeat`/`offset`/`rotation`/`wrap`/`filter`/`anisotropy`。

This lesson demonstrates a UV-checker texture plus a dynamic `CanvasTexture`, with live controls for `repeat`/`offset`/`rotation`/`wrap`/`filter`/`anisotropy`.

## 核心概念 / Core Concepts

### 1. 纹理类型 / Texture Types

| 类型 / Type | 说明 / Description |
| --- | --- |
| `Texture` | 通用纹理，常配合 `TextureLoader` 加载图片 / generic, loaded via `TextureLoader` |
| `CubeTexture` | 6 面立方体纹理，用于天空盒与环境反射 / 6-face cube, skybox & env reflection |
| `DataTexture` | 直接从 `TypedArray` 创建的纹理（程序化数据）/ raw typed-array texture |
| `CanvasTexture` | 从 `<canvas>` 创建，画布更新时纹理自动刷新 / from canvas, auto-refreshes |
| `VideoTexture` | 从 `<video>` 元素创建 / from video element |
| `RenderTarget.texture` | 渲染目标纹理，把渲染结果当贴图 / render-target as texture |
| `CompressedTexture` | 压缩纹理（KTX2/Basis）/ compressed (KTX2/Basis) |

```js
// TextureLoader / 加载图片
const loader = new THREE.TextureLoader();
const tex = await loader.loadAsync('albedo.png');

// DataTexture / 程序化数据
const data = new Uint8Array([255, 0, 0, 255]);  // 1x1 红色像素 / 1x1 red pixel
const dtex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
dtex.needsUpdate = true;

// CanvasTexture / 动态画布
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 256;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ff0'; ctx.fillRect(0, 0, 256, 256);
const ctex = new THREE.CanvasTexture(canvas);
// 之后修改 canvas 内容后：/ after modifying canvas:
ctex.needsUpdate = true;   // 标记刷新 / mark for refresh
```

### 2. UV 坐标 / UV Coordinates

UV 坐标将 3D 顶点映射到 2D 纹理空间，范围通常 `[0,1]`。`(0,0)` 是纹理左下角，`(1,1)` 是右上角。

UV coordinates map 3D vertices to 2D texture space, typically `[0,1]`. `(0,0)` is the texture's bottom-left, `(1,1)` is top-right.

```js
// 手写 UV / hand-writing UVs
const uvs = new Float32Array([
  0, 0,   // 左下 / bottom-left
  1, 0,   // 右下 / bottom-right
  1, 1,   // 右上 / top-right
  0, 1,   // 左上 / top-left
]);
geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
```

### 3. 包裹模式 / Wrap Modes

```js
tex.wrapS = THREE.RepeatWrapping;      // 水平重复 / horizontal repeat
tex.wrapT = THREE.RepeatWrapping;      // 垂直重复 / vertical repeat
// 选项 / options:
//   RepeatWrapping      —— 重复平铺 / tile
//   ClampToEdgeWrapping —— 边缘拉伸（默认）/ stretch edge (default)
//   MirroredRepeatWrapping —— 镜像重复 / mirror tile

tex.repeat.set(2, 2);     // 纹理重复 2×2 / repeat 2x2
tex.offset.set(0.5, 0);   // 纹理偏移 / offset
tex.rotation = Math.PI / 4;  // 旋转 45° / rotate 45°
tex.center.set(0.5, 0.5);    // 旋转中心 / rotation center
tex.needsUpdate = true;      // 修改 wrap 后需标记 / flag after wrap change
```

### 4. 过滤模式 / Filter Modes

当纹理像素与屏幕像素不是 1:1 时（放大或缩小），需要过滤算法决定颜色。

When texels and screen pixels aren't 1:1 (magnification or minification), a filter decides the color.

```js
// 放大过滤（纹素 > 像素）/ magnification filter
tex.magFilter = THREE.LinearFilter;   // 双线性插值（平滑）/ bilinear (smooth)
// 或 / or: THREE.NearestFilter —— 最近邻（像素风）/ nearest (pixel-art)

// 缩小过滤（纹素 < 像素）/ minification filter
tex.minFilter = THREE.LinearMipmapLinearFilter;  // 三线性+mipmap（默认，最平滑）/ trilinear+mipmap (default)
// 其他选项 / other options:
//   NearestFilter              最近邻
//   LinearFilter               双线性（无 mipmap）
//   NearestMipmapNearestFilter 最近邻 mipmap
//   LinearMipmapNearestFilter  双线性 mipmap
//   NearestMipmapLinearFilter
```

### 5. Mipmap

Mipmap 是纹理的逐级缩小版本（1/2、1/4、1/8…），GPU 根据物体在屏幕上的大小选择合适的级别，避免远处闪烁和锯齿。Three.js 对 2 的幂次（POT）纹理自动生成 mipmap。

A mipmap is a pyramid of progressively smaller textures (1/2, 1/4, 1/8…). The GPU picks the right level based on screen size, preventing distant shimmer and aliasing. Three.js auto-generates mipmaps for power-of-two (POT) textures.

```js
tex.generateMipmaps = true;   // 默认 true / default true
tex.minFilter = THREE.LinearMipmapLinearFilter;  // 需要 mipmap 的 filter
```

### 6. NPOT 纹理 / NPOT Textures

非 2 的幂（NPOT，如 300×200）的纹理在 WebGL1 下有诸多限制（不能 mipmap、只能 `ClampToEdge`）。WebGL2 支持完整 NPOT，但为了兼容性和性能，仍建议使用 POT 尺寸（256、512、1024、2048…）。

Non-power-of-two (NPOT, e.g. 300×200) textures had restrictions in WebGL1 (no mipmaps, only `ClampToEdge`). WebGL2 supports full NPOT, but POT sizes (256, 512, 1024, 2048…) are still recommended for compatibility and performance.

### 7. 各向异性过滤 / Anisotropy

当纹理以掠射角观察时（如地板延伸到远处），即使有 mipmap 也会模糊。各向异性过滤（`anisotropy`）改善这一情况。

When a texture is viewed at a grazing angle (like a floor stretching into the distance), even mipmaps look blurry. Anisotropic filtering improves this.

```js
const maxAniso = renderer.capabilities.getMaxAnisotropy();
tex.anisotropy = Math.min(8, maxAniso);  // 通常 4–16 足够 / 4–16 is usually enough
```

### 8. 颜色空间 / Color Space

```js
// 颜色/反照率贴图 → SRGB / color/albedo → SRGB
tex.colorSpace = THREE.SRGBColorSpace;

// 法线/粗糙度/金属度/AO 贴图 → Linear（默认）/ data textures → Linear (default)
normalTex.colorSpace = THREE.LinearSRGBColorSpace;
```

### 9. HDR 环境与 PMREM / HDR Environment & PMREM

HDR 环境贴图（`.hdr`/`.exr`）存储真实世界的亮度值（可 >1），用于 PBR 反射。`PMREMGenerator` 将 HDR 预滤波成 mipmap 级别的立方体贴图，模拟不同粗糙度的反射。

HDR environment maps (`.hdr`/`.exr`) store real-world luminance (can be >1) for PBR reflections. `PMREMGenerator` pre-filters HDR into mipmapped cube maps simulating different roughness levels.

```js
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
const hdrTex = await new RGBELoader().loadAsync('env.hdr');
const pmrem = new THREE.PMREMGenerator(renderer);
const envRT = pmrem.fromEquirectangular(hdrTex);
scene.environment = envRT.texture;   // PBR 反射 / PBR reflection
hdrTex.dispose();
pmrem.dispose();
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `TextureLoader` | 异步加载图片纹理 / async image loader |
| `RGBELoader` | 加载 `.hdr` 文件 / load HDR |
| `CubeTextureLoader` | 加载 6 面立方体 / load 6-face cube |
| `Texture` | 通用纹理 / generic texture |
| `CanvasTexture` | 从 canvas 创建 / from canvas |
| `VideoTexture` | 从 video 创建 / from video |
| `DataTexture` | 从 TypedArray 创建 / from typed array |
| `texture.wrapS` / `wrapT` | 包裹模式 / wrap mode |
| `texture.repeat` | 重复次数 `Vector2` / repeat count |
| `texture.offset` | 偏移 `Vector2` / offset |
| `texture.rotation` / `center` | 旋转角度与中心 / rotation & center |
| `texture.magFilter` / `minFilter` | 过滤模式 / filter mode |
| `texture.anisotropy` | 各向异性等级 / anisotropy level |
| `texture.colorSpace` | 颜色空间 / color space |
| `texture.generateMipmaps` | 是否生成 mipmap / mipmap toggle |
| `texture.flipY` | 是否翻转 Y（默认 true）/ flip Y (default true) |
| `texture.needsUpdate` | 标记刷新 / mark refresh |
| `texture.dispose()` | 释放 GPU 内存 / free VRAM |
| `PMREMGenerator` | HDR 预滤波 / HDR pre-filter |
| `renderer.capabilities.getMaxAnisotropy()` | 最大各向异性 / max anisotropy |

## 原理 / Principles

### 纹理采样管线 / The Sampling Pipeline

```text
顶点 UV → (repeat × N + offset) → wrap 模式处理 → 旋转/中心变换
  → 选择 mipmap 级别（基于屏幕导数 dFdx/dFdy）
    → magFilter 或 minFilter 采样
      → 各向异性过滤（可选）
        → 最终颜色（经 colorSpace 转换到线性空间）
```

理解这条管线后，"远处闪烁"= mipmap 没开或 minFilter 不对；"边缘拉伸"= wrap 模式是 `ClampToEdge`；"斜角模糊"= anisotropy 太低；"颜色偏暗"= colorSpace 没设 SRGB。

Once you understand this pipeline: "distant shimmer" = mipmaps off or wrong minFilter; "edge stretch" = `ClampToEdge`; "grazing-angle blur" = low anisotropy; "too dark" = colorSpace not SRGB.

### CanvasTexture 的更新机制 / CanvasTexture Update

`CanvasTexture` 在创建时上传一次到 GPU。之后修改 canvas 内容，必须设 `texture.needsUpdate = true`，渲染器下一帧才会重新上传。每帧更新的动态纹理（如视频效果）开销不小，尽量降低 canvas 分辨率或更新频率。

`CanvasTexture` uploads to GPU once at creation. After modifying the canvas, set `texture.needsUpdate = true` to re-upload next frame. Per-frame dynamic textures (e.g. video effects) are costly—lower canvas resolution or update frequency.

## 常见陷阱 / Common Pitfalls

1. **UV 翻转 / UV flip**：Three.js 默认 `flipY=true`（图片 Y 朝下，UV Y 朝上），加载图片纹理时不匹配会上下颠倒。/ Default `flipY=true`; mismatched images appear upside-down.
2. **NPOT + mipmap / NPOT & mipmaps**：NPOT 纹理在 WebGL1 不能 mipmap，远处闪烁。用 POT 或 WebGL2。/ NPOT can't mipmap in WebGL1.
3. **颜色贴图没设 SRGB / Color texture not SRGB**：albedo 贴图偏暗。/ Albedo too dark.
4. **忘记 `needsUpdate` / Missing needsUpdate**：修改 `wrapS`/`repeat` 后没标记，纹理不更新。/ Changes to wrap/repeat not applied.
5. **`repeat` 配合 `ClampToEdge` 无效 / repeat with ClampToEdge**：`repeat>1` 需要 `RepeatWrapping` 才有效。/ `repeat>1` needs `RepeatWrapping`.
6. **不 `dispose` / Missing dispose**：换贴图后旧纹理不释放，显存泄漏。/ Old textures leak VRAM.
7. **大纹理不分 mip / Large texture no mipmap**：4096×4096 纹理不开 mipmap，远处采样闪烁且性能差。/ Large textures without mipmaps shimmer and perform poorly.
8. **跨域图片 / CORS**：跨域图片未设 `crossOrigin`，纹理加载失败。/ Cross-origin images need `crossOrigin`.

## 调试技巧 / Debugging Tips

- 用 UV 检查器纹理（棋盘格 + 颜色标记）检查 UV 是否正确映射。/ Use a UV-checker texture to verify UV mapping.
- 临时设 `tex.magFilter = THREE.NearestFilter` 查看原始像素。/ Use `NearestFilter` to see raw texels.
- `console.log(tex.image.width, tex.image.height)` 检查纹理尺寸是否 POT。/ Check texture dimensions.
- `renderer.info.memory.textures` 查看当前纹理数量。/ Monitor texture count.
- 把纹理画到 `CanvasTexture` 上，用 `toDataURL` 检查内容。/ Inspect texture content via canvas.

## 练习 / Exercises

1. 用 `CanvasTexture` 画一个动态时钟，实时更新。/ Draw a live clock on a CanvasTexture.
2. 加载一张图片，用 `repeat` 平铺成地板。/ Load an image and tile it as a floor.
3. 用 `DataTexture` 生成一个程序化的噪声纹理。/ Generate a procedural noise texture.
4. 对比 `NearestFilter` 与 `LinearFilter` 在放大时的视觉差异。/ Compare nearest vs linear at magnification.
5. 用 `PMREMGenerator` 加载一张 HDR 做环境反射。/ Load an HDR for environment reflection.
6. 用 `VideoTexture` 把视频贴到平面上。/ Map a video onto a plane.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/09-texture/index.html`](../../examples/09-texture/index.html)

```js
// UV 检查器纹理（程序化）/ UV checker texture (procedural)
function makeCheckerTexture(size = 256, cells = 8) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cell = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const even = (x + y) % 2 === 0;
      ctx.fillStyle = even ? '#cccccc' : '#444466';
      ctx.fillRect(x * cell, y * cell, cell, cell);
      // 标记 UV 坐标 / label UV coords
      if (x === 0 && y === 0) {
        ctx.fillStyle = '#ff4444'; ctx.font = '20px sans-serif';
        ctx.fillText('0,0', 4, 24);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const checkerTex = makeCheckerTexture();
checkerTex.wrapS = checkerTex.wrapT = THREE.RepeatWrapping;
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.MeshStandardMaterial({ map: checkerTex, side: THREE.DoubleSide })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// GUI
const params = {
  repeatX: 1, repeatY: 1,
  offsetX: 0, offsetY: 0,
  rotation: 0,
  wrap: 'Repeat',
  minFilter: 'LinearMipmapLinear',
  anisotropy: 1,
};
gui.add(params, 'repeatX', 1, 8, 1).onChange(v => { checkerTex.repeat.x = v; });
gui.add(params, 'repeatY', 1, 8, 1).onChange(v => { checkerTex.repeat.y = v; });
gui.add(params, 'rotation', 0, 360, 1).onChange(v => {
  checkerTex.rotation = THREE.MathUtils.degToRad(v);
});
gui.add(params, 'wrap', ['Repeat', 'ClampToEdge', 'MirroredRepeat']).onChange(v => {
  checkerTex.wrapS = checkerTex.wrapT = THREE[v + 'Wrapping'];
  checkerTex.needsUpdate = true;
});
gui.add(params, 'anisotropy', 1, renderer.capabilities.getMaxAnisotropy(), 1)
  .onChange(v => { checkerTex.anisotropy = v; });
```

## 参考资源 / References

- [Three.js Docs — Texture](https://threejs.org/docs/#api/en/textures/Texture)
- [Three.js Docs — CanvasTexture](https://threejs.org/docs/#api/en/textures/CanvasTexture)
- [Three.js Manual — Textures](https://threejs.org/manual/#en/textures)
- [Three.js Color Management](https://threejs.org/docs/#manual/en/introduction/Color-management)
- [WebGL Fundamentals — Textures](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)
- [Khronos — KTX2 Texture Compression](https://github.com/KhronosGroup/KTX-Specification)

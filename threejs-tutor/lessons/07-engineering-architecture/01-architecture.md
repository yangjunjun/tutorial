# 工程化与架构 / Engineering & Architecture

> 阶段 / Phase: 七、工程化与架构 / Engineering & Architecture
> 预计用时 / Estimated: 4–6 小时 / hours
> 难度 / Difficulty: Advanced

## 概述 / Overview

当 Three.js 项目从"一个旋转立方体"成长为"数字孪生平台"时，代码架构决定了项目的生死。本节讲解如何用 Vite + TypeScript + Three.js + Vue 3 搭建可维护的工程化项目，核心原则是：**Three.js 引擎代码与 Vue UI 代码解耦**。引擎负责场景、资源、相机、渲染循环、交互、销毁；Vue 负责页面、表单、面板、路由、业务状态。两者通过 EventBus / Store 通信。

When a Three.js project grows from "a rotating cube" to "a digital twin platform," code architecture determines the project's survival. This lesson covers how to build a maintainable engineering project with Vite + TypeScript + Three.js + Vue 3. The core principle: **decouple Three.js engine code from Vue UI code**. The engine handles scene, resources, camera, render loop, interaction, and disposal; Vue handles pages, forms, panels, routing, and business state. They communicate via an EventBus / Store.

## 核心概念 / Core Concepts

### 1. 技术栈选择 / Tech Stack

```text
Vite          — 构建工具，HMR 快，支持 importmap / build tool, fast HMR
TypeScript    — 类型安全，重构信心 / type safety, refactor confidence
Three.js      — 3D 渲染核心 / 3D rendering core
Vue 3         — UI 框架，页面/表单/路由 / UI framework
Pinia (可选)  — 状态管理，跨组件共享 3D 状态 / state management (optional)
Web Worker    — 重计算移出主线程（物理、路径规划）/ heavy compute off main thread
Blender       — 3D 建模与导出 / 3D modeling & export
glTF Transform— 模型优化管线（压缩、纹理转换）/ model optimization pipeline
```

### 2. 核心原则：引擎与 UI 解耦 / Core Principle: Decouple Engine from UI

**反面模式 / Anti-pattern**（不要这样做）：

```vue
<!-- ❌ 错误：Vue 组件里直接写大量 Three.js 代码 -->
<script setup>
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();
// 数百行 Three.js 代码混在 Vue 组件里...
// hundreds of lines of Three.js mixed into the Vue component...
</script>
```

**正确模式 / Correct pattern**：

```text
Vue 组件 / Vue component
  ├── 只管 UI 状态（面板开关、表单值、路由）/ only UI state
  ├── 通过 EventBus 或 Pinia 与引擎通信 / communicate with engine via EventBus/Pinia
  └── 不直接操作 Mesh / Geometry / Material / never touch Mesh/Geometry/Material directly

Three.js 引擎 / Three.js Engine
  ├── Experience（入口，管理生命周期）/ entry, manages lifecycle
  ├── Renderer（渲染器封装）/ renderer wrapper
  ├── Camera（相机管理）/ camera management
  ├── SceneManager（场景模块加载/切换）/ scene module loading/switching
  ├── ResourceManager（资源加载/缓存/释放）/ resource load/cache/dispose
  ├── InputManager（输入统一处理）/ unified input handling
  ├── Time（时钟与 delta）/ clock & delta
  └── EventBus（引擎↔UI 通信桥梁）/ engine↔UI communication bridge
```

### 3. 推荐目录结构 / Recommended Directory Structure

```text
src/
├── engine/                    # Three.js 引擎核心 / engine core
│   ├── Experience.ts          # 引擎入口，管理整体生命周期 / entry, lifecycle
│   ├── Renderer.ts            # WebGLRenderer 封装 / renderer wrapper
│   ├── Camera.ts              # 相机管理 / camera management
│   ├── SceneManager.ts        # 场景模块注册/切换 / scene module registry
│   ├── ResourceManager.ts     # 资源加载/缓存/释放 / resource manager
│   ├── InputManager.ts        # 键鼠/触摸输入 / input handling
│   ├── Time.ts                # Clock 与 delta / clock & delta
│   └── EventBus.ts            # 事件总线 / event bus
├── worlds/                    # 场景模块 / scene modules
│   ├── MainWorld.ts           # 主场景 / main scene
│   ├── ViewerWorld.ts         # 模型查看器场景 / model viewer scene
│   └── objects/               # 场景内对象 / scene objects
│       ├── Character.ts
│       └── Terrain.ts
├── shaders/                   # GLSL / TSL 着色器 / shaders
│   ├── water.vert
│   ├── water.frag
│   └── tsl/
├── loaders/                   # 自定义加载器 / custom loaders
├── utils/                     # 工具函数 / utilities
├── components/                # Vue UI 组件 / Vue UI components
│   ├── Panel3D.vue
│   ├── Toolbar.vue
│   └── StatsOverlay.vue
└── views/                     # Vue 页面 / Vue pages
    ├── HomeView.vue
    └── ViewerView.vue
```

### 4. SceneModule 生命周期接口 / SceneModule Lifecycle Interface

每个场景模块实现统一接口，让 SceneManager 能统一管理初始化、更新、缩放和销毁：

Each scene module implements a unified interface so SceneManager can uniformly manage init, update, resize, and dispose:

```ts
// engine/SceneManager.ts
export interface SceneModule {
  /** 初始化场景（可异步加载资源）/ initialize (may async-load resources) */
  init(): Promise<void>;
  /** 每帧更新 / per-frame update */
  update(delta: number, elapsed: number): void;
  /** 窗口缩放 / handle resize */
  resize(width: number, height: number): void;
  /** 销毁，释放所有资源 / dispose, free all resources */
  dispose(): void;
}
```

```ts
// worlds/MainWorld.ts
export class MainWorld implements SceneModule {
  private scene = new THREE.Scene();
  private cubes: THREE.Mesh[] = [];

  async init(): Promise<void> {
    // 加载资源、创建物体 / load resources, create objects
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i - 4.5, 0, 0);
      this.cubes.push(mesh);
      this.scene.add(mesh);
    }
  }

  update(delta: number, elapsed: number): void {
    // 用 delta 保证帧率无关 / delta ensures frame-rate independence
    for (const cube of this.cubes) {
      cube.rotation.y += delta * 0.5;
      cube.position.y = Math.sin(elapsed + cube.position.x) * 0.5;
    }
  }

  resize(width: number, height: number): void {
    // 相机 aspect 由 Camera 模块处理，这里处理场景特有的 / camera handled by Camera module
  }

  dispose(): void {
    // 递归释放所有资源 / recursively dispose all resources
    this.scene.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => {
          for (const k in m) if (m[k]?.isTexture) m[k].dispose();
          m.dispose();
        });
      }
    });
    this.cubes = [];
  }
}
```

### 5. Experience 引擎入口 / Experience Entry

```ts
// engine/Experience.ts
export class Experience {
  renderer: Renderer;
  camera: Camera;
  sceneManager: SceneManager;
  resources: ResourceManager;
  input: InputManager;
  time: Time;
  eventBus: EventBus;

  private rafId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.eventBus = new EventBus();
    this.time = new Time();
    this.renderer = new Renderer(canvas);
    this.camera = new Camera();
    this.resources = new ResourceManager();
    this.input = new InputManager(canvas);
    this.sceneManager = new SceneManager(this);
  }

  async loadModule(name: string): Promise<void> {
    await this.sceneManager.switchTo(name);
  }

  start(): void {
    this.running = true;
    this.time.start();
    const loop = () => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(loop);
      const { delta, elapsed } = this.time.tick();
      this.sceneManager.update(delta, elapsed);
      this.renderer.render(this.sceneManager.current.scene, this.camera.threeCamera);
    };
    loop();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  dispose(): void {
    this.stop();
    this.sceneManager.disposeAll();
    this.renderer.dispose();
    this.input.dispose();
  }
}
```

### 6. Vue 与引擎的通信 / Vue ↔ Engine Communication

```ts
// Vue 组件通过 EventBus 与引擎通信 / Vue communicates with engine via EventBus
import { useEngine } from '@/engine/useEngine';

const { engine, eventBus } = useEngine();

// Vue → Engine：发送指令 / Vue → Engine: send command
function toggleWireframe() {
  eventBus.emit('setting:wireframe', true);
}

// Engine → Vue：监听事件 / Engine → Vue: listen to events
eventBus.on('object:selected', (obj) => {
  selectedObject.value = obj.name;
});
```

```ts
// 引擎内部监听 EventBus / engine listens to EventBus internally
export class MainWorld implements SceneModule {
  init() {
    this.eventBus.on('setting:wireframe', (on: boolean) => {
      this.cubes.forEach(c => (c.material.wireframe = on));
    });
  }
}
```

### 7. ResourceManager 资源管理 / Resource Manager

```ts
export class ResourceManager {
  private cache = new Map<string, any>();
  private disposables = new Set<{ dispose: () => void }>();

  async loadGLTF(url: string): Promise<THREE.Group> {
    if (this.cache.has(url)) return this.cache.get(url).clone();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    this.cache.set(url, gltf.scene);
    return gltf.scene.clone();
  }

  disposeAll(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables.clear();
    this.cache.clear();
  }
}
```

## 关键 API / Key APIs

| API / Pattern | 说明 / Description |
| --- | --- |
| `SceneModule` interface | 场景模块统一生命周期接口 / unified scene lifecycle interface |
| `Experience` class | 引擎入口，管理所有子系统 / engine entry, manages all subsystems |
| `SceneManager` | 注册/切换/销毁场景模块 / register/switch/dispose scene modules |
| `ResourceManager` | 资源加载/缓存/统一释放 / resource load/cache/unified disposal |
| `EventBus` | 引擎↔UI 事件通信 / engine↔UI event communication |
| `Time.tick()` | 返回 `{ delta, elapsed }` / returns delta & elapsed |
| `InputManager` | 统一输入事件（鼠标/触摸/键盘）/ unified input events |
| `scene.traverse(cb)` | 递归遍历场景树（用于销毁）/ recursive scene traversal (for disposal) |
| `renderer.info` | 验证资源是否释放 / verify resources are disposed |

## 原理 / Principles

### 为什么要解耦 / Why Decouple

当 Three.js 代码混在 Vue 组件里时：组件卸载时忘了 `dispose()` → 显存泄漏；多处直接操作 `scene` → 状态不一致；想换 React/RAW JS → 全部重写。解耦后：引擎独立测试、独立复用；UI 层可替换；生命周期清晰可控。

When Three.js code is mixed into Vue components: component unmount without `dispose()` → VRAM leak; multiple places directly manipulating `scene` → state inconsistency; wanting to switch to React/raw JS → full rewrite. Decoupled: engine is independently testable and reusable; UI layer is swappable; lifecycle is clear and controllable.

### 场景模块的可销毁、可切换、可测试 / Disposable, Switchable, Testable Scene Modules

```text
可销毁 (Disposable):
  dispose() 释放所有 geometry / material / texture
  用 renderer.info.memory 验证归零 / verify with renderer.info.memory

可切换 (Switchable):
  SceneManager.switchTo('viewer') → 旧模块 dispose() → 新模块 init()
  切换时无残留 / no residue after switch

可测试 (Testable):
  SceneModule 是纯 TS 类，不依赖 Vue / pure TS class, no Vue dependency
  可在 Node/jsdom 中单元测试 / unit-testable in Node/jsdom
```

### 渲染循环的归属 / Where the Render Loop Belongs

渲染循环永远在引擎的 `Experience.start()` 中，不在 Vue 组件里。Vue 只通过 `eventBus.emit('engine:start')` / `engine.stop()` 控制。这保证即使 Vue 组件卸载，引擎仍可运行（或按需停止）。

The render loop always lives in `Experience.start()`, never in Vue components. Vue only controls it via `eventBus.emit('engine:start')` / `engine.stop()`. This ensures the engine can keep running (or stop on demand) even if Vue components unmount.

## 常见陷阱 / Common Pitfalls

1. **Vue 组件卸载不 dispose**：`onUnmounted` 里忘记调用 `engine.dispose()`，显存泄漏。 / Vue `onUnmounted` forgetting `engine.dispose()` → VRAM leak.
2. **多处直接操作 scene**：绕过 SceneManager 直接 `scene.add()`，切换场景时残留。 / Bypassing SceneManager to `scene.add()` → residue on switch.
3. **用 `onBeforeRender` 代替 update**：把逻辑塞进 `mesh.onBeforeRender`，难以测试和调试。 / Stuffing logic into `onBeforeRender` — hard to test/debug.
4. **资源重复加载**：没有 ResourceManager 缓存，每次切换场景重新下载。 / No ResourceManager cache → re-downloading on every scene switch.
5. **delta 为 0 时除零**：`Time.tick()` 首帧 delta 可能是 0，除法需保护。 / Division by zero when first-frame delta is 0.
6. **EventBus 不解绑**：Vue 组件 `onMounted` 里 `eventBus.on()` 但 `onUnmounted` 里没 `off()`。 / EventBus not unsubscribed in `onUnmounted`.
7. **引擎代码依赖 Vue**：在 engine/ 里 `import { ref } from 'vue'`，破坏解耦。 / Engine code importing Vue — breaks decoupling.
8. **不做类型约束**：SceneModule 没有 interface，各模块生命周期方法名不一致。 / No SceneModule interface — inconsistent lifecycle method names.

## 调试技巧 / Debugging Tips

- **`renderer.info` 验证销毁**：dispose 后检查 `memory.geometries` 和 `memory.textures` 是否归零。 / Verify disposal with `renderer.info.memory` after dispose.
- **EventBus 日志**：开发时给 EventBus 加 `console.log`，看事件流。 / Add logging to EventBus during development.
- **SceneManager 状态**：`sceneManager.current?.constructor.name` 确认当前场景。 / Check `sceneManager.current?.constructor.name`.
- **Time.delta 钳制**：`delta = Math.min(delta, 0.1)` 防止切 tab 回来后大跳。 / Clamp delta to prevent jumps after tab switch.
- **Vue Devtools + 控制台**：Vue Devtools 看 UI 状态，控制台看引擎日志。 / Vue Devtools for UI state, console for engine logs.
- **内存快照对比**：切换场景前后 Chrome Memory 快照，找泄漏。 / Chrome Memory snapshots before/after scene switch to find leaks.

## 练习 / Exercises

1. 将本节示例的引擎骨架用 Vite + TypeScript + Vue 3 重现为多文件项目。 / Recreate the example engine skeleton as a multi-file Vite + TS + Vue 3 project.
2. 添加第二个 SceneModule（如粒子场景），实现 GUI 切换两个场景。 / Add a second SceneModule (e.g. particles); GUI switches between two scenes.
3. 实现 ResourceManager 的 GLTF 缓存，切换场景时不重复加载。 / Implement ResourceManager GLTF caching; no re-load on scene switch.
4. 在 Vue 组件中通过 EventBus 控制引擎的线框模式、暂停/恢复。 / Control engine wireframe/pause via EventBus from a Vue component.
5. 写一个 dispose 验证测试：dispose 后断言 `renderer.info.memory.geometries === 0`。 / Write a dispose verification test asserting `renderer.info.memory.geometries === 0` after dispose.

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/24-architecture/index.html`](../../examples/24-architecture/index.html)

核心：单文件实现的引擎骨架——Experience 类含 Renderer/Camera/SceneManager/Time/ResourceManager，一个 DemoWorld 模块展示 init/update/resize/dispose 完整生命周期，GUI 按钮触发 dispose & rebuild 验证资源释放。

Core: single-file engine skeleton — Experience class with Renderer/Camera/SceneManager/Time/ResourceManager; a DemoWorld module demonstrates the full init/update/resize/dispose lifecycle; GUI button triggers dispose & rebuild to verify resource release.

```js
// SceneModule 接口 / SceneModule interface
class DemoWorld {
  init() { /* 创建立方体 / create cubes */ }
  update(delta, elapsed) { /* 旋转 / rotate */ }
  resize(w, h) { /* 相机 aspect / camera aspect */ }
  dispose() {
    // 递归释放 / recursive disposal
    this.scene.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

// Experience 管理 / Experience manages
class Experience {
  start() { /* 启动渲染循环 / start render loop */ }
  dispose() {
    this.sceneManager.current.dispose(); // 销毁当前场景 / dispose current
    this.renderer.dispose();              // 销毁渲染器 / dispose renderer
  }
}

// GUI 验证销毁 / GUI verifies disposal
gui.add({ rebuild: () => {
  const before = renderer.info.memory.geometries;
  experience.dispose();
  const after = renderer.info.memory.geometries;
  console.log(`geometries: ${before} → ${after}`); // 应归零 / should be 0
}}, 'rebuild');
```

## 参考资源 / References

- [Three.js Manual - Performance](https://threejs.org/manual/#en/performance)
- [Three.js Manual - Creating a Scene](https://threejs.org/manual/#en/create-a-scene)
- [Vue 3 + Three.js Best Practices](https://discourse.threejs.org/t/vuejs-threejs-best-practices/)
- [Vite](https://vitejs.dev/)
- [Bruno Simon - Three.js Journey (Architecture)](https://threejs-journey.com/)
- [Three.js Experience Pattern](https://github.com/brunosimon/threejs-meetup-2022)
- [glTF Transform](https://gltf-transform.dev/)
- [TypeScript Interface Patterns](https://www.typescriptlang.org/docs/handbook/interfaces.html)

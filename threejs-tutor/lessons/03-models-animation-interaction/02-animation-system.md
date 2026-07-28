# 动画系统 / Animation System

> 阶段 / Phase: 三、模型、动画和交互 / Models, Animation & Interaction
> 预计用时 / Estimated: 6-9 小时 / hours
> 难度 / Difficulty: Intermediate

## 概述 / Overview

Three.js 的动画系统基于"剪辑-混合器-动作"三层模型。`AnimationClip` 是一段静态数据（若干关键帧轨道的集合），`AnimationMixer` 是驱动这些剪辑的播放器，`AnimationAction` 是某个剪辑的"播放实例"，负责循环模式、时间缩放、淡入淡出。理解这三层，就能实现播放/暂停/循环/切换/混合/程序化动画，并在角色从 idle 切换到 run 时平滑过渡。

Three.js's animation system is built on a three-layer model: Clip–Mixer–Action. `AnimationClip` is static data (a set of keyframe tracks), `AnimationMixer` is the player that drives clips, and `AnimationAction` is a "playback instance" of a clip, controlling loop mode, time scale, and fade in/out. Understanding these three layers lets you implement play/pause/loop/switch/blend/procedural animation, and smoothly transition a character from idle to run.

## 核心概念 / Core Concepts

### 1. 三层模型 / The Three-Layer Model

```text
AnimationClip   (数据 / data: tracks[])
   ↓
AnimationMixer  (播放器 / player: owns clock, updates actions)
   ↓
AnimationAction (实例 / instance: one clip's playback state)
```

- **Clip**：一组 `KeyframeTrack`，每个 track 描述某个属性（如 `.position`、`.quaternion`、`.scale`）随时间变化的关键帧。可来自 glTF，也可手写。
- **Mixer**：每个动画对象绑定一个 mixer，每帧调用 `mixer.update(delta)` 推进时间。
- **Action**：对同一 clip 可创建多个 action（不同循环/速度），但通常一个 clip 一个 action。

- **Clip**: a set of `KeyframeTrack`s; each track describes keyframes of a property (e.g. `.position`, `.quaternion`, `.scale`) over time. Can come from glTF or be hand-authored.
- **Mixer**: each animated object binds one mixer; call `mixer.update(delta)` every frame to advance time.
- **Action**: you can create multiple actions from one clip (different loop/speed), but typically one action per clip.

### 2. 手写 AnimationClip / Hand-authoring a Clip

不依赖建模软件，纯代码也能造动画。关键帧用 `times`（秒数组）和 `values`（扁平数值数组）描述。轨道名格式为 `对象名.属性` 或完整路径 `parent.child.position`。

Without any modeling software, you can author animation purely in code. Keyframes use `times` (array of seconds) and `values` (flattened number array). Track names follow `objectName.property` or a full path `parent.child.position`.

```js
import * as THREE from 'three';

// 构建 idle 剪辑：身体上下浮动 / Build an idle clip: body bobbing
function makeIdleClip(root) {
  const body = root.getObjectByName('Body');
  const times   = [0, 0.5, 1.0];
  const values  = [1.4, 1.5, 1.6, 1.4]; // y 值 / y values
  const track = new THREE.NumberKeyframeTrack(
    'Body.position',   // 轨道名 / track name (relative to mixer root)
    times,
    values
  );
  return new THREE.AnimationClip('Idle', 1.0, [track]);
}

// 构建 walk 剪辑：左右腿交替摆动 / Build a walk clip: alternating leg swing
function makeWalkClip(root) {
  const times = [0, 0.25, 0.5, 0.75, 1.0];
  // 左腿绕 x 轴摆动 / Left leg swings around x
  const leftRot = new THREE.NumberKeyframeTrack(
    'LeftLeg.rotation[x]',
    times,
    [0.3, -0.3, 0.3, -0.3, 0.3]
  );
  // 右腿反相 / Right leg opposite phase
  const rightRot = new THREE.NumberKeyframeTrack(
    'RightLeg.rotation[x]',
    times,
    [-0.3, 0.3, -0.3, 0.3, -0.3]
  );
  return new THREE.AnimationClip('Walk', 1.0, [leftRot, rightRot]);
}
```

> 轨道名中的路径是**相对于 mixer 根节点**的。`new AnimationMixer(root)` 后，track `Body.position` 解析为 `root.getObjectByName('Body').position`。

> The path in a track name is **relative to the mixer root**. After `new AnimationMixer(root)`, track `Body.position` resolves to `root.getObjectByName('Body').position`.

### 3. AnimationAction 控制 / Action Control

```js
const mixer = new THREE.AnimationMixer(root);
const idleAction = mixer.clipAction(idleClip);
const walkAction = mixer.clipAction(walkClip);

idleAction.setLoop(THREE.LoopRepeat, Infinity); // 循环 / loop
idleAction.clampWhenFinished = false;
idleAction.timeScale = 1.0;            // 速度 / speed
idleAction.play();                     // 播放 / play

// 暂停 / pause
idleAction.paused = true;
// 停止 / stop
idleAction.stop();
// 跳到指定时间 / seek
idleAction.time = 0.5; mixer.update(0);
```

### 4. 淡入淡出与切换 / Fade & Switch

`fadeIn(d)` 在 d 秒内权重从 0→1；`fadeOut(d)` 从当前→0。切换动画的标准范式：

`fadeIn(d)` ramps weight 0→1 over d seconds; `fadeOut(d)` ramps current→0. The canonical pattern for switching animations:

```js
function switchTo(nextAction, fade = 0.3) {
  currentAction.fadeOut(fade);
  nextAction.reset().fadeIn(fade).play();
  currentAction = nextAction;
}
// 角色 idle → run / character idle to run
switchTo(walkAction, 0.3);
```

### 5. 动画混合 / Blending

同一 mixer 下多个 action 同时播放，权重按比例混合。可实现"边走边挥手"——把 walk（权重 1）和 wave（权重 0.6）同时 play，mixer 自动加权合成。注意混合要求 clip 作用的骨骼/节点兼容。

Multiple actions on the same mixer play simultaneously, blended by weight. You can "walk while waving" — play walk (weight 1) and wave (weight 0.6) together; the mixer auto-composites. Ensure clips target compatible nodes/bones.

```js
walkAction.setEffectiveWeight(1.0);
waveAction.setEffectiveWeight(0.6).play();
```

### 6. 程序化动画 / Procedural Animation

并非所有动作都要烘焙成 clip。可在 `update` 里直接改 transform，再叠加 clip 结果。常见模式：clip 处理基础动作，程序代码处理瞄准/IK/响应输入。

Not every motion needs to be baked into a clip. You can modify transforms directly in `update`, then layer clip results on top. Common pattern: clips handle base motion, code handles aiming/IK/input response.

```js
// 先更新 mixer / update mixer first
mixer.update(delta);
// 再叠加程序化：头部朝向鼠标 / then procedural: head looks at mouse target
head.lookAt(mouseTarget);
```

## 关键 API / Key APIs

| API | 说明 / Description |
| --- | --- |
| `AnimationClip` | 一段动画数据，含若干轨道 / A piece of animation data with tracks |
| `KeyframeTrack` 及子类 | 单属性的关键帧序列 / Keyframe sequence for one property (`VectorKeyframeTrack`, `QuaternionKeyframeTrack`, `NumberKeyframeTrack`) |
| `AnimationMixer` | 驱动剪辑的播放器 / Player driving clips; call `update(delta)` per frame |
| `AnimationAction` | 剪辑的播放实例 / Playback instance: play/pause/stop/loop/fade/weight |
| `mixer.clipAction(clip)` | 为 clip 获取/创建 action / Get or create an action for a clip |
| `action.setLoop` | 设置循环模式与次数 / Set loop mode and count |
| `action.fadeIn / fadeOut` | 权重淡入淡出 / Ramp weight in/out |
| `action.setEffectiveWeight` | 设置有效权重（影响混合）/ Set effective blend weight |
| `action.getMixer` | 获取所属 mixer / Get owning mixer |

## 工作流 / Workflow

1. **获取 clip**：来自 `gltf.animations`，或用 `KeyframeTrack` + `AnimationClip` 手写。
2. **建 mixer**：`new AnimationMixer(animatedRoot)`，每个独立动画角色一个 mixer。
3. **建 action**：`mixer.clipAction(clip)`，配置 `loop`、`clampWhenFinished`、`timeScale`。
4. **播放**：`action.play()`。
5. **每帧**：`mixer.update(delta)`（在 `requestAnimationFrame` 或 `setAnimationLoop` 内）。
6. **切换**：`current.fadeOut(d); next.reset().fadeIn(d).play()`。
7. **混合**：多 action 同时 play，调 `setEffectiveWeight`。
8. **释放**：销毁角色时 `mixer.uncacheAction`/`uncacheRoot`。

## 常见陷阱 / Common Pitfalls

1. **忘记 `mixer.update(delta)`** / Forgetting `mixer.update(delta)` — 动画完全不动。
2. **轨道名路径错误** / Wrong track path — track 不解析，属性不变；检查名称是否相对 mixer 根、能否 `getObjectByName` 找到。
3. **delta 过大导致跳帧** / Huge delta causes popping — 切标签页后回来 delta 巨大，应 `Math.min(delta, 0.1)` 钳制。
4. **fadeIn 后没 stop 旧 action** / Old action not stopped after fade — 旧 action 权重到 0 仍在播放，浪费计算；fadeOut 完成后会自动停，但手动管理时注意。
5. **循环接缝不闭合** / Loop seam not closed — 首尾关键帧值不同，循环时跳变；确保首末帧一致或用 `LoopRepeat`。
6. **混合不兼容骨骼** / Blending incompatible rigs — 不同角色 clip 混用会找不到节点。
7. **timeScale 为 0 误以为暂停** / timeScale=0 ≠ paused — timeScale=0 时 mixer 仍推进但速度 0，且事件仍触发；用 `paused=true` 才是真正暂停。

## 调试技巧 / Debugging Tips

- `console.log(clip.tracks)` 看每条轨道名、类型、帧数。
- 用 `action.time` 显示当前播放时间，配 GUI 滑块手动 scrub。
- mixer 有事件：`mixer.addEventListener('loop', e => console.log('loop', e.action))`、`'finished'`。
- 动画不动时先确认：mixer 是否 update、action 是否 play、track 名是否匹配、clip 时长是否 > 0。
- 用 `skeleton.helper` 可视化骨骼，定位哪根骨头没动。

## 练习 / Exercises

1. 手写一个 `Wave` clip：右臂绕肩关节 `rotation[x]` 摆动 3 次，与 idle 同时播放做混合。
2. 实现 `crossFade(from, to, duration)` 通用切换函数，带 GUI 滑块调 duration。
3. 用 `setEffectiveWeight` 让角色边走边挥手，权重可视化调节。
4. 实现程序化瞄准：头部朝向鼠标射线落点，叠加在 idle 之上。
5. 给 mixer 加 `loop`/`finished` 事件监听，在控制台打印。
6. 实现"暂停/恢复"按钮，注意用 `paused` 而非 `timeScale`。

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/13-animation-system/index.html`](../../examples/13-animation-system/index.html)

```js
// 手写两个 clip：idle（呼吸）与 walk（腿摆动）
// Hand-author two clips: idle (breathing) and walk (leg swing)
function buildClips(root) {
  // idle：Body 上下浮动 / Body bobs up/down
  const idleTrack = new THREE.NumberKeyframeTrack(
    'Body.position', [0, 0.5, 1, 1.5, 2],
    [1.5, 1.55, 1.5, 1.45, 1.5]
  );
  const idle = new THREE.AnimationClip('Idle', 2, [idleTrack]);

  // walk：左右腿交替摆动 + 手臂反相 / Legs alternate, arms counter-swing
  const times = [0, 0.25, 0.5, 0.75, 1];
  const leftLeg  = new THREE.NumberKeyframeTrack('LeftLeg.rotation[x]',  times, [ 0.4,-0.4, 0.4,-0.4, 0.4]);
  const rightLeg = new THREE.NumberKeyframeTrack('RightLeg.rotation[x]', times, [-0.4, 0.4,-0.4, 0.4,-0.4]);
  const leftArm  = new THREE.NumberKeyframeTrack('LeftArm.rotation[x]',  times, [-0.3, 0.3,-0.3, 0.3,-0.3]);
  const rightArm = new THREE.NumberKeyframeTrack('RightArm.rotation[x]', times, [ 0.3,-0.3, 0.3,-0.3, 0.3]);
  const walk = new THREE.AnimationClip('Walk', 1, [leftLeg, rightLeg, leftArm, rightArm]);
  return { idle, walk };
}

const mixer = new THREE.AnimationMixer(root);
const clips = buildClips(root);
const actions = {
  idle: mixer.clipAction(clips.idle),
  walk: mixer.clipAction(clips.walk),
};
actions.idle.setLoop(THREE.LoopRepeat, Infinity);
actions.walk.setLoop(THREE.LoopRepeat, Infinity);
actions.idle.play();

let current = actions.idle;
function switchTo(name, fade = 0.3) {
  const next = actions[name];
  if (next === current) return;
  current.fadeOut(fade);
  next.reset().fadeIn(fade).play();
  current = next;
}

// 渲染循环 / render loop
renderer.setAnimationLoop(() => {
  const d = Math.min(clock.getDelta(), 0.1);
  mixer.update(d);
  controls.update();
  renderer.render(scene, camera);
});
```

## 参考资源 / References

- [Three.js Docs - AnimationSystem](https://threejs.org/docs/#manual/en/introduction/Animation-system)
- [Three.js Docs - AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- [Three.js Manual - Animations](https://threejs.org/manual/#en/animations)
- [Three.js Example - Animation keyframes](https://threejs.org/examples/#webgl_animation_keyframes)

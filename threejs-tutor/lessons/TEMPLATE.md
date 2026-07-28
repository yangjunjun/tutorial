# Lesson Writing Template / 课程编写模板

All lesson markdown files follow this structure. Each section has **bilingual** (中文 + English) content.

```
# {Title in Chinese} / {Title in English}

> 阶段 / Phase: {phase}
> 预计用时 / Estimated: {time}
> 难度 / Difficulty: {Beginner/Intermediate/Advanced}

## 概述 / Overview

{中文段落：本节解决什么问题，为什么重要}

{English paragraph: what this lesson covers and why it matters}

## 核心概念 / Core Concepts

### 1. {Concept} / {English}

{中文解释}

{English explanation}

\`\`\`js
// code example with bilingual comments
\`\`\`

### 2. ...

## 关键 API / Key APIs

| API | 说明 (CN) | Description (EN) |
| --- | --- | --- |
| ... | ... | ... |

## 数学/原理 / Math & Principles

{中文 + English formula explanation}

## 常见陷阱 / Common Pitfalls

1. {CN pitfall} / {EN}
2. ...

## 调试技巧 / Debugging Tips

- {tip CN / EN}

## 练习 / Exercises

1. {exercise CN / EN}
2. ...

## 示例代码 / Example

> 📁 可运行示例 / Runnable example: [`examples/XX-name/index.html`](../../examples/XX-name/index.html)

{core code snippet}

## 参考资源 / References

- [Three.js Docs - ...](https://threejs.org/docs/)
- [Three.js Manual - ...](https://threejs.org/manual/)
```

## Rules

1. Every section must have **both Chinese and English**.
2. Code blocks must have bilingual comments.
3. Each lesson links to its runnable example.
4. Use `THREE` global namespace (CDN build) in example HTML.
5. Example HTML loads Three.js r160+ from unpkg CDN via importmap + lil-gui for debug panel.

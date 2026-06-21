# 第 11 章：并发编程

> Java 天生支持多线程。本章学习 Java 并发编程的核心概念，从 Thread 到 CompletableFuture。

## 学习目标

- 理解 Java 线程模型
- 掌握 ExecutorService 线程池的使用
- 学会 CompletableFuture 异步编程
- 了解线程安全问题与解决方案

## 知识要点

### 1. Thread 基础

```java
// 方式 1: 继承 Thread
class MyThread extends Thread {
    public void run() { System.out.println("运行中"); }
}

// 方式 2: 实现 Runnable（推荐）
Runnable task = () -> System.out.println("运行中");
new Thread(task).start();
```

### 2. ExecutorService 线程池

```java
// 固定大小线程池
ExecutorService pool = Executors.newFixedThreadPool(4);

// 提交任务
Future<String> future = pool.submit(() -> {
    Thread.sleep(1000);
    return "完成";
});

String result = future.get();  // 阻塞等待结果
pool.shutdown();
```

### 3. CompletableFuture（异步编程）

```java
CompletableFuture.supplyAsync(() -> fetchFromDb())
    .thenApply(data -> transform(data))
    .thenAccept(result -> save(result))
    .exceptionally(e -> handleError(e));
```

### 4. 线程安全

- `synchronized` 关键字
- `ReentrantLock`
- `ConcurrentHashMap`
- `AtomicInteger` 原子变量

## 示例代码

| 文件 | 说明 |
|------|------|
| `ThreadDemo.java` | Thread 基础、Runnable、线程生命周期 |
| `ExecutorDemo.java` | 线程池、Future、批量任务 |
| `AsyncDemo.java` | CompletableFuture 异步链 |
| `ConcurrencySafety.java` | 线程安全：synchronized、Atomic、Concurrent |

## 编译与运行

```bash
cd 11-concurrency
javac -d out src/com/tutorial/concurrent/*.java
java -cp out com.tutorial.concurrent.ThreadDemo
java -cp out com.tutorial.concurrent.ExecutorDemo
java -cp out com.tutorial.concurrent.AsyncDemo
java -cp out com.tutorial.concurrent.ConcurrencySafety
```

## 下一章

[12 - 测试与安全 →](../12-testing/)

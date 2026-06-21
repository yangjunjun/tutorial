package com.tutorial.concurrent;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

/**
 * 并发编程综合演示
 */
public class ThreadDemo {

    public static void main(String[] args) throws Exception {
        basicThread();
        runnableDemo();
        executorDemo();
        futureDemo();
    }

    static void basicThread() throws InterruptedException {
        System.out.println("===== 基本 Thread =====");

        Thread t1 = new Thread(() -> {
            System.out.printf("  [%s] 线程启动%n", Thread.currentThread().getName());
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            System.out.printf("  [%s] 线程结束%n", Thread.currentThread().getName());
        }, "worker-1");

        t1.start();
        System.out.printf("  主线程等待 %s ...%n", t1.getName());
        t1.join();  // 等待 t1 完成
        System.out.println("  主线程继续");
    }

    static void runnableDemo() throws InterruptedException {
        System.out.println("\n===== Runnable =====");

        // 多个任务并行执行
        Runnable[] tasks = {
                () -> compute("任务A", 200),
                () -> compute("任务B", 150),
                () -> compute("任务C", 100),
        };

        Thread[] threads = new Thread[tasks.length];
        for (int i = 0; i < tasks.length; i++) {
            threads[i] = new Thread(tasks[i], "worker-" + (char)('A' + i));
            threads[i].start();
        }

        for (Thread t : threads) {
            t.join();
        }
        System.out.println("  所有任务完成");
    }

    static void executorDemo() throws Exception {
        System.out.println("\n===== ExecutorService 线程池 =====");

        ExecutorService pool = Executors.newFixedThreadPool(3);

        // 提交多个任务
        var futures = new java.util.ArrayList<Future<String>>();
        for (int i = 1; i <= 5; i++) {
            final int taskId = i;
            futures.add(pool.submit(() -> {
                Thread.sleep(100);
                return "任务-%d 完成 (线程: %s)".formatted(taskId,
                        Thread.currentThread().getName());
            }));
        }

        // 收集结果
        for (var future : futures) {
            System.out.printf("  %s%n", future.get());
        }

        pool.shutdown();
        System.out.println("  线程池已关闭");
    }

    static void futureDemo() throws Exception {
        System.out.println("\n===== CompletableFuture =====");

        // 异步链：获取 → 转换 → 消费
        CompletableFuture.supplyAsync(() -> {
                    System.out.println("  [1] 获取数据...");
                    sleep(200);
                    return 42;
                })
                .thenApply(data -> {
                    System.out.printf("  [2] 转换数据: %d × 2 = %d%n", data, data * 2);
                    return data * 2;
                })
                .thenApply(result -> {
                    System.out.printf("  [3] 格式化: 结果是 %d%n", result);
                    return "最终结果: " + result;
                })
                .thenAccept(result ->
                        System.out.printf("  [4] %s%n", result))
                .join();

        // 并行组合
        System.out.println("\n  并行执行:");
        CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> {
            sleep(200);
            return "数据A";
        });
        CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> {
            sleep(150);
            return "数据B";
        });

        f1.thenCombine(f2, (a, b) -> a + " + " + b)
                .thenAccept(result ->
                        System.out.printf("  合并结果: %s%n", result))
                .join();
    }

    static void compute(String name, long ms) {
        System.out.printf("  [%s] 开始 (%d ms)%n", name, ms);
        sleep(ms);
        System.out.printf("  [%s] 完成%n", name);
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}

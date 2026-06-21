package com.tutorial.concurrent;

import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 线程安全演示
 */
public class ConcurrencySafety {

    public static void main(String[] args) throws Exception {
        unsafeDemo();
        synchronizedDemo();
        atomicDemo();
        concurrentMapDemo();
    }

    static void unsafeDemo() throws InterruptedException {
        System.out.println("===== 不安全的计数器 =====");

        int[] counter = {0};  // 不安全！

        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 10000; i++) {
            pool.submit(() -> counter[0]++);
        }

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.printf("  期望: 10000, 实际: %d（竞态条件！）%n", counter[0]);
    }

    static void synchronizedDemo() throws InterruptedException {
        System.out.println("\n===== synchronized 安全计数器 =====");

        int[] counter = {0};
        Object lock = new Object();

        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 10000; i++) {
            pool.submit(() -> {
                synchronized (lock) {
                    counter[0]++;
                }
            });
        }

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.printf("  期望: 10000, 实际: %d%n", counter[0]);
    }

    static void atomicDemo() throws InterruptedException {
        System.out.println("\n===== AtomicInteger 原子操作 =====");

        AtomicInteger counter = new AtomicInteger(0);

        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 10000; i++) {
            pool.submit(counter::incrementAndGet);
        }

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.printf("  期望: 10000, 实际: %d%n", counter.get());
    }

    static void concurrentMapDemo() throws InterruptedException {
        System.out.println("\n===== ConcurrentHashMap =====");

        ConcurrentHashMap<String, AtomicInteger> wordCount = new ConcurrentHashMap<>();

        String[] words = "hello world hello java world hello java java".split(" ");

        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (int i = 0; i < 1000; i++) {
            pool.submit(() -> {
                for (String word : words) {
                    wordCount.computeIfAbsent(word, k -> new AtomicInteger(0))
                            .incrementAndGet();
                }
            });
        }

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println("  词频统计:");
        wordCount.forEach((word, count) ->
                System.out.printf("    %s: %d%n", word, count.get()));
    }
}

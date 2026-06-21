package com.tutorial.oop;

/**
 * 可绘制接口 - 演示 interface
 */
public interface Drawable {
    /**
     * 抽象方法：实现类必须实现
     */
    void draw();

    /**
     * 默认方法：提供默认实现，子类可选覆盖
     */
    default String describe() {
        return "这是一个可绘制的对象";
    }

    /**
     * 静态方法
     */
    static Drawable empty() {
        return () -> System.out.println("  （空白画布）");
    }
}

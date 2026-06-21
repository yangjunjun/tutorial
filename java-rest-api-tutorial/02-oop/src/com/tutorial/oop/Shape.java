package com.tutorial.oop;

/**
 * 形状抽象类 - 演示 abstract class
 * 
 * 抽象类 vs 接口：
 * - 抽象类可以有状态（字段）、构造方法
 * - 接口更适合定义行为契约
 */
public abstract class Shape implements Drawable {
    private String color;

    protected Shape(String color) {
        this.color = color;
    }

    public String getColor() { return color; }

    // 抽象方法：子类必须实现
    public abstract double area();
    public abstract double perimeter();

    // 具体方法：通用逻辑
    public void printInfo() {
        System.out.printf("  %s形状: 面积=%.2f, 周长=%.2f%n",
                color, area(), perimeter());
    }

    @Override
    public String describe() {
        return "%s的%s".formatted(color, getClass().getSimpleName());
    }
}

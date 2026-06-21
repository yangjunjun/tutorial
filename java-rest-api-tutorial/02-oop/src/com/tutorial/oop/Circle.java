package com.tutorial.oop;

/**
 * 圆形 - 同时继承抽象类和实现接口
 */
public class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    public double getRadius() { return radius; }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public double perimeter() {
        return 2 * Math.PI * radius;
    }

    @Override
    public void draw() {
        System.out.printf("  绘制一个%s的圆 (半径=%.1f)%n", getColor(), radius);
    }

    @Override
    public String toString() {
        return "Circle{color='%s', radius=%.1f}".formatted(getColor(), radius);
    }
}

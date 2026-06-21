package com.tutorial.oop;

/**
 * 猫 - 演示多态
 */
public class Cat extends Animal implements Drawable {
    private boolean indoor;

    public Cat(String name, int age, boolean indoor) {
        super(name, age);
        this.indoor = indoor;
    }

    @Override
    public String speak() {
        return "%s 说: 喵~".formatted(getName());
    }

    @Override
    public void draw() {
        System.out.println("  绘制一只%s猫 🐱".formatted(indoor ? "室内" : "室外"));
    }

    @Override
    public String toString() {
        return "Cat{name='%s', age=%d, indoor=%s}".formatted(getName(), getAge(), indoor);
    }
}

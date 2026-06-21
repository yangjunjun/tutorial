package com.tutorial.oop;

/**
 * 狗 - 演示继承与方法重写
 */
public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age);
        this.breed = breed;
    }

    public String getBreed() { return breed; }

    @Override
    public String speak() {
        return "%s（%s）说: 汪汪！".formatted(getName(), breed);
    }

    /**
     * Dog 独有的方法，不在父类中
     */
    public void fetch() {
        System.out.println(getName() + " 跑去捡球了！");
    }

    @Override
    public String toString() {
        return "Dog{name='%s', age=%d, breed='%s'}".formatted(getName(), getAge(), breed);
    }
}

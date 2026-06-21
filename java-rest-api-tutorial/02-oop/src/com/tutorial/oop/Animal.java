package com.tutorial.oop;

/**
 * 动物基类 - 演示封装
 */
public class Animal {
    private String name;
    private int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    /**
     * 可被子类重写的方法
     */
    public String speak() {
        return name + " 发出声音...";
    }

    @Override
    public String toString() {
        return "Animal{name='%s', age=%d}".formatted(name, age);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Animal other)) return false;
        return age == other.age && name.equals(other.name);
    }

    @Override
    public int hashCode() {
        return 31 * name.hashCode() + age;
    }
}

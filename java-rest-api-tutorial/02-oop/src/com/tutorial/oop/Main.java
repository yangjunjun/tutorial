package com.tutorial.oop;

import java.util.ArrayList;
import java.util.List;

/**
 * 综合演示：封装、继承、多态、接口、抽象类
 */
public class Main {

    public static void main(String[] args) {
        System.out.println("===== 1. 基本创建 =====");
        Animal dog = new Dog("旺财", 3, "金毛");
        Animal cat = new Cat("咪咪", 2, true);
        System.out.println(dog);
        System.out.println(cat);

        // 多态：同一方法，不同行为
        System.out.println("\n===== 2. 多态演示 =====");
        List<Animal> animals = new ArrayList<>();
        animals.add(new Dog("旺财", 3, "金毛"));
        animals.add(new Cat("咪咪", 2, true));
        animals.add(new Dog("大黄", 5, "柴犬"));
        animals.add(new Cat("花花", 1, false));

        for (Animal animal : animals) {
            // 运行时决定调用哪个 speak()
            System.out.println("  " + animal.speak());
        }

        // instanceof 模式匹配 (Java 16+)
        System.out.println("\n===== 3. 类型检查与向下转型 =====");
        for (Animal animal : animals) {
            if (animal instanceof Dog d) {
                System.out.printf("  %s 是 %s 犬种%n", d.getName(), d.getBreed());
            } else if (animal instanceof Cat c) {
                System.out.printf("  %s 是 %s猫%n", c.getName(),
                        c instanceof Cat cc && true ? "可爱的" : "");
            }
        }

        // 接口
        System.out.println("\n===== 4. 接口演示 =====");
        List<Drawable> drawables = new ArrayList<>();
        drawables.add(new Cat("小白", 1, true));
        drawables.add(new Circle("红色", 5.0));
        drawables.add(Drawable.empty());  // 静态工厂方法

        for (Drawable d : drawables) {
            System.out.println("  描述: " + d.describe());
            d.draw();
        }

        // 抽象类
        System.out.println("\n===== 5. 抽象类与形状 =====");
        List<Shape> shapes = new ArrayList<>();
        shapes.add(new Circle("蓝色", 3.0));
        shapes.add(new Circle("绿色", 7.5));

        for (Shape shape : shapes) {
            shape.printInfo();
        }

        // Record (Java 16+)
        System.out.println("\n===== 6. Record =====");
        record Point(double x, double y) {
            double distanceTo(Point other) {
                return Math.sqrt(Math.pow(x - other.x, 2) + Math.pow(y - other.y, 2));
            }
        }

        var p1 = new Point(0, 0);
        var p2 = new Point(3, 4);
        System.out.printf("  %s 到 %s 的距离 = %.2f%n", p1, p2, p1.distanceTo(p2));
    }
}

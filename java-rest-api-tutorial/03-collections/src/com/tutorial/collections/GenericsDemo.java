package com.tutorial.collections;

import java.util.List;

/**
 * 泛型演示：类、方法、通配符
 */
public class GenericsDemo {

    // ===== 泛型类 =====
    static class Box<T> {
        private T item;

        public void put(T item) { this.item = item; }
        public T get() { return item; }

        @Override
        public String toString() {
            return "Box{%s}".formatted(item);
        }
    }

    // ===== 多类型参数泛型类 =====
    static class Pair<K, V> {
        private final K key;
        private final V value;

        public Pair(K key, V value) {
            this.key = key;
            this.value = value;
        }

        public K getKey() { return key; }
        public V getValue() { return value; }

        @Override
        public String toString() {
            return "Pair{%s=%s}".formatted(key, value);
        }
    }

    // ===== 泛型方法 =====
    public static <T extends Comparable<T>> T findMax(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static <T> void printArray(T[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) System.out.print(", ");
            System.out.print(array[i]);
        }
        System.out.println("]");
    }

    // ===== 通配符 =====
    // 上界通配符：接受 Number 或其子类
    public static double sumOf(List<? extends Number> list) {
        return list.stream()
                .mapToDouble(Number::doubleValue)
                .sum();
    }

    // 下界通配符：接受 Integer 或其父类
    public static void addNumbers(List<? super Integer> list) {
        for (int i = 1; i <= 5; i++) {
            list.add(i);
        }
    }

    // ===== 泛型接口 =====
    interface Repository<T, ID> {
        T findById(ID id);
        List<T> findAll();
        void save(T entity);
    }

    // 模拟实现
    static class InMemoryUserRepo implements Repository<String, Integer> {
        private final java.util.Map<Integer, String> store = new java.util.HashMap<>();
        private int nextId = 1;

        @Override
        public String findById(Integer id) { return store.get(id); }

        @Override
        public List<String> findAll() { return List.copyOf(store.values()); }

        @Override
        public void save(String entity) { store.put(nextId++, entity); }
    }

    public static void main(String[] args) {
        boxDemo();
        pairDemo();
        methodDemo();
        wildcardDemo();
        repositoryDemo();
    }

    static void boxDemo() {
        System.out.println("===== 泛型类 Box =====");
        Box<String> stringBox = new Box<>();
        stringBox.put("Hello Generics");
        System.out.printf("String Box: %s%n", stringBox);

        Box<Integer> intBox = new Box<>();
        intBox.put(42);
        System.out.printf("Integer Box: %s%n", intBox);
    }

    static void pairDemo() {
        System.out.println("\n===== 泛型类 Pair =====");
        var p1 = new Pair<>("name", "张三");
        var p2 = new Pair<>(1, "一");
        System.out.println(p1);
        System.out.println(p2);
    }

    static void methodDemo() {
        System.out.println("\n===== 泛型方法 =====");
        System.out.printf("max(10, 20) = %d%n", findMax(10, 20));
        System.out.printf("max(\"abc\", \"xyz\") = %s%n", findMax("abc", "xyz"));

        printArray(new String[]{"A", "B", "C"});
        printArray(new Integer[]{1, 2, 3});
    }

    static void wildcardDemo() {
        System.out.println("\n===== 通配符 =====");

        // 上界
        List<Integer> ints = List.of(1, 2, 3);
        List<Double> doubles = List.of(1.5, 2.5, 3.5);
        System.out.printf("sum(ints) = %.1f%n", sumOf(ints));
        System.out.printf("sum(doubles) = %.1f%n", sumOf(doubles));

        // 下界
        List<Number> numbers = new java.util.ArrayList<>();
        addNumbers(numbers);
        System.out.println("addNumbers: " + numbers);
    }

    static void repositoryDemo() {
        System.out.println("\n===== 泛型接口 Repository =====");
        InMemoryUserRepo repo = new InMemoryUserRepo();
        repo.save("张三");
        repo.save("李四");
        repo.save("王五");

        System.out.println("所有用户: " + repo.findAll());
        System.out.printf("id=2: %s%n", repo.findById(2));
    }
}

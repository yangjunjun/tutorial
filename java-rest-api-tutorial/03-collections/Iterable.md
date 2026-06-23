# Java 自定义类实现 Iterable 完整示例
实现 `Iterable<T>` 核心两点：
1. 类实现 `Iterable<T>` 接口，重写 `iterator()` 方法，返回一个 `Iterator<T>`
2. 自定义迭代器（实现 `Iterator<T>`），实现 `hasNext()`、`next()`、`remove()`
实现后该类就能使用 **增强 for 循环 for-each** 遍历

## 完整代码示例
```java
import java.util.Iterator;

// 自定义容器类，存储字符串，实现 Iterable<String>
public class MyStringList implements Iterable<String> {
    // 底层存储数组
    private String[] data;
    // 当前有效元素个数
    private int size;

    // 构造方法，初始化容量
    public MyStringList(int capacity) {
        data = new String[capacity];
        size = 0;
    }

    // 添加元素方法
    public void add(String str) {
        if (size >= data.length) {
            throw new RuntimeException("容器已满");
        }
        data[size++] = str;
    }

    // 必须重写：返回迭代器对象
    @Override
    public Iterator<String> iterator() {
        // 返回自定义迭代器
        return new MyIterator();
    }

    // 内部自定义迭代器，实现 Iterator<String>
    private class MyIterator implements Iterator<String> {
        // 迭代指针，记录当前遍历到哪个下标
        private int index = 0;

        // 是否还有下一个元素
        @Override
        public boolean hasNext() {
            return index < size;
        }

        // 获取下一个元素
        @Override
        public String next() {
            if (!hasNext()) {
                throw new RuntimeException("无更多元素");
            }
            return data[index++];
        }

        // 可选：删除当前元素，这里简单抛出不支持操作
        @Override
        public void remove() {
            throw new UnsupportedOperationException("不支持删除");
        }
    }

    // 测试主方法
    public static void main(String[] args) {
        MyStringList list = new MyStringList(5);
        list.add("X");
        list.add("Y");
        list.add("Z");

        // 重点：实现 Iterable 后可以直接 for-each 遍历
        for (String item : list) {
            System.out.print(item + " ");
        }
        // 输出：X Y Z
    }
}
```

## 分步拆解讲解
### 1. 接口关系
- `Iterable<T>`：只有一个抽象方法 `Iterator<T> iterator()`
  作用：标记该对象**可被 for-each 循环遍历**
- `Iterator<T>`：迭代器，负责逐个取出元素，三个方法：
  - `hasNext()`：判断是否还有未遍历元素
  - `next()`：取出下一个元素，指针后移
  - `remove()`：删除刚取出的元素（可选实现）

### 2. 关键逻辑
1. `MyStringList` 是自定义集合，底层用数组存数据
2. 内部类 `MyIterator` 持有外部类的数组与遍历下标，控制遍历流程
3. `iterator()` 方法 new 一个迭代器返回，JDK 在执行 `for (String item : list)` 时会自动调用这个方法拿到迭代器遍历

### 3. 等价底层逻辑
增强 for 循环本质等价于手动迭代器调用：
```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String item = it.next();
    System.out.print(item + " ");
}
```

## 泛型通用版（适配任意类型）
如果想让容器存任意类型，把泛型抽出来：
```java
import java.util.Iterator;

public class MyArrayList<T> implements Iterable<T> {
    private Object[] arr;
    private int size;

    public MyArrayList(int cap) {
        arr = new Object[cap];
    }

    public void add(T val) {
        arr[size++] = val;
    }

    @Override
    public Iterator<T> iterator() {
        return new InnerIter();
    }

    private class InnerIter implements Iterator<T> {
        int cur = 0;
        @Override
        public boolean hasNext() {
            return cur < size;
        }
        @Override
        @SuppressWarnings("unchecked")
        public T next() {
            return (T) arr[cur++];
        }
    }

    public static void main(String[] args) {
        MyArrayList<Integer> nums = new MyArrayList<>(3);
        nums.add(10);
        nums.add(20);
        for (Integer n : nums) {
            System.out.println(n);
        }
    }
}
```
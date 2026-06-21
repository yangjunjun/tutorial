package com.tutorial.functional;

import java.util.*;
import java.util.function.*;

/**
 * 四大函数式接口实战演示
 */
public class FunctionalInterfaces {

    public static void main(String[] args) {
        functionDemo();
        predicateDemo();
        consumerDemo();
        supplierDemo();
        compositionDemo();
        optionalDemo();
    }

    static void functionDemo() {
        System.out.println("===== Function<T, R> =====");

        // 基本使用：String → Integer
        Function<String, Integer> strLen = String::length;
        System.out.printf("  \"Hello\".length() = %d%n", strLen.apply("Hello"));

        // andThen：先执行自己，再执行下一个
        Function<String, String> trim = String::trim;
        Function<String, String> upper = String::toUpperCase;
        Function<String, String> process = trim.andThen(upper);
        System.out.printf("  trim.andThen(upper): '%s'%n", process.apply("  hello world  "));

        // compose：先执行参数，再执行自己
        Function<String, String> process2 = upper.compose(trim);
        System.out.printf("  upper.compose(trim): '%s'%n", process2.apply("  hello world  "));

        // identity
        Function<String, String> identity = Function.identity();
        System.out.printf("  identity: '%s'%n", identity.apply("不变"));

        // 实战：字段提取器
        record User(String name, String email) {}
        Function<User, String> getName = User::name;
        Function<User, String> getDomain = u -> u.email().split("@")[1];

        var user = new User("张三", "zhangsan@gmail.com");
        System.out.printf("  姓名: %s, 邮箱域名: %s%n", getName.apply(user), getDomain.apply(user));
    }

    static void predicateDemo() {
        System.out.println("\n===== Predicate<T> =====");

        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositive = n -> n > 0;

        // and / or / negate
        Predicate<Integer> isEvenAndPositive = isEven.and(isPositive);
        Predicate<Integer> isEvenOrPositive = isEven.or(isPositive);
        Predicate<Integer> isOdd = isEven.negate();

        List<Integer> numbers = List.of(-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6);

        System.out.println("  偶数且正数: " + filter(numbers, isEvenAndPositive));
        System.out.println("  偶数或正数: " + filter(numbers, isEvenOrPositive));
        System.out.println("  奇数: " + filter(numbers, isOdd));

        // 实战：任务过滤器
        record Task(String title, boolean done, int priority) {}
        Predicate<Task> isDone = Task::done;
        Predicate<Task> isUrgent = t -> t.priority() >= 4;

        var tasks = List.of(
                new Task("A", true, 5), new Task("B", false, 3),
                new Task("C", true, 2), new Task("D", false, 5)
        );

        System.out.println("  已完成且紧急: " + filter(tasks, isDone.and(isUrgent)));
        System.out.println("  未完成或紧急: " + filter(tasks, isDone.negate().or(isUrgent)));
    }

    static void consumerDemo() {
        System.out.println("\n===== Consumer<T> =====");

        // 基本使用
        Consumer<String> print = s -> System.out.printf("  [%s]%n", s);
        print.accept("Hello Consumer");

        // andThen：链式消费
        Consumer<String> log = s -> System.out.printf("  [LOG] %s%n", s);
        Consumer<String> both = print.andThen(log);
        both.accept("链式调用");

        // 实战：事件监听器
        class EventBus {
            private final List<Consumer<String>> listeners = new ArrayList<>();

            void subscribe(Consumer<String> listener) { listeners.add(listener); }
            void publish(String event) {
                listeners.forEach(l -> l.accept(event));
            }
        }

        var bus = new EventBus();
        bus.subscribe(e -> System.out.printf("  [通知] %s%n", e));
        bus.subscribe(e -> System.out.printf("  [日志] %s%n", e));
        bus.publish("任务已创建");
    }

    static void supplierDemo() {
        System.out.println("\n===== Supplier<T> =====");

        // 基本使用
        Supplier<Double> random = Math::random;
        System.out.printf("  随机数: %.4f%n", random.get());

        // 延迟初始化
        Supplier<UUID> uuidGen = UUID::randomUUID;
        System.out.printf("  UUID: %s%n", uuidGen.get());

        // 工厂模式
        record Task(String id, String title) {}
        Function<String, Task> taskFactory = title ->
                new Task(uuidGen.get().toString().substring(0, 8), title);

        System.out.printf("  新任务: %s%n", taskFactory.apply("学习 Supplier"));
    }

    static void compositionDemo() {
        System.out.println("\n===== 组合实战 =====");

        // 模拟 REST API 中的请求处理管道
        record Request(String method, String path, String body) {}
        record Response(int status, String body) {}

        // 管道：验证 → 处理 → 格式化
        Function<Request, Request> validate = req -> {
            if (req.path() == null || req.path().isBlank())
                throw new IllegalArgumentException("路径不能为空");
            return req;
        };

        Function<Request, Response> handle = req -> {
            if ("GET".equals(req.method()))
                return new Response(200, "获取数据成功");
            if ("POST".equals(req.method()))
                return new Response(201, "创建成功: " + req.body());
            return new Response(405, "不支持的方法");
        };

        Function<Response, String> format = resp ->
                "[%d] %s".formatted(resp.status(), resp.body());

        // 组合管道
        Function<Request, String> pipeline = validate.andThen(handle).andThen(format);

        var req1 = new Request("GET", "/api/tasks", "");
        var req2 = new Request("POST", "/api/tasks", "{\"title\":\"新任务\"}");

        System.out.printf("  %s%n", pipeline.apply(req1));
        System.out.printf("  %s%n", pipeline.apply(req2));
    }

    static void optionalDemo() {
        System.out.println("\n===== Optional =====");

        // 创建
        Optional<String> present = Optional.of("有值");
        Optional<String> empty = Optional.empty();
        Optional<String> nullable = Optional.ofNullable(null);

        System.out.printf("  present: %s%n", present);
        System.out.printf("  empty: %s%n", empty);
        System.out.printf("  nullable: %s%n", nullable);

        // 安全取值
        System.out.printf("  orElse: %s%n", empty.orElse("默认值"));
        System.out.printf("  orElseGet: %s%n", empty.orElseGet(() -> "懒加载默认值"));

        // 链式操作
        Optional<String> result = Optional.of("  Hello World  ")
                .map(String::trim)
                .filter(s -> s.length() > 5)
                .map(String::toUpperCase);
        System.out.printf("  链式: %s%n", result.orElse("不满足条件"));

        // ifPresent
        Optional.of("有值").ifPresent(v -> System.out.printf("  ifPresent: %s%n", v));
        empty.ifPresent(v -> System.out.println("  不会执行"));

        // 实战：模拟查找用户
        record User(String name, String email) {}
        Map<String, User> users = Map.of(
                "alice", new User("Alice", "alice@example.com")
        );

        Optional<User> found = Optional.ofNullable(users.get("alice"));
        Optional<User> notFound = Optional.ofNullable(users.get("bob"));

        found.ifPresent(u -> System.out.printf("  找到: %s <%s>%n", u.name(), u.email()));
        System.out.printf("  未找到: %s%n", notFound.map(User::name).orElse("用户不存在"));
    }

    // 辅助方法
    static <T> List<T> filter(List<T> list, Predicate<T> predicate) {
        return list.stream().filter(predicate).toList();
    }
}

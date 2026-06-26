## Java 编译运行与包机制系统介绍

### 一、Java 程序的编译与运行

#### 1.1 整体流程

```
源代码 (.java)  ──javac──>  字节码 (.class)  ──JVM──>  执行
```

Java 程序分为两个阶段：

- **编译期**：`javac` 编译器把 `.java` 源文件编译成 `.class` 字节码文件。
- **运行期**：JVM（Java 虚拟机）加载并执行 `.class` 文件。

字节码是平台无关的中间格式，这就是"一次编写，到处运行"的基础。

#### 1.2 一个最简单的例子

```java
// 文件：Hello.java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

编译：

```bash
javac Hello.java
```

这一步在**同目录**下生成 `Hello.class`。

运行：

```bash
java Hello
```

注意：`java` 命令后面跟的是**类名**（不带 `.class` 后缀），不是文件名。

#### 1.3 Classpath（类路径）

Classpath 告诉 JVM **去哪里找 .class 文件**，这是理解 Java 依赖管理的关键。

```bash
# 告诉 JVM 去当前目录和 lib/tools.jar 里找类
java -cp .;lib/tools.jar com.example.Main
```

`-cp` 后面可以跟多个路径（Windows 用 `;` 分隔，Linux/Mac 用 `:` 分隔），路径可以是目录，也可以是 JAR 文件。JVM 会按顺序在这些路径中搜索需要的类。

如果不指定 `-cp`，默认 classpath 是当前目录 `.`。

#### 1.4 JAR 是什么

JAR（Java ARchive）本质上就是一个 ZIP 压缩包，里面装了一堆 `.class` 文件，可能还有一个 `META-INF/MANIFEST.MF` 元信息文件。

```bash
# 查看 JAR 内容
jar tf jackson-databind-2.15.2.jar

# 创建 JAR
jar cf mylib.jar -C build/classes .

# 运行可执行 JAR（主类写在 MANIFEST.MF 里）
java -jar myapp.jar
```

所以一个 JAR 就是"把很多类打包成一个文件方便分发"，仅此而已。

---

### 二、Package（包）机制

#### 2.1 包是什么

包（package）是 Java 的**命名空间机制**，用来解决类名冲突问题。两个不同包下可以有同名的类：

- `java.util.Date`
- `java.sql.Date`

这是两个完全不同的类，互不干扰。

#### 2.2 package 声明

```java
package com.example.service;

public class UserService {
    // ...
}
```

`package` 声明必须是 `.java` 文件的**第一行有效代码**（注释除外）。它声明了这个类"属于哪个包"。

一个类只能属于一个包。如果不写 `package` 声明，这个类属于**默认包**（default package），在正式项目中不建议这样做。

#### 2.3 包名与目录结构的对应关系

这是最容易让人困惑的地方，规则其实很简单：

**包名中的每个点，对应文件系统中的一个目录层级。**

```java
package com.example.service;
public class UserService { }
```

这个类的 `.class` 文件必须放在：

```
com/example/service/UserService.class
```

注意：**编译时不强制要求 `.java` 文件也按这个结构放置**（javac 不会检查），但**运行时 JVM 会严格按这个结构去找 `.class` 文件**。

不过，实际上所有项目都约定把 `.java` 源文件也按包结构放：

```
src/
  com/example/service/UserService.java
  com/example/model/User.java
```

编译后：

```
build/classes/
  com/example/service/UserService.class
  com/example/model/User.class
```

#### 2.4 包的命名约定

```
反向域名.项目名.模块名
```

比如 `com.fasterxml.jackson.databind`：

| 部分 | 含义 |
|------|------|
| `com.fasterxml` | 公司的反向域名（fasterxml.com） |
| `jackson` | 项目名 |
| `databind` | 模块名 |

这只是一个**命名约定**，不是语法要求。目的是让不同公司的包名不会撞车。

#### 2.5 包是扁平的

Java 中的包没有真正的父子关系。以下三个包完全独立：

```
com.fasterxml.jackson
com.fasterxml.jackson.core
com.fasterxml.jackson.databind
```

`import com.fasterxml.jackson.*` **只会**引入 `com.fasterxml.jackson` 这个包下的类，**不会**引入 `com.fasterxml.jackson.core` 或 `com.fasterxml.jackson.databind` 下的任何东西。通配符 `*` 只匹配当前包下的类，不递归子包。

---

### 三、import 语句

#### 3.1 三种写法

```java
// 1. 引入具体类（最常用）
import com.fasterxml.jackson.databind.ObjectMapper;

// 2. 通配符引入（引入包下所有类，不含子包）
import com.fasterxml.jackson.databind.*;

// 3. 静态引入（引入类的静态方法/字段）
import static java.lang.Math.PI;
import static java.util.Collections.emptyList;
```

通配符引入和逐个引入**在运行时没有任何区别**，编译器都会解析成具体类的引用，不会引入多余的东西。区别只在于源码层面的可读性和可能的类名冲突。

#### 3.2 import 的工作原理

import 不是"加载"或"引入代码"，它只是一个**缩写机制**。

没有 import：

```java
com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
```

有了 import：

```java
import com.fasterxml.jackson.databind.ObjectMapper;
// ...
ObjectMapper mapper = new ObjectMapper();
```

仅此而已。import 让编译器知道 `ObjectMapper` 这个短名字对应哪个全限定类名。它不影响运行时性能，不引入额外代码。

#### 3.3 同包类不需要 import

同一个包下的类可以直接互相引用，不需要 import：

```java
package com.example.service;

// UserService 和 OrderService 在同一个包里，可以直接用
public class UserService {
    private OrderService orderService;
}
```

#### 3.4 java.lang 包自动引入

`java.lang` 包下的类（如 `String`、`Integer`、`System`、`Math`）不需要 import，编译器自动处理。

---

### 四、把编译运行和包串起来

用一个完整例子把上面的概念串在一起。

#### 项目结构

```
project/
├── lib/
│   └── utils.jar          ← 第三方依赖
└── src/
    └── com/example/
        ├── Main.java
        └── service/
            └── UserService.java
```

#### UserService.java

```java
package com.example.service;

public class UserService {
    public String getUserName() {
        return "Alice";
    }
}
```

#### Main.java

```java
package com.example;

import com.example.service.UserService;

public class Main {
    public static void main(String[] args) {
        UserService service = new UserService();
        System.out.println(service.getUserName());
    }
}
```

#### 编译

```bash
# 在 project 目录下
javac -d build/classes -cp lib/utils.jar src/com/example/service/UserService.java src/com/example/Main.java
```

- `-d build/classes`：编译输出目录（`.class` 会按包结构自动生成子目录）
- `-cp lib/utils.jar`：编译时需要的外部依赖

编译后：

```
build/classes/
  com/example/Main.class
  com/example/service/UserService.class
```

#### 运行

```bash
java -cp build/classes;lib/utils.jar com.example.Main
```

- `-cp` 告诉 JVM 去哪里找 `.class` 文件
- `com.example.Main` 是要执行的主类（全限定类名）

---

### 五、Maven 如何简化这一切

手动管理 classpath 和依赖非常繁琐，Maven 把这些全自动化了：

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>
```

你只需要声明这一条，Maven 会：

1. 从远程仓库下载 `jackson-databind-2.15.2.jar`
2. 自动下载它依赖的 `jackson-core` 和 `jackson-annotations`（传递依赖）
3. 编译时自动把这些 JAR 加到 classpath
4. 运行时同样自动配置 classpath

你不再需要手动 `jar tf` 看内容，不需要写 `-cp` 参数，不需要担心依赖链条断裂。这就是为什么现代 Java 项目几乎都用 Maven 或 Gradle。

---

### 六、核心概念速查表

| 概念 | 作用 | 类比 |
|------|------|------|
| package | 类的命名空间，防止命名冲突 | Python 的模块/包 |
| import | 类名缩写，让编译器知道短名字对应哪个全限定名 | Python 的 `from X import Y` |
| classpath | 告诉 JVM 去哪里找 .class 文件 | Python 的 `sys.path` |
| JAR | 把多个 .class 文件打包成一个文件分发 | Python 的 wheel (.whl) |
| Maven/Gradle | 自动化依赖管理和构建 | pip / npm |
| 传递依赖 | 你依赖的库自己也依赖别的库，自动一并拉取 | pip 的依赖解析 |

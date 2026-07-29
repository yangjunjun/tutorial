# 计算机科学核心原理与概念 / Core Principles and Concepts of Computer Science

## 文档定位 / Purpose

计算机科学（Computer Science, CS）研究信息如何表示、计算如何进行、程序如何构造，以及计算系统如何可靠、高效、安全地协作。本文件是一份中英文知识地图，系统列举计算机科学的主要原理与概念。

Computer Science studies how information is represented, how computation is performed, how programs are constructed, and how computing systems cooperate reliably, efficiently, and securely. This document is a bilingual knowledge map of its major principles and concepts.

## 总体知识地图 / High-Level Knowledge Map

```text
计算机科学 Computer Science
├── 数学与理论基础 Mathematical and Theoretical Foundations
├── 信息与数据表示 Information and Data Representation
├── 算法与数据结构 Algorithms and Data Structures
├── 计算机组成与体系结构 Computer Organization and Architecture
├── 操作系统 Operating Systems
├── 编程语言与编译 Programming Languages and Compilers
├── 软件工程 Software Engineering
├── 数据库与信息系统 Databases and Information Systems
├── 计算机网络与 Web Computer Networks and the Web
├── 分布式系统 Distributed Systems
├── 计算机安全 Cybersecurity
├── 人工智能与机器学习 Artificial Intelligence and Machine Learning
├── 图形学、人机交互与多媒体 Graphics, HCI, and Multimedia
└── 计算伦理与社会影响 Computing Ethics and Social Impact
```

---

## 1. 数学与理论基础 / Mathematical and Theoretical Foundations

### 1.1 离散数学 / Discrete Mathematics

离散数学研究有限或可数的离散对象，是算法、数据结构、编程语言和网络的数学基础。

Discrete mathematics studies finite or countable structures and provides the mathematical foundation for algorithms, data structures, programming languages, and networks.

主要内容 / Main topics:

- 集合论 / Set Theory
- 数理逻辑 / Mathematical Logic
- 组合数学 / Combinatorics
- 图论 / Graph Theory
- 数论 / Number Theory
- 递推关系 / Recurrence Relations

### 1.2 集合 / Set

集合是一组互不重复对象的整体。并集、交集、差集和笛卡尔积被广泛用于描述类型、关系和数据库查询。

A set is a collection of distinct objects. Union, intersection, difference, and Cartesian product are widely used to describe types, relations, and database queries.

### 1.3 关系与函数 / Relations and Functions

关系描述对象之间的联系；函数将定义域中的每个输入映射到值域中的唯一输出。

A relation describes associations between objects. A function maps every input in its domain to exactly one output in its codomain.

### 1.4 命题逻辑与谓词逻辑 / Propositional and Predicate Logic

命题逻辑研究真假命题及其组合；谓词逻辑进一步表达对象、属性和量词，是程序验证和数据库查询的重要基础。

Propositional logic studies true/false statements and their composition. Predicate logic adds objects, properties, and quantifiers, forming a basis for program verification and database queries.

常见逻辑运算 / Common logical operations:

- 与 / AND
- 或 / OR
- 非 / NOT
- 异或 / XOR
- 蕴含 / Implication
- 全称量词 / Universal Quantifier
- 存在量词 / Existential Quantifier

### 1.5 布尔代数 / Boolean Algebra

布尔代数使用真和假或 1 和 0 进行运算，是数字电路、条件判断和位运算的理论基础。

Boolean algebra operates on true/false or 1/0 values and underlies digital circuits, conditional logic, and bitwise operations.

### 1.6 证明 / Proof

证明用于严格说明一个命题必然成立。

A proof rigorously demonstrates that a proposition must be true.

常见方法 / Common methods:

- 直接证明 / Direct Proof
- 反证法 / Proof by Contradiction
- 逆否证明 / Proof by Contraposition
- 数学归纳法 / Mathematical Induction
- 构造性证明 / Constructive Proof

### 1.7 概率与统计 / Probability and Statistics

概率描述不确定性，统计从数据中估计规律。它们是随机算法、网络性能、机器学习和实验分析的基础。

Probability models uncertainty, while statistics infers patterns from data. They support randomized algorithms, network performance analysis, machine learning, and experimentation.

### 1.8 图 / Graph

图由顶点和边组成，可表示道路、社交关系、依赖、网络拓扑和程序控制流。

A graph consists of vertices and edges and can represent roads, social relationships, dependencies, network topology, and program control flow.

常见类型 / Common types:

- 有向图与无向图 / Directed and Undirected Graphs
- 加权图 / Weighted Graph
- 无环图 / Acyclic Graph
- 有向无环图 / Directed Acyclic Graph, DAG
- 树 / Tree

---

## 2. 信息与数据表示 / Information and Data Representation

### 2.1 信息 / Information

信息是能够减少不确定性的内容。计算机通过符号和编码表示、存储、传输与处理信息。

Information is content that reduces uncertainty. Computers represent, store, transmit, and process it through symbols and encodings.

### 2.2 比特与字节 / Bit and Byte

比特是最小的信息单位，取值为 0 或 1。一个字节通常由 8 个比特组成。

A bit is the smallest unit of information and has a value of 0 or 1. A byte usually consists of eight bits.

```text
1 Byte = 8 bits
1 KiB = 1024 Bytes
1 MiB = 1024 KiB
1 GiB = 1024 MiB
```

### 2.3 二进制 / Binary

二进制仅使用 0 和 1 表示数值，适合由开关状态构成的数字电路。

Binary uses only 0 and 1 to represent values and fits digital circuits built from switching states.

其他常见进制 / Other common numeral systems:

- 十进制 / Decimal
- 十六进制 / Hexadecimal
- 八进制 / Octal

### 2.4 数值表示 / Numeric Representation

整数通常使用补码表示；实数通常使用 IEEE 754 浮点格式表示。

Integers are commonly represented using two's complement, while real numbers are commonly represented using the IEEE 754 floating-point format.

关键概念 / Key concepts:

- 有符号与无符号整数 / Signed and Unsigned Integers
- 溢出 / Overflow
- 浮点误差 / Floating-Point Error
- 精度 / Precision
- 舍入 / Rounding

### 2.5 字符编码 / Character Encoding

字符编码定义字符与数字之间的映射。

Character encoding defines a mapping between characters and numbers.

常见编码 / Common encodings:

- ASCII
- Unicode
- UTF-8
- UTF-16

UTF-8 是可变长度 Unicode 编码，也是 Web 和现代软件最常用的文本编码。

UTF-8 is a variable-length Unicode encoding and the dominant text encoding for the Web and modern software.

### 2.6 数据序列化 / Data Serialization

序列化把内存中的数据结构转换为可存储或传输的格式；反序列化执行逆过程。

Serialization converts in-memory data structures into a format suitable for storage or transmission; deserialization performs the reverse operation.

常见格式 / Common formats:

- JSON
- XML
- YAML
- Protocol Buffers
- MessagePack

### 2.7 信息熵 / Information Entropy

信息熵衡量随机变量的不确定程度，是数据压缩和信息论的重要概念。

Information entropy measures the uncertainty of a random variable and is fundamental to data compression and information theory.

### 2.8 压缩 / Compression

- 无损压缩 / Lossless Compression：可以完整恢复原始数据，如 ZIP、PNG。
- 有损压缩 / Lossy Compression：牺牲部分信息换取更高压缩率，如 JPEG、MP3。

Lossless compression preserves all original data, while lossy compression discards some information for a higher compression ratio.

---

## 3. 计算理论 / Theory of Computation

### 3.1 计算 / Computation

计算是按照明确规则对符号或状态进行变换的过程。

Computation is the transformation of symbols or states according to well-defined rules.

### 3.2 算法 / Algorithm

算法是解决一类问题的有限、明确、可执行步骤。

An algorithm is a finite, unambiguous, and executable sequence of steps for solving a class of problems.

一个良好算法通常应具备 / A sound algorithm usually has:

- 有限性 / Finiteness
- 明确性 / Definiteness
- 输入与输出 / Inputs and Outputs
- 可执行性 / Effectiveness
- 正确性 / Correctness

### 3.3 自动机 / Automaton

自动机是用于描述计算过程的抽象机器。

An automaton is an abstract machine used to model computation.

常见模型 / Common models:

- 有限状态机 / Finite-State Machine
- 下推自动机 / Pushdown Automaton
- 图灵机 / Turing Machine

### 3.4 形式语言 / Formal Language

形式语言由字母表、字符串和生成规则构成，用于描述程序语法、协议和计算问题。

A formal language consists of an alphabet, strings, and production rules and is used to describe programming syntax, protocols, and computational problems.

### 3.5 图灵机 / Turing Machine

图灵机是一种理论计算模型，用无限纸带、读写头和状态转换规则描述通用计算。

A Turing machine is a theoretical model of general computation using an unbounded tape, a read/write head, and state-transition rules.

### 3.6 可计算性 / Computability

可计算性研究哪些问题原则上能被算法解决。

Computability studies which problems can, in principle, be solved by algorithms.

### 3.7 停机问题 / Halting Problem

停机问题询问：是否存在一个通用算法，能判断任意程序在任意输入下最终是否停止。图灵证明这样的通用算法不存在。

The halting problem asks whether a universal algorithm can determine if any program halts on any input. Turing proved that no such general algorithm exists.

### 3.8 可判定与不可判定问题 / Decidable and Undecidable Problems

- 可判定问题：存在总能终止并给出正确答案的算法。
- 不可判定问题：不存在满足该条件的通用算法。

A decidable problem has an algorithm that always terminates with the correct answer. An undecidable problem has no such general algorithm.

### 3.9 计算复杂性 / Computational Complexity

计算复杂性研究解决问题所需的时间和空间资源如何随输入规模增长。

Computational complexity studies how the time and space required to solve a problem grow with input size.

### 3.10 P、NP 与 NP 完全 / P, NP, and NP-Complete

- P：可由确定性算法在多项式时间内解决的问题。
- NP：给定候选答案后，可在多项式时间内验证的问题。
- NP-hard：至少与所有 NP 问题一样困难。
- NP-complete：同时属于 NP 和 NP-hard。

- P contains problems solvable in polynomial time.
- NP contains problems whose proposed solutions can be verified in polynomial time.
- NP-hard problems are at least as hard as every problem in NP.
- NP-complete problems are both in NP and NP-hard.

P 是否等于 NP 仍是计算机科学最重要的未解决问题之一。

Whether P equals NP remains one of the most important open problems in computer science.

---

## 4. 算法分析与设计 / Algorithm Analysis and Design

### 4.1 正确性 / Correctness

算法正确性表示算法对所有符合前提的输入都能产生满足规格的输出。

Algorithm correctness means that the algorithm produces an output satisfying its specification for every valid input.

### 4.2 时间复杂度 / Time Complexity

时间复杂度描述运行时间随输入规模增长的趋势。

Time complexity describes how execution time grows with input size.

常见复杂度 / Common complexity classes:

| 复杂度 / Complexity | 中文说明 | English Description |
|---|---|---|
| `O(1)` | 常数时间 | Constant time |
| `O(log n)` | 对数时间 | Logarithmic time |
| `O(n)` | 线性时间 | Linear time |
| `O(n log n)` | 线性对数时间 | Linearithmic time |
| `O(n²)` | 平方时间 | Quadratic time |
| `O(2ⁿ)` | 指数时间 | Exponential time |
| `O(n!)` | 阶乘时间 | Factorial time |

### 4.3 空间复杂度 / Space Complexity

空间复杂度描述算法额外使用的内存如何随输入规模增长。

Space complexity describes how an algorithm's additional memory usage grows with input size.

### 4.4 渐近分析 / Asymptotic Analysis

- 大 O / Big O：渐近上界。
- 大 Ω / Big Omega：渐近下界。
- 大 Θ / Big Theta：紧确渐近界。

- Big O expresses an asymptotic upper bound.
- Big Omega expresses an asymptotic lower bound.
- Big Theta expresses a tight asymptotic bound.

### 4.5 递归 / Recursion

递归通过调用自身解决规模更小的同类问题，必须包含终止条件。

Recursion solves a problem by invoking itself on smaller instances and must include a base case.

### 4.6 分治 / Divide and Conquer

将问题拆成独立子问题，分别解决后合并结果。例如归并排序和快速排序。

Divide and conquer splits a problem into independent subproblems, solves them, and combines their results. Merge sort and quicksort are examples.

### 4.7 动态规划 / Dynamic Programming

动态规划保存重叠子问题的结果，避免重复计算，适合具有最优子结构的问题。

Dynamic programming stores solutions to overlapping subproblems and applies to problems with optimal substructure.

两种形式 / Two common forms:

- 记忆化搜索 / Memoization
- 自底向上制表 / Bottom-Up Tabulation

### 4.8 贪心算法 / Greedy Algorithm

贪心算法每一步选择当前看来最优的方案。只有当问题具备特定性质时，局部最优才能导出全局最优。

A greedy algorithm chooses the locally best option at each step. It reaches a global optimum only when the problem has the required structural properties.

### 4.9 回溯 / Backtracking

回溯枚举候选解，发现当前选择不可能成功时撤销并尝试其他路径。

Backtracking explores candidate solutions and abandons a path when it cannot lead to a valid solution.

### 4.10 随机算法 / Randomized Algorithm

随机算法在执行过程中使用随机选择，以改善平均性能或简化设计。

A randomized algorithm uses random choices during execution to improve expected performance or simplify its design.

### 4.11 启发式算法 / Heuristic Algorithm

启发式算法在难以精确求解的问题上快速获得较好但不保证最优的结果。

A heuristic algorithm quickly finds a useful, but not necessarily optimal, solution to a difficult problem.

---

## 5. 数据结构 / Data Structures

### 5.1 抽象数据类型 / Abstract Data Type, ADT

抽象数据类型定义数据支持哪些操作，而不规定底层如何实现。

An abstract data type defines supported operations without specifying their implementation.

### 5.2 数组 / Array

数组在连续内存中存储同类元素，支持常数时间随机访问，但中间插入和删除通常较慢。

An array stores homogeneous elements in contiguous memory. It supports constant-time random access, while middle insertion and deletion are usually expensive.

### 5.3 链表 / Linked List

链表通过节点指针连接元素，插入和删除灵活，但随机访问较慢。

A linked list connects elements through node references. It supports flexible insertion and deletion but has slow random access.

### 5.4 栈 / Stack

栈遵循后进先出原则，常用于函数调用、表达式求值和撤销操作。

A stack follows Last In, First Out (LIFO) and is used for function calls, expression evaluation, and undo operations.

### 5.5 队列 / Queue

队列遵循先进先出原则，常用于任务调度、消息处理和广度优先搜索。

A queue follows First In, First Out (FIFO) and is used in task scheduling, message processing, and breadth-first search.

### 5.6 哈希表 / Hash Table

哈希表通过哈希函数将键映射到存储位置，平均可以实现常数时间查询、插入和删除。

A hash table maps keys to storage locations using a hash function and offers average constant-time lookup, insertion, and deletion.

关键问题 / Key issues:

- 哈希冲突 / Hash Collision
- 拉链法 / Separate Chaining
- 开放寻址 / Open Addressing
- 负载因子 / Load Factor

### 5.7 树 / Tree

树表示具有层级关系的数据。

A tree represents hierarchical data.

常见树结构 / Common tree structures:

- 二叉树 / Binary Tree
- 二叉搜索树 / Binary Search Tree
- 平衡树 / Balanced Tree
- AVL 树 / AVL Tree
- 红黑树 / Red-Black Tree
- B 树与 B+ 树 / B-Tree and B+ Tree
- Trie 前缀树 / Trie

### 5.8 堆 / Heap

堆是一种满足堆序性质的树形结构，常用于实现优先队列。

A heap is a tree-based structure satisfying the heap property and is commonly used to implement priority queues.

### 5.9 图的数据结构 / Graph Data Structures

图常用邻接矩阵或邻接表表示。

Graphs are commonly represented using adjacency matrices or adjacency lists.

主要算法 / Major algorithms:

- 深度优先搜索 / Depth-First Search, DFS
- 广度优先搜索 / Breadth-First Search, BFS
- 最短路径 / Shortest Path
- 最小生成树 / Minimum Spanning Tree
- 拓扑排序 / Topological Sort

---

## 6. 计算机组成与体系结构 / Computer Organization and Architecture

### 6.1 冯·诺依曼体系结构 / Von Neumann Architecture

冯·诺依曼体系结构把程序指令和数据存放在同一存储器中，由处理器依次取指、译码和执行。

The von Neumann architecture stores instructions and data in the same memory and processes them through a fetch-decode-execute cycle.

### 6.2 中央处理器 / Central Processing Unit, CPU

CPU 执行指令并协调计算机各部分工作。

The CPU executes instructions and coordinates the operation of computer components.

主要组成 / Main components:

- 算术逻辑单元 / Arithmetic Logic Unit, ALU
- 控制单元 / Control Unit
- 寄存器 / Registers
- 高速缓存 / Cache

### 6.3 指令集体系结构 / Instruction Set Architecture, ISA

ISA 定义软件可见的机器指令、寄存器、数据类型和寻址方式，是软件与硬件之间的接口。

An ISA defines machine instructions, registers, data types, and addressing modes visible to software. It is the interface between software and hardware.

常见 ISA / Common ISAs:

- x86-64
- ARM
- RISC-V

### 6.4 RISC 与 CISC / RISC and CISC

- RISC 倾向使用数量较少、形式规则的简单指令。
- CISC 倾向提供数量更多、功能更复杂的指令。

RISC favors a smaller set of regular instructions, while CISC traditionally provides a larger set of more complex instructions.

### 6.5 指令流水线 / Instruction Pipeline

流水线让多条指令的不同阶段重叠执行，提高吞吐量。

Instruction pipelining overlaps different stages of multiple instructions to increase throughput.

相关概念 / Related concepts:

- 数据冒险 / Data Hazard
- 控制冒险 / Control Hazard
- 分支预测 / Branch Prediction
- 乱序执行 / Out-of-Order Execution

### 6.6 存储层次 / Memory Hierarchy

```text
寄存器 Registers
  ↓ 更大、更慢、每字节更便宜
高速缓存 Cache
  ↓
主存 RAM
  ↓
固态硬盘/磁盘 SSD/HDD
  ↓
远程与归档存储 Remote/Archival Storage
```

Memory hierarchies balance speed, capacity, and cost by placing small fast storage near the processor and larger slower storage farther away.

### 6.7 局部性原理 / Principle of Locality

- 时间局部性：最近访问的数据很可能再次访问。
- 空间局部性：相邻数据很可能很快被访问。

- Temporal locality means recently accessed data is likely to be accessed again.
- Spatial locality means nearby data is likely to be accessed soon.

缓存和虚拟内存的有效性高度依赖局部性。

The effectiveness of caches and virtual memory depends heavily on locality.

### 6.8 输入输出 / Input and Output, I/O

I/O 是处理器与磁盘、网络、键盘、显示器等外部设备交换数据的机制。

I/O is the mechanism by which the processor exchanges data with external devices such as disks, networks, keyboards, and displays.

### 6.9 中断 / Interrupt

中断允许硬件或软件暂停当前执行流，让 CPU 处理高优先级事件。

An interrupt allows hardware or software to suspend the current execution flow so the CPU can handle an event.

### 6.10 多核与并行计算 / Multicore and Parallel Computing

多核处理器包含多个执行核心；并行计算把工作拆分到多个处理单元同时执行。

A multicore processor contains multiple execution cores. Parallel computing divides work among multiple processing units for simultaneous execution.

---

## 7. 操作系统 / Operating Systems

### 7.1 操作系统 / Operating System, OS

操作系统管理硬件资源，为应用程序提供进程、内存、文件、网络和设备等抽象。

An operating system manages hardware resources and provides abstractions such as processes, memory, files, networking, and devices to applications.

### 7.2 内核 / Kernel

内核是操作系统的核心，以高权限运行，负责资源管理、系统调用和硬件控制。

The kernel is the privileged core of an operating system responsible for resource management, system calls, and hardware control.

### 7.3 用户态与内核态 / User Mode and Kernel Mode

用户态限制应用直接访问硬件；内核态拥有执行特权操作的权限。

User mode restricts direct hardware access, while kernel mode permits privileged operations.

### 7.4 系统调用 / System Call

系统调用是应用程序请求内核服务的受控入口，如读取文件、创建进程或发送网络数据。

A system call is a controlled interface through which an application requests kernel services such as file access, process creation, or networking.

### 7.5 进程 / Process

进程是正在执行的程序实例，拥有独立地址空间和系统资源。

A process is an executing instance of a program with its own address space and system resources.

### 7.6 线程 / Thread

线程是进程中的执行单元，同一进程内的线程共享内存和多数资源。

A thread is an execution unit within a process. Threads in the same process share memory and most resources.

### 7.7 调度 / Scheduling

调度器决定哪个进程或线程在何时使用 CPU。

The scheduler determines which process or thread uses the CPU and when.

调度目标 / Scheduling goals:

- 公平性 / Fairness
- 响应时间 / Response Time
- 吞吐量 / Throughput
- 优先级 / Priority

### 7.8 上下文切换 / Context Switch

上下文切换保存当前任务状态并恢复另一个任务状态。它实现多任务，但也带来性能开销。

A context switch saves one task's state and restores another's. It enables multitasking but introduces overhead.

### 7.9 虚拟内存 / Virtual Memory

虚拟内存为每个进程提供独立、连续的地址空间，并通过页表映射到物理内存。

Virtual memory gives each process an isolated, contiguous address space mapped to physical memory through page tables.

相关概念 / Related concepts:

- 页 / Page
- 页表 / Page Table
- 缺页 / Page Fault
- 交换空间 / Swap
- 内存保护 / Memory Protection

### 7.10 文件系统 / File System

文件系统组织持久化数据，提供文件、目录、权限和元数据等抽象。

A file system organizes persistent data and provides abstractions such as files, directories, permissions, and metadata.

### 7.11 并发 / Concurrency

并发表示多个任务在时间上交错推进，不要求它们在同一时刻真正执行。

Concurrency means multiple tasks make progress during overlapping periods, without necessarily executing at exactly the same instant.

### 7.12 并行 / Parallelism

并行表示多个任务在多个计算单元上同时执行。

Parallelism means multiple tasks execute simultaneously on multiple processing units.

```text
并发 Concurrency：处理多个任务
并行 Parallelism：同时执行多个任务
```

### 7.13 竞态条件 / Race Condition

当程序结果依赖多个并发操作不可预测的执行顺序时，就发生竞态条件。

A race condition occurs when a program's result depends on the unpredictable ordering of concurrent operations.

### 7.14 临界区与互斥 / Critical Section and Mutual Exclusion

临界区访问共享资源；互斥确保同一时刻只有一个执行单元进入关键区域。

A critical section accesses shared resources. Mutual exclusion ensures only one execution unit enters it at a time.

### 7.15 同步原语 / Synchronization Primitives

- 互斥锁 / Mutex
- 信号量 / Semaphore
- 条件变量 / Condition Variable
- 读写锁 / Read-Write Lock
- 原子操作 / Atomic Operation

Synchronization primitives coordinate concurrent access to shared state.

### 7.16 死锁 / Deadlock

死锁发生在多个任务互相等待对方持有的资源，导致所有任务都无法继续。

A deadlock occurs when tasks wait indefinitely for resources held by one another.

经典必要条件 / Coffman conditions:

- 互斥 / Mutual Exclusion
- 持有并等待 / Hold and Wait
- 不可抢占 / No Preemption
- 循环等待 / Circular Wait

### 7.17 虚拟机与容器 / Virtual Machines and Containers

- 虚拟机虚拟化硬件，每个虚拟机通常运行独立操作系统。
- 容器共享宿主机内核，通过命名空间和资源限制实现隔离。

Virtual machines virtualize hardware and usually run separate operating systems. Containers share the host kernel and use namespaces and resource controls for isolation.

---

## 8. 编程语言与编译原理 / Programming Languages and Compilers

### 8.1 编程语言 / Programming Language

编程语言是表达计算过程、数据结构和控制逻辑的形式化语言。

A programming language is a formal language for expressing computations, data structures, and control logic.

### 8.2 语法与语义 / Syntax and Semantics

- 语法规定程序如何书写。
- 语义规定程序表示什么以及如何执行。

Syntax defines how programs are written. Semantics defines what programs mean and how they behave.

### 8.3 编程范式 / Programming Paradigm

主要范式 / Major paradigms:

- 命令式编程 / Imperative Programming
- 过程式编程 / Procedural Programming
- 面向对象编程 / Object-Oriented Programming
- 函数式编程 / Functional Programming
- 声明式编程 / Declarative Programming
- 逻辑编程 / Logic Programming
- 事件驱动编程 / Event-Driven Programming

### 8.4 类型系统 / Type System

类型系统规定值和表达式可执行哪些操作，用于提前发现错误并表达程序约束。

A type system defines valid operations on values and expressions, helping detect errors and express program constraints.

常见分类 / Common classifications:

- 静态类型与动态类型 / Static and Dynamic Typing
- 强类型与弱类型 / Strong and Weak Typing
- 类型推断 / Type Inference
- 泛型 / Generics
- 子类型 / Subtyping
- 代数数据类型 / Algebraic Data Types

### 8.5 作用域 / Scope

作用域决定一个名称在程序的哪些位置可见。

Scope determines where a name is visible within a program.

### 8.6 生命周期 / Lifetime

生命周期表示一个值或对象在执行期间保持有效的时间范围。

Lifetime describes the period during execution in which a value or object remains valid.

### 8.7 调用栈与堆 / Call Stack and Heap

- 调用栈保存函数调用帧、局部变量和返回地址。
- 堆用于动态分配生命周期更灵活的对象。

The call stack stores function frames, local variables, and return addresses. The heap stores dynamically allocated objects with more flexible lifetimes.

### 8.8 内存管理 / Memory Management

内存管理负责分配、使用和回收内存。

Memory management allocates, uses, and reclaims memory.

常见策略 / Common strategies:

- 手动管理 / Manual Memory Management
- 垃圾回收 / Garbage Collection
- 引用计数 / Reference Counting
- 所有权与借用 / Ownership and Borrowing

### 8.9 编译器 / Compiler

编译器把源语言程序转换成目标语言或机器代码。

A compiler translates a program from a source language into a target language or machine code.

典型阶段 / Typical phases:

```text
源代码 Source Code
  → 词法分析 Lexical Analysis
  → 语法分析 Parsing
  → 语义分析 Semantic Analysis
  → 中间表示 Intermediate Representation
  → 优化 Optimization
  → 代码生成 Code Generation
```

### 8.10 解释器 / Interpreter

解释器直接读取并执行程序，而不一定提前生成完整机器代码。

An interpreter reads and executes a program directly without necessarily producing a complete machine-code executable beforehand.

### 8.11 即时编译 / Just-In-Time Compilation, JIT

JIT 在程序运行期间把热点代码编译为机器代码，兼顾动态性与执行性能。

JIT compiles frequently executed code into machine code at runtime, balancing flexibility and performance.

### 8.12 运行时 / Runtime

运行时提供程序执行所需的环境和服务，如内存管理、异常处理、线程和标准库。

A runtime provides services needed during execution, such as memory management, exceptions, threads, and standard libraries.

---

## 9. 软件工程 / Software Engineering

### 9.1 软件生命周期 / Software Development Life Cycle, SDLC

典型阶段包括需求、设计、实现、测试、部署、运行和维护。

Typical phases include requirements, design, implementation, testing, deployment, operation, and maintenance.

### 9.2 需求 / Requirements

- 功能需求描述系统必须做什么。
- 非功能需求描述性能、安全、可靠性和可维护性等质量目标。

Functional requirements describe what a system must do. Non-functional requirements describe quality goals such as performance, security, reliability, and maintainability.

### 9.3 抽象 / Abstraction

抽象隐藏不必要的实现细节，只暴露当前层次需要理解的能力。

Abstraction hides unnecessary implementation details and exposes only what is relevant at a given level.

### 9.4 模块化 / Modularity

模块化将复杂系统拆成边界明确、职责集中的部分。

Modularity decomposes a complex system into components with clear boundaries and focused responsibilities.

### 9.5 封装 / Encapsulation

封装把数据和操作组合在一起，并限制外部直接依赖内部实现。

Encapsulation groups data with its operations and restricts external dependence on internal implementation.

### 9.6 内聚与耦合 / Cohesion and Coupling

- 高内聚：模块内部元素围绕单一职责紧密相关。
- 低耦合：模块之间依赖较少且接口稳定。

High cohesion means a module's elements serve a focused purpose. Low coupling means modules have limited, stable dependencies on one another.

### 9.7 接口与 API / Interface and API

接口定义组件之间如何交互；API 是软件组件向外提供的可调用契约。

An interface defines how components interact. An API is a callable contract exposed by a software component.

### 9.8 关注点分离 / Separation of Concerns

把界面、业务规则、数据访问和基础设施等不同职责分开处理。

Separation of concerns isolates responsibilities such as presentation, business rules, data access, and infrastructure.

### 9.9 SOLID 原则 / SOLID Principles

- 单一职责 / Single Responsibility
- 开闭原则 / Open-Closed
- 里氏替换 / Liskov Substitution
- 接口隔离 / Interface Segregation
- 依赖倒置 / Dependency Inversion

SOLID is a set of object-oriented design principles intended to improve maintainability and extensibility.

### 9.10 设计模式 / Design Pattern

设计模式是特定上下文中反复出现的软件设计问题的通用解法模板。

A design pattern is a reusable solution template for a recurring software design problem in a particular context.

### 9.11 重构 / Refactoring

重构是在不改变外部行为的前提下改善代码内部结构。

Refactoring improves internal code structure without changing observable behavior.

### 9.12 技术债务 / Technical Debt

技术债务是为了短期速度接受的设计或实现妥协，它会增加未来修改成本。

Technical debt is a design or implementation compromise made for short-term speed that increases future change costs.

### 9.13 测试 / Testing

主要层次 / Major levels:

- 单元测试 / Unit Testing
- 集成测试 / Integration Testing
- 系统测试 / System Testing
- 端到端测试 / End-to-End Testing
- 回归测试 / Regression Testing
- 性能测试 / Performance Testing
- 安全测试 / Security Testing

### 9.14 版本控制 / Version Control

版本控制记录文件历史，支持协作、分支、合并和回滚。Git 是最常见的分布式版本控制系统。

Version control records file history and supports collaboration, branching, merging, and rollback. Git is the most widely used distributed version control system.

### 9.15 持续集成与持续交付 / CI/CD

- 持续集成自动构建并测试每次变更。
- 持续交付或部署自动准备或发布可运行版本。

Continuous Integration automatically builds and tests changes. Continuous Delivery or Deployment automates preparation or release of deployable versions.

### 9.16 可观测性 / Observability

通过日志、指标和链路追踪理解系统内部状态。

Observability uses logs, metrics, and traces to understand a system's internal state.

---

## 10. 数据库与信息系统 / Databases and Information Systems

### 10.1 数据库 / Database

数据库是有组织的数据集合，数据库管理系统负责存储、查询、并发控制、安全和恢复。

A database is an organized collection of data. A Database Management System manages storage, queries, concurrency, security, and recovery.

### 10.2 数据模型 / Data Model

数据模型规定数据如何组织以及数据之间如何关联。

A data model defines how data is organized and related.

常见模型 / Common models:

- 关系模型 / Relational Model
- 文档模型 / Document Model
- 键值模型 / Key-Value Model
- 图模型 / Graph Model
- 列族模型 / Wide-Column Model

### 10.3 关系模型 / Relational Model

关系模型把数据组织成表，由行、列、键和约束构成。

The relational model organizes data into tables consisting of rows, columns, keys, and constraints.

### 10.4 主键与外键 / Primary Key and Foreign Key

- 主键唯一标识表中的记录。
- 外键引用另一个表的键，用于维护引用关系。

A primary key uniquely identifies a row. A foreign key references a key in another table and maintains a relationship.

### 10.5 规范化 / Normalization

规范化通过分解表减少重复数据和更新异常。

Normalization decomposes tables to reduce redundancy and update anomalies.

常见范式 / Common normal forms:

- 第一范式 / First Normal Form, 1NF
- 第二范式 / Second Normal Form, 2NF
- 第三范式 / Third Normal Form, 3NF
- BCNF

### 10.6 结构化查询语言 / Structured Query Language, SQL

SQL 是关系数据库的声明式查询语言。

SQL is a declarative language for relational databases.

主要操作 / Main operations:

- 查询 / SELECT
- 插入 / INSERT
- 更新 / UPDATE
- 删除 / DELETE
- 连接 / JOIN
- 聚合 / Aggregation

### 10.7 索引 / Index

索引以额外存储和写入成本换取更快查询。B+ 树和哈希结构是常见实现。

An index trades additional storage and write cost for faster queries. B+ trees and hash structures are common implementations.

### 10.8 查询优化 / Query Optimization

查询优化器根据统计信息和成本模型选择执行计划。

A query optimizer uses statistics and cost models to choose an execution plan.

### 10.9 事务 / Transaction

事务是一组作为整体成功或失败的数据操作。

A transaction is a group of data operations that succeeds or fails as a unit.

ACID:

- 原子性 / Atomicity
- 一致性 / Consistency
- 隔离性 / Isolation
- 持久性 / Durability

### 10.10 隔离级别 / Isolation Level

隔离级别控制并发事务可以观察到彼此变化的程度。

Isolation levels control how much concurrent transactions can observe one another's changes.

常见级别 / Common levels:

- 读未提交 / Read Uncommitted
- 读已提交 / Read Committed
- 可重复读 / Repeatable Read
- 串行化 / Serializable

### 10.11 非关系型数据库 / Not Only SQL, NoSQL

NoSQL 泛指不以传统关系模型为核心、通常强调灵活模型或水平扩展的数据库系统。

NoSQL broadly refers to databases that do not center on the traditional relational model and often emphasize flexible schemas or horizontal scalability.

### 10.12 数据仓库与数据湖 / Data Warehouse and Data Lake

- 数据仓库保存经过建模、适合分析的结构化数据。
- 数据湖以原始形式保存大量结构化和非结构化数据。

A data warehouse stores modeled data optimized for analytics. A data lake stores large volumes of raw structured and unstructured data.

---

## 11. 计算机网络与 Web / Computer Networks and the Web

### 11.1 计算机网络 / Computer Network

计算机网络让不同设备通过通信链路和协议交换数据。

A computer network enables devices to exchange data through communication links and protocols.

### 11.2 协议 / Protocol

协议规定通信双方如何组织、发送、接收和解释消息。

A protocol defines how communicating parties structure, send, receive, and interpret messages.

### 11.3 分层 / Layering

网络分层把复杂通信问题拆成职责不同的层。

Network layering decomposes communication into layers with distinct responsibilities.

TCP/IP 模型 / TCP/IP model:

```text
应用层 Application Layer
传输层 Transport Layer
网际层 Internet Layer
链路层 Link Layer
```

### 11.4 数据包 / Packet

数据包是网络传输的格式化数据单元，通常包含头部和载荷。

A packet is a formatted unit of network data, typically containing a header and payload.

### 11.5 网际协议 / Internet Protocol, IP

Internet Protocol 负责跨网络寻址和路由数据包，但不保证可靠到达。

The Internet Protocol addresses and routes packets across networks but does not guarantee reliable delivery.

### 11.6 传输控制协议 / Transmission Control Protocol, TCP

TCP 提供面向连接、可靠、有序的字节流传输，并实现重传、流量控制和拥塞控制。

TCP provides a connection-oriented, reliable, ordered byte stream with retransmission, flow control, and congestion control.

### 11.7 用户数据报协议 / User Datagram Protocol, UDP

UDP 提供无连接的数据报传输，开销较小，但不保证到达、顺序或去重。

UDP provides connectionless datagram delivery with low overhead but no guarantees of arrival, ordering, or deduplication.

### 11.8 域名系统 / Domain Name System, DNS

DNS 把域名映射到 IP 地址及其他资源记录。

The Domain Name System maps domain names to IP addresses and other resource records.

### 11.9 超文本传输协议 / Hypertext Transfer Protocol, HTTP

HTTP 是 Web 的应用层请求—响应协议。

HTTP is the Web's application-layer request-response protocol.

关键概念 / Key concepts:

- 方法 / Methods
- 状态码 / Status Codes
- 请求头与响应头 / Request and Response Headers
- 缓存 / Caching
- Cookie
- 内容协商 / Content Negotiation

### 11.10 HTTPS 与传输层安全 / HTTPS and Transport Layer Security, TLS

HTTPS 使用 TLS 保护 HTTP 通信，提供机密性、完整性和服务端身份认证。

HTTPS uses TLS to protect HTTP communication, providing confidentiality, integrity, and server authentication.

### 11.11 客户端—服务端模型 / Client-Server Model

客户端发起请求，服务端提供数据或计算能力。

The client initiates requests, and the server provides data or computation.

### 11.12 表述性状态转移 / Representational State Transfer, REST

REST 是一种面向资源、强调统一接口和无状态通信的架构风格。

REST is an architectural style centered on resources, uniform interfaces, and stateless communication.

### 11.13 WebSocket 与服务端事件 / WebSocket and Server-Sent Events, SSE

- WebSocket 提供长连接上的双向通信。
- Server-Sent Events 提供服务端到客户端的单向事件流。

WebSocket provides bidirectional communication over a persistent connection. Server-Sent Events provides a one-way event stream from server to client.

### 11.14 内容分发网络 / Content Delivery Network, CDN

内容分发网络把内容缓存到靠近用户的边缘节点，以减少延迟和源站负载。

A Content Delivery Network caches content at edge locations near users to reduce latency and origin load.

### 11.15 认证与鉴权 / Authentication and Authorization

- 认证确认主体是谁。
- 鉴权判断该主体可以执行什么操作。

Authentication verifies who a principal is. Authorization determines what that principal is allowed to do.

---

## 12. 分布式系统 / Distributed Systems

### 12.1 分布式系统 / Distributed System

分布式系统由多台独立计算机组成，但对用户表现为一个协同工作的整体。

A distributed system consists of independent computers that coordinate and appear to users as a coherent whole.

### 12.2 部分失败 / Partial Failure

分布式系统中某些节点或网络链路可能失败，而其他部分仍然正常，这是分布式系统区别于单机程序的重要特征。

In a distributed system, some nodes or links may fail while others continue operating. This partial failure is a defining characteristic.

### 12.3 延迟与超时 / Latency and Timeout

网络通信耗时不确定。超时只能说明尚未收到结果，不能证明操作没有执行。

Network latency is variable. A timeout means no result was observed in time; it does not prove that the operation did not execute.

### 12.4 一致性 / Consistency

一致性描述多个节点上的数据副本在何时、以何种方式对外呈现相同结果。

Consistency describes when and how replicated data appears the same across nodes.

常见模型 / Common models:

- 强一致性 / Strong Consistency
- 线性一致性 / Linearizability
- 顺序一致性 / Sequential Consistency
- 最终一致性 / Eventual Consistency

### 12.5 CAP 定理 / CAP Theorem

当网络分区发生时，分布式数据系统不能同时完全保证一致性和可用性。

During a network partition, a distributed data system cannot simultaneously provide both full consistency and full availability.

CAP:

- 一致性 / Consistency
- 可用性 / Availability
- 分区容错性 / Partition Tolerance

### 12.6 复制 / Replication

复制把数据保存在多个节点上，以提高可用性、读取性能和容灾能力。

Replication stores data on multiple nodes to improve availability, read performance, and fault tolerance.

### 12.7 分区与分片 / Partitioning and Sharding

分片按规则将不同数据分布到不同节点，实现水平扩展。

Sharding distributes different subsets of data across nodes for horizontal scalability.

### 12.8 共识 / Consensus

共识算法让多个节点即使面对故障和消息延迟，也能就某个值或操作顺序达成一致。

Consensus algorithms allow nodes to agree on a value or operation order despite failures and message delays.

典型算法 / Representative algorithms:

- Paxos
- Raft

### 12.9 领导者选举 / Leader Election

多个节点通过协议选出协调者，由领导者组织写入或任务分配。

Leader election selects a coordinator among nodes to organize writes or assign work.

### 12.10 消息队列 / Message Queue

消息队列解耦生产者和消费者，支持异步处理、削峰和重试。

A message queue decouples producers and consumers and supports asynchronous processing, load leveling, and retries.

### 12.11 幂等性 / Idempotency

幂等操作执行一次和重复执行多次产生相同的最终效果。

An idempotent operation has the same final effect whether executed once or multiple times.

### 12.12 容错 / Fault Tolerance

容错系统在部分组件故障时仍能继续提供正确或降级后的服务。

A fault-tolerant system continues providing correct or degraded service despite component failures.

常见手段 / Common techniques:

- 冗余 / Redundancy
- 重试 / Retry
- 指数退避 / Exponential Backoff
- 熔断 / Circuit Breaker
- 故障转移 / Failover
- 限流 / Rate Limiting

### 12.13 可扩展性 / Scalability

- 垂直扩展：增强单机资源。
- 水平扩展：增加节点数量。

Vertical scaling strengthens a single machine. Horizontal scaling adds more machines.

---

## 13. 计算机安全 / Cybersecurity

### 13.1 信息安全三要素 / CIA Triad

- 机密性 / Confidentiality：信息只对授权主体可见。
- 完整性 / Integrity：信息未被未授权篡改。
- 可用性 / Availability：授权用户可以及时访问系统和数据。

The CIA triad consists of confidentiality, integrity, and availability.

### 13.2 威胁建模 / Threat Modeling

威胁建模系统识别资产、攻击者、入口、信任边界和缓解措施。

Threat modeling systematically identifies assets, attackers, entry points, trust boundaries, and mitigations.

### 13.3 最小权限原则 / Principle of Least Privilege

用户、程序和服务只应获得完成任务所必需的最低权限。

Users, programs, and services should receive only the minimum permissions required to perform their tasks.

### 13.4 纵深防御 / Defense in Depth

通过多层独立安全控制降低单点防护失效的风险。

Defense in depth uses multiple independent security controls to reduce the risk of a single failure.

### 13.5 密码学 / Cryptography

密码学使用数学方法保护通信和数据。

Cryptography uses mathematical techniques to protect communication and data.

### 13.6 哈希函数 / Hash Function

密码学哈希函数把任意长度输入映射为固定长度摘要，并应具备抗碰撞和单向性等性质。

A cryptographic hash function maps arbitrary-length input to a fixed-length digest and should provide properties such as collision resistance and one-wayness.

用途 / Uses:

- 完整性校验 / Integrity Checking
- 密码摘要 / Password Hashing
- 数字签名中的摘要 / Digests for Digital Signatures
- 内容寻址 / Content Addressing

### 13.7 对称加密 / Symmetric Encryption

加密和解密使用同一把密钥，速度快，适合大量数据。

Symmetric encryption uses the same key for encryption and decryption and is efficient for bulk data.

### 13.8 非对称加密 / Asymmetric Encryption

使用公钥和私钥对，支持密钥交换、身份认证和数字签名。

Asymmetric cryptography uses public-private key pairs and supports key exchange, authentication, and digital signatures.

### 13.9 数字签名 / Digital Signature

数字签名使用私钥签名、公钥验证，用于证明消息来源和完整性。

A digital signature is created with a private key and verified with a public key to prove origin and integrity.

### 13.10 认证、授权与审计 / Authentication, Authorization, and Auditing

- 认证 / Authentication：确认身份。
- 授权 / Authorization：授予或拒绝权限。
- 审计 / Auditing：记录和检查行为。

Authentication verifies identity, authorization grants or denies permissions, and auditing records and examines actions.

### 13.11 输入验证 / Input Validation

所有外部输入都应按明确规则验证，不能因为输入来自前端或内部网络就默认可信。

All external input should be validated against explicit rules. Input must not be trusted merely because it comes from a frontend or internal network.

### 13.12 常见漏洞 / Common Vulnerabilities

- SQL 注入 / SQL Injection
- 跨站脚本 / Cross-Site Scripting, XSS
- 跨站请求伪造 / Cross-Site Request Forgery, CSRF
- 命令注入 / Command Injection
- 路径遍历 / Path Traversal
- 服务端请求伪造 / Server-Side Request Forgery, SSRF
- 认证绕过 / Authentication Bypass
- 越权访问 / Broken Access Control
- 敏感信息泄露 / Sensitive Data Exposure

### 13.13 零信任 / Zero Trust

零信任强调持续验证主体、设备和上下文，不因网络位置自动授予信任。

Zero Trust continuously verifies identities, devices, and context instead of granting trust based solely on network location.

---

## 14. 人工智能与机器学习 / Artificial Intelligence and Machine Learning

### 14.1 人工智能 / Artificial Intelligence, AI

人工智能研究使机器表现出感知、推理、学习、规划和决策能力的方法。

Artificial Intelligence studies methods that enable machines to perceive, reason, learn, plan, and make decisions.

### 14.2 机器学习 / Machine Learning, ML

机器学习让系统从数据中学习模式，而不是为每种情况显式编写规则。

Machine learning enables systems to learn patterns from data rather than relying on explicitly programmed rules for every case.

### 14.3 监督学习 / Supervised Learning

使用带标签样本学习输入到目标输出的映射。

Supervised learning uses labeled examples to learn a mapping from inputs to target outputs.

任务 / Tasks:

- 分类 / Classification
- 回归 / Regression

### 14.4 无监督学习 / Unsupervised Learning

从无标签数据中发现结构和模式。

Unsupervised learning discovers structure and patterns in unlabeled data.

任务 / Tasks:

- 聚类 / Clustering
- 降维 / Dimensionality Reduction
- 异常检测 / Anomaly Detection

### 14.5 强化学习 / Reinforcement Learning

智能体通过与环境交互并根据奖励学习策略。

An agent learns a policy by interacting with an environment and receiving rewards.

### 14.6 神经网络 / Neural Network

神经网络由多层参数化变换组成，通过训练学习复杂函数。

A neural network consists of layers of parameterized transformations and learns complex functions through training.

### 14.7 深度学习 / Deep Learning

深度学习使用多层神经网络从大量数据中学习分层表示。

Deep learning uses multilayer neural networks to learn hierarchical representations from large datasets.

### 14.8 训练与推理 / Training and Inference

- 训练通过数据和优化算法调整模型参数。
- 推理使用训练后的模型对新输入产生结果。

Training adjusts model parameters using data and optimization. Inference uses the trained model to produce outputs for new inputs.

### 14.9 损失函数与优化 / Loss Function and Optimization

损失函数衡量预测误差，优化算法调整参数以减小损失。

A loss function measures prediction error, and an optimization algorithm adjusts parameters to reduce that loss.

### 14.10 过拟合与欠拟合 / Overfitting and Underfitting

- 过拟合：模型过度记忆训练数据，泛化能力差。
- 欠拟合：模型无法充分学习数据中的规律。

Overfitting means a model memorizes training data and generalizes poorly. Underfitting means it fails to capture the underlying patterns.

### 14.11 泛化 / Generalization

泛化能力是模型在未见数据上保持良好表现的能力。

Generalization is a model's ability to perform well on unseen data.

### 14.12 自然语言处理 / Natural Language Processing, NLP

NLP 研究计算机理解、生成和处理人类语言的方法。

NLP studies methods for computers to understand, generate, and process human language.

### 14.13 计算机视觉 / Computer Vision

计算机视觉研究从图像和视频中提取信息。

Computer vision studies how to extract information from images and video.

### 14.14 大语言模型 / Large Language Model, LLM

大语言模型通常基于 Transformer，在大规模文本和代码上训练，通过预测 Token 学习语言模式和知识表示。

A Large Language Model is typically based on the Transformer architecture and trained on large text and code corpora to learn language patterns and representations through token prediction.

### 14.15 AI 评估与安全 / AI Evaluation and Safety

重要问题 / Important concerns:

- 准确性 / Accuracy
- 鲁棒性 / Robustness
- 偏见与公平 / Bias and Fairness
- 可解释性 / Explainability
- 隐私 / Privacy
- 幻觉 / Hallucination
- 对齐 / Alignment

---

## 15. 图形学、人机交互与多媒体 / Graphics, HCI, and Multimedia

### 15.1 计算机图形学 / Computer Graphics

计算机图形学研究如何生成、表示和渲染二维或三维视觉内容。

Computer graphics studies how to generate, represent, and render two-dimensional and three-dimensional visual content.

核心概念 / Core concepts:

- 几何建模 / Geometric Modeling
- 坐标变换 / Coordinate Transformation
- 光栅化 / Rasterization
- 光线追踪 / Ray Tracing
- 着色 / Shading
- 纹理 / Texture

### 15.2 图像处理 / Image Processing

图像处理对像素数据执行增强、过滤、压缩、分割和变换。

Image processing performs enhancement, filtering, compression, segmentation, and transformation on pixel data.

### 15.3 人机交互 / Human-Computer Interaction, HCI

人机交互研究人如何使用计算系统，以及如何设计有效、易学、安全和令人满意的交互。

HCI studies how people use computing systems and how to design interactions that are effective, learnable, safe, and satisfying.

### 15.4 用户体验 / User Experience, UX

用户体验涵盖用户使用产品前、中、后的整体感受。

User experience covers a person's overall experience before, during, and after using a product.

### 15.5 可用性 / Usability

可用性通常考虑有效性、效率、易学性、可记忆性和错误恢复。

Usability commonly considers effectiveness, efficiency, learnability, memorability, and error recovery.

### 15.6 可访问性 / Accessibility

可访问性确保不同身体、感官和认知能力的人都能使用计算系统。

Accessibility ensures that people with diverse physical, sensory, and cognitive abilities can use computing systems.

---

## 16. 计算伦理与社会影响 / Computing Ethics and Social Impact

### 16.1 隐私 / Privacy

隐私关注个人信息如何被收集、处理、共享、保存和删除。

Privacy concerns how personal information is collected, processed, shared, retained, and deleted.

### 16.2 公平与偏见 / Fairness and Bias

数据和算法可能延续或放大现实世界中的偏见，应评估不同群体受到的影响。

Data and algorithms can preserve or amplify real-world biases, so their effects on different groups must be evaluated.

### 16.3 透明度与可解释性 / Transparency and Explainability

透明度说明系统如何构建和使用；可解释性帮助人理解具体结果产生的原因。

Transparency describes how a system is built and used. Explainability helps people understand why a particular result was produced.

### 16.4 问责 / Accountability

问责要求明确谁对计算系统的设计、部署和后果负责。

Accountability requires clarity about who is responsible for a computing system's design, deployment, and consequences.

### 16.5 知识产权 / Intellectual Property

软件开发涉及版权、专利、商标、商业秘密和开源许可证。

Software development involves copyright, patents, trademarks, trade secrets, and open-source licenses.

### 16.6 数字鸿沟 / Digital Divide

数字鸿沟是不同人群在设备、网络、技能和数字机会方面的不平等。

The digital divide is inequality in access to devices, connectivity, skills, and digital opportunities.

### 16.7 可持续计算 / Sustainable Computing

可持续计算关注计算设备、数据中心和软件系统的能源、材料和环境成本。

Sustainable computing considers the energy, material, and environmental costs of devices, data centers, and software systems.

---

## 17. 贯穿所有领域的核心原则 / Cross-Cutting Principles

### 17.1 抽象 / Abstraction

忽略当前层次不重要的细节，用更简单的模型理解复杂系统。

Ignore details that are irrelevant at the current level and use simpler models to understand complex systems.

### 17.2 分解 / Decomposition

把复杂问题拆成更小、更容易理解和解决的子问题。

Break a complex problem into smaller, more understandable and manageable subproblems.

### 17.3 分层 / Layering

每一层使用下层能力并向上层提供更高层抽象。

Each layer uses services from the layer below and provides a higher-level abstraction to the layer above.

### 17.4 不变量 / Invariant

不变量是在特定程序点或系统状态下必须始终成立的性质。

An invariant is a property that must always hold at a particular program point or system state.

### 17.5 权衡 / Trade-Off

计算机系统很少存在所有维度都最优的方案，通常需要在时间、空间、成本、复杂度、一致性和可用性之间取舍。

Computing systems rarely have a solution that is optimal in every dimension. Trade-offs are made among time, space, cost, complexity, consistency, and availability.

### 17.6 局部性 / Locality

相近时间或空间的数据更可能被一起访问，是缓存、存储和程序优化的基础。

Data close in time or space is more likely to be accessed together, forming a basis for caching, storage, and program optimization.

### 17.7 延迟与吞吐量 / Latency and Throughput

- 延迟是完成一次操作需要的时间。
- 吞吐量是单位时间完成的操作数量。

Latency is the time required for one operation. Throughput is the number of operations completed per unit time.

### 17.8 正确性、可靠性与可用性 / Correctness, Reliability, and Availability

- 正确性：系统行为符合规格。
- 可靠性：系统在一段时间内持续正确运行。
- 可用性：系统在需要时能够提供服务。

Correctness means behavior conforms to specification. Reliability means continued correct operation over time. Availability means the system is accessible when needed.

### 17.9 确定性与非确定性 / Determinism and Nondeterminism

确定性系统在相同状态和输入下产生相同结果；非确定性系统可能存在多个可能行为或结果。

A deterministic system produces the same result from the same state and input. A nondeterministic system may exhibit multiple possible behaviors or results.

### 17.10 状态 / State

状态是系统在某一时刻影响未来行为的全部信息。

State is all information at a given moment that influences a system's future behavior.

### 17.11 可组合性 / Composability

可组合性表示小组件可以按照明确规则组合成更大的系统。

Composability means small components can be combined according to clear rules to form larger systems.

### 17.12 端到端原则 / End-to-End Principle

某些功能只有在通信端点实现才能得到完整正确性，底层可以提供帮助，但不能完全替代端点检查。

Some functions can be implemented completely and correctly only at communication endpoints. Lower layers may assist but cannot fully replace endpoint checks.

---

## 18. 常见概念对照 / Common Concept Comparisons

### 18.1 程序、进程与线程 / Program, Process, and Thread

| 概念 | 中文说明 | English Description |
|---|---|---|
| 程序 / Program | 静态代码和数据 | Static code and data |
| 进程 / Process | 正在运行的程序实例 | A running instance of a program |
| 线程 / Thread | 进程内的执行单元 | An execution unit within a process |

### 18.2 并发与并行 / Concurrency and Parallelism

| 概念 | 中文说明 | English Description |
|---|---|---|
| 并发 / Concurrency | 多个任务交错推进 | Multiple tasks make overlapping progress |
| 并行 / Parallelism | 多个任务同时执行 | Multiple tasks execute simultaneously |

### 18.3 编译与解释 / Compilation and Interpretation

| 概念 | 中文说明 | English Description |
|---|---|---|
| 编译 / Compilation | 执行前转换程序 | Translate a program before execution |
| 解释 / Interpretation | 执行时读取并运行程序 | Read and execute a program at runtime |
| JIT | 运行时编译热点代码 | Compile hot code during execution |

### 18.4 认证与鉴权 / Authentication and Authorization

| 概念 | 中文说明 | English Description |
|---|---|---|
| 认证 / Authentication | 确认你是谁 | Verify who you are |
| 鉴权 / Authorization | 判断你能做什么 | Determine what you may do |

### 18.5 编码、加密与哈希 / Encoding, Encryption, and Hashing

| 概念 | 目的 | 是否需要密钥 | 是否可逆 |
|---|---|---|---|
| 编码 / Encoding | 表示与兼容 | 否 / No | 是 / Yes |
| 加密 / Encryption | 保密 | 是 / Yes | 持有密钥时可逆 / Reversible with a key |
| 哈希 / Hashing | 摘要与完整性 | 通常否 / Usually no | 设计上不可逆 / Designed to be one-way |

### 18.6 缓存与持久化 / Cache and Persistence

| 概念 | 中文说明 | English Description |
|---|---|---|
| 缓存 / Cache | 保存副本以加速访问，可丢弃并重建 | Stores rebuildable copies for faster access |
| 持久化 / Persistence | 长期保存权威数据 | Durably stores authoritative data |

### 18.7 横向扩展与纵向扩展 / Horizontal and Vertical Scaling

| 概念 | 中文说明 | English Description |
|---|---|---|
| 纵向扩展 / Scale Up | 增强单机 CPU、内存等资源 | Add resources to one machine |
| 横向扩展 / Scale Out | 增加机器或实例数量 | Add more machines or instances |

---

## 19. 推荐学习路径 / Recommended Learning Path

### 第一阶段：编程与数学基础 / Stage 1: Programming and Mathematics

1. 选择一门编程语言 / Choose one programming language.
2. 学习变量、控制流、函数和数据类型 / Learn variables, control flow, functions, and data types.
3. 学习离散数学、逻辑和基本概率 / Study discrete mathematics, logic, and basic probability.
4. 掌握调试和版本控制 / Learn debugging and version control.

### 第二阶段：算法与系统基础 / Stage 2: Algorithms and Systems

1. 数据结构与算法 / Data structures and algorithms.
2. 时间与空间复杂度 / Time and space complexity.
3. 计算机组成原理 / Computer architecture.
4. 操作系统与并发 / Operating systems and concurrency.
5. 计算机网络 / Computer networks.

### 第三阶段：构建真实软件 / Stage 3: Building Real Software

1. 软件设计与测试 / Software design and testing.
2. 数据库与事务 / Databases and transactions.
3. API 与分布式系统 / APIs and distributed systems.
4. 安全、部署和可观测性 / Security, deployment, and observability.

### 第四阶段：选择专业方向 / Stage 4: Specialization

- 人工智能与机器学习 / AI and Machine Learning
- 系统与基础设施 / Systems and Infrastructure
- 网络与安全 / Networks and Security
- 数据库与数据工程 / Databases and Data Engineering
- 编程语言与编译器 / Programming Languages and Compilers
- 图形学与游戏 / Graphics and Games
- 人机交互 / Human-Computer Interaction
- 理论计算机科学 / Theoretical Computer Science

---

## 20. 总结 / Summary

计算机科学不仅是学习编程语言。它研究：

- 信息如何表示 / How information is represented;
- 问题是否可计算 / Whether problems are computable;
- 算法需要多少资源 / How many resources algorithms require;
- 软件如何被正确构造 / How software is constructed correctly;
- 硬件和操作系统如何执行程序 / How hardware and operating systems execute programs;
- 数据如何被组织和保护 / How data is organized and protected;
- 多台计算机如何可靠协作 / How multiple computers cooperate reliably;
- 人与智能系统如何交互 / How people interact with intelligent systems;
- 技术如何影响个人与社会 / How technology affects individuals and society.

Computer Science is not merely the study of programming languages. It is the systematic study of information, computation, algorithms, software, machines, networks, intelligence, and the social consequences of computing.

贯穿整个学科的核心思维是：

The core modes of thinking across the discipline are:

> 抽象复杂性、分解问题、建立不变量、分析资源、管理状态、设计接口，并在各种约束之间做出可解释的权衡。
>
> Abstract complexity, decompose problems, establish invariants, analyze resources, manage state, design interfaces, and make explainable trade-offs under constraints.

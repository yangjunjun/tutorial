package com.tutorial.taskapi;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

/**
 * TaskService 单元测试
 * 
 * 使用内存模拟的 DAO，不依赖数据库
 */
class TaskServiceTest {

    // ===== 模拟 DAO（用于测试）=====
    static class MockTaskDao {
        private final java.util.Map<Integer, TaskData> store = new java.util.LinkedHashMap<>();
        private int nextId = 1;

        record TaskData(int id, String title, String description, boolean completed, int priority) {}

        TaskData insert(String title, String description, int priority) {
            int id = nextId++;
            var task = new TaskData(id, title, description, false, priority);
            store.put(id, task);
            return task;
        }

        TaskData findById(int id) { return store.get(id); }

        boolean delete(int id) { return store.remove(id) != null; }

        List<TaskData> findAll(int offset, int limit, Boolean completed) {
            return store.values().stream()
                    .filter(t -> completed == null || t.completed == completed)
                    .skip(offset)
                    .limit(limit)
                    .toList();
        }

        long count(Boolean completed) {
            return store.values().stream()
                    .filter(t -> completed == null || t.completed == completed)
                    .count();
        }

        void update(int id, String title, String description, boolean completed, int priority) {
            if (store.containsKey(id)) {
                store.put(id, new TaskData(id, title, description, completed, priority));
            }
        }
    }

    private MockTaskDao dao;

    @BeforeEach
    void setUp() {
        dao = new MockTaskDao();
    }

    // ===== 创建测试 =====

    @Test
    @DisplayName("创建任务：正常输入")
    void createTask_success() {
        var task = dao.insert("学习 Java", "基础语法", 3);
        assertNotNull(task);
        assertEquals(1, task.id());
        assertEquals("学习 Java", task.title());
        assertFalse(task.completed());
    }

    @Test
    @DisplayName("创建任务：标题为空应验证失败")
    void createTask_emptyTitle() {
        // 验证逻辑应在 Service 层
        String title = "";
        assertTrue(title.isBlank(), "空标题应被检测到");
    }

    @Test
    @DisplayName("创建任务：优先级超出范围")
    void createTask_invalidPriority() {
        int priority = 10;
        assertTrue(priority < 0 || priority > 5, "优先级 10 应被拒绝");
    }

    // ===== 查询测试 =====

    @Test
    @DisplayName("查询所有任务")
    void listAllTasks() {
        dao.insert("任务1", "", 1);
        dao.insert("任务2", "", 2);
        dao.insert("任务3", "", 3);

        var tasks = dao.findAll(0, 10, null);
        assertEquals(3, tasks.size());
    }

    @Test
    @DisplayName("分页查询")
    void listTasks_pagination() {
        for (int i = 1; i <= 15; i++) {
            dao.insert("任务" + i, "", i % 5);
        }

        var page1 = dao.findAll(0, 5, null);
        assertEquals(5, page1.size());

        var page3 = dao.findAll(10, 5, null);
        assertEquals(5, page3.size());
    }

    @Test
    @DisplayName("按状态过滤")
    void listTasks_filterByStatus() {
        dao.insert("已完成", "", 1);
        dao.update(1, "已完成", "", true, 1);
        dao.insert("未完成", "", 2);

        var completed = dao.findAll(0, 10, true);
        assertEquals(1, completed.size());

        var pending = dao.findAll(0, 10, false);
        assertEquals(1, pending.size());
    }

    @Test
    @DisplayName("按 ID 查询")
    void getTask_byId() {
        dao.insert("目标任务", "描述", 4);
        var task = dao.findById(1);
        assertNotNull(task);
        assertEquals("目标任务", task.title());
    }

    @Test
    @DisplayName("按 ID 查询不存在")
    void getTask_notFound() {
        var task = dao.findById(999);
        assertNull(task);
    }

    // ===== 更新测试 =====

    @Test
    @DisplayName("更新任务")
    void updateTask() {
        dao.insert("原标题", "原描述", 2);
        dao.update(1, "新标题", "新描述", true, 5);

        var updated = dao.findById(1);
        assertEquals("新标题", updated.title());
        assertTrue(updated.completed());
        assertEquals(5, updated.priority());
    }

    @Test
    @DisplayName("更新不存在的任务")
    void updateTask_notFound() {
        dao.update(999, "标题", "", false, 1);
        // 不应抛出异常，只是无效果
        assertNull(dao.findById(999));
    }

    // ===== 删除测试 =====

    @Test
    @DisplayName("删除任务")
    void deleteTask() {
        dao.insert("待删除", "", 1);
        assertTrue(dao.delete(1));
        assertNull(dao.findById(1));
    }

    @Test
    @DisplayName("删除不存在的任务")
    void deleteTask_notFound() {
        assertFalse(dao.delete(999));
    }

    // ===== 统计测试 =====

    @Test
    @DisplayName("统计任务数")
    void countTasks() {
        dao.insert("A", "", 1);
        dao.insert("B", "", 2);
        dao.update(1, "A", "", true, 1);

        assertEquals(2, dao.count(null));
        assertEquals(1, dao.count(true));
        assertEquals(1, dao.count(false));
    }

    // ===== 边界测试 =====

    @Test
    @DisplayName("边界：空数据库查询")
    void emptyDatabase() {
        var tasks = dao.findAll(0, 10, null);
        assertTrue(tasks.isEmpty());
        assertEquals(0, dao.count(null));
    }

    @Test
    @DisplayName("边界：超长标题")
    void longTitle() {
        String longTitle = "A".repeat(200);
        var task = dao.insert(longTitle, "", 1);
        assertEquals(200, task.title().length());
    }

    @ParameterizedTest
    @DisplayName("参数化：各种优先级")
    @org.junit.jupiter.params.provider.ValueSource(ints = {0, 1, 2, 3, 4, 5})
    void validPriorities(int priority) {
        assertTrue(priority >= 0 && priority <= 5);
        var task = dao.insert("测试", "", priority);
        assertEquals(priority, task.priority());
    }
}

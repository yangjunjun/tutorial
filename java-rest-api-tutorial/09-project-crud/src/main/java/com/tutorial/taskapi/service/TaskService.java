package com.tutorial.taskapi.service;

import com.tutorial.taskapi.dao.TaskDao;
import com.tutorial.taskapi.model.Task;

import java.util.List;

/**
 * 任务服务层
 * 
 * 负责业务逻辑：参数校验、数据转换、调用 DAO
 */
public class TaskService {

    private final TaskDao dao;

    public TaskService(TaskDao dao) {
        this.dao = dao;
    }

    /**
     * 获取任务列表（支持分页和状态过滤）
     */
    public TaskListResult listTasks(int page, int size, String status) {
        int offset = (page - 1) * size;
        Boolean completedFilter = null;

        if ("completed".equalsIgnoreCase(status)) {
            completedFilter = true;
        } else if ("pending".equalsIgnoreCase(status)) {
            completedFilter = false;
        }

        List<Task> tasks = dao.findAll(offset, size, completedFilter);
        long total = dao.count(completedFilter);

        return new TaskListResult(tasks, total);
    }

    /**
     * 获取单个任务
     */
    public Task getTask(int id) {
        return dao.findById(id);
    }

    /**
     * 创建任务
     */
    public Task createTask(Task task) {
        // 确保新任务的状态是未完成
        task.setCompleted(false);
        return dao.insert(task);
    }

    /**
     * 更新任务（部分更新）
     */
    public Task updateTask(int id, Task updates) {
        Task existing = dao.findById(id);
        if (existing == null) return null;

        // 只更新非 null 的字段
        if (updates.getTitle() != null) {
            existing.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            existing.setDescription(updates.getDescription());
        }
        existing.setCompleted(updates.isCompleted());
        if (updates.getPriority() > 0) {
            existing.setPriority(updates.getPriority());
        }

        dao.update(existing);
        return dao.findById(id);  // 返回最新数据
    }

    /**
     * 删除任务
     */
    public boolean deleteTask(int id) {
        return dao.delete(id);
    }

    /**
     * 列表结果（含总数）
     */
    public record TaskListResult(List<Task> tasks, long total) {}
}

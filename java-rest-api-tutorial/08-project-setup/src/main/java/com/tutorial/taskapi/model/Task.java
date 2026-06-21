package com.tutorial.taskapi.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * 任务实体类
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Task {
    private int id;
    private String title;
    private String description;
    private boolean completed;
    private int priority;
    private String createdAt;
    private String updatedAt;

    public Task() {}  // Jackson 需要无参构造器

    public Task(String title, String description, int priority) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.completed = false;
    }

    // ===== Getters & Setters =====

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    /**
     * 字段校验
     */
    public String validate() {
        if (title == null || title.isBlank()) {
            return "标题不能为空";
        }
        if (title.length() > 200) {
            return "标题不能超过 200 个字符";
        }
        if (priority < 0 || priority > 5) {
            return "优先级必须在 0-5 之间";
        }
        return null;  // null 表示验证通过
    }

    @Override
    public String toString() {
        return "Task{id=%d, title='%s', completed=%s, priority=%d}".formatted(
                id, title, completed, priority);
    }
}

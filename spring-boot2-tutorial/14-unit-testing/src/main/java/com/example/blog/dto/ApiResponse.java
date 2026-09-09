package com.example.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 通用响应 DTO（第 14 章测试工程最小骨架）
 */
@Data
public class ApiResponse<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private int code;

    private String message;

    private T data;
}

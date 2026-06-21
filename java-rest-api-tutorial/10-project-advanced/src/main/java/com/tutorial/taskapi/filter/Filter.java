package com.tutorial.taskapi.filter;

import com.sun.net.httpserver.HttpExchange;

/**
 * 过滤器接口
 * 
 * 类似 Servlet Filter 的设计模式
 */
public interface Filter {

    /**
     * 执行过滤
     * @param exchange HTTP 交换对象
     * @param chain    过滤器链，调用 chain.doFilter() 继续下一个
     * @return true 表示继续执行，false 表示已终止
     */
    boolean doFilter(HttpExchange exchange, FilterChain chain) throws Exception;

    /**
     * 过滤器名称（用于日志）
     */
    default String name() {
        return getClass().getSimpleName();
    }
}

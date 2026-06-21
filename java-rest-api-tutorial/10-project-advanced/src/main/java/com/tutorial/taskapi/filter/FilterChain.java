package com.tutorial.taskapi.filter;

import com.sun.net.httpserver.HttpExchange;

import java.util.List;

/**
 * 过滤器链
 * 
 * 按顺序执行过滤器，任一过滤器返回 false 则终止链
 */
public class FilterChain {

    private final List<Filter> filters;
    private final Runnable finalHandler;
    private int currentIndex = 0;

    public FilterChain(List<Filter> filters, Runnable finalHandler) {
        this.filters = filters;
        this.finalHandler = finalHandler;
    }

    /**
     * 执行下一个过滤器
     */
    public boolean doFilter(HttpExchange exchange) throws Exception {
        if (currentIndex < filters.size()) {
            Filter filter = filters.get(currentIndex++);
            System.out.printf("  [Filter] → %s%n", filter.name());
            return filter.doFilter(exchange, this);
        } else {
            // 所有过滤器通过，执行最终处理器
            finalHandler.run();
            return true;
        }
    }

    /**
     * 重置链（用于复用）
     */
    public void reset() {
        currentIndex = 0;
    }
}

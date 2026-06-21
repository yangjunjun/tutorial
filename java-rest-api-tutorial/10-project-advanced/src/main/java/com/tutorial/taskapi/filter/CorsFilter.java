package com.tutorial.taskapi.filter;

import com.sun.net.httpserver.HttpExchange;

/**
 * CORS（跨域资源共享）过滤器
 * 
 * 允许浏览器从不同域名访问 API
 */
public class CorsFilter implements Filter {

    private final String allowedOrigins;

    public CorsFilter() {
        this("*");  // 开发环境允许所有来源
    }

    public CorsFilter(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public boolean doFilter(HttpExchange exchange, FilterChain chain) throws Exception {
        // 设置 CORS 响应头
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", allowedOrigins);
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers",
                "Content-Type, Authorization");
        exchange.getResponseHeaders().set("Access-Control-Max-Age", "3600");

        // OPTIONS 预检请求直接返回 204
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return false;  // 不继续执行
        }

        return chain.doFilter(exchange);
    }

    @Override
    public String name() {
        return "CorsFilter";
    }
}

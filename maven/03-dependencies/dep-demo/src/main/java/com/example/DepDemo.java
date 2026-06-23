package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * 演示 Maven 依赖管理：
 * - Gson（compile scope）
 * - HttpClient5（compile scope + 传递依赖）
 * - SLF4J（显式版本覆盖传递依赖版本）
 */
public class DepDemo {
    private static final Logger log = LoggerFactory.getLogger(DepDemo.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static void main(String[] args) throws Exception {
        log.info("Dependency Demo 启动");

        // 使用 HttpClient5 发送请求
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            var request = new HttpGet("https://httpbin.org/get");
            String body = client.execute(request, response -> {
                log.info("HTTP 状态码: {}", response.getCode());
                return EntityUtils.toString(response.getEntity());
            });

            // 使用 Gson 解析 JSON
            Map<?, ?> result = gson.fromJson(body, Map.class);
            System.out.println("Response origin: " + result.get("origin"));
        }

        log.info("Demo 完成");
    }
}

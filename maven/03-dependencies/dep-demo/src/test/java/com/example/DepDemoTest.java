package com.example;

import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 演示 test scope 依赖：JUnit 只在测试阶段可用
 */
class DepDemoTest {

    @Test
    void gsonShouldSerializeMap() {
        Gson gson = new Gson();
        String json = gson.toJson(Map.of("key", "value"));

        assertNotNull(json);
        assertTrue(json.contains("key"));
        assertTrue(json.contains("value"));
    }

    @Test
    void gsonShouldDeserializeJson() {
        Gson gson = new Gson();
        Map<?, ?> result = gson.fromJson("{\"name\": \"Maven\"}", Map.class);

        assertEquals("Maven", result.get("name"));
    }
}

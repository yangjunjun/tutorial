package com.example.common;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * 公共 JSON 工具类，供其他模块复用。
 */
public final class JsonUtils {
    private static final Gson GSON = new GsonBuilder()
            .setPrettyPrinting()
            .create();

    private JsonUtils() {}

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }

    public static <T> T fromJson(String json, Class<T> type) {
        return GSON.fromJson(json, type);
    }
}

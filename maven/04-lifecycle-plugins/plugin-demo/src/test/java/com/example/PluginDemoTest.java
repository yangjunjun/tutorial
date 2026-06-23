package com.example;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PluginDemoTest {

    @Test
    void applicationShouldNotThrow() {
        assertDoesNotThrow(() -> PluginDemo.main(new String[]{}));
    }
}

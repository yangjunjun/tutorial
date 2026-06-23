package com.tutorial.quickstart;

public class TestStringFormat {
    public static void main(String[] var0) {
        System.out.println("===============");
        System.out.println("|0123456789|");
        System.out.printf("|%s|%n", "hi");
        //宽度与对齐（width & flags）
        System.out.printf("|%10s|%n", "hi");
        System.out.printf("|%-10s|%n", "hi");
        // 
        System.out.printf("|%010d|%n", 12);
    }
}

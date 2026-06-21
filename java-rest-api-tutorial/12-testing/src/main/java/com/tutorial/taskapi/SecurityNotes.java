package com.tutorial.taskapi;

/**
 * 安全最佳实践演示
 * 
 * 涵盖 REST API 常见的安全威胁和防御方法
 */
public class SecurityNotes {

    public static void main(String[] args) {
        sqlInjection();
        passwordHashing();
        inputValidation();
        corsNote();
        httpsNote();
    }

    // ===== 1. SQL 注入防御 =====
    static void sqlInjection() {
        System.out.println("===== SQL 注入防御 =====");

        String maliciousInput = "'; DROP TABLE tasks; --";

        System.out.println("  恶意输入: " + maliciousInput);
        System.out.println();

        // 错误方式：字符串拼接
        String unsafe = "SELECT * FROM tasks WHERE title = '" + maliciousInput + "'";
        System.out.println("  ❌ 不安全 SQL:");
        System.out.println("  " + unsafe);
        System.out.println("  → 这会删除整张表！");
        System.out.println();

        // 正确方式：PreparedStatement
        System.out.println("  ✅ 安全 SQL（PreparedStatement）:");
        System.out.println("  SELECT * FROM tasks WHERE title = ?");
        System.out.println("  参数: '" + maliciousInput + "'");
        System.out.println("  → 参数被安全转义，注入无效");
    }

    // ===== 2. 密码存储 =====
    static void passwordHashing() {
        System.out.println("\n===== 密码安全存储 =====");

        String password = "mySecret123";

        // ❌ 明文存储
        System.out.println("  ❌ 明文: " + password);

        // ✅ SHA-256 哈希
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            String hashed = java.util.Base64.getEncoder().encodeToString(hash);
            System.out.println("  ✅ SHA-256: " + hashed.substring(0, 40) + "...");
        } catch (Exception e) {
            System.out.println("  哈希失败");
        }

        System.out.println();
        System.out.println("  最佳实践:");
        System.out.println("  - 永远不要明文存储密码");
        System.out.println("  - 使用 bcrypt 或 argon2（带盐）");
        System.out.println("  - 不要使用 MD5（已不安全）");
    }

    // ===== 3. 输入验证 =====
    static void inputValidation() {
        System.out.println("\n===== 输入验证 =====");

        String[] inputs = {
                "正常标题",
                "<script>alert('XSS')</script>",
                "Robert'); DROP TABLE students;--",
                "A".repeat(10000),
                "",
        };

        for (String input : inputs) {
            String display = input.length() > 50 ? input.substring(0, 50) + "..." : input;
            boolean valid = validateTitle(input);
            System.out.printf("  %s '%s'%n", valid ? "✅" : "❌", display);
        }
    }

    static boolean validateTitle(String title) {
        if (title == null || title.isBlank()) return false;
        if (title.length() > 200) return false;
        // 检查是否包含脚本标签（简单版）
        if (title.toLowerCase().contains("<script")) return false;
        return true;
    }

    // ===== 4. CORS 配置 =====
    static void corsNote() {
        System.out.println("\n===== CORS 跨域安全 =====");
        System.out.println("  开发环境:");
        System.out.println("    Access-Control-Allow-Origin: *");
        System.out.println();
        System.out.println("  生产环境:");
        System.out.println("    Access-Control-Allow-Origin: https://yourdomain.com");
        System.out.println("    Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
        System.out.println("    Access-Control-Allow-Headers: Content-Type, Authorization");
        System.out.println("    Access-Control-Max-Age: 3600");
    }

    // ===== 5. HTTPS =====
    static void httpsNote() {
        System.out.println("\n===== HTTPS =====");
        System.out.println("  生产环境安全配置:");
        System.out.println("  1. 使用反向代理（Nginx/Caddy）处理 SSL/TLS");
        System.out.println("  2. 使用 Let's Encrypt 获取免费证书");
        System.out.println("  3. 强制 HTTPS 重定向");
        System.out.println("  4. 设置 HSTS 头");
        System.out.println("  5. 定期更新证书");
    }
}

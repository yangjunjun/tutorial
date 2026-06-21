# 第 11 章：文件上传

> **个人博客系统** — Spring Boot 3 实战教程
>
> 本章源码路径：`11-file-upload/`

---

## 目录

- [11.1 文件上传概述](#111-文件上传概述)
- [11.2 Spring Boot 文件上传基础](#112-spring-boot-文件上传基础)
- [11.3 文件上传配置](#113-文件上传配置)
- [11.4 响应 VO 设计](#114-响应-vo-设计)
- [11.5 文件 Service 设计与实现](#115-文件-service-设计与实现)
- [11.6 文件 Controller](#116-文件-controller)
- [11.7 静态资源映射](#117-静态资源映射)
- [11.8 业务应用：头像上传与封面上传](#118-业务应用头像上传与封面上传)
- [11.9 测试文件上传](#119-测试文件上传)
- [11.10 安全注意事项](#1110-安全注意事项)
- [11.11 本章小结](#1111-本章小结)

---

## 11.1 文件上传概述

在个人博客系统中，文件上传是一个基础且重要的功能。以下场景都需要文件上传支持：

| 场景         | 文件类型           | 大小限制    |
| ------------ | ------------------ | ----------- |
| 用户头像     | JPG / PNG / GIF    | 2 MB        |
| 文章封面     | JPG / PNG          | 5 MB        |
| 文章内容图片 | JPG / PNG / GIF    | 5 MB        |
| 附件下载     | PDF / DOC / ZIP    | 20 MB       |

本章将实现一个**通用文件上传服务**，包含以下核心功能：

- 文件上传到本地磁盘
- UUID 重命名防止文件名冲突
- 文件类型白名单校验
- 文件大小限制
- 静态资源映射（通过 URL 访问上传的文件）
- 文件删除

---

## 11.2 Spring Boot 文件上传基础

### MultipartFile 接口

Spring 提供了 `MultipartFile` 接口来处理文件上传。当表单的 `enctype` 设置为 `multipart/form-data` 时，Spring 会自动将上传的文件解析为 `MultipartFile` 对象。

```java
@PostMapping("/upload")
public Result upload(@RequestParam("file") MultipartFile file) {
    // file.getOriginalFilename() — 原始文件名
    // file.getSize()             — 文件大小（字节）
    // file.getContentType()      — MIME 类型
    // file.getInputStream()      — 文件输入流
    // file.getBytes()            — 文件字节数组
    // file.transferTo(dest)      — 将文件保存到目标位置
}
```

### 核心方法一览

| 方法                   | 说明                         |
| ---------------------- | ---------------------------- |
| `getOriginalFilename()`| 获取上传时的原始文件名       |
| `getSize()`            | 获取文件大小（字节）         |
| `getContentType()`     | 获取 MIME 类型               |
| `isEmpty()`            | 判断文件是否为空             |
| `transferTo(File)`     | 将文件写入到指定位置         |
| `getInputStream()`     | 获取文件的输入流             |
| `getBytes()`           | 获取文件的字节数组           |

---

## 11.3 文件上传配置

### application.yml 配置

```yaml
spring:
  servlet:
    multipart:
      enabled: true                # 启用文件上传
      max-file-size: 10MB          # 单个文件最大大小
      max-request-size: 50MB       # 单次请求的最大大小（多文件上传时）
      file-size-threshold: 2KB     # 超过此阈值后写入磁盘临时文件
      # location: /tmp             # 临时文件存储目录（可选）

# 自定义文件上传配置
file:
  upload:
    base-path: /data/blog/uploads  # 文件存储根目录
    url-prefix: /uploads           # URL 访问前缀
    allowed-types:                 # 允许的文件类型（MIME 白名单）
      - image/jpeg
      - image/png
      - image/gif
      - image/webp
      - application/pdf
    max-size: 10485760             # 最大文件大小（10MB，单位字节）
```

### 配置说明

| 配置项                    | 说明                                    | 默认值 |
| ------------------------- | --------------------------------------- | ------ |
| `max-file-size`           | 单个文件的最大大小                      | 1MB    |
| `max-request-size`        | 单次请求的最大大小（含所有文件）        | 10MB   |
| `file-size-threshold`     | 超过此阈值后，文件从内存写入磁盘        | 0      |
| `file.upload.base-path`   | 自定义配置：文件存储的根目录            | -      |
| `file.upload.url-prefix`  | 自定义配置：URL 访问前缀               | -      |
| `file.upload.allowed-types`| 自定义配置：允许上传的 MIME 类型列表   | -      |

> **注意**：如果上传的文件超过 `max-file-size`，Spring 会抛出 `MaxUploadSizeExceededException`。我们需要在全局异常处理器中捕获此异常。

---

## 11.4 响应 VO 设计

> 完整代码见 `src/main/java/com/example/blog/vo/FileVO.java`

文件上传成功后，需要返回文件的访问 URL、原始文件名、文件大小等信息：

```java
@Data
@Schema(description = "文件上传响应")
public class FileVO {

    @Schema(description = "文件访问URL", example = "/uploads/2025/01/a1b2c3d4.jpg")
    private String url;

    @Schema(description = "原始文件名", example = "my-photo.jpg")
    private String originalName;

    @Schema(description = "文件大小（字节）", example = "102400")
    private Long size;

    @Schema(description = "文件 MIME 类型", example = "image/jpeg")
    private String contentType;
}
```

---

## 11.5 文件 Service 设计与实现

> 完整代码见 `src/main/java/com/example/blog/service/FileService.java` 和 `service/impl/FileServiceImpl.java`

### Service 接口

```java
public interface FileService {
    /**
     * 上传文件
     * @param file 上传的文件
     * @param subDir 子目录（如 avatar、cover、article）
     * @return 文件信息 VO
     */
    FileVO upload(MultipartFile file, String subDir);

    /**
     * 删除文件
     * @param fileUrl 文件的访问URL
     */
    void delete(String fileUrl);
}
```

### 核心实现逻辑

```
上传流程：
1. 校验文件是否为空
2. 校验文件类型（白名单）
3. 校验文件大小
4. 生成唯一文件名（UUID + 原始扩展名）
5. 按日期创建子目录（yyyy/MM/dd）
6. 保存文件到磁盘
7. 构建并返回 FileVO

删除流程：
1. 根据 URL 反推文件路径
2. 校验路径安全性（防止目录穿越攻击）
3. 删除文件
```

### UUID 文件名生成

```java
/**
 * 生成唯一文件名
 * 使用 UUID 替换原始文件名，防止重名覆盖。
 * 保留原始扩展名，保证文件可以被正确识别。
 *
 * 示例：
 * 原始文件名 "my-photo.jpg" → "a1b2c3d4e5f6.jpg"
 */
private String generateFileName(String originalFilename) {
    String extension = getFileExtension(originalFilename);
    String uuid = UUID.randomUUID().toString().replace("-", "");
    return uuid + extension;
}
```

### 文件类型校验（白名单方式）

```java
/**
 * 校验文件类型是否在白名单中
 * 使用 MIME 类型白名单校验，比扩展名校验更可靠。
 *
 * 注意：MIME 类型由浏览器根据文件内容推断，
 * 某些情况下可能不准确，建议结合扩展名一起校验。
 */
private void validateFileType(MultipartFile file) {
    String contentType = file.getContentType();
    if (contentType == null || !allowedTypes.contains(contentType)) {
        throw new BusinessException("不支持的文件类型: " + contentType
                + "，允许的类型: " + allowedTypes);
    }
}
```

### 目录穿越攻击防护

```java
/**
 * 校验文件路径安全性，防止目录穿越攻击
 * 
 * 攻击示例：
 * 传入 fileUrl = "/uploads/../../etc/passwd"
 * 如果不校验，可能会删除系统关键文件！
 */
private void validateFilePath(String filePath) {
    Path normalizedPath = Paths.get(filePath).normalize();
    Path uploadDir = Paths.get(basePath).normalize();
    if (!normalizedPath.startsWith(uploadDir)) {
        throw new BusinessException("非法的文件路径");
    }
}
```

---

## 11.6 文件 Controller

> 完整代码见 `src/main/java/com/example/blog/controller/FileController.java`

```java
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "文件管理", description = "文件上传与删除接口")
public class FileController {

    private final FileService fileService;

    /**
     * 通用文件上传
     */
    @PostMapping("/upload")
    @Operation(summary = "上传文件")
    public Result<FileVO> upload(@RequestParam("file") MultipartFile file,
                                 @RequestParam(defaultValue = "general") String subDir) {
        return Result.ok(fileService.upload(file, subDir));
    }

    /**
     * 用户头像上传（限制为图片类型，2MB）
     */
    @PostMapping("/upload/avatar")
    @Operation(summary = "上传用户头像")
    public Result<FileVO> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return Result.ok(fileService.upload(file, "avatar"));
    }

    /**
     * 文章封面上传
     */
    @PostMapping("/upload/cover")
    @Operation(summary = "上传文章封面")
    public Result<FileVO> uploadCover(@RequestParam("file") MultipartFile file) {
        return Result.ok(fileService.upload(file, "cover"));
    }

    /**
     * 删除文件
     */
    @DeleteMapping
    @Operation(summary = "删除文件")
    public Result<Void> delete(@RequestParam String fileUrl) {
        fileService.delete(fileUrl);
        return Result.ok();
    }
}
```

---

## 11.7 静态资源映射

> 完整代码见 `src/main/java/com/example/blog/config/WebMvcConfig.java`

上传的文件存储在服务器磁盘上（如 `/data/blog/uploads/`），需要通过 HTTP URL 才能被前端访问。Spring MVC 提供了 `addResourceHandlers` 方法来实现静态资源映射：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.base-path}")
    private String basePath;

    @Value("${file.upload.url-prefix}")
    private String urlPrefix;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 将 URL 前缀映射到磁盘目录
        // 例如：/uploads/abc.jpg → /data/blog/uploads/abc.jpg
        registry.addResourceHandler(urlPrefix + "/**")
                .addResourceLocations("file:" + basePath + "/");
    }
}
```

### 映射原理

```
浏览器请求：GET http://localhost:8080/uploads/2025/01/a1b2c3d4.jpg
                         │
                         ▼
Spring MVC ResourceHandler 匹配 /uploads/**
                         │
                         ▼
映射到磁盘：/data/blog/uploads/2025/01/a1b2c3d4.jpg
                         │
                         ▼
读取文件并返回给浏览器
```

> **注意**：如果使用 Spring Security，需要放行静态资源路径，否则会返回 401/403：
> ```java
> // SecurityConfig.java
> http.authorizeHttpRequests(auth -> auth
>     .requestMatchers("/uploads/**").permitAll()  // 放行静态资源
>     // ...
> );
> ```

---

## 11.8 业务应用：头像上传与封面上传

### 头像上传

用户更新头像时，前端调用头像上传接口，获取返回的 URL 后调用更新用户信息接口：

```bash
# 第一步：上传头像文件
curl -X POST http://localhost:8080/api/files/upload/avatar \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/my-avatar.jpg"

# 响应：
# {
#   "code": 200,
#   "data": {
#     "url": "/uploads/avatar/2025/01/e4d909c290d0fb1ca068ffaddf22cbd0.jpg",
#     "originalName": "my-avatar.jpg",
#     "size": 52428,
#     "contentType": "image/jpeg"
#   }
# }

# 第二步：更新用户头像
curl -X PUT http://localhost:8080/api/user/avatar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"avatarUrl": "/uploads/avatar/2025/01/e4d909c290d0fb1ca068ffaddf22cbd0.jpg"}'
```

### 文章封面上传

创建文章时，封面图片的 URL 作为文章的一个字段提交：

```bash
# 第一步：上传封面图片
curl -X POST http://localhost:8080/api/files/upload/cover \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/cover.jpg"

# 第二步：创建文章（封面URL作为字段提交）
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "我的第一篇博客",
    "content": "正文内容...",
    "coverUrl": "/uploads/cover/2025/01/f5e10c8a2d.jpg",
    "categoryId": 1
  }'
```

---

## 11.9 测试文件上传

### 方式一：curl 命令行

```bash
# 上传单个文件
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/test-image.jpg"

# 上传头像
curl -X POST http://localhost:8080/api/files/upload/avatar \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/avatar.png"

# 上传封面
curl -X POST http://localhost:8080/api/files/upload/cover \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/cover.jpg"

# 删除文件
curl -X DELETE "http://localhost:8080/api/files?fileUrl=/uploads/general/2025/01/abc123.jpg" \
  -H "Authorization: Bearer {token}"
```

### 方式二：Postman

1. 选择 `POST` 方法
2. URL：`http://localhost:8080/api/files/upload`
3. Headers 中添加 `Authorization: Bearer {token}`
4. Body 选择 `form-data`
5. Key 填写 `file`，Type 选择 `File`
6. Value 选择要上传的文件
7. 点击 Send

### 方式三：前端 HTML 表单（测试用）

```html
<!DOCTYPE html>
<html>
<head><title>文件上传测试</title></head>
<body>
  <h2>文件上传测试</h2>
  <form action="/api/files/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept="image/*">
    <input type="hidden" name="subDir" value="test">
    <button type="submit">上传</button>
  </form>
</body>
</html>
```

### 异常场景测试

```bash
# 测试超大文件（应返回 413 或自定义错误信息）
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@/path/to/large-file.zip"

# 测试不支持的文件类型（如 .exe，应返回错误）
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@/path/to/malware.exe"

# 测试空文件
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@/path/to/empty.txt"
```

---

## 11.10 安全注意事项

文件上传是 Web 安全中非常重要的一环，以下是需要注意的安全问题：

### 1. 文件类型校验

```
✅ 推荐做法：
- MIME 类型白名单（file.getContentType()）
- 文件扩展名白名单
- 文件头（Magic Number）校验

❌ 不推荐：
- 仅依赖前端校验
- 黑名单方式（容易遗漏危险类型）
```

### 2. 文件名安全

```
✅ 推荐做法：
- UUID 重命名，不使用原始文件名存储
- 保留扩展名时校验扩展名合法性

❌ 不推荐：
- 直接使用用户提供的文件名（可能导致路径穿越）
- 在文件名中包含用户输入的内容
```

### 3. 存储路径安全

```
✅ 推荐做法：
- 文件存储在应用目录之外
- 通过静态资源映射提供访问
- 校验文件路径，防止目录穿越

❌ 不推荐：
- 文件存储在 WEB-INF 或 classpath 下
- 根据用户输入拼接文件路径
```

### 4. 文件大小限制

```
✅ 推荐做法：
- 配置 max-file-size 和 max-request-size
- 在 Service 层二次校验

❌ 不推荐：
- 不限制文件大小（可能导致磁盘被占满）
```

---

## 11.11 本章小结

本章我们学习了：

| 知识点           | 要点                                                    |
| ---------------- | ------------------------------------------------------- |
| MultipartFile    | Spring 文件上传的核心接口                               |
| 文件上传配置     | 大小限制、临时目录等 Spring Boot 配置                   |
| UUID 重命名      | 防止文件名冲突，保留原始扩展名                         |
| 文件类型校验     | MIME 类型白名单方式，比黑名单更安全                     |
| 静态资源映射     | WebMvcConfigurer 将磁盘目录映射为可访问的 URL           |
| 目录穿越防护     | 校验文件路径的合法性                                    |
| 文件删除         | 根据 URL 反推路径，校验后删除                         |
| 实际业务应用     | 头像上传、文章封面上传的完整流程                        |

### 下一章预告

下一章我们将集成 **SpringDoc OpenAPI**，为项目自动生成在线 API 文档（Swagger UI），方便前端开发和接口调试。

---

## 附录：本章文件清单

| 文件路径 | 说明 |
| -------- | ---- |
| `controller/FileController.java` | 文件上传/删除 Controller |
| `service/FileService.java` | 文件 Service 接口 |
| `service/impl/FileServiceImpl.java` | 文件 Service 实现 |
| `vo/FileVO.java` | 文件上传响应 VO |
| `config/WebMvcConfig.java` | WebMvc 静态资源映射配置 |

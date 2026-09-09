package com.example.blog.service.impl;

import com.example.blog.exception.BusinessException;
import com.example.blog.service.FileService;
import com.example.blog.vo.FileVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 文件服务实现类（本地磁盘存储）
 * <p>
 * 将上传的文件保存到服务器本地磁盘，通过静态资源映射提供 URL 访问。
 * 核心功能：
 * <ul>
 *   <li>文件类型白名单校验</li>
 *   <li>文件大小校验</li>
 *   <li>UUID 重命名防冲突</li>
 *   <li>按日期组织目录结构</li>
 *   <li>目录穿越攻击防护</li>
 * </ul>
 * </p>
 *
 * <p>如果需要切换到 OSS 或 MinIO 存储，只需新建一个实现类即可，
 * Controller 层无需修改（面向接口编程）。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Service
@Slf4j
public class FileServiceImpl implements FileService {

    /**
     * 文件存储根目录
     * <p>从配置项 file.upload.base-path 读取</p>
     */
    @Value("${file.upload.base-path:/data/blog/uploads}")
    private String basePath;

    /**
     * URL 访问前缀
     * <p>从配置项 file.upload.url-prefix 读取</p>
     */
    @Value("${file.upload.url-prefix:/uploads}")
    private String urlPrefix;

    /**
     * 允许的文件 MIME 类型（白名单）
     * <p>
     * 只允许以下类型上传：
     * - 图片：JPEG、PNG、GIF、WebP
     * - 文档：PDF
     * </p>
     */
    @Value("${file.upload.allowed-types:image/jpeg,image/png,image/gif,image/webp,application/pdf}")
    private String[] allowedTypesArray;

    /**
     * 最大文件大小（字节），默认 10MB
     */
    @Value("${file.upload.max-size:10485760}")
    private long maxSize;

    /**
     * 允许的扩展名白名单（双重校验）
     */
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"
    );

    /**
     * 日期格式化器，用于生成按日期组织的子目录
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    // ==================== 上传 ====================

    /**
     * 上传文件到本地磁盘
     * <p>
     * 完整流程：校验 → 生成文件名 → 创建目录 → 保存文件 → 返回信息
     * </p>
     *
     * @param file   上传的文件
     * @param subDir 子目录名称（如 avatar、cover、article、general）
     * @return 文件信息 VO
     */
    @Override
    public FileVO upload(MultipartFile file, String subDir) {
        // ---- 1. 基础校验 ----
        validateFile(file);

        // ---- 2. 生成存储路径 ----
        // 目录结构：basePath/subDir/yyyy/MM/dd/uuid.ext
        // 示例：/data/blog/uploads/avatar/2025/01/15/a1b2c3d4e5f6.jpg
        String dateDir = LocalDate.now().format(DATE_FORMATTER);
        String newFileName = generateFileName(file.getOriginalFilename());
        String relativePath = subDir + "/" + dateDir + "/" + newFileName;

        // ---- 3. 创建目标目录 ----
        Path targetDir = Paths.get(basePath, subDir, dateDir);
        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            log.error("创建目录失败: {}", targetDir, e);
            throw new BusinessException("文件上传失败：无法创建存储目录");
        }

        // ---- 4. 保存文件到磁盘 ----
        Path targetFile = targetDir.resolve(newFileName);
        try {
            file.transferTo(targetFile.toFile());
            log.info("文件上传成功: {} → {}", file.getOriginalFilename(), targetFile);
        } catch (IOException e) {
            log.error("保存文件失败: {}", targetFile, e);
            throw new BusinessException("文件上传失败：保存文件时发生错误");
        }

        // ---- 5. 构建响应 VO ----
        FileVO fileVO = new FileVO();
        fileVO.setUrl(urlPrefix + "/" + relativePath);
        fileVO.setOriginalName(file.getOriginalFilename());
        fileVO.setSize(file.getSize());
        fileVO.setContentType(file.getContentType());
        return fileVO;
    }

    // ==================== 删除 ====================

    /**
     * 根据 URL 删除文件
     * <p>
     * 流程：URL 反推路径 → 安全校验 → 删除文件
     * </p>
     *
     * @param fileUrl 文件的访问 URL
     */
    @Override
    public void delete(String fileUrl) {
        if (!StringUtils.hasText(fileUrl)) {
            throw new BusinessException("文件URL不能为空");
        }

        // 去掉 URL 前缀，得到相对路径
        // 例如：/uploads/avatar/2025/01/xxx.jpg → avatar/2025/01/xxx.jpg
        if (!fileUrl.startsWith(urlPrefix + "/")) {
            throw new BusinessException("无效的文件URL");
        }
        String relativePath = fileUrl.substring(urlPrefix.length() + 1);

        // 拼接出完整的磁盘路径
        Path filePath = Paths.get(basePath, relativePath).normalize();

        // 安全校验：防止目录穿越攻击
        validateFilePath(filePath);

        // 删除文件
        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("文件删除成功: {}", filePath);
            } else {
                log.warn("文件不存在，跳过删除: {}", filePath);
            }
        } catch (IOException e) {
            log.error("删除文件失败: {}", filePath, e);
            throw new BusinessException("文件删除失败");
        }
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 文件基础校验
     * <p>
     * 检查以下项目：
     * 1. 文件是否为空
     * 2. 文件类型是否在白名单中
     * 3. 文件大小是否超限
     * 4. 文件扩展名是否合法
     * </p>
     *
     * @param file 上传的文件
     */
    private void validateFile(MultipartFile file) {
        // 1. 检查文件是否为空
        if (file == null || file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        // 2. 校验 MIME 类型（白名单）
        List<String> allowedTypes = Arrays.asList(allowedTypesArray);
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new BusinessException(
                    "不支持的文件类型: " + contentType + "，允许的类型: " + allowedTypes);
        }

        // 3. 校验文件大小
        if (file.getSize() > maxSize) {
            throw new BusinessException(
                    String.format("文件大小超出限制，最大允许 %d MB，当前 %d MB",
                            maxSize / (1024 * 1024),
                            file.getSize() / (1024 * 1024)));
        }

        // 4. 校验文件扩展名（双重校验）
        String extension = getFileExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BusinessException(
                    "不支持的文件扩展名: " + extension + "，允许的扩展名: " + ALLOWED_EXTENSIONS);
        }
    }

    /**
     * 生成唯一文件名
     * <p>
     * 使用 UUID 替换原始文件名，防止重名覆盖。
     * 保留原始扩展名，保证文件可以被正确识别。
     * </p>
     *
     * <pre>
     * 示例：
     * "my-photo.jpg" → "a1b2c3d4e5f6789012345678.jpg"
     * "report.pdf"   → "f0e1d2c3b4a5968776655443.pdf"
     * </pre>
     *
     * @param originalFilename 原始文件名
     * @return UUID 文件名（含扩展名）
     */
    private String generateFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid + extension;
    }

    /**
     * 从文件名中提取扩展名
     * <p>
     * 处理边界情况：
     * - null 或空字符串 → 返回空字符串
     * - 没有扩展名的文件 → 返回空字符串
     * - 隐藏文件（如 .gitignore）→ 返回空字符串
     * </p>
     *
     * @param filename 文件名
     * @return 扩展名（包含点号，如 ".jpg"）
     */
    private String getFileExtension(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex <= 0) {
            // 没有扩展名，或者是以点号开头的隐藏文件
            return "";
        }
        return filename.substring(lastDotIndex);
    }

    /**
     * 校验文件路径安全性，防止目录穿越攻击
     * <p>
     * 攻击示例：
     * 传入 fileUrl = "/uploads/../../etc/passwd"
     * 如果不校验，可能会删除系统关键文件！
     * </p>
     * <p>
     * 防护方式：将路径标准化（normalize）后，检查是否在允许的目录内。
     * </p>
     *
     * @param filePath 要校验的文件路径
     */
    private void validateFilePath(Path filePath) {
        Path normalizedPath = filePath.normalize();
        Path uploadDir = Paths.get(basePath).normalize();
        if (!normalizedPath.startsWith(uploadDir)) {
            log.warn("检测到非法文件路径访问: {}", normalizedPath);
            throw new BusinessException("非法的文件路径");
        }
    }
}

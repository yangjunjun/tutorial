package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.service.FileService;
import com.example.blog.vo.FileVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件管理 Controller
 * <p>
 * 提供文件上传、删除功能。支持以下业务场景：
 * - 通用文件上传
 * - 用户头像上传（限制图片类型，2MB）
 * - 文章封面上传（限制图片类型，5MB）
 * </p>
 *
 * <p>文件存储位置由配置项 file.upload.base-path 决定，
 * 上传成功后返回文件的访问 URL，前端可直接使用该 URL 展示图片。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "文件管理", description = "文件上传与删除接口")
public class FileController {

    private final FileService fileService;

    /**
     * 通用文件上传
     * <p>
     * 支持所有白名单内的文件类型，最大 10MB。
     * 上传到 general 子目录下。
     * </p>
     *
     * @param file   上传的文件
     * @param subDir 子目录名称（可选，默认 general）
     * @return 文件信息（URL、原始文件名、大小、类型）
     */
    @PostMapping("/upload")
    @Operation(summary = "通用文件上传", description = "上传文件到服务器，返回文件访问URL")
    public Result<FileVO> upload(
            @Parameter(description = "要上传的文件") @RequestParam("file") MultipartFile file,
            @Parameter(description = "子目录") @RequestParam(defaultValue = "general") String subDir) {
        FileVO fileVO = fileService.upload(file, subDir);
        return Result.ok(fileVO);
    }

    /**
     * 用户头像上传
     * <p>
     * 专用于用户头像上传，文件存储到 avatar 子目录。
     * Service 层会校验文件类型（仅允许图片）和大小（最大 2MB）。
     * </p>
     *
     * @param file 头像图片文件
     * @return 文件信息
     */
    @PostMapping("/upload/avatar")
    @Operation(summary = "上传用户头像", description = "上传头像图片，仅支持 JPG/PNG/GIF，最大 2MB")
    public Result<FileVO> uploadAvatar(
            @Parameter(description = "头像图片") @RequestParam("file") MultipartFile file) {
        FileVO fileVO = fileService.upload(file, "avatar");
        return Result.ok(fileVO);
    }

    /**
     * 文章封面上传
     * <p>
     * 专用于文章封面图片上传，文件存储到 cover 子目录。
     * </p>
     *
     * @param file 封面图片文件
     * @return 文件信息
     */
    @PostMapping("/upload/cover")
    @Operation(summary = "上传文章封面", description = "上传文章封面图片，仅支持 JPG/PNG，最大 5MB")
    public Result<FileVO> uploadCover(
            @Parameter(description = "封面图片") @RequestParam("file") MultipartFile file) {
        FileVO fileVO = fileService.upload(file, "cover");
        return Result.ok(fileVO);
    }

    /**
     * 文章内容图片上传
     * <p>
     * 用于文章 Markdown 编辑器中的图片上传，存储到 article 子目录。
     * </p>
     *
     * @param file 文章内容图片
     * @return 文件信息
     */
    @PostMapping("/upload/article")
    @Operation(summary = "上传文章内容图片", description = "用于 Markdown 编辑器中的图片上传")
    public Result<FileVO> uploadArticleImage(
            @Parameter(description = "文章图片") @RequestParam("file") MultipartFile file) {
        FileVO fileVO = fileService.upload(file, "article");
        return Result.ok(fileVO);
    }

    /**
     * 删除文件
     * <p>
     * 根据文件访问 URL 删除服务器上的文件。
     * 会进行路径安全校验，防止目录穿越攻击。
     * </p>
     *
     * @param fileUrl 文件的访问 URL
     * @return 操作结果
     */
    @DeleteMapping
    @Operation(summary = "删除文件", description = "根据文件URL删除服务器上的文件")
    public Result<Void> delete(
            @Parameter(description = "文件访问URL") @RequestParam String fileUrl) {
        fileService.delete(fileUrl);
        return Result.ok();
    }
}

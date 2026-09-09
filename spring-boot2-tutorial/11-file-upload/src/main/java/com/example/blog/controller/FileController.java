package com.example.blog.controller;

import com.example.blog.common.Result;
import com.example.blog.service.FileService;
import com.example.blog.vo.FileVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
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
 * <p>Spring Boot 2.5 适配说明：接口文档使用 springfox 3.0.0（Swagger 2 注解风格），
 * 即 @Api / @ApiOperation / @ApiParam，而非 SpringDoc 的 @Tag / @Operation / @Parameter。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Api(tags = "文件管理", description = "文件上传与删除接口")
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
    @ApiOperation(value = "通用文件上传", notes = "上传文件到服务器，返回文件访问URL")
    public Result<FileVO> upload(
            @ApiParam(value = "要上传的文件", required = true) @RequestParam("file") MultipartFile file,
            @ApiParam(value = "子目录") @RequestParam(defaultValue = "general") String subDir) {
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
    @ApiOperation(value = "上传用户头像", notes = "上传头像图片，仅支持 JPG/PNG/GIF，最大 2MB")
    public Result<FileVO> uploadAvatar(
            @ApiParam(value = "头像图片", required = true) @RequestParam("file") MultipartFile file) {
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
    @ApiOperation(value = "上传文章封面", notes = "上传文章封面图片，仅支持 JPG/PNG，最大 5MB")
    public Result<FileVO> uploadCover(
            @ApiParam(value = "封面图片", required = true) @RequestParam("file") MultipartFile file) {
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
    @ApiOperation(value = "上传文章内容图片", notes = "用于 Markdown 编辑器中的图片上传")
    public Result<FileVO> uploadArticleImage(
            @ApiParam(value = "文章图片", required = true) @RequestParam("file") MultipartFile file) {
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
    @ApiOperation(value = "删除文件", notes = "根据文件URL删除服务器上的文件")
    public Result<Void> delete(
            @ApiParam(value = "文件访问URL", required = true) @RequestParam String fileUrl) {
        fileService.delete(fileUrl);
        return Result.ok();
    }
}

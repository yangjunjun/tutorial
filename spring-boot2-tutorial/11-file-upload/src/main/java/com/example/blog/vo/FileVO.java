package com.example.blog.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 文件上传响应 VO
 * <p>
 * 文件上传成功后返回给前端的信息。
 * 前端可以直接使用 url 字段展示图片或作为表单字段提交。
 * </p>
 *
 * <pre>
 * 响应示例：
 * {
 *   "code": 200,
 *   "data": {
 *     "url": "/uploads/avatar/2025/01/a1b2c3d4e5f6.jpg",
 *     "originalName": "my-photo.jpg",
 *     "size": 52428,
 *     "contentType": "image/jpeg"
 *   }
 * }
 * </pre>
 *
 * <p>Spring Boot 2.5 适配说明：文档注解使用 springfox 的 @ApiModel/@ApiModelProperty
 * （对应 SpringDoc/Swagger 3 中的 @Schema）。</p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
@Data
@ApiModel(description = "文件上传响应信息")
public class FileVO {

    /**
     * 文件访问 URL
     * <p>
     * 相对路径，前端拼接域名后可直接访问。
     * 例如：http://localhost:8080/uploads/avatar/2025/01/a1b2c3d4.jpg
     * </p>
     */
    @ApiModelProperty(value = "文件访问URL", example = "/uploads/avatar/2025/01/a1b2c3d4e5f6.jpg")
    private String url;

    /**
     * 原始文件名
     * <p>用户上传时的文件名，仅用于展示，实际存储使用的是 UUID 文件名。</p>
     */
    @ApiModelProperty(value = "原始文件名", example = "my-photo.jpg")
    private String originalName;

    /**
     * 文件大小（字节）
     */
    @ApiModelProperty(value = "文件大小（字节）", example = "102400")
    private Long size;

    /**
     * 文件 MIME 类型
     * <p>例如：image/jpeg, image/png, application/pdf</p>
     */
    @ApiModelProperty(value = "文件MIME类型", example = "image/jpeg")
    private String contentType;
}

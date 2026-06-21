package com.example.blog.service;

import com.example.blog.vo.FileVO;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务接口
 * <p>
 * 定义文件上传和删除的抽象方法。
 * 具体实现可以存储到本地磁盘、OSS（阿里云对象存储）、MinIO 等。
 * </p>
 *
 * @author blog-tutorial
 * @since 1.0
 */
public interface FileService {

    /**
     * 上传文件
     * <p>
     * 将文件保存到服务器，并返回文件的访问信息（URL、文件名、大小等）。
     * 实现类需要完成以下工作：
     * <ol>
     *   <li>校验文件是否为空</li>
     *   <li>校验文件类型（白名单）</li>
     *   <li>校验文件大小</li>
     *   <li>生成唯一文件名（UUID）</li>
     *   <li>按日期创建子目录</li>
     *   <li>保存文件到磁盘</li>
     *   <li>构建并返回 FileVO</li>
     * </ol>
     * </p>
     *
     * @param file   上传的文件
     * @param subDir 子目录名称（如 avatar、cover、article）
     * @return 文件上传结果
     * @throws com.example.blog.exception.BusinessException 文件校验失败时抛出
     */
    FileVO upload(MultipartFile file, String subDir);

    /**
     * 删除文件
     * <p>
     * 根据文件的访问 URL 反推文件路径，校验安全性后删除文件。
     * 如果文件不存在，静默处理（不抛异常）。
     * </p>
     *
     * @param fileUrl 文件的访问 URL（如 /uploads/avatar/2025/01/xxx.jpg）
     * @throws com.example.blog.exception.BusinessException 路径不合法时抛出
     */
    void delete(String fileUrl);
}

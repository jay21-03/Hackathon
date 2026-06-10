package com.seal.hackathon.common.storage;

import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.common.storage.dto.FileUploadResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx", "zip");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/zip",
            "application/x-zip-compressed");

    private final FileStorageProperties properties;

    public FileUploadResponse storeProblemAttachment(Long eventId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException("File exceeds maximum size of 20MB");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        if (originalName.contains("..")) {
            throw new BusinessException("Invalid file name");
        }

        String extension = extractExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException("Only PDF, DOCX, and ZIP files are allowed");
        }

        String mimeType = file.getContentType();
        if (mimeType != null && !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException("Unsupported file type");
        }

        String storedName = UUID.randomUUID() + "_" + sanitizeFileName(originalName);
        Path target = resolveRoot()
                .resolve("problems")
                .resolve(String.valueOf(eventId))
                .resolve(storedName);

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORE_FAILED");
        }

        String relativePath = "problems/" + eventId + "/" + storedName;
        return FileUploadResponse.builder()
                .url("/api/v1/files/" + relativePath)
                .fileName(originalName)
                .size(file.getSize())
                .mimeType(mimeType)
                .build();
    }

    public Resource loadAsResource(String relativePath) {
        if (relativePath == null || relativePath.isBlank() || relativePath.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_FILE_PATH");
        }

        Path root = resolveRoot().toAbsolutePath().normalize();
        Path filePath = root.resolve(relativePath).normalize();
        if (!filePath.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_FILE_PATH");
        }
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND");
            }
            return resource;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND");
        }
    }

    public String extractDownloadName(String relativePath) {
        String fileName = Paths.get(relativePath).getFileName().toString();
        int underscore = fileName.indexOf('_');
        if (underscore >= 0 && underscore < fileName.length() - 1) {
            return fileName.substring(underscore + 1);
        }
        return fileName;
    }

    public void deleteProblemAttachment(Long eventId, String publicUrl) {
        String relativePath = extractRelativePath(publicUrl);
        if (relativePath == null) {
            return;
        }
        String expectedPrefix = "problems/" + eventId + "/";
        if (!relativePath.startsWith(expectedPrefix)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FILE_EVENT_MISMATCH");
        }
        deleteRelativePath(relativePath);
    }

    public void deleteByPublicUrl(String publicUrl) {
        String relativePath = extractRelativePath(publicUrl);
        if (relativePath == null) {
            return;
        }
        deleteRelativePath(relativePath);
    }

    public String extractRelativePath(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) {
            return null;
        }
        String normalized = publicUrl.trim();
        String prefix = "/api/v1/files/";
        int index = normalized.indexOf(prefix);
        if (index >= 0) {
            return normalized.substring(index + prefix.length());
        }
        if (normalized.startsWith("problems/")) {
            return normalized;
        }
        return null;
    }

    public boolean existsByPublicUrl(String publicUrl) {
        String relativePath = extractRelativePath(publicUrl);
        if (relativePath == null) {
            return false;
        }
        Path root = resolveRoot().toAbsolutePath().normalize();
        Path filePath = root.resolve(relativePath).normalize();
        return filePath.startsWith(root) && Files.isRegularFile(filePath);
    }

    private void deleteRelativePath(String relativePath) {
        if (relativePath == null || relativePath.isBlank() || relativePath.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_FILE_PATH");
        }

        Path root = resolveRoot().toAbsolutePath().normalize();
        Path filePath = root.resolve(relativePath).normalize();
        if (!filePath.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_FILE_PATH");
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_DELETE_FAILED");
        }
    }

    private Path resolveRoot() {
        return Paths.get(properties.getFileStoragePath()).toAbsolutePath().normalize();
    }

    private String extractExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

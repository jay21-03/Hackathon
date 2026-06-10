package com.seal.hackathon.common.storage.controller;

import com.seal.hackathon.common.storage.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileDownloadController {

    private static final String PREFIX = "/api/v1/files/";

    private final FileStorageService fileStorageService;

    @GetMapping("/**")
    public ResponseEntity<Resource> download(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (!uri.startsWith(PREFIX)) {
            return ResponseEntity.notFound().build();
        }

        String relativePath = uri.substring(PREFIX.length());
        Resource resource = fileStorageService.loadAsResource(relativePath);
        String downloadName = fileStorageService.extractDownloadName(relativePath);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}

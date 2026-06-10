package com.seal.hackathon.common.storage.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.storage.FileStorageService;
import com.seal.hackathon.common.storage.dto.FileUploadResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/events")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminFileController {

    private final FileStorageService fileStorageService;
    private final OrganizerAuthorizationService organizerAuthorizationService;

    @PostMapping("/{eventId}/files")
    public ApiResponse<FileUploadResponse> uploadProblemAttachment(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return ApiResponse.ok(fileStorageService.storeProblemAttachment(eventId, file));
    }

    @DeleteMapping("/{eventId}/files")
    public ApiResponse<Void> deleteProblemAttachment(
            @PathVariable Long eventId,
            @RequestParam("url") String url) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        fileStorageService.deleteProblemAttachment(eventId, url);
        return ApiResponse.ok(null);
    }
}

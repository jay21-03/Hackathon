package com.seal.hackathon.ranking.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.ranking.dto.AdvancementPreviewResponse;
import com.seal.hackathon.ranking.dto.AdvancementResponse;
import com.seal.hackathon.ranking.dto.ExecuteAdvancementRequest;
import com.seal.hackathon.ranking.dto.ExecuteAdvancementResponse;
import com.seal.hackathon.ranking.service.AdvancementService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/events/{eventId}/advancements")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminAdvancementController {

    private final AdvancementService advancementService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/preview")
    public ApiResponse<AdvancementPreviewResponse> preview(
            @PathVariable Long eventId,
            @RequestParam Long fromRoundId,
            @RequestParam Long toRoundId,
            @RequestParam(defaultValue = "2") int topNPerBoard) {
        return ApiResponse.ok(advancementService.previewAdvancements(
                eventId, fromRoundId, toRoundId, topNPerBoard));
    }

    @PostMapping("/execute")
    public ApiResponse<ExecuteAdvancementResponse> execute(
            @PathVariable Long eventId,
            @Valid @RequestBody ExecuteAdvancementRequest request) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(advancementService.executeAdvancements(eventId, request, userId));
    }

    @GetMapping
    public ApiResponse<List<AdvancementResponse>> list(
            @PathVariable Long eventId,
            @RequestParam Long toRoundId) {
        return ApiResponse.ok(advancementService.listAdvancements(eventId, toRoundId));
    }
}

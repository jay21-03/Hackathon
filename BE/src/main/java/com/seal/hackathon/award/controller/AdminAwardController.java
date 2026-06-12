package com.seal.hackathon.award.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.award.dto.AwardCategoryResponse;
import com.seal.hackathon.award.dto.CreateAwardCategoryRequest;
import com.seal.hackathon.award.dto.CreateTeamAwardRequest;
import com.seal.hackathon.award.dto.EventAwardsResponse;
import com.seal.hackathon.award.dto.PublishAwardsResponse;
import com.seal.hackathon.award.dto.SuggestAwardsFromRankingRequest;
import com.seal.hackathon.award.dto.SuggestAwardsFromRankingResponse;
import com.seal.hackathon.award.dto.TeamAwardResponse;
import com.seal.hackathon.award.dto.UpdateAwardCategoryRequest;
import com.seal.hackathon.award.service.AwardService;
import com.seal.hackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminAwardController {

    private final AwardService awardService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/api/v1/admin/events/{eventId}/award-categories")
    public ApiResponse<List<AwardCategoryResponse>> listCategories(@PathVariable Long eventId) {
        return ApiResponse.ok(awardService.listCategories(eventId));
    }

    @PostMapping("/api/v1/admin/events/{eventId}/award-categories")
    public ApiResponse<AwardCategoryResponse> createCategory(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateAwardCategoryRequest request) {
        return ApiResponse.ok(awardService.createCategory(eventId, request));
    }

    @PutMapping("/api/v1/admin/award-categories/{categoryId}")
    public ApiResponse<AwardCategoryResponse> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody UpdateAwardCategoryRequest request) {
        return ApiResponse.ok(awardService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/api/v1/admin/award-categories/{categoryId}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long categoryId) {
        awardService.deleteCategory(categoryId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/api/v1/admin/events/{eventId}/awards")
    public ApiResponse<EventAwardsResponse> listAwards(@PathVariable Long eventId) {
        return ApiResponse.ok(awardService.listAwardsForOrganizer(eventId));
    }

    @PostMapping("/api/v1/admin/events/{eventId}/awards")
    public ApiResponse<TeamAwardResponse> assignAward(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateTeamAwardRequest request) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(awardService.assignAward(eventId, request, userId));
    }

    @DeleteMapping("/api/v1/admin/awards/{awardId}")
    public ApiResponse<Void> removeAward(@PathVariable Long awardId) {
        awardService.removeAward(awardId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/api/v1/admin/events/{eventId}/awards/publish")
    public ApiResponse<PublishAwardsResponse> publishAwards(@PathVariable Long eventId) {
        return ApiResponse.ok(awardService.publishAwards(eventId));
    }

    @PostMapping("/api/v1/admin/events/{eventId}/awards/unpublish")
    public ApiResponse<PublishAwardsResponse> unpublishAwards(@PathVariable Long eventId) {
        return ApiResponse.ok(awardService.unpublishAwards(eventId));
    }

    @PostMapping("/api/v1/admin/events/{eventId}/awards/suggest-from-ranking")
    public ApiResponse<SuggestAwardsFromRankingResponse> suggestFromRanking(
            @PathVariable Long eventId,
            @RequestBody(required = false) SuggestAwardsFromRankingRequest request) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        SuggestAwardsFromRankingRequest body = request != null ? request : new SuggestAwardsFromRankingRequest();
        return ApiResponse.ok(awardService.suggestFromRanking(eventId, body, userId));
    }
}

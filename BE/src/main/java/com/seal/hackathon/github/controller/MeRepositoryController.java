package com.seal.hackathon.github.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.github.dto.JudgeRepositoryResponse;
import com.seal.hackathon.github.dto.TeamRepositoryResponse;
import com.seal.hackathon.github.service.RepositoryProvisioningService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class MeRepositoryController {

    private final RepositoryProvisioningService repositoryProvisioningService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/repositories")
    public ApiResponse<List<TeamRepositoryResponse>> getMyRepositories() {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.getMyRepositories(currentUserId));
    }

    @GetMapping("/teams/{teamId}/repository")
    public ApiResponse<List<TeamRepositoryResponse>> getMyTeamRepository(
            @PathVariable Long teamId,
            @RequestParam(required = false) Long eventId) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.getMyTeamRepository(teamId, currentUserId, eventId));
    }

    @GetMapping("/judge/repositories")
    public ApiResponse<List<JudgeRepositoryResponse>> getJudgeRepositories() {
        return ApiResponse.ok(repositoryProvisioningService.getJudgeRepositoriesForCurrentUser());
    }

    @GetMapping("/judge/rounds/{roundId}/repositories")
    public ApiResponse<List<JudgeRepositoryResponse>> getJudgeRepositoriesForRound(@PathVariable Long roundId) {
        return ApiResponse.ok(repositoryProvisioningService.getJudgeRepositoriesForRoundForCurrentUser(roundId));
    }
}

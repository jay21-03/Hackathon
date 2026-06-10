package com.seal.hackathon.github.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.github.dto.GrantJudgeAccessResponse;
import com.seal.hackathon.github.dto.ProvisionProblemRepositoriesResponse;
import com.seal.hackathon.github.dto.RepoTemplateResponse;
import com.seal.hackathon.github.dto.RepositoryLockResponse;
import com.seal.hackathon.github.dto.RepositoryRetryResponse;
import com.seal.hackathon.github.dto.SaveRepoTemplateRequest;
import com.seal.hackathon.github.dto.TeamRepositoryResponse;
import com.seal.hackathon.github.service.RepositoryProvisioningService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminRepositoryProvisioningController {

    private final RepositoryProvisioningService repositoryProvisioningService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/problems/{problemId}/repo-template")
    public ApiResponse<RepoTemplateResponse> createRepoTemplate(
            @PathVariable Long problemId,
            @Valid @RequestBody SaveRepoTemplateRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.saveProblemTemplate(problemId, request, currentUserId));
    }

    @PutMapping("/problems/{problemId}/repo-template")
    public ApiResponse<RepoTemplateResponse> updateRepoTemplate(
            @PathVariable Long problemId,
            @Valid @RequestBody SaveRepoTemplateRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.saveProblemTemplate(problemId, request, currentUserId));
    }

    @GetMapping("/problems/{problemId}/repo-template")
    public ApiResponse<RepoTemplateResponse> getRepoTemplate(@PathVariable Long problemId) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.getOrCreateProblemTemplate(problemId, currentUserId));
    }

    @PostMapping("/problems/{problemId}/repositories/provision")
    public ApiResponse<ProvisionProblemRepositoriesResponse> provisionProblemRepositories(
            @PathVariable Long problemId,
            @RequestParam(defaultValue = "false") boolean force) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.provisionForProblem(problemId, force, currentUserId));
    }

    @PostMapping("/problems/{problemId}/repositories/lock")
    public ApiResponse<RepositoryLockResponse> lockProblemRepositories(@PathVariable Long problemId) {
        return ApiResponse.ok(repositoryProvisioningService.lockProblemRepositories(problemId));
    }

    @PostMapping("/rounds/{roundId}/repositories/lock")
    public ApiResponse<RepositoryLockResponse> lockRoundRepositories(@PathVariable Long roundId) {
        return ApiResponse.ok(repositoryProvisioningService.lockRoundRepositories(roundId));
    }

    @PostMapping("/rounds/{roundId}/repositories/grant-judge-access")
    public ApiResponse<GrantJudgeAccessResponse> grantJudgeAccessForRound(@PathVariable Long roundId) {
        return ApiResponse.ok(repositoryProvisioningService.grantJudgeAccessForRound(roundId));
    }

    @PostMapping("/team-repositories/{repositoryId}/retry")
    public ApiResponse<RepositoryRetryResponse> retryRepository(@PathVariable Long repositoryId) {
        Long currentUserId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(repositoryProvisioningService.retryRepository(repositoryId, currentUserId));
    }

    @GetMapping("/events/{eventId}/repositories")
    public ApiResponse<List<TeamRepositoryResponse>> getEventRepositories(@PathVariable Long eventId) {
        return ApiResponse.ok(repositoryProvisioningService.getRepositoriesByEvent(eventId));
    }

    @GetMapping("/teams/{teamId}/repository")
    public ApiResponse<List<TeamRepositoryResponse>> getTeamRepository(@PathVariable Long teamId) {
        return ApiResponse.ok(repositoryProvisioningService.getTeamRepository(teamId));
    }
}

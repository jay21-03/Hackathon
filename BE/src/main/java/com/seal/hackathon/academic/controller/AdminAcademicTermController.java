package com.seal.hackathon.academic.controller;

import com.seal.hackathon.academic.dto.AcademicTermResponse;
import com.seal.hackathon.academic.dto.CreateAcademicTermRequest;
import com.seal.hackathon.academic.dto.TermDashboardResponse;
import com.seal.hackathon.academic.dto.TermParticipantResponse;
import com.seal.hackathon.academic.dto.TermRankingResponse;
import com.seal.hackathon.academic.dto.TermRepositoryResponse;
import com.seal.hackathon.academic.dto.TermScoreSheetResponse;
import com.seal.hackathon.academic.dto.TermScopedListResponse;
import com.seal.hackathon.academic.dto.UpdateAcademicTermRequest;
import com.seal.hackathon.academic.service.AcademicTermService;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.EventListItemResponse;
import com.seal.hackathon.registration.dto.TeamDetailDto;
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
@RequestMapping("/api/v1/admin/academic-terms")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminAcademicTermController {

    private final AcademicTermService academicTermService;

    @GetMapping
    public ApiResponse<List<AcademicTermResponse>> listTerms(
            @RequestParam(required = false) AcademicTermStatus status) {
        return ApiResponse.ok(academicTermService.listTerms(status));
    }

    @PostMapping
    public ApiResponse<AcademicTermResponse> createTerm(@Valid @RequestBody CreateAcademicTermRequest request) {
        return ApiResponse.ok(academicTermService.createTerm(request));
    }

    @GetMapping("/{termId}")
    public ApiResponse<AcademicTermResponse> getTerm(@PathVariable Long termId) {
        return ApiResponse.ok(academicTermService.getTerm(termId));
    }

    @PutMapping("/{termId}")
    public ApiResponse<AcademicTermResponse> updateTerm(
            @PathVariable Long termId,
            @Valid @RequestBody UpdateAcademicTermRequest request) {
        return ApiResponse.ok(academicTermService.updateTerm(termId, request));
    }

    @GetMapping("/{termId}/events")
    public ApiResponse<TermScopedListResponse<EventListItemResponse>> listEvents(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listEventsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/teams")
    public ApiResponse<TermScopedListResponse<TeamDetailDto>> listTeams(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listTeamsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/participants")
    public ApiResponse<TermScopedListResponse<TermParticipantResponse>> listParticipants(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listParticipantsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/mentors")
    public ApiResponse<TermScopedListResponse<UserSummaryResponse>> listMentors(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listMentorsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/judges")
    public ApiResponse<TermScopedListResponse<UserSummaryResponse>> listJudges(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listJudgesByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/mentors/candidates")
    public ApiResponse<TermScopedListResponse<UserSummaryResponse>> listMentorCandidates(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listMentorCandidatesByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/judges/candidates")
    public ApiResponse<TermScopedListResponse<UserSummaryResponse>> listJudgeCandidates(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listJudgeCandidatesByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/ranking")
    public ApiResponse<TermScopedListResponse<TermRankingResponse>> listRankings(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listRankingsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/repositories")
    public ApiResponse<TermScopedListResponse<TermRepositoryResponse>> listRepositories(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listRepositoriesByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/score-sheets")
    public ApiResponse<TermScopedListResponse<TermScoreSheetResponse>> listScoreSheets(
            @PathVariable Long termId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(academicTermService.listScoreSheetsByTerm(termId, page, size));
    }

    @GetMapping("/{termId}/dashboard")
    public ApiResponse<TermDashboardResponse> getDashboard(@PathVariable Long termId) {
        return ApiResponse.ok(academicTermService.getTermDashboard(termId));
    }
}

package com.seal.hackathon.common.validation;

import com.seal.hackathon.aireview.dto.BackfillCommitsRequest;
import com.seal.hackathon.authprofile.dto.UpdateUserApprovalRequest;
import com.seal.hackathon.award.dto.CreateAwardCategoryRequest;
import com.seal.hackathon.award.dto.CreateTeamAwardRequest;
import com.seal.hackathon.award.dto.SuggestAwardsFromRankingRequest;
import com.seal.hackathon.award.enums.AwardType;
import com.seal.hackathon.contest.dto.CreateEventRequest;
import com.seal.hackathon.contest.dto.CreateProblemRequest;
import com.seal.hackathon.contest.dto.UpdateProblemRequest;
import com.seal.hackathon.scoring.dto.MatrixRowInput;
import com.seal.hackathon.scoring.dto.SaveMatrixRequest;
import com.seal.hackathon.scoring.dto.ScoreItemInput;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ValidationHardeningDtoTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void backfillRequiresSinceAndOrderedRange() {
        assertThat(messages(new BackfillCommitsRequest(null, null, true)))
                .contains("BACKFILL_SINCE_REQUIRED");
        assertThat(messages(new BackfillCommitsRequest(
                OffsetDateTime.parse("2026-06-02T00:00:00+07:00"),
                OffsetDateTime.parse("2026-06-01T00:00:00+07:00"),
                true)))
                .contains("BACKFILL_INVALID_RANGE");
        assertThat(messages(new BackfillCommitsRequest(
                OffsetDateTime.parse("2026-06-01T00:00:00+07:00"),
                OffsetDateTime.parse("2026-06-02T00:00:00+07:00"),
                true)))
                .isEmpty();
    }

    @Test
    void problemUrlsUseConsistentHttpValidationForCreateAndUpdate() {
        CreateProblemRequest create = validCreateProblem();
        create.setExternalLink("https://example.com/problem");
        create.setAttachmentUrl("http://example.com/file.pdf");
        assertThat(messages(create)).isEmpty();

        create.setExternalLink("ftp://example.com/problem");
        assertThat(messages(create)).contains("externalLink must be a valid http(s) URL");

        UpdateProblemRequest update = new UpdateProblemRequest();
        update.setExternalLink("ftp://example.com/problem");
        assertThat(messages(update)).contains("externalLink must be a valid http(s) URL");

        update.setExternalLink("https://example.com/problem");
        update.setAttachmentUrl(" ".repeat(3));
        assertThat(messages(update)).isEmpty();
    }

    @Test
    void awardValidationRejectsInvalidTypeRankAndIds() {
        CreateAwardCategoryRequest rankWithoutOrder = validAwardCategory(AwardType.RANK);
        rankWithoutOrder.setRankOrder(null);
        assertThat(messages(rankWithoutOrder)).contains("RANK_AWARD_REQUIRES_RANK_ORDER");

        CreateAwardCategoryRequest customWithOrder = validAwardCategory(AwardType.CUSTOM);
        customWithOrder.setRankOrder(1);
        assertThat(messages(customWithOrder)).contains("CUSTOM_AWARD_MUST_NOT_HAVE_RANK_ORDER");

        CreateTeamAwardRequest assign = new CreateTeamAwardRequest();
        assign.setAwardCategoryId(-1L);
        assign.setTeamId(0L);
        assertThat(messages(assign)).contains("awardCategoryId must be positive", "teamId must be positive");
    }

    @Test
    void awardSuggestAllowsOnlyOneScope() {
        SuggestAwardsFromRankingRequest request = new SuggestAwardsFromRankingRequest();
        request.setRoundId(1L);
        request.setBoardId(2L);
        assertThat(messages(request)).contains("AWARD_SUGGEST_SCOPE_CONFLICT");
    }

    @Test
    void scoringMatrixRejectsNullRowsAndDuplicates() {
        SaveMatrixRequest request = new SaveMatrixRequest();
        assertThat(messages(request)).contains("rows must not be null");

        MatrixRowInput row1 = row(1L, 1L);
        MatrixRowInput row2 = row(1L, 2L);
        request.setRows(List.of(row1, row2));
        assertThat(messages(request)).contains("DUPLICATE_TEAM_ROW");

        request.setRows(List.of(row(1L, 1L, 1L)));
        assertThat(messages(request)).contains("DUPLICATE_CRITERIA_SCORE");
    }

    @Test
    void approvalRejectRequiresReasonAndApproveRejectsReason() {
        UpdateUserApprovalRequest reject = new UpdateUserApprovalRequest();
        reject.setAction(UpdateUserApprovalRequest.ApprovalAction.REJECT);
        reject.setReason("   ");
        assertThat(messages(reject)).contains("reason is required when rejecting a user");

        UpdateUserApprovalRequest approve = new UpdateUserApprovalRequest();
        approve.setAction(UpdateUserApprovalRequest.ApprovalAction.APPROVE);
        approve.setReason("not used");
        assertThat(messages(approve)).contains("reason is only supported when rejecting a user");
    }

    @Test
    void eventRequestRejectsNegativeIdAndUnknownFields() {
        CreateEventRequest request = new CreateEventRequest();
        request.setName("Valid Event");
        request.setStartDate(LocalDate.of(2026, 6, 1));
        request.setEndDate(LocalDate.of(2026, 6, 2));
        request.setRegistrationStartAt(OffsetDateTime.parse("2026-05-01T00:00:00+07:00"));
        request.setRegistrationEndAt(OffsetDateTime.parse("2026-05-31T23:59:00+07:00"));
        request.setMaxTeams(10);
        request.setAcademicTermId(-1L);
        request.putExtraField("maxTeam", 10);

        assertThat(messages(request)).contains("academicTermId must be positive", "UNKNOWN_JSON_FIELD");
    }

    private Set<String> messages(Object target) {
        return validator.validate(target).stream()
                .map(ConstraintViolation::getMessage)
                .collect(java.util.stream.Collectors.toSet());
    }

    private CreateProblemRequest validCreateProblem() {
        CreateProblemRequest request = new CreateProblemRequest();
        request.setTitle("Problem");
        request.setReleaseAt(OffsetDateTime.parse("2026-06-01T09:00:00+07:00"));
        request.setCloseAt(OffsetDateTime.parse("2026-06-01T17:00:00+07:00"));
        return request;
    }

    private CreateAwardCategoryRequest validAwardCategory(AwardType awardType) {
        CreateAwardCategoryRequest request = new CreateAwardCategoryRequest();
        request.setName("Best Award");
        request.setCode("BEST");
        request.setAwardType(awardType);
        request.setRankOrder(awardType == AwardType.RANK ? 1 : null);
        request.setMaxWinners(1);
        return request;
    }

    private MatrixRowInput row(Long teamId, Long... criteriaIds) {
        MatrixRowInput row = new MatrixRowInput();
        row.setTeamId(teamId);
        row.setScores(java.util.Arrays.stream(criteriaIds).map(id -> {
            ScoreItemInput score = new ScoreItemInput();
            score.setCriteriaId(id);
            return score;
        }).toList());
        return row;
    }
}

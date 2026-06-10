package com.seal.hackathon.common.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

class ContestTimelineValidationTest {

    @Test
    void eventRegistrationRules_matchFrontendExpectations() {
        LocalDate startDate = LocalDate.of(2026, 6, 10);
        LocalDate endDate = LocalDate.of(2026, 6, 12);
        OffsetDateTime regStart = OffsetDateTime.parse("2026-06-01T08:00:00+07:00");
        OffsetDateTime regEnd = OffsetDateTime.parse("2026-06-09T23:59:00+07:00");

        assertThat(ContestTimelineValidation.isRegistrationEndWithinEvent(regEnd, endDate)).isTrue();
        assertThat(ContestTimelineValidation.isRegistrationStartBeforeEvent(regStart, startDate)).isTrue();
        assertThat(ContestTimelineValidation.isRegistrationEndWithinEvent(
                        OffsetDateTime.parse("2026-06-15T08:00:00+07:00"), endDate))
                .isFalse();
    }

    @Test
    void roundAndProblemRules_matchFrontendExpectations() {
        OffsetDateTime roundStart = OffsetDateTime.parse("2026-06-10T08:00:00+07:00");
        OffsetDateTime roundEnd = OffsetDateTime.parse("2026-06-11T18:00:00+07:00");

        assertThat(ContestTimelineValidation.isRoundStartWithinEvent(
                        roundStart, LocalDate.of(2026, 6, 10)))
                .isTrue();
        assertThat(ContestTimelineValidation.isRoundEndWithinEvent(roundEnd, LocalDate.of(2026, 6, 12)))
                .isTrue();
        assertThat(ContestTimelineValidation.isProblemReleaseWithinRound(
                        OffsetDateTime.parse("2026-06-10T09:00:00+07:00"), roundStart))
                .isTrue();
        assertThat(ContestTimelineValidation.isProblemCloseWithinRound(
                        OffsetDateTime.parse("2026-06-11T17:00:00+07:00"), roundEnd))
                .isTrue();
        assertThat(ContestTimelineValidation.isProblemReleaseWithinRound(
                        OffsetDateTime.parse("2026-06-09T09:00:00+07:00"), roundStart))
                .isFalse();
    }

    @Test
    void eventWithinTerm_andRoundOverlap() {
        LocalDate termStart = LocalDate.of(2026, 6, 1);
        LocalDate termEnd = LocalDate.of(2026, 6, 30);
        assertThat(ContestTimelineValidation.isEventWithinAcademicTerm(
                        LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 12), termStart, termEnd))
                .isTrue();
        assertThat(ContestTimelineValidation.isEventWithinAcademicTerm(
                        LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 12), termStart, termEnd))
                .isFalse();

        OffsetDateTime r1Start = OffsetDateTime.parse("2026-06-10T08:00:00+07:00");
        OffsetDateTime r1End = OffsetDateTime.parse("2026-06-11T12:00:00+07:00");
        OffsetDateTime r2Start = OffsetDateTime.parse("2026-06-11T10:00:00+07:00");
        OffsetDateTime r2End = OffsetDateTime.parse("2026-06-12T18:00:00+07:00");
        assertThat(ContestTimelineValidation.doRoundTimelinesOverlap(r1Start, r1End, r2Start, r2End))
                .isTrue();
        assertThat(ContestTimelineValidation.doRoundTimelinesOverlap(
                        r1Start, r1End, r1End, OffsetDateTime.parse("2026-06-12T18:00:00+07:00")))
                .isFalse();
    }
}

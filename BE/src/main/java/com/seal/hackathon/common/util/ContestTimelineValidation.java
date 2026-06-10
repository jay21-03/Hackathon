package com.seal.hackathon.common.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public final class ContestTimelineValidation {

    private ContestTimelineValidation() {
    }

    public static boolean isEventDateRangeValid(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !startDate.isAfter(endDate);
    }

    public static boolean isRegistrationWindowValid(
            OffsetDateTime registrationStartAt, OffsetDateTime registrationEndAt) {
        if (registrationStartAt == null || registrationEndAt == null) {
            return true;
        }
        return !registrationStartAt.isAfter(registrationEndAt);
    }

    public static boolean isRegistrationEndWithinEvent(OffsetDateTime registrationEndAt, LocalDate endDate) {
        if (registrationEndAt == null || endDate == null) {
            return true;
        }
        OffsetDateTime eventEnd = endDate.atTime(LocalTime.MAX).atOffset(registrationEndAt.getOffset());
        return !registrationEndAt.isAfter(eventEnd);
    }

    public static boolean isRegistrationStartBeforeEvent(
            OffsetDateTime registrationStartAt, LocalDate startDate) {
        if (registrationStartAt == null || startDate == null) {
            return true;
        }
        OffsetDateTime eventStart = startDate.atStartOfDay().atOffset(registrationStartAt.getOffset());
        return !registrationStartAt.isAfter(eventStart);
    }

    public static boolean isRoundTimelineValid(OffsetDateTime startAt, OffsetDateTime endAt) {
        if (startAt == null || endAt == null) {
            return true;
        }
        return startAt.isBefore(endAt);
    }

    public static boolean isRoundStartWithinEvent(OffsetDateTime roundStartAt, LocalDate eventStartDate) {
        if (roundStartAt == null || eventStartDate == null) {
            return true;
        }
        OffsetDateTime eventStart = eventStartDate.atStartOfDay().atOffset(roundStartAt.getOffset());
        return !roundStartAt.isBefore(eventStart);
    }

    public static boolean isRoundEndWithinEvent(OffsetDateTime roundEndAt, LocalDate eventEndDate) {
        if (roundEndAt == null || eventEndDate == null) {
            return true;
        }
        OffsetDateTime eventEnd = eventEndDate.atTime(LocalTime.MAX).atOffset(roundEndAt.getOffset());
        return !roundEndAt.isAfter(eventEnd);
    }

    public static boolean isProblemWindowValid(OffsetDateTime releaseAt, OffsetDateTime closeAt) {
        if (releaseAt == null || closeAt == null) {
            return true;
        }
        return closeAt.isAfter(releaseAt);
    }

    public static boolean isProblemReleaseWithinRound(OffsetDateTime releaseAt, OffsetDateTime roundStartAt) {
        if (releaseAt == null || roundStartAt == null) {
            return true;
        }
        return !releaseAt.isBefore(roundStartAt);
    }

    public static boolean isProblemCloseWithinRound(OffsetDateTime closeAt, OffsetDateTime roundEndAt) {
        if (closeAt == null || roundEndAt == null) {
            return true;
        }
        return !closeAt.isAfter(roundEndAt);
    }

    public static boolean isEventWithinAcademicTerm(
            LocalDate eventStartDate,
            LocalDate eventEndDate,
            LocalDate termStartDate,
            LocalDate termEndDate) {
        if (eventStartDate == null
                || eventEndDate == null
                || termStartDate == null
                || termEndDate == null) {
            return true;
        }
        return !eventStartDate.isBefore(termStartDate) && !eventEndDate.isAfter(termEndDate);
    }

    /** Hai khoảng [start, end) chồng nhau khi startA < endB && startB < endA. */
    public static boolean doRoundTimelinesOverlap(
            OffsetDateTime startA, OffsetDateTime endA, OffsetDateTime startB, OffsetDateTime endB) {
        if (startA == null || endA == null || startB == null || endB == null) {
            return false;
        }
        return startA.isBefore(endB) && startB.isBefore(endA);
    }
}

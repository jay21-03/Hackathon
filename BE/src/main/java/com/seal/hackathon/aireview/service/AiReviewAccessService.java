package com.seal.hackathon.aireview.service;

import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * AI review visibility: participants (own team), mentors/judges assigned to the team's board, and organizers.
 */
@Service
@RequiredArgsConstructor
public class AiReviewAccessService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final CurrentUserProvider currentUserProvider;

    @Value("${app.ai.review.judge-access-enabled:true}")
    private boolean judgeAccessEnabled;

    public void requireCanViewTeamReviews(Long teamId) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (principal.getRoles() != null && principal.getRoles().contains("ORGANIZER")) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
            organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());
            return;
        }
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, principal.getUserId())) {
            return;
        }
        if (isMentorForTeam(teamId, principal.getUserId())) {
            return;
        }
        if (judgeAccessEnabled && isJudgeForTeam(teamId, principal.getUserId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    private boolean isMentorForTeam(Long teamId, Long userId) {
        List<BoardSlot> slots = boardSlotRepository.findByTeamId(teamId);
        for (BoardSlot slot : slots) {
            if (slot.getBoardId() != null
                    && mentorAssignmentRepository.existsByBoardIdAndMentorId(slot.getBoardId(), userId)) {
                return true;
            }
        }
        return false;
    }

    private boolean isJudgeForTeam(Long teamId, Long userId) {
        List<BoardSlot> slots = boardSlotRepository.findByTeamId(teamId);
        for (BoardSlot slot : slots) {
            if (slot.getBoardId() != null
                    && judgeAssignmentRepository.existsByBoardIdAndJudgeId(slot.getBoardId(), userId)) {
                return true;
            }
        }
        return false;
    }
}

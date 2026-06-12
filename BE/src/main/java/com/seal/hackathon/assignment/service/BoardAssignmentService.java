package com.seal.hackathon.assignment.service;

import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.assignment.dto.AssignmentResponse;
import com.seal.hackathon.assignment.dto.CreateAssignmentRequest;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.contest.dto.BoardTeamResponse;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class BoardAssignmentService {

    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final TeamRepository teamRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final AcademicTermRepository academicTermRepository;
    private final UserRoleRepository userRoleRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final ScoreSheetRepository scoreSheetRepository;
    private final JudgeBoardReadinessService judgeBoardReadinessService;
    private final BoardScoringReadinessService boardScoringReadinessService;

    @Transactional
    public AssignmentResponse assignMentor(Long boardId, CreateAssignmentRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);

        Long mentorId = request.getUserId();
        if (mentorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId must not be null");
        }
        if (!userRoleRepository.existsByUserIdAndRole(mentorId, SystemRole.MENTOR)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TARGET_NOT_MENTOR");
        }

        // idempotent
        if (mentorAssignmentRepository.existsByBoardIdAndMentorId(boardId, mentorId)) {
            MentorAssignment existing = mentorAssignmentRepository.findByBoardIdAndMentorId(boardId, mentorId).get();
            return toResponse(existing);
        }

        OffsetDateTime now = OffsetDateTime.now();
        MentorAssignment ma = MentorAssignment.builder()
                .boardId(boardId)
                .mentorId(mentorId)
                .createdAt(now)
                .createdBy(principal.getUserId())
                .build();
        MentorAssignment saved = mentorAssignmentRepository.save(ma);
        return toResponse(saved);
    }

    @Transactional
    public AssignmentResponse assignJudge(Long boardId, CreateAssignmentRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);

        Long judgeId = request.getUserId();
        if (judgeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId must not be null");
        }
        if (!userRoleRepository.existsByUserIdAndRole(judgeId, SystemRole.JUDGE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TARGET_NOT_JUDGE");
        }

        if (judgeAssignmentRepository.existsByBoardIdAndJudgeId(boardId, judgeId)) {
            JudgeAssignment existing = judgeAssignmentRepository.findByBoardIdAndJudgeId(boardId, judgeId).get();
            return toJudgeResponse(existing);
        }

        OffsetDateTime now = OffsetDateTime.now();
        JudgeAssignment ja = JudgeAssignment.builder()
                .boardId(boardId)
                .judgeId(judgeId)
                .createdAt(now)
                .createdBy(principal.getUserId())
                .build();
        JudgeAssignment saved = judgeAssignmentRepository.save(ja);
        boardScoringReadinessService.notifyReadyJudgesForBoard(boardId);
        return toJudgeResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listMentorsByBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return mentorAssignmentRepository.findByBoardId(boardId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listJudgesByBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return judgeAssignmentRepository.findByBoardId(boardId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listMentorAssignmentsForCurrentUser() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        return mentorAssignmentRepository.findByMentorId(principal.getUserId()).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listJudgeAssignmentsForCurrentUser() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        return judgeAssignmentRepository.findByJudgeId(principal.getUserId()).stream()
                .map(this::toJudgeResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BoardTeamResponse> listTeamsForMentor(Long boardId) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (!mentorAssignmentRepository.existsByBoardIdAndMentorId(boardId, principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MENTOR_NOT_ASSIGNED");
        }
        return boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(boardId).stream()
                .filter(slot -> slot.getTeamId() != null)
                .map(slot -> {
                    Team team = teamRepository.findById(slot.getTeamId()).orElse(null);
                    return BoardTeamResponse.builder()
                            .slotId(slot.getId())
                            .slotNumber(slot.getTeamNumber())
                            .teamId(slot.getTeamId())
                            .teamName(team != null ? team.getName() : "Team " + slot.getTeamId())
                            .teamStatus(team != null && team.getStatus() != null ? team.getStatus().name() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMentorAssignment(Long boardId, Long mentorId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        mentorAssignmentRepository.deleteByBoardIdAndMentorId(boardId, mentorId);
    }

    @Transactional
    public void completeStaffAssignment(Long boardId, Long userId, SystemRole role, Long createdBy) {
        boardRepository.findById(boardId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        OffsetDateTime now = OffsetDateTime.now();
        if (role == SystemRole.MENTOR) {
            if (!mentorAssignmentRepository.existsByBoardIdAndMentorId(boardId, userId)) {
                mentorAssignmentRepository.save(MentorAssignment.builder()
                        .boardId(boardId)
                        .mentorId(userId)
                        .createdAt(now)
                        .createdBy(createdBy)
                        .build());
            }
            return;
        }
        if (role == SystemRole.JUDGE) {
            if (!judgeAssignmentRepository.existsByBoardIdAndJudgeId(boardId, userId)) {
                judgeAssignmentRepository.save(JudgeAssignment.builder()
                        .boardId(boardId)
                        .judgeId(userId)
                        .createdAt(now)
                        .createdBy(createdBy)
                        .build());
                boardScoringReadinessService.notifyReadyJudgesForBoard(boardId);
            }
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be MENTOR or JUDGE");
    }

    @Transactional
    public void deleteJudgeAssignment(Long boardId, Long judgeId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);

        List<ScoreSheet> scoreSheets = scoreSheetRepository.findByBoardIdAndJudgeId(boardId, judgeId);
        if (!scoreSheets.isEmpty()) {
            scoreSheetRepository.deleteAll(scoreSheets);
        }
        judgeAssignmentRepository.deleteByBoardIdAndJudgeId(boardId, judgeId);
    }

    private AssignmentResponse toResponse(MentorAssignment m) {
        return enrichBoardContext(AssignmentResponse.builder()
                .id(m.getId())
                .boardId(m.getBoardId())
                .assigneeId(m.getMentorId())
                .createdAt(m.getCreatedAt())
                .createdBy(m.getCreatedBy())
                .build());
    }

    private AssignmentResponse toResponse(JudgeAssignment j) {
        return toJudgeResponse(j);
    }

    private AssignmentResponse toJudgeResponse(JudgeAssignment j) {
        AssignmentResponse response = enrichBoardContext(AssignmentResponse.builder()
                .id(j.getId())
                .boardId(j.getBoardId())
                .assigneeId(j.getJudgeId())
                .createdAt(j.getCreatedAt())
                .createdBy(j.getCreatedBy())
                .build());
        return judgeBoardReadinessService.enrichJudgeAssignment(j, response);
    }

    private AssignmentResponse enrichBoardContext(AssignmentResponse response) {
        if (response.getBoardId() == null) {
            return response;
        }
        Board board = boardRepository.findById(response.getBoardId()).orElse(null);
        if (board == null) {
            return response;
        }
        response.setBoardName(board.getName());
        response.setRoundId(board.getRoundId());
        if (board.getRoundId() == null) {
            return response;
        }
        Round round = roundRepository.findById(board.getRoundId()).orElse(null);
        if (round == null) {
            return response;
        }
        response.setRoundName(round.getName());
        response.setEventId(round.getEventId());
        if (round.getEventId() == null) {
            return response;
        }
        Event event = eventRepository.findById(round.getEventId()).orElse(null);
        if (event != null) {
            response.setEventName(event.getName());
            response.setAcademicTermId(event.getAcademicTermId());
            if (event.getAcademicTermId() != null) {
                AcademicTerm term = academicTermRepository.findById(event.getAcademicTermId()).orElse(null);
                if (term != null) {
                    response.setAcademicTermStatus(term.getStatus());
                }
            }
        }
        return response;
    }
}


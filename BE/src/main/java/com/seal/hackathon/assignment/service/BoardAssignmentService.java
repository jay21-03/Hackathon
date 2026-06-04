package com.seal.hackathon.assignment.service;

import com.seal.hackathon.assignment.dto.AssignmentResponse;
import com.seal.hackathon.assignment.dto.CreateAssignmentRequest;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.contest.repository.BoardRepository;
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
    private final UserRoleRepository userRoleRepository;
    private final CurrentUserProvider currentUserProvider;

    public String skeletonStatus() {
        return "ok";
    }

    @Transactional
    public AssignmentResponse assignMentor(Long boardId, CreateAssignmentRequest request) {
        // only organizers
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }

        boardRepository.findById(boardId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));

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
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        boardRepository.findById(boardId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));

        Long judgeId = request.getUserId();
        if (judgeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId must not be null");
        }
        if (!userRoleRepository.existsByUserIdAndRole(judgeId, SystemRole.JUDGE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TARGET_NOT_JUDGE");
        }

        if (judgeAssignmentRepository.existsByBoardIdAndJudgeId(boardId, judgeId)) {
            JudgeAssignment existing = judgeAssignmentRepository.findByBoardIdAndJudgeId(boardId, judgeId).get();
            return toResponse(existing);
        }

        OffsetDateTime now = OffsetDateTime.now();
        JudgeAssignment ja = JudgeAssignment.builder()
                .boardId(boardId)
                .judgeId(judgeId)
                .createdAt(now)
                .createdBy(principal.getUserId())
                .build();
        JudgeAssignment saved = judgeAssignmentRepository.save(ja);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listMentorsByBoard(Long boardId) {
        requireOrganizer();
        boardRepository.findById(boardId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        return mentorAssignmentRepository.findByBoardId(boardId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> listJudgesByBoard(Long boardId) {
        requireOrganizer();
        boardRepository.findById(boardId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
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
        return judgeAssignmentRepository.findByJudgeId(principal.getUserId()).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteMentorAssignment(Long boardId, Long mentorId) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        mentorAssignmentRepository.deleteByBoardIdAndMentorId(boardId, mentorId);
    }

    @Transactional
    public void deleteJudgeAssignment(Long boardId, Long judgeId) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        judgeAssignmentRepository.deleteByBoardIdAndJudgeId(boardId, judgeId);
    }

    private void requireOrganizer() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
    }

    private AssignmentResponse toResponse(MentorAssignment m) {
        return AssignmentResponse.builder()
                .id(m.getId())
                .boardId(m.getBoardId())
                .assigneeId(m.getMentorId())
                .createdAt(m.getCreatedAt())
                .createdBy(m.getCreatedBy())
                .build();
    }

    private AssignmentResponse toResponse(JudgeAssignment j) {
        return AssignmentResponse.builder()
                .id(j.getId())
                .boardId(j.getBoardId())
                .assigneeId(j.getJudgeId())
                .createdAt(j.getCreatedAt())
                .createdBy(j.getCreatedBy())
                .build();
    }
}


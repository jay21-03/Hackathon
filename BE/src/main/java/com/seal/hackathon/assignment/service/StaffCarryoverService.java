package com.seal.hackathon.assignment.service;

import com.seal.hackathon.academic.repository.AcademicTermQueryRepository;
import com.seal.hackathon.assignment.dto.StaffCarryoverFailure;
import com.seal.hackathon.assignment.dto.StaffCarryoverItem;
import com.seal.hackathon.assignment.dto.StaffCarryoverRequest;
import com.seal.hackathon.assignment.dto.StaffCarryoverResponse;
import com.seal.hackathon.assignment.dto.StaffCarryoverSuccess;
import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class StaffCarryoverService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final StaffInvitationRepository staffInvitationRepository;
    private final AcademicTermQueryRepository academicTermQueryRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;

    @Transactional
    public StaffCarryoverResponse carryoverForEvent(Long eventId, StaffCarryoverRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        Long termId = event.getAcademicTermId();
        if (termId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_HAS_NO_ACADEMIC_TERM");
        }

        Set<Long> sourceMentorIds = null;
        Set<Long> sourceJudgeIds = null;
        if (request.getSourceTermId() != null) {
            sourceMentorIds = new HashSet<>(academicTermQueryRepository.findMentorIdsByTermId(request.getSourceTermId()));
            sourceJudgeIds = new HashSet<>(academicTermQueryRepository.findJudgeIdsByTermId(request.getSourceTermId()));
        }

        Set<Long> termMentorCandidates = new HashSet<>(academicTermQueryRepository.findMentorCandidateIdsByTermId(termId));
        Set<Long> termJudgeCandidates = new HashSet<>(academicTermQueryRepository.findJudgeCandidateIdsByTermId(termId));

        List<StaffCarryoverSuccess> succeeded = new ArrayList<>();
        List<StaffCarryoverFailure> failed = new ArrayList<>();
        Set<String> seenInBatch = new HashSet<>();

        for (StaffCarryoverItem item : request.getItems()) {
            SystemRole role = item.getRole() != null ? item.getRole() : request.getDefaultRole();
            if (role != SystemRole.MENTOR && role != SystemRole.JUDGE) {
                failed.add(StaffCarryoverFailure.builder()
                        .userId(item.getUserId())
                        .role(role)
                        .reason("INVALID_ROLE")
                        .build());
                continue;
            }
            String batchKey = item.getUserId() + "|" + role.name();
            if (!seenInBatch.add(batchKey)) {
                failed.add(StaffCarryoverFailure.builder()
                        .userId(item.getUserId())
                        .role(role)
                        .reason("DUPLICATE_IN_BATCH")
                        .build());
                continue;
            }

            User user = userRepository.findById(item.getUserId()).orElse(null);
            if (user == null) {
                failed.add(StaffCarryoverFailure.builder()
                        .userId(item.getUserId())
                        .role(role)
                        .reason("USER_NOT_FOUND")
                        .build());
                continue;
            }

            if (request.getSourceTermId() != null) {
                Set<Long> sourceIds = role == SystemRole.MENTOR ? sourceMentorIds : sourceJudgeIds;
                if (sourceIds == null || !sourceIds.contains(user.getId())) {
                    failed.add(StaffCarryoverFailure.builder()
                            .userId(user.getId())
                            .role(role)
                            .reason("NOT_IN_SOURCE_TERM")
                            .build());
                    continue;
                }
            }

            Set<Long> termCandidates = role == SystemRole.MENTOR ? termMentorCandidates : termJudgeCandidates;
            if (termCandidates.contains(user.getId())) {
                failed.add(StaffCarryoverFailure.builder()
                        .userId(user.getId())
                        .role(role)
                        .reason("ALREADY_IN_TERM")
                        .build());
                continue;
            }

            try {
                registerStaffForTerm(eventId, principal.getUserId(), user, role);
                termCandidates.add(user.getId());
                succeeded.add(StaffCarryoverSuccess.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(role)
                        .build());
            } catch (ResponseStatusException ex) {
                failed.add(StaffCarryoverFailure.builder()
                        .userId(user.getId())
                        .role(role)
                        .reason(ex.getReason())
                        .build());
            }
        }

        return StaffCarryoverResponse.builder()
                .total(request.getItems().size())
                .succeededCount(succeeded.size())
                .failedCount(failed.size())
                .succeeded(succeeded)
                .failed(failed)
                .build();
    }

    private void registerStaffForTerm(Long eventId, Long actorId, User user, SystemRole role) {
        staffInvitationRepository
                .findByEventIdAndBoardIdIsNullAndEmailIgnoreCaseAndRoleAndStatus(
                        eventId, user.getEmail(), role, StaffInvitationStatus.ACCEPTED)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "ALREADY_IN_TERM");
                });

        activateInvitedStaffUser(user);
        ensureUserRole(user.getId(), role);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        staffInvitationRepository.save(StaffInvitation.builder()
                .eventId(eventId)
                .email(user.getEmail())
                .role(role)
                .status(StaffInvitationStatus.ACCEPTED)
                .invitedAt(now)
                .acceptedAt(now)
                .acceptedUserId(user.getId())
                .resendCount(0)
                .createdBy(actorId)
                .createdAt(now)
                .build());
    }

    private void activateInvitedStaffUser(User user) {
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            user.setStatus(UserStatus.ACTIVE);
            user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            userRepository.save(user);
        }
    }

    private void ensureUserRole(Long userId, SystemRole role) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, role)) {
            userRoleRepository.save(UserRole.builder()
                    .userId(userId)
                    .role(role)
                    .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .build());
        }
    }
}

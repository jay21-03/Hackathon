package com.seal.hackathon.registration.service;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.mail.dto.EmailTrackingSummary;
import com.seal.hackathon.mail.service.EmailTrackingService;
import com.seal.hackathon.registration.dto.TeamInvitationResponse;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.seal.hackathon.common.util.PageRequestUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TeamInvitationService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final EmailTrackingService emailTrackingService;

    @Transactional(readOnly = true)
    public PagedResult<TeamInvitationResponse> listInvitations(
            Long eventId, String statusFilter, String email, int page, int size) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        int resolvedSize = PageRequestUtils.resolveSize(size);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        String emailFilter = StringUtils.hasText(email) ? email.trim() : "";
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        PageRequest pageable = PageRequest.of(
                resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "invitedAt"));

        Page<TeamMember> memberPage = resolvePage(eventId, statusFilter, emailFilter, now, pageable);
        Map<Long, String> teamNames = teamRepository.findAllById(
                        memberPage.getContent().stream().map(TeamMember::getTeamId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Team::getId, Team::getName));
        List<Long> memberIds = memberPage.getContent().stream().map(TeamMember::getId).toList();
        Map<Long, EmailTrackingSummary> trackingById = emailTrackingService.summariesForTeamMembers(memberIds);

        return PagedResult.<TeamInvitationResponse>builder()
                .items(memberPage.getContent().stream()
                        .map(member -> toResponse(
                                member,
                                teamNames.get(member.getTeamId()),
                                now,
                                trackingById.get(member.getId())))
                        .toList())
                .page(resolvedPage)
                .size(resolvedSize)
                .total(memberPage.getTotalElements())
                .totalPages(memberPage.getTotalPages())
                .build();
    }

    private Page<TeamMember> resolvePage(
            Long eventId, String statusFilter, String emailFilter, OffsetDateTime now, PageRequest pageable) {
        if (!StringUtils.hasText(statusFilter)) {
            return teamMemberRepository.findByEventIdAndContactPersonFalseOrderByInvitedAtDesc(eventId, pageable);
        }
        return switch (statusFilter.trim().toUpperCase()) {
            case "INVITED" -> teamMemberRepository.findActiveInvitations(
                    eventId, TeamMemberStatus.INVITED, now, emailFilter, pageable);
            case "EXPIRED" -> teamMemberRepository.findExpiredInvitations(
                    eventId, TeamMemberStatus.INVITED, now, emailFilter, pageable);
            case "CONFIRMED" -> teamMemberRepository.findByEventIdAndStatusFiltered(
                    eventId, TeamMemberStatus.CONFIRMED, emailFilter, pageable);
            case "DECLINED" -> teamMemberRepository.findByEventIdAndStatusFiltered(
                    eventId, TeamMemberStatus.DECLINED, emailFilter, pageable);
            default -> teamMemberRepository.findByEventIdAndContactPersonFalseOrderByInvitedAtDesc(eventId, pageable);
        };
    }

    private TeamInvitationResponse toResponse(
            TeamMember member, String teamName, OffsetDateTime now, EmailTrackingSummary tracking) {
        boolean expired = member.getStatus() == TeamMemberStatus.INVITED
                && member.getInviteExpiresAt() != null
                && member.getInviteExpiresAt().isBefore(now);
        TeamInvitationResponse.TeamInvitationResponseBuilder builder = TeamInvitationResponse.builder()
                .id(member.getId())
                .teamId(member.getTeamId())
                .teamName(teamName)
                .eventId(member.getEventId())
                .email(member.getEmail())
                .fullName(member.getFullName())
                .status(member.getStatus())
                .invitedAt(member.getInvitedAt())
                .inviteExpiresAt(member.getInviteExpiresAt())
                .confirmedAt(member.getConfirmedAt())
                .declinedAt(member.getDeclinedAt())
                .resendCount(member.getResendCount() == null ? 0 : member.getResendCount())
                .lastResentAt(member.getLastResentAt())
                .expired(expired);
        if (tracking != null) {
            builder
                    .emailOpenCount(tracking.getOpenCount())
                    .emailOpenedAt(tracking.getOpenedAt())
                    .emailAcceptClickedAt(tracking.getAcceptClickedAt())
                    .emailDeclineClickedAt(tracking.getDeclineClickedAt());
        }
        return builder.build();
    }
}

package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.dto.AuditLogResponse;
import com.seal.hackathon.registration.dto.BulkInviteTeamMembersRequest;
import com.seal.hackathon.registration.dto.BulkTeamInvitationResponse;
import com.seal.hackathon.registration.dto.InviteMemberRequest;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.dto.TeamRegistrationSummaryDto;
import java.util.List;

public interface RegistrationService {
    TeamDetailDto registerTeam(Long eventId, RegisterTeamRequest request, Long contactUserId, String contactEmail, String idempotencyKey, String requestPath);

    TeamDetailDto getTeam(Long teamId, Long requesterUserId, boolean organizer);

    TeamDetailDto updateTeamStatus(Long teamId, com.seal.hackathon.common.enums.TeamStatus status, String reason, Long actorUserId, String actorEmail, boolean organizer);

    TeamDetailDto confirmInvitation(String token, Long actorUserId, String actorEmail);

    TeamDetailDto declineInvitation(String token, Long actorUserId, String actorEmail);

    TeamDetailDto resendInvitation(Long teamMemberId, Long actorUserId, String actorEmail, boolean organizer);

    TeamDetailDto inviteTeamMember(
            Long teamId,
            InviteMemberRequest member,
            Long actorUserId,
            String actorEmail,
            boolean organizer,
            String idempotencyKey,
            String requestPath);

    TeamDetailDto cancelPendingInvitation(Long teamId, Long teamMemberId, Long actorUserId, String actorEmail, boolean organizer);

    BulkTeamInvitationResponse bulkInviteTeamMembers(
            Long teamId,
            BulkInviteTeamMembersRequest request,
            Long actorUserId,
            String actorEmail,
            boolean organizer);

    List<TeamDetailDto> getMyTeams(Long eventId, Long userId);

    List<TeamDetailDto> getEventTeams(Long eventId);

    List<TeamDetailDto> getEventTeams(Long eventId, com.seal.hackathon.common.enums.TeamStatus status);

    PagedResult<TeamDetailDto> getEventTeamsPaged(
            Long eventId, com.seal.hackathon.common.enums.TeamStatus status, String query, int page, int size);

    TeamRegistrationSummaryDto getEventTeamRegistrationSummary(Long eventId);

    List<AuditLogResponse> getEventAuditLogs(Long eventId, int limit);
}

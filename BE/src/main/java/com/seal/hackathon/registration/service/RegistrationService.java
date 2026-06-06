package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.dto.MemberRequest;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import java.util.List;

public interface RegistrationService {
    TeamDetailDto registerTeam(Long eventId, RegisterTeamRequest request, Long contactUserId, String contactEmail, String idempotencyKey, String requestPath);

    TeamDetailDto getTeam(Long teamId, Long requesterUserId, boolean organizer);

    TeamDetailDto updateTeamStatus(Long teamId, com.seal.hackathon.common.enums.TeamStatus status, String reason, Long actorUserId, String actorEmail, boolean organizer);

    TeamDetailDto confirmInvitation(String token, Long actorUserId, String actorEmail);

    TeamDetailDto declineInvitation(String token, Long actorUserId, String actorEmail);

    TeamDetailDto resendInvitation(Long teamMemberId, Long actorUserId, String actorEmail, boolean organizer);

    TeamDetailDto inviteTeamMember(Long teamId, MemberRequest member, Long actorUserId, String actorEmail, boolean organizer);

    List<TeamDetailDto> getMyTeams(Long eventId, Long userId);

    List<TeamDetailDto> getEventTeams(Long eventId);

    List<TeamDetailDto> getEventTeams(Long eventId, com.seal.hackathon.common.enums.TeamStatus status);
}

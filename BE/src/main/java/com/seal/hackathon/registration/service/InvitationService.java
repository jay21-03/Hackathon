package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import java.util.List;

public interface InvitationService {
    List<TeamMember> issueInvitations(Team team, List<TeamMember> members, Long actorId);

    String hashIncomingToken(Long teamId, Long teamMemberId, String nonce, String rawToken);
}

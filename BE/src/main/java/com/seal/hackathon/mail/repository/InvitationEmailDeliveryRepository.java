package com.seal.hackathon.mail.repository;

import com.seal.hackathon.mail.entity.InvitationEmailDelivery;
import com.seal.hackathon.mail.enums.InvitationEmailType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationEmailDeliveryRepository extends JpaRepository<InvitationEmailDelivery, Long> {

    Optional<InvitationEmailDelivery> findByTrackingToken(String trackingToken);

    Optional<InvitationEmailDelivery> findFirstByStaffInvitationIdOrderBySentAtDesc(Long staffInvitationId);

    Optional<InvitationEmailDelivery> findFirstByTeamMemberIdOrderBySentAtDesc(Long teamMemberId);

    List<InvitationEmailDelivery> findByStaffInvitationIdInOrderBySentAtDesc(List<Long> staffInvitationIds);

    List<InvitationEmailDelivery> findByTeamMemberIdInOrderBySentAtDesc(List<Long> teamMemberIds);
}

package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StaffInvitationRepository extends JpaRepository<StaffInvitation, Long> {

    Optional<StaffInvitation> findByIdAndStatus(Long id, StaffInvitationStatus status);

    Optional<StaffInvitation> findByBoardIdAndEmailIgnoreCaseAndRoleAndStatus(
            Long boardId, String email, SystemRole role, StaffInvitationStatus status);

    List<StaffInvitation> findByBoardIdInAndStatusOrderByInvitedAtDesc(
            List<Long> boardIds, StaffInvitationStatus status);

    List<StaffInvitation> findByBoardIdInAndRoleAndStatusOrderByInvitedAtDesc(
            List<Long> boardIds, SystemRole role, StaffInvitationStatus status);

    List<StaffInvitation> findByBoardIdAndStatusOrderByInvitedAtDesc(
            Long boardId, StaffInvitationStatus status);

    List<StaffInvitation> findByBoardIdAndRoleAndStatusOrderByInvitedAtDesc(
            Long boardId, SystemRole role, StaffInvitationStatus status);
}

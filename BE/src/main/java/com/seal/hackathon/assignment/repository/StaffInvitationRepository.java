package com.seal.hackathon.assignment.repository;



import com.seal.hackathon.assignment.entity.StaffInvitation;

import com.seal.hackathon.common.enums.StaffInvitationStatus;

import com.seal.hackathon.common.enums.SystemRole;

import java.time.OffsetDateTime;

import java.util.List;

import java.util.Optional;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;



public interface StaffInvitationRepository extends JpaRepository<StaffInvitation, Long> {



    Optional<StaffInvitation> findByIdAndStatus(Long id, StaffInvitationStatus status);



    List<StaffInvitation> findByBoardId(Long boardId);

    Optional<StaffInvitation> findByBoardIdAndEmailIgnoreCaseAndRoleAndStatus(

            Long boardId, String email, SystemRole role, StaffInvitationStatus status);



    List<StaffInvitation> findByBoardIdInAndStatusOrderByInvitedAtDesc(

            List<Long> boardIds, StaffInvitationStatus status);



    List<StaffInvitation> findByBoardIdInAndRoleAndStatusOrderByInvitedAtDesc(

            List<Long> boardIds, SystemRole role, StaffInvitationStatus status);



    Page<StaffInvitation> findByBoardIdInAndStatusOrderByInvitedAtDesc(

            List<Long> boardIds, StaffInvitationStatus status, Pageable pageable);



    Page<StaffInvitation> findByBoardIdInAndRoleAndStatusOrderByInvitedAtDesc(

            List<Long> boardIds, SystemRole role, StaffInvitationStatus status, Pageable pageable);



    @Query("""
            SELECT si FROM StaffInvitation si
            WHERE si.boardId IN :boardIds
              AND (:status IS NULL OR si.status = :status)
              AND (:role IS NULL OR si.role = :role)
            """)
    Page<StaffInvitation> findFiltered(
            @Param("boardIds") List<Long> boardIds,
            @Param("status") StaffInvitationStatus status,
            @Param("role") SystemRole role,
            Pageable pageable);

    @Query("""
            SELECT si FROM StaffInvitation si
            WHERE si.boardId IN :boardIds
              AND (:status IS NULL OR si.status = :status)
              AND (:role IS NULL OR si.role = :role)
              AND LOWER(si.email) LIKE LOWER(CONCAT('%', :email, '%'))
            """)
    Page<StaffInvitation> findFilteredByEmail(
            @Param("boardIds") List<Long> boardIds,
            @Param("status") StaffInvitationStatus status,
            @Param("role") SystemRole role,
            @Param("email") String email,
            Pageable pageable);



    @Modifying(clearAutomatically = true)
    @Query("""

            UPDATE StaffInvitation si SET si.status = :expiredStatus

            WHERE si.boardId IN :boardIds

              AND si.status = :invitedStatus

              AND si.inviteExpiresAt IS NOT NULL

              AND si.inviteExpiresAt < :now

            """)

    int markExpired(

            @Param("boardIds") List<Long> boardIds,

            @Param("invitedStatus") StaffInvitationStatus invitedStatus,

            @Param("expiredStatus") StaffInvitationStatus expiredStatus,

            @Param("now") OffsetDateTime now);

    @Query("""
            SELECT si FROM StaffInvitation si
            WHERE si.status = :status
              AND si.inviteExpiresAt IS NOT NULL
              AND si.inviteExpiresAt > :now
              AND si.inviteExpiresAt <= :deadline
              AND si.reminderSentAt IS NULL
            """)
    List<StaffInvitation> findDueForReminder(
            @Param("status") StaffInvitationStatus status,
            @Param("now") OffsetDateTime now,
            @Param("deadline") OffsetDateTime deadline);

}


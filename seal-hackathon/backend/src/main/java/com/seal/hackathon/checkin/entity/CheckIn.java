package com.seal.hackathon.checkin.entity;

import com.seal.hackathon.common.enums.CheckInStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "check_ins")
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;
    private Long teamId;
    private Long teamMemberId;
    private Long userId;
    private String photoUrl;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CheckInStatus status;
    private OffsetDateTime checkedInAt;
    private Long verifiedBy;
    private OffsetDateTime verifiedAt;
    private String note;
}

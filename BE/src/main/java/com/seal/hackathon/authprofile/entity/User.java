package com.seal.hackathon.authprofile.entity;

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
import com.seal.hackathon.common.enums.StudentType;
import com.seal.hackathon.common.enums.UserStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String googleSub;
    private String passwordHash;
    @Column(unique = true)
    private String username;
    private String githubUsername;
    private String fullName;
    @Builder.Default
    @Column(nullable = false)
    private Boolean profileCompleted = true;
    private String studentId;
    private String university;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StudentType studentType;
    private String avatarUrl;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

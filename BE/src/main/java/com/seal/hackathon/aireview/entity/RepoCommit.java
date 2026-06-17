package com.seal.hackathon.aireview.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "repo_commits")
public class RepoCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_repository_id", nullable = false)
    private Long teamRepositoryId;

    @Column(name = "commit_sha", nullable = false, length = 100)
    private String commitSha;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_email")
    private String authorEmail;

    private String message;

    @Column(name = "committed_at")
    private OffsetDateTime committedAt;

    private String branch;

    @Column(name = "commit_url")
    private String commitUrl;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String source = "scheduler";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}

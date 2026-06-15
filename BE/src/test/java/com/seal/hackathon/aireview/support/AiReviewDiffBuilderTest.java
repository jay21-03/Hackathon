package com.seal.hackathon.aireview.support;

import com.seal.hackathon.github.client.GitHubCommitDetail;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiReviewDiffBuilderTest {

    @Test
    void buildCodeChangesDetail_truncatesLargePatchAndTotal() {
        String hugePatch = "x".repeat(5_000);
        GitHubCommitDetail commit = GitHubCommitDetail.builder()
                .sha("abc123def456")
                .message("feat: demo")
                .files(List.of(GitHubCommitDetail.GitHubCommitFileChange.builder()
                        .filename("src/App.java")
                        .status("modified")
                        .additions(100)
                        .deletions(10)
                        .patch(hugePatch)
                        .build()))
                .build();

        String detail = AiReviewDiffBuilder.buildCodeChangesDetail(List.of(commit));

        assertThat(detail).contains("src/App.java");
        assertThat(detail).contains("[Truncated]");
        assertThat(detail.length()).isLessThanOrEqualTo(52_000);
    }

    @Test
    void buildCodeChangesDetail_ignoresLockFiles() {
        GitHubCommitDetail commit = GitHubCommitDetail.builder()
                .sha("abc123def456")
                .message("chore")
                .files(List.of(
                        GitHubCommitDetail.GitHubCommitFileChange.builder()
                                .filename("package-lock.json")
                                .status("modified")
                                .additions(1)
                                .deletions(0)
                                .patch("should-not-appear")
                                .build(),
                        GitHubCommitDetail.GitHubCommitFileChange.builder()
                                .filename("src/main.java")
                                .status("added")
                                .additions(5)
                                .deletions(0)
                                .patch("+ code")
                                .build()))
                .build();

        String detail = AiReviewDiffBuilder.buildCodeChangesDetail(List.of(commit));

        assertThat(detail).doesNotContain("package-lock.json");
        assertThat(detail).contains("src/main.java");
    }
}

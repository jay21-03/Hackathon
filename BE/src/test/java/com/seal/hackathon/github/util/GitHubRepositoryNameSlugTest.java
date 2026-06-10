package com.seal.hackathon.github.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubRepositoryNameSlugTest {

    @Test
    void buildUsesReadableSlugsFromEventTeamAndProblemNames() {
        String name = GitHubRepositoryNameSlug.build(
                "Hackathon 2026 summer",
                "Tôi là Superman",
                "smart AI");

        assertThat(name).isEqualTo("hackathon-2026-summer-toi-la-superman-smart-ai");
    }

    @Test
    void buildStripsVietnameseDiacritics() {
        String name = GitHubRepositoryNameSlug.build(
                "RepoProvisioningEvent",
                "Đội Repo",
                "Đề đã mở");

        assertThat(name).isEqualTo("repoprovisioningevent-doi-repo-de-da-mo");
    }

    @Test
    void slugSegmentReplacesInvalidCharacters() {
        assertThat(GitHubRepositoryNameSlug.slugSegment("  Hello @ World!!  "))
                .isEqualTo("hello-world");
    }
}

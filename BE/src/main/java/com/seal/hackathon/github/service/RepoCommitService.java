package com.seal.hackathon.github.service;

import com.seal.hackathon.aireview.entity.RepoCommit;
import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.RepoCommitRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.common.util.GitHubRepoCoordinates;
import com.seal.hackathon.github.client.GitHubClientException;
import com.seal.hackathon.github.client.GitHubCommitInfo;
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.dto.RepoCommitResponse;
import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import java.time.OffsetDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RepoCommitService {

    private static final Logger log = LoggerFactory.getLogger(RepoCommitService.class);

    private final RepoCommitRepository repoCommitRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final ProblemRepositoryTemplateRepository templateRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final GitHubRepositoryClient githubRepositoryClient;
    private final CommitUpdateBroadcaster commitUpdateBroadcaster;

    @Value("${app.github.default-branch:main}")
    private String configuredDefaultBranch;

    @Transactional(readOnly = true)
    public Optional<RepoCommitResponse> findLatestResponse(Long teamRepositoryId) {
        return repoCommitRepository
                .findTopByTeamRepositoryIdOrderByCommittedAtDescIdDesc(teamRepositoryId)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Optional<RepoCommitResponse> getLatestCommit(Long teamRepositoryId, Long currentUserId) {
        TeamRepository repository = loadAuthorizedRepository(teamRepositoryId, currentUserId);
        return findLatestResponse(repository.getId());
    }

    @Transactional
    public RepoCommitResponse refreshLatestCommit(Long teamRepositoryId, Long currentUserId) {
        TeamRepository repository = loadAuthorizedRepository(teamRepositoryId, currentUserId);
        return captureLatestCommit(repository);
    }

    @Transactional
    public void captureLatestCommitSilently(Long teamRepositoryId) {
        if (teamRepositoryId == null) {
            return;
        }
        teamRepositoryEntityRepository.findById(teamRepositoryId).ifPresent(repository -> {
            try {
                captureLatestCommit(repository);
            } catch (Exception ex) {
                log.warn(
                        "Failed to capture latest commit for team repository {}: {}",
                        teamRepositoryId,
                        ex.getMessage());
            }
        });
    }

    private TeamRepository loadAuthorizedRepository(Long teamRepositoryId, Long currentUserId) {
        TeamRepository repository = teamRepositoryEntityRepository
                .findById(teamRepositoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository not found"));
        if (!teamMemberRepository.existsByTeamIdAndUserId(repository.getTeamId(), currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        return repository;
    }

    private RepoCommitResponse captureLatestCommit(TeamRepository repository) {
        GitHubRepoCoordinates coordinates = GitHubRepoCoordinates.fromTeamRepository(
                        repository.getGithubOwner(), repository.getGithubRepoName(), repository.getRepositoryUrl())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "NOT_GITHUB_REPOSITORY"));

        String branch = resolveBranch(repository.getProblemId());
        GitHubCommitInfo commitInfo;
        try {
            commitInfo = githubRepositoryClient
                    .getLatestCommit(coordinates.owner(), coordinates.repoName(), branch)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "REPOSITORY_EMPTY"));
        } catch (GitHubClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "GITHUB_COMMIT_UNAVAILABLE: " + ex.getMessage());
        }

        if (!StringUtils.hasText(commitInfo.getSha())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "REPOSITORY_EMPTY");
        }

        Optional<RepoCommit> existing = repoCommitRepository.findByTeamRepositoryIdAndCommitSha(
                repository.getId(), commitInfo.getSha());
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        OffsetDateTime now = OffsetDateTime.now();
        RepoCommit saved = repoCommitRepository.save(RepoCommit.builder()
                .teamRepositoryId(repository.getId())
                .commitSha(commitInfo.getSha())
                .authorName(commitInfo.getAuthorName())
                .authorEmail(commitInfo.getAuthorEmail())
                .message(trimMessage(commitInfo.getMessage()))
                .committedAt(commitInfo.getCommittedAt())
                .branch(branch)
                .commitUrl(commitInfo.getHtmlUrl())
                .createdAt(now)
                .build());
        RepoCommitResponse response = toResponse(saved);
        commitUpdateBroadcaster.broadcastFromRepository(repository, response);
        return response;
    }

    private String resolveBranch(Long problemId) {
        if (problemId != null) {
            Optional<String> templateBranch = templateRepository
                    .findByProblemId(problemId)
                    .map(ProblemRepositoryTemplate::getDefaultBranch)
                    .filter(StringUtils::hasText);
            if (templateBranch.isPresent()) {
                return templateBranch.get().trim();
            }
        }
        return StringUtils.hasText(configuredDefaultBranch) ? configuredDefaultBranch.trim() : "main";
    }

    private String trimMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return message;
        }
        String trimmed = message.trim();
        return trimmed.length() > 4000 ? trimmed.substring(0, 4000) : trimmed;
    }

    private RepoCommitResponse toResponse(RepoCommit entity) {
        return RepoCommitResponse.builder()
                .id(entity.getId())
                .teamRepositoryId(entity.getTeamRepositoryId())
                .sha(entity.getCommitSha())
                .message(entity.getMessage())
                .authorName(entity.getAuthorName())
                .authorEmail(entity.getAuthorEmail())
                .committedAt(entity.getCommittedAt())
                .htmlUrl(entity.getCommitUrl())
                .branch(entity.getBranch())
                .capturedAt(entity.getCreatedAt())
                .build();
    }
}

package com.seal.hackathon.github.service;

import com.seal.hackathon.aireview.entity.RepoCommit;
import com.seal.hackathon.aireview.repository.RepoCommitRepository;
import com.seal.hackathon.github.dto.CommitUpdateMessage;
import com.seal.hackathon.github.dto.RepoCommitResponse;
import com.seal.hackathon.github.websocket.CommitUpdateWebSocketHandler;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommitUpdateBroadcaster {

    private final CommitUpdateWebSocketHandler webSocketHandler;
    private final RepoCommitRepository repoCommitRepository;
    private final TeamRepository teamRepository;

    public void broadcastFromRepository(
            com.seal.hackathon.aireview.entity.TeamRepository repository, RepoCommitResponse latestCommit) {
        if (repository == null || latestCommit == null) {
            return;
        }
        Team team = teamRepository.findById(repository.getTeamId()).orElse(null);
        long commitCount = repoCommitRepository.countByTeamRepositoryId(repository.getId());
        webSocketHandler.broadcast(new CommitUpdateMessage(
                repository.getTeamId(),
                repository.getId(),
                team != null ? team.getEventId() : null,
                latestCommit.getSha(),
                latestCommit.getMessage(),
                latestCommit.getCommittedAt(),
                commitCount > 0 ? (int) commitCount : null));
    }

    public void broadcastFromEntity(
            com.seal.hackathon.aireview.entity.TeamRepository repository, RepoCommit latestCommit) {
        if (repository == null || latestCommit == null) {
            return;
        }
        Team team = teamRepository.findById(repository.getTeamId()).orElse(null);
        long commitCount = repoCommitRepository.countByTeamRepositoryId(repository.getId());
        webSocketHandler.broadcast(new CommitUpdateMessage(
                repository.getTeamId(),
                repository.getId(),
                team != null ? team.getEventId() : null,
                latestCommit.getCommitSha(),
                latestCommit.getMessage(),
                latestCommit.getCommittedAt(),
                commitCount > 0 ? (int) commitCount : null));
    }
}

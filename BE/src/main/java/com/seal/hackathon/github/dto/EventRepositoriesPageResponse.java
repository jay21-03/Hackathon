package com.seal.hackathon.github.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRepositoriesPageResponse {
    private List<TeamRepositoryResponse> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
    private RepositoryStatusStatsResponse stats;
}

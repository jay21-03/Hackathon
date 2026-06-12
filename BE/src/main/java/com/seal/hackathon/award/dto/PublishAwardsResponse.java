package com.seal.hackathon.award.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublishAwardsResponse {

    private int awardsPublished;
    private boolean published;
}

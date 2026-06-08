package com.seal.hackathon.github.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class MyRepositoryResponse {
    TeamRepositoryResponse repository;
}

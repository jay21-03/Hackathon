package com.seal.hackathon.assignment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssignmentRequest {
    @NotNull(message = "userId must not be null")
    @Positive(message = "userId must be greater than 0")
    private Long userId;
}

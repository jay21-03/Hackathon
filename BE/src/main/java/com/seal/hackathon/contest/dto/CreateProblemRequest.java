package com.seal.hackathon.contest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class CreateProblemRequest {

    @NotBlank(message = "title must not be blank")
    private String title;

    private String description;
    private String attachmentUrl;
    private String externalLink;

    @NotNull(message = "releaseAt must not be null")
    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime releaseAt;

    @NotNull(message = "closeAt must not be null")
    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime closeAt;
}

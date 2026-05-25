package com.seal.hackathon.contest.dto;

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
    private OffsetDateTime releaseAt;
}

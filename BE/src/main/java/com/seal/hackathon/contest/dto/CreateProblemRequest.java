package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class CreateProblemRequest {

    @NotBlank(message = "title must not be blank")
    @Size(min = 1, max = 255, message = "title must be between 1 and 255 characters")
    private String title;

    @Size(max = 10000, message = "description must not exceed 10000 characters")
    private String description;
    @Size(max = 2048, message = "attachmentUrl must not exceed 2048 characters")
    private String attachmentUrl;
    private String externalLink;

    @NotNull(message = "releaseAt must not be null")
    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime releaseAt;

    @NotNull(message = "closeAt must not be null")
    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime closeAt;

    @AssertTrue(message = "closeAt must be after releaseAt")
    @JsonIgnore
    public boolean isProblemWindowValid() {
        return ContestTimelineValidation.isProblemWindowValid(releaseAt, closeAt);
    }

    @AssertTrue(message = "externalLink must start with http:// or https://")
    @JsonIgnore
    public boolean isExternalLinkValid() {
        if (!StringUtils.hasText(externalLink)) {
            return true;
        }
        return externalLink.trim().matches("^https?://.+");
    }
}

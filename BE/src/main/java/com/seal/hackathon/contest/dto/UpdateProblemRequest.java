package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;

@Data
public class UpdateProblemRequest {
    @Size(min = 1, max = 255, message = "title must be between 1 and 255 characters")
    private String title;

    @Size(max = 10000, message = "description must not exceed 10000 characters")
    private String description;
    private String externalLink;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private String attachmentUrl;

    @JsonIgnore
    private boolean attachmentUrlProvided;

    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime releaseAt;

    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime closeAt;

    @JsonIgnore
    private final Map<String, Object> extraFields = new HashMap<>();

    @JsonAnySetter
    public void putExtraField(String name, Object value) {
        extraFields.put(name, value);
    }

    @JsonProperty("attachmentUrl")
    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    @JsonProperty("attachmentUrl")
    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
        this.attachmentUrlProvided = true;
    }

    public boolean hasForbiddenImmutableFields() {
        return extraFields.containsKey("boardId")
                || extraFields.containsKey("createdBy")
                || extraFields.containsKey("board_id")
                || extraFields.containsKey("created_by");
    }

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

    @AssertTrue(message = "boardId and createdBy cannot be updated")
    @JsonIgnore
    public boolean hasNoForbiddenImmutableFields() {
        return !hasForbiddenImmutableFields();
    }
}

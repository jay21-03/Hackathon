package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import com.seal.hackathon.common.util.HttpUrlValidation;
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

@Data
public class UpdateProblemRequest {
    @Size(min = 1, max = 255, message = "title must be between 1 and 255 characters")
    private String title;

    @Size(max = 10000, message = "description must not exceed 10000 characters")
    private String description;
    @Size(max = 2048, message = "externalLink must not exceed 2048 characters")
    private String externalLink;

    @Size(max = 2048, message = "attachmentUrl must not exceed 2048 characters")
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

    @AssertTrue(message = "attachmentUrl must be an http(s) URL or managed uploaded file URL")
    @JsonIgnore
    public boolean isAttachmentUrlValid() {
        return HttpUrlValidation.isOptionalProblemAttachmentUrl(attachmentUrl);
    }

    @AssertTrue(message = "externalLink must be a valid http(s) URL")
    @JsonIgnore
    public boolean isExternalLinkValid() {
        return HttpUrlValidation.isOptionalHttpUrl(externalLink);
    }

    @AssertTrue(message = "boardId and createdBy cannot be updated")
    @JsonIgnore
    public boolean hasNoForbiddenImmutableFields() {
        return !hasForbiddenImmutableFields();
    }
}

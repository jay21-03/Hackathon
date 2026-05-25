package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class UpdateProblemRequest {
    private String title;
    private String description;
    private String attachmentUrl;
    private String externalLink;

    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime releaseAt;

    @JsonIgnore
    private final Map<String, Object> extraFields = new HashMap<>();

    @JsonAnySetter
    public void putExtraField(String name, Object value) {
        extraFields.put(name, value);
    }

    public boolean hasForbiddenImmutableFields() {
        return extraFields.containsKey("boardId")
                || extraFields.containsKey("createdBy")
                || extraFields.containsKey("board_id")
                || extraFields.containsKey("created_by");
    }
}

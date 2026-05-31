package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class CreateBoardSlotRequest {

    @NotNull(message = "teamNumber must not be null")
    @Positive(message = "teamNumber must be greater than 0")
    private Integer teamNumber;

    @JsonIgnore
    private final Map<String, Object> extraFields = new HashMap<>();

    @JsonAnySetter
    public void putExtraField(String name, Object value) {
        extraFields.put(name, value);
    }

    public boolean containsField(String fieldName) {
        return extraFields.containsKey(fieldName);
    }
}

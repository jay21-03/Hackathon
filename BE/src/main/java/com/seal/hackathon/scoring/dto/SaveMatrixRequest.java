package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.Data;

@Data
public class SaveMatrixRequest {
    @NotNull(message = "rows must not be null")
    @Size(max = 500, message = "rows must not exceed 500 items")
    @Valid
    private List<MatrixRowInput> rows;

    @AssertTrue(message = "DUPLICATE_TEAM_ROW")
    @JsonIgnore
    public boolean hasUniqueTeamRows() {
        if (rows == null) {
            return true;
        }
        Set<Long> seen = new HashSet<>();
        for (MatrixRowInput row : rows) {
            if (row == null || row.getTeamId() == null) {
                continue;
            }
            if (!seen.add(row.getTeamId())) {
                return false;
            }
        }
        return true;
    }
}

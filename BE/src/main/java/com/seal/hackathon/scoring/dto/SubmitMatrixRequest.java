package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Data;

@Data
public class SubmitMatrixRequest {
    private boolean submitAll;
    private List<Long> teamIds;
}

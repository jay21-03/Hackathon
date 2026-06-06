package com.seal.hackathon.scoring.dto;

import jakarta.validation.Valid;
import java.util.List;
import lombok.Data;

@Data
public class SaveMatrixRequest {
    @Valid
    private List<MatrixRowInput> rows;
}

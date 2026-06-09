package com.seal.hackathon.mail.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveEmailTemplateRequest {

    @NotBlank
    private String subject;

    @NotBlank
    private String bodyHtml;
}

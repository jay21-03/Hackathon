package com.seal.hackathon.mail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SaveEmailTemplateRequest {

    @NotBlank(message = "subject must not be blank")
    @Size(max = 255, message = "subject must not exceed 255 characters")
    private String subject;

    @NotBlank(message = "bodyHtml must not be blank")
    @Size(max = 50000, message = "bodyHtml must not exceed 50000 characters")
    private String bodyHtml;
}

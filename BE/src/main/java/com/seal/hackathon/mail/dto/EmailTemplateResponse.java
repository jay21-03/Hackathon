package com.seal.hackathon.mail.dto;

import com.seal.hackathon.mail.enums.EmailTemplateKey;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailTemplateResponse {

    private EmailTemplateKey templateKey;
    private String subject;
    private String bodyHtml;
    private String source;
    private boolean customized;
}

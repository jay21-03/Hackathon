package com.seal.hackathon.mail.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RenderedEmail {

    private String subject;
    private String html;
}

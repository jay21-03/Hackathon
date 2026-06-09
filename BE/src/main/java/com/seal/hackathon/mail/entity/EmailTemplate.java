package com.seal.hackathon.mail.entity;

import com.seal.hackathon.mail.enums.EmailTemplateKey;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "email_templates")
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;

    @Enumerated(EnumType.STRING)
    private EmailTemplateKey templateKey;

    private String subject;

    private String bodyHtml;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

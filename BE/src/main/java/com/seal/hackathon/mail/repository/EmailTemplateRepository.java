package com.seal.hackathon.mail.repository;

import com.seal.hackathon.mail.entity.EmailTemplate;
import com.seal.hackathon.mail.enums.EmailTemplateKey;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    Optional<EmailTemplate> findByEventIdAndTemplateKey(Long eventId, EmailTemplateKey templateKey);

    Optional<EmailTemplate> findByEventIdIsNullAndTemplateKey(EmailTemplateKey templateKey);

    List<EmailTemplate> findByEventIdOrderByTemplateKeyAsc(Long eventId);
}

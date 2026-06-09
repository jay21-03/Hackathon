package com.seal.hackathon.mail.service;

import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.mail.dto.EmailTemplateResponse;
import com.seal.hackathon.mail.dto.RenderedEmail;
import com.seal.hackathon.mail.dto.SaveEmailTemplateRequest;
import com.seal.hackathon.mail.entity.EmailTemplate;
import com.seal.hackathon.mail.enums.EmailTemplateKey;
import com.seal.hackathon.mail.repository.EmailTemplateRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final DynamicMailRenderer dynamicMailRenderer;
    private final OrganizerAuthorizationService organizerAuthorizationService;

    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> listForEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<EmailTemplateResponse> responses = new ArrayList<>();
        for (EmailTemplateKey key : EmailTemplateKey.values()) {
            responses.add(resolveTemplateView(eventId, key));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse getForEvent(Long eventId, EmailTemplateKey key) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return resolveTemplateView(eventId, key);
    }

    @Transactional
    public EmailTemplateResponse saveForEvent(Long eventId, EmailTemplateKey key, SaveEmailTemplateRequest request) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        EmailTemplate entity = emailTemplateRepository
                .findByEventIdAndTemplateKey(eventId, key)
                .orElse(EmailTemplate.builder()
                        .eventId(eventId)
                        .templateKey(key)
                        .createdAt(now)
                        .build());
        entity.setSubject(request.getSubject().trim());
        entity.setBodyHtml(request.getBodyHtml());
        entity.setUpdatedAt(now);
        emailTemplateRepository.save(entity);
        return EmailTemplateResponse.builder()
                .templateKey(key)
                .subject(entity.getSubject())
                .bodyHtml(entity.getBodyHtml())
                .source("EVENT")
                .customized(true)
                .build();
    }

    @Transactional
    public EmailTemplateResponse resetForEvent(Long eventId, EmailTemplateKey key) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        emailTemplateRepository.findByEventIdAndTemplateKey(eventId, key).ifPresent(emailTemplateRepository::delete);
        return resolveTemplateView(eventId, key);
    }

    @Transactional(readOnly = true)
    public RenderedEmail render(Long eventId, EmailTemplateKey key, Map<String, Object> variables) {
        ResolvedTemplate resolved = resolveRenderable(eventId, key);
        String html = resolved.useClasspath()
                ? dynamicMailRenderer.renderClasspath(resolved.key().classpathName(), variables)
                : dynamicMailRenderer.renderInline(resolved.bodyHtml(), variables);
        String subject = applySubjectVariables(resolved.subject(), variables);
        return RenderedEmail.builder().subject(subject).html(html).build();
    }

    private EmailTemplateResponse resolveTemplateView(Long eventId, EmailTemplateKey key) {
        ResolvedTemplate resolved = resolveRenderable(eventId, key);
        return EmailTemplateResponse.builder()
                .templateKey(key)
                .subject(resolved.subject())
                .bodyHtml(resolved.bodyHtml())
                .source(resolved.source())
                .customized(resolved.customized())
                .build();
    }

    private ResolvedTemplate resolveRenderable(Long eventId, EmailTemplateKey key) {
        Optional<EmailTemplate> eventTemplate = emailTemplateRepository.findByEventIdAndTemplateKey(eventId, key);
        if (eventTemplate.isPresent()) {
            EmailTemplate t = eventTemplate.get();
            return new ResolvedTemplate(key, t.getSubject(), t.getBodyHtml(), false, "EVENT", true);
        }
        Optional<EmailTemplate> globalTemplate = emailTemplateRepository.findByEventIdIsNullAndTemplateKey(key);
        if (globalTemplate.isPresent()) {
            EmailTemplate t = globalTemplate.get();
            return new ResolvedTemplate(key, t.getSubject(), t.getBodyHtml(), false, "GLOBAL", false);
        }
        return loadClasspathDefault(key);
    }

    private ResolvedTemplate loadClasspathDefault(EmailTemplateKey key) {
        try {
            String classpathFile = "templates/" + key.classpathName() + ".html";
            String body = StreamUtils.copyToString(
                    new ClassPathResource(classpathFile).getInputStream(), StandardCharsets.UTF_8);
            return new ResolvedTemplate(key, defaultSubject(key), body, true, "DEFAULT", false);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "EMAIL_TEMPLATE_DEFAULT_MISSING");
        }
    }

    private String defaultSubject(EmailTemplateKey key) {
        return switch (key) {
            case STAFF_INVITATION -> "[SEAL Hackathon] Lời mời [[${roleLabel}]] — [[${eventName}]]";
            case TEAM_INVITATION -> "[SEAL Hackathon] Lời mời tham gia đội [[${teamName}]]";
            case STAFF_REMINDER -> "[SEAL Hackathon] Nhắc phản hồi lời mời [[${roleLabel}]]";
            case TEAM_REMINDER -> "[SEAL Hackathon] Nhắc xác nhận lời mời đội [[${teamName}]]";
        };
    }

    private String applySubjectVariables(String subject, Map<String, Object> variables) {
        String rendered = subject;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            rendered = rendered.replace("[[" + "${" + entry.getKey() + "}" + "]]", String.valueOf(entry.getValue()));
        }
        return rendered;
    }

    private record ResolvedTemplate(
            EmailTemplateKey key,
            String subject,
            String bodyHtml,
            boolean useClasspath,
            String source,
            boolean customized) {}
}

package com.seal.hackathon.aireview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.common.enums.AiReviewKind;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class AiReviewSupabaseMirror {

    private static final Logger log = LoggerFactory.getLogger(AiReviewSupabaseMirror.class);

    private final ObjectMapper objectMapper;

    @Value("${app.ai.review.supabase-url:}")
    private String supabaseUrl;

    @Value("${app.ai.review.supabase-service-role-key:}")
    private String serviceRoleKey;

    public void mirror(AiReview review) {
        if (!isConfigured() || review == null || !StringUtils.hasText(review.getCommitSha())) {
            return;
        }

        try {
            RestClient.create()
                    .post()
                    .uri(normalizedUrl() + "/rest/v1/ai_reviews?on_conflict=team_id,commit_sha,review_kind")
                    .header("apikey", serviceRoleKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                    .header("Prefer", "resolution=merge-duplicates")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(buildPayload(review))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Could not mirror AI review {} to Supabase: {}", review.getId(), ex.getMessage());
        }
    }

    private boolean isConfigured() {
        return StringUtils.hasText(supabaseUrl) && StringUtils.hasText(serviceRoleKey);
    }

    private String normalizedUrl() {
        return supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
    }

    private ObjectNode buildPayload(AiReview review) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("team_id", String.valueOf(review.getTeamId()));
        body.put("commit_sha", review.getCommitSha());
        body.put("review_kind", toLegacyKind(review.getReviewKind()));
        body.put("status", review.getStatus() == null ? null : review.getStatus().toHandoverStatus());
        body.put("push_summary", review.getSummary());
        body.put("rag_level", review.getRagLevel());

        JsonNode structuredOutput = parseStructuredOutput(review.getStructuredOutput());
        if (structuredOutput == null || structuredOutput.isNull()) {
            body.putObject("structured_output");
        } else {
            body.set("structured_output", structuredOutput);
        }

        OffsetDateTime updatedAt = review.getReviewedAt() != null ? review.getReviewedAt() : review.getCreatedAt();
        if (review.getCreatedAt() != null) {
            body.put("created_at", review.getCreatedAt().toString());
        }
        if (updatedAt != null) {
            body.put("updated_at", updatedAt.toString());
        }
        return body;
    }

    private JsonNode parseStructuredOutput(String structuredOutput) {
        if (!StringUtils.hasText(structuredOutput)) {
            return null;
        }
        try {
            return objectMapper.readTree(structuredOutput);
        } catch (Exception ex) {
            ObjectNode fallback = objectMapper.createObjectNode();
            fallback.put("raw", structuredOutput);
            return fallback;
        }
    }

    private String toLegacyKind(AiReviewKind kind) {
        return switch (kind) {
            case TEAM_AGGREGATE -> "team_aggregate";
            case PER_PUSH -> "per_push";
        };
    }
}

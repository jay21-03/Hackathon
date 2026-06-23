package com.seal.hackathon.aireview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.client.AiReviewLlmClient;
import com.seal.hackathon.aireview.support.AiReviewPrompts;
import com.seal.hackathon.aireview.support.AiReviewStructuredOutputValidator;
import com.seal.hackathon.aireview.support.AiReviewStructuredOutputValidator.ValidationResult;
import com.seal.hackathon.aireview.support.AiReviewValidationException;
import com.seal.hackathon.common.enums.AiReviewKind;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiReviewLlmRunner {

    private static final int MAX_ATTEMPTS = 2;

    private final AiReviewLlmClient aiReviewLlmClient;
    private final ObjectMapper objectMapper;
    private final AiReviewStructuredOutputValidator outputValidator;

    public record LlmJsonResult(String rawJson, JsonNode root) {}

    public LlmJsonResult invokeValidated(String prompt, AiReviewKind kind) {
        String lastRaw = null;
        List<String> lastViolations = List.of("Chưa gọi LLM.");
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            String currentPrompt =
                    attempt == 1 ? prompt : AiReviewPrompts.jsonRepairPrompt(kind, lastViolations, lastRaw);
            lastRaw = aiReviewLlmClient.analyzeCodeDiff(currentPrompt);
            try {
                JsonNode root = objectMapper.readTree(lastRaw);
                root = outputValidator.normalize(root, kind);
                ValidationResult validation = outputValidator.validate(root, kind);
                if (validation.valid()) {
                    return new LlmJsonResult(objectMapper.writeValueAsString(root), root);
                }
                lastViolations = validation.violations();
            } catch (Exception ex) {
                lastViolations = new ArrayList<>();
                lastViolations.add("JSON không parse được: " + ex.getMessage());
            }
        }
        throw new AiReviewValidationException(lastViolations);
    }
}

package com.seal.hackathon.aireview.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class GeminiAiReviewClient implements AiReviewLlmClient {

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.review.api-key:}")
    private String apiKey;

    @Value("${app.ai.review.model:gemini-2.0-flash}")
    private String model;

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(apiKey);
    }

    @Override
    public String analyzeCodeDiff(String prompt) {
        if (!isConfigured()) {
            throw new IllegalStateException("AI review API key is not configured");
        }

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(
                "contents",
                List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        body.put("generationConfig", generationConfig);

        RestClient client = restClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();

        try {
            JsonNode response = client.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null) {
                throw new IllegalStateException("Empty response from Gemini API");
            }
            JsonNode textNode = response.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!textNode.isTextual() || !StringUtils.hasText(textNode.asText())) {
                throw new IllegalStateException("Gemini response did not contain JSON text");
            }
            return textNode.asText().trim();
        } catch (RestClientException ex) {
            throw new IllegalStateException("Gemini API call failed: " + ex.getMessage(), ex);
        }
    }
}

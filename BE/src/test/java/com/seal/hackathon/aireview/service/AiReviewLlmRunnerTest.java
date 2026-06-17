package com.seal.hackathon.aireview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.client.AiReviewLlmClient;
import com.seal.hackathon.aireview.support.AiReviewStructuredOutputValidator;
import com.seal.hackathon.aireview.support.AiReviewValidationException;
import com.seal.hackathon.common.enums.AiReviewKind;
import com.seal.hackathon.support.FakeAiReviewLlmClient;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiReviewLlmRunnerTest {

    private final AiReviewStructuredOutputValidator validator = new AiReviewStructuredOutputValidator();

    @Test
    void retriesOnceWhenFirstAggregateResponseInvalid() {
        AtomicInteger calls = new AtomicInteger();
        AiReviewLlmClient client = new AiReviewLlmClient() {
            @Override
            public String analyzeCodeDiff(String prompt) {
                int n = calls.incrementAndGet();
                if (n == 1) {
                    return "{\"criteria_comments\":{}}";
                }
                return FakeAiReviewLlmClient.AGGREGATE_JSON;
            }

            @Override
            public boolean isConfigured() {
                return true;
            }
        };

        AiReviewLlmRunner runner = new AiReviewLlmRunner(client, new ObjectMapper(), validator);
        var result = runner.invokeValidated("tổng hợp cấp đội test", AiReviewKind.TEAM_AGGREGATE);

        assertThat(calls.get()).isEqualTo(2);
        assertThat(result.root().path("criteria_comments").path("R1_01").asText()).contains("Tốt");
    }

    @Test
    void failsAfterTwoInvalidAttempts() {
        AiReviewLlmClient client = new AiReviewLlmClient() {
            @Override
            public String analyzeCodeDiff(String prompt) {
                return "{\"criteria_comments\":{}}";
            }

            @Override
            public boolean isConfigured() {
                return true;
            }
        };
        AiReviewLlmRunner runner = new AiReviewLlmRunner(client, new ObjectMapper(), validator);

        assertThatThrownBy(() -> runner.invokeValidated("tổng hợp cấp đội test", AiReviewKind.TEAM_AGGREGATE))
                .isInstanceOf(AiReviewValidationException.class)
                .satisfies(ex -> assertThat(((AiReviewValidationException) ex).violations()).isNotEmpty());
    }
}

package com.seal.hackathon.aireview.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.common.enums.AiReviewKind;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiReviewStructuredOutputValidatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AiReviewStructuredOutputValidator validator = new AiReviewStructuredOutputValidator();

    @Test
    void acceptsValidPerPushOutput() throws Exception {
        var root = objectMapper.readTree(FakePerPushJson.MINIMAL_VALID);
        assertThat(validator.validate(root, AiReviewKind.PER_PUSH).valid()).isTrue();
    }

    @Test
    void rejectsPerPushMissingPushSummary() throws Exception {
        var root = objectMapper.readTree(FakePerPushJson.MINIMAL_VALID.replace(
                "\"push_summary\": \"Batch gồm 1 commit: ok\"", "\"push_summary\": \"\""));
        var result = validator.validate(root, AiReviewKind.PER_PUSH);
        assertThat(result.valid()).isFalse();
        assertThat(result.violations()).anyMatch(v -> v.contains("push_summary"));
    }

    @Test
    void acceptsValidAggregateOutput() throws Exception {
        var root = objectMapper.readTree(FakeAggregateJson.MINIMAL_VALID);
        assertThat(validator.validate(root, AiReviewKind.TEAM_AGGREGATE).valid()).isTrue();
    }

    @Test
    void rejectsAggregateMissingCriteriaAndSmb() throws Exception {
        var root = objectMapper.readTree("""
                {
                  "criteria_comments": { "R1_01": "Tốt" },
                  "smb_scale_advisory": { "summary": "ok" },
                  "overall_picture": { "historical_synthesis": "h", "evolution_notes": "e" },
                  "agent_intelligence": { "reasoning_pattern": "none" }
                }
                """);
        var result = validator.validate(root, AiReviewKind.TEAM_AGGREGATE);
        assertThat(result.valid()).isFalse();
        assertThat(result.violations()).anyMatch(v -> v.contains("R1_02"));
        assertThat(result.violations()).anyMatch(v -> v.contains("cost_for_smb"));
    }

    @Test
    void rejectsCriteriaWithoutQualitativeRating() throws Exception {
        String json = FakeAggregateJson.MINIMAL_VALID.replace(
                "\"R1_01\": \"Fit tốt — Tốt\"", "\"R1_01\": \"Chỉ nhận xét không có thang\"");
        var root = objectMapper.readTree(json);
        var result = validator.validate(root, AiReviewKind.TEAM_AGGREGATE);
        assertThat(result.valid()).isFalse();
        assertThat(result.violations()).anyMatch(v -> v.contains("R1_01") && v.contains("phân hạng"));
    }

    private static final class FakePerPushJson {
        static final String MINIMAL_VALID = """
                {
                  "overall_picture": { "push_summary": "Batch gồm 1 commit: ok", "significant_change": false },
                  "rag_maturity": { "level": "Basic" },
                  "assessment": {
                    "advantages": "a", "disadvantages": "d", "improvement_areas": "i",
                    "security": "s", "completeness": "c", "latency": "l",
                    "observability": "o", "error_handling": "e"
                  }
                }
                """;
    }

    private static final class FakeAggregateJson {
        static final String MINIMAL_VALID = """
                {
                  "criteria_comments": {
                    "R1_01": "Fit tốt — Tốt",
                    "R1_02": "Pipeline — Khá",
                    "R1_03": "Retrieval — Khá",
                    "R1_04": "Prompt — Tốt",
                    "R1_05": "Doc — Khá",
                    "R2_01": "Agent — Trung bình",
                    "R2_02": "Model — Yếu",
                    "R2_03": "Ops — Khá",
                    "R2_04": "Extend — Trung bình",
                    "R2_05": "Q&A — Tốt"
                  },
                  "smb_scale_advisory": {
                    "system_identity_recap": "id",
                    "summary": "sum",
                    "tech_and_architecture": "arch",
                    "cost_for_smb": "cost",
                    "throughput_and_reliability": "thr",
                    "observability_and_operations": "obs",
                    "data_and_integrations": "data"
                  },
                  "overall_picture": {
                    "historical_synthesis": "hist",
                    "evolution_notes": "evo"
                  },
                  "agent_intelligence": {
                    "reasoning_pattern": "ReAct",
                    "detected_skills": [],
                    "tool_definitions": [],
                    "has_agent_config_files": false
                  }
                }
                """;
    }
}

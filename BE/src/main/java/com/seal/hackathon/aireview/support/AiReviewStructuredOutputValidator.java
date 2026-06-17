package com.seal.hackathon.aireview.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.seal.hackathon.common.enums.AiReviewKind;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public final class AiReviewStructuredOutputValidator {

    private static final Pattern QUALITATIVE_RATING = Pattern.compile(
            "(?i)(?<![\\p{L}])(Xuất sắc|Tốt|Khá|Trung bình|Yếu)(?![\\p{L}])");

    private static final List<String> CRITERIA_KEYS =
            List.of("R1_01", "R1_02", "R1_03", "R1_04", "R1_05", "R2_01", "R2_02", "R2_03", "R2_04", "R2_05");

    private static final List<String> SMB_KEYS = List.of(
            "system_identity_recap",
            "summary",
            "tech_and_architecture",
            "cost_for_smb",
            "throughput_and_reliability",
            "observability_and_operations",
            "data_and_integrations");

    private static final Map<String, String> CRITERIA_ALIASES = Map.ofEntries(
            Map.entry("r1_problem_solution", "R1_01"),
            Map.entry("r1_tech_stack_suitability", "R1_02"),
            Map.entry("r1_data_pipeline", "R1_02"),
            Map.entry("r1_retrieval_citation", "R1_03"),
            Map.entry("r1_intent_prompting", "R1_04"),
            Map.entry("r1_completeness_readiness", "R1_05"),
            Map.entry("r1_presentation_doc", "R1_05"),
            Map.entry("r2_agent_multihop", "R2_01"),
            Map.entry("r2_model_resources", "R2_02"),
            Map.entry("r2_production_ops", "R2_03"),
            Map.entry("r2_observability_monitoring", "R2_03"),
            Map.entry("r2_extensibility", "R2_04"),
            Map.entry("r2_bgk_qa", "R2_05"),
            Map.entry("r2_security_best_practices", "R2_05"));

    private static final Map<String, String> SMB_ALIASES = Map.ofEntries(
            Map.entry("architecture_recommendations", "tech_and_architecture"),
            Map.entry("infrastructure_cost_estimation", "cost_for_smb"),
            Map.entry("security_compliance", "summary"),
            Map.entry("operations_maintenance", "observability_and_operations"),
            Map.entry("scalability_strategy", "throughput_and_reliability"),
            Map.entry("technology_stack_evolution", "data_and_integrations"),
            Map.entry("system_identity", "system_identity_recap"),
            Map.entry("tech_arch", "tech_and_architecture"),
            Map.entry("cost", "cost_for_smb"),
            Map.entry("reliability", "throughput_and_reliability"),
            Map.entry("observability", "observability_and_operations"),
            Map.entry("data", "data_and_integrations"));

    public record ValidationResult(boolean valid, List<String> violations) {
        public static ValidationResult ok() {
            return new ValidationResult(true, List.of());
        }

        public static ValidationResult fail(List<String> violations) {
            return new ValidationResult(false, List.copyOf(violations));
        }
    }

    public ValidationResult validate(JsonNode root, AiReviewKind kind) {
        if (root == null || root.isMissingNode() || !root.isObject()) {
            return ValidationResult.fail(List.of("Phản hồi LLM phải là JSON object."));
        }
        return kind == AiReviewKind.TEAM_AGGREGATE ? validateAggregate(root) : validatePerPush(root);
    }

    private ValidationResult validatePerPush(JsonNode root) {
        List<String> violations = new ArrayList<>();
        requireNonBlankText(root, "overall_picture", "push_summary", violations);
        requireNonBlankText(root, "rag_maturity", "level", violations);
        JsonNode assessment = root.path("assessment");
        if (!assessment.isObject()) {
            violations.add("Thiếu object assessment.");
        } else {
            for (String field :
                    List.of("advantages", "disadvantages", "security", "completeness", "latency", "observability", "error_handling")) {
                if (!hasNonBlankText(assessment, field)) {
                    violations.add("assessment." + field + " trống.");
                }
            }
        }
        return violations.isEmpty() ? ValidationResult.ok() : ValidationResult.fail(violations);
    }

    private ValidationResult validateAggregate(JsonNode root) {
        List<String> violations = new ArrayList<>();
        Map<String, String> criteria = normalizeCriteria(root.path("criteria_comments"));
        for (String key : CRITERIA_KEYS) {
            String value = criteria.get(key);
            if (!StringUtils.hasText(value)) {
                violations.add("criteria_comments." + key + " trống.");
                continue;
            }
            if (!QUALITATIVE_RATING.matcher(value).find()) {
                violations.add("criteria_comments." + key + " thiếu phân hạng (Xuất sắc|Tốt|Khá|Trung bình|Yếu).");
            }
        }

        Map<String, String> smb = normalizeSmb(root.path("smb_scale_advisory"));
        for (String key : SMB_KEYS) {
            if (!StringUtils.hasText(smb.get(key))) {
                violations.add("smb_scale_advisory." + key + " trống.");
            }
        }

        requireNonBlankText(root, "overall_picture", "historical_synthesis", violations);
        requireNonBlankText(root, "overall_picture", "evolution_notes", violations);
        requireNonBlankText(root, "agent_intelligence", "reasoning_pattern", violations);

        return violations.isEmpty() ? ValidationResult.ok() : ValidationResult.fail(violations);
    }

    private static Map<String, String> normalizeCriteria(JsonNode raw) {
        Map<String, String> out = new LinkedHashMap<>();
        if (!raw.isObject()) {
            return out;
        }
        raw.fields().forEachRemaining(entry -> {
            if (!entry.getValue().isTextual() || !StringUtils.hasText(entry.getValue().asText())) {
                return;
            }
            String key = entry.getKey();
            String upper = key.toUpperCase(Locale.ROOT).replace('-', '_');
            if (CRITERIA_KEYS.contains(upper)) {
                out.putIfAbsent(upper, entry.getValue().asText().trim());
                return;
            }
            String alias = CRITERIA_ALIASES.get(key.toLowerCase(Locale.ROOT));
            if (alias != null) {
                out.putIfAbsent(alias, entry.getValue().asText().trim());
            }
        });
        return out;
    }

    private static Map<String, String> normalizeSmb(JsonNode raw) {
        Map<String, String> out = new LinkedHashMap<>();
        if (!raw.isObject()) {
            return out;
        }
        raw.fields().forEachRemaining(entry -> {
            if (!entry.getValue().isTextual() || !StringUtils.hasText(entry.getValue().asText())) {
                return;
            }
            String key = entry.getKey();
            if (SMB_KEYS.contains(key)) {
                out.putIfAbsent(key, entry.getValue().asText().trim());
                return;
            }
            String alias = SMB_ALIASES.get(key.toLowerCase(Locale.ROOT));
            if (alias != null) {
                out.putIfAbsent(alias, entry.getValue().asText().trim());
            }
        });
        return out;
    }

    private static void requireNonBlankText(
            JsonNode root, String objectField, String textField, List<String> violations) {
        if (!hasNonBlankText(root.path(objectField), textField)) {
            violations.add(objectField + "." + textField + " trống.");
        }
    }

    private static boolean hasNonBlankText(JsonNode parent, String field) {
        if (!parent.isObject()) {
            return false;
        }
        JsonNode value = parent.path(field);
        return value.isTextual() && StringUtils.hasText(value.asText());
    }
}

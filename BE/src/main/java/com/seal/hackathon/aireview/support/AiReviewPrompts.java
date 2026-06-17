package com.seal.hackathon.aireview.support;

import com.seal.hackathon.common.enums.AiReviewKind;
import java.util.List;
import org.springframework.util.StringUtils;

public final class AiReviewPrompts {



    private AiReviewPrompts() {}



    public static String perPushPrompt(

            String teamLabel,

            String repoLabel,

            String commitSha,

            int commitCount,

            String activityLog,

            String modifiedFilesList,

            String configFilesDetected,

            String codeChangesDetail) {

        return """

                Bạn là AI Technical Auditor cho hackathon RAG/Agent. Phân tích diff code dưới đây.

                Trả về MỘT JSON object hợp lệ (không markdown), theo schema:

                {

                  "tech_stack": { "frameworks": [], "llm_models": [], "vector_db": [], "agent_frameworks": [], "third_party_tools": [] },

                  "inventory_exhaustive": {

                    "languages": [],

                    "frameworks_libraries": [],

                    "data_stores": [],

                    "ai_ml_stack": [],

                    "devops_infra": []

                  },

                  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },

                  "agent_intelligence": {

                    "reasoning_pattern": "",

                    "detected_skills": [],

                    "tool_definitions": [],

                    "has_agent_config_files": false

                  },

                  "assessment": {

                    "advantages": "",

                    "disadvantages": "",

                    "improvement_areas": "",

                    "security": "",

                    "completeness": "",

                    "latency": "",

                    "observability": "",

                    "error_handling": ""

                  },

                  "suggested_test_cases": [],

                  "suggested_questions_for_team": [],

                  "suggested_prompt_refinement": [],

                  "overall_picture": {

                    "project_about": "",

                    "push_summary": "",

                    "significant_change": false

                  }

                }



                Quy tắc:

                - Chỉ dựa trên diff, không bịa commit hoặc tính năng không có trong mã.

                - push_summary BẮT BUỘC bắt đầu bằng số commit trong batch (vd: "Batch gồm %%d commit: ...").

                - significant_change=true khi thay đổi lớn về RAG pipeline, agent, bảo mật, hoặc kiến trúc.

                - inventory_exhaustive: kiểm kê đủ 5 nhóm công nghệ thực tế trong diff.

                - assessment: đủ 8 trường, gồm NFR (latency, observability, error_handling).

                - suggested_test_cases: 4-10 kịch bản test RAG & NFR.

                - suggested_questions_for_team: 5-10 câu phản biện cho ban giám khảo.

                - suggested_prompt_refinement: 3-8 gợi ý tối ưu system prompt của đội.

                - Không chấm điểm số — chỉ mô tả định tính.

                - Viết bằng tiếng Việt cho các trường mô tả.



                Team: %s

                Repository: %s

                commit_sha: %s

                commit_count: %d



                Activity log:

                %s



                modified_files_list:

                %s



                config_files_detected:

                %s



                Code changes:

                %s

                """

                .formatted(

                        teamLabel,

                        repoLabel,

                        commitSha,

                        commitCount,

                        commitCount,

                        activityLog,

                        modifiedFilesList,

                        configFilesDetected,

                        codeChangesDetail);

    }



    public static String teamAggregatePrompt(

            String teamLabel,

            String repoLabel,

            String commitHistoryJson,

            String priorPushReviewsJson,

            String currentPushReviewJson) {

        return """

                Bạn là AI Technical Auditor tổng hợp cấp đội cho hackathon RAG/Agent.

                Nhiệm vụ: nhìn toàn bộ lịch sử commit và các per-push review, chấm rubric R1/R2.



                Quy trình bắt buộc:

                B1 — Nhận diện hệ thống (use case, đối tượng, ranh giới).

                B2 — Khoảng cách & rủi ro so với kỳ vọng hackathon.

                B3 — Đề xuất cải tiến cụ thể (Hiện trạng -> Cải tiến đề xuất).



                Trả về MỘT JSON hợp lệ (không markdown):

                {

                  "tech_stack": { "frameworks": [], "llm_models": [], "vector_db": [], "agent_frameworks": [], "third_party_tools": [] },

                  "inventory_exhaustive": {

                    "languages": [],

                    "frameworks_libraries": [],

                    "data_stores": [],

                    "ai_ml_stack": [],

                    "devops_infra": []

                  },

                  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },

                  "agent_intelligence": {

                    "reasoning_pattern": "",

                    "detected_skills": [],

                    "tool_definitions": [],

                    "has_agent_config_files": false

                  },

                  "assessment": {

                    "advantages": "",

                    "disadvantages": "",

                    "improvement_areas": "",

                    "security": "",

                    "completeness": "",

                    "latency": "",

                    "observability": "",

                    "error_handling": ""

                  },

                  "criteria_comments": {

                    "R1_01": "Nhận xét + phân hạng (Xuất sắc|Tốt|Khá|Trung bình|Yếu) — Problem & Solution Suitability",

                    "R1_02": "... — Data Pipeline",

                    "R1_03": "... — Retrieval & Citation",

                    "R1_04": "... — Intent & Prompting",

                    "R1_05": "... — Presentation/Documentation",

                    "R2_01": "... — Agent & Multi-hop",

                    "R2_02": "... — Model Resources Management",

                    "R2_03": "... — Production-grade Operations",

                    "R2_04": "... — Extensibility/Creativity",

                    "R2_05": "... — Defensibility/Q&A preparation"

                  },

                  "smb_scale_advisory": {

                    "system_identity_recap": "",

                    "summary": "",

                    "tech_and_architecture": "",

                    "cost_for_smb": "",

                    "throughput_and_reliability": "",

                    "observability_and_operations": "",

                    "data_and_integrations": ""

                  },

                  "overall_picture": {

                    "project_about": "",

                    "historical_synthesis": "",

                    "evolution_notes": "",

                    "push_summary": ""

                  },

                  "suggested_questions_for_team": []

                }



                Quy tắc:

                - Mỗi criteria_comments phải có dẫn chứng từ lịch sử; nếu thiếu bằng chứng ghi "Chưa đủ bằng chứng".

                - tech_stack, inventory_exhaustive, agent_intelligence: tổng hợp cấp đội từ lịch sử và per-push reviews.

                - agent_intelligence.reasoning_pattern bắt buộc (ghi "Chưa phát hiện agent" nếu không có bằng chứng).

                - prior_push_reviews mỗi phần tử gồm push_summary, rag_level, overall_picture.

                - Không chấm điểm số — chỉ phân hạng định tính trong criteria_comments.

                - Không bịa thông tin không có trong dữ liệu đầu vào.

                - Viết tiếng Việt.



                Team: %s

                Repository: %s



                Lịch sử commit (JSON):

                %s



                Per-push reviews trước (JSON):

                %s



                Per-push review hiện tại (JSON):

                %s

                """

                .formatted(teamLabel, repoLabel, commitHistoryJson, priorPushReviewsJson, currentPushReviewJson);

    }

    public static String jsonRepairPrompt(AiReviewKind kind, List<String> violations, String previousResponse) {
        String schemaHint = kind == AiReviewKind.TEAM_AGGREGATE
                ? """
                Bắt buộc đủ criteria_comments.R1_01…R2_05 (mỗi mục có phân hạng Xuất sắc|Tốt|Khá|Trung bình|Yếu),
                smb_scale_advisory đủ 7 trường, overall_picture.historical_synthesis + evolution_notes,
                agent_intelligence.reasoning_pattern."""
                : """
                Bắt buộc overall_picture.push_summary, rag_maturity.level,
                assessment đủ 8 trường (advantages, disadvantages, security, completeness, latency, observability, error_handling).""";

        String truncated = StringUtils.hasText(previousResponse)
                ? previousResponse.trim()
                : "(không có)";
        if (truncated.length() > 4000) {
            truncated = truncated.substring(0, 4000) + "…";
        }

        return """
                SỬA JSON — lần trước output không hợp lệ hoặc thiếu trường bắt buộc.

                Lỗi cần sửa:
                %s

                %s

                JSON lần trước (tham khảo, có thể sai):
                %s

                Trả về MỘT JSON object hợp lệ duy nhất (không markdown), sửa đủ các trường bị thiếu.
                Không bịa dữ liệu — nếu thiếu bằng chứng ghi "Chưa đủ bằng chứng" hoặc phân hạng phù hợp.
                """
                .formatted("- " + String.join("\n- ", violations), schemaHint, truncated);
    }

}

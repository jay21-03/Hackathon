package com.seal.hackathon.aireview.support;



public final class AiReviewPrompts {



    private AiReviewPrompts() {}



    public static String perPushPrompt(

            String teamLabel, String repoLabel, String activityLog, String codeChangesDetail) {

        return """

                Bạn là AI Technical Auditor cho hackathon RAG/Agent. Phân tích diff code dưới đây.

                Trả về MỘT JSON object hợp lệ (không markdown), theo schema:

                {

                  "tech_stack": { "frameworks": [], "llm_models": [], "vector_db": [], "agent_frameworks": [], "third_party_tools": [] },

                  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },

                  "assessment": {

                    "advantages": "",

                    "disadvantages": "",

                    "improvement_areas": "",

                    "security": "",

                    "completeness": ""

                  },

                  "suggested_test_cases": [],

                  "suggested_questions_for_team": [],

                  "overall_picture": {

                    "project_about": "",

                    "push_summary": "",

                    "significant_change": false

                  },

                  "reference_score": 0

                }



                Quy tắc:

                - Chỉ dựa trên diff, không bịa commit hoặc tính năng không có trong mã.

                - push_summary mô tả batch commit hiện tại.

                - significant_change=true khi thay đổi lớn về RAG pipeline, agent, bảo mật, hoặc kiến trúc.

                - reference_score: số 0-100 tham khảo (không phải điểm chính thức).

                - Viết bằng tiếng Việt cho các trường mô tả.



                Team: %s

                Repository: %s



                Activity log:

                %s



                Code changes:

                %s

                """

                .formatted(teamLabel, repoLabel, activityLog, codeChangesDetail);

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

                  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },

                  "assessment": { "advantages": "", "disadvantages": "", "improvement_areas": "", "security": "", "completeness": "" },

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

                  "suggested_questions_for_team": [],

                  "reference_score": 0

                }



                Quy tắc:

                - Mỗi criteria_comments phải có dẫn chứng từ lịch sử; nếu thiếu bằng chứng ghi "Chưa đủ bằng chứng".

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

}

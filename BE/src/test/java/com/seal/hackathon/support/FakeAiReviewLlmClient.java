package com.seal.hackathon.support;

import com.seal.hackathon.aireview.client.AiReviewLlmClient;

/** Deterministic LLM responses for integration tests. */
public class FakeAiReviewLlmClient implements AiReviewLlmClient {

    public static final String PER_PUSH_JSON = """
            {
              "tech_stack": { "frameworks": ["FastAPI"], "llm_models": ["gemini"], "vector_db": ["chroma"], "agent_frameworks": [], "third_party_tools": [] },
              "inventory_exhaustive": {
                "languages": ["Python"],
                "frameworks_libraries": ["FastAPI", "LangChain"],
                "data_stores": ["Chroma"],
                "ai_ml_stack": ["Gemini", "embeddings"],
                "devops_infra": ["Docker"]
              },
              "rag_maturity": { "level": "Advanced", "features_detected": ["chunking", "embedding"] },
              "agent_intelligence": {
                "reasoning_pattern": "ReAct-style tool loop",
                "detected_skills": ["retrieval", "summarization"],
                "tool_definitions": ["search_docs"],
                "has_agent_config_files": false
              },
              "assessment": {
                "advantages": "Pipeline RAG rõ ràng",
                "disadvantages": "Thiếu citation",
                "improvement_areas": "Thêm hybrid search",
                "security": "Không thấy lộ API key",
                "completeness": "MVP ổn",
                "latency": "Chưa đo p95 retrieval",
                "observability": "Thiếu log trace LLM",
                "error_handling": "Retry cơ bản, chưa circuit breaker"
              },
              "suggested_test_cases": ["Test retrieval với câu hỏi mơ hồ"],
              "suggested_questions_for_team": ["Vì sao chọn chunk size hiện tại?"],
              "suggested_prompt_refinement": ["Thêm ràng buộc trích dẫn nguồn trong system prompt"],
              "overall_picture": {
                "project_about": "Chatbot RAG nội bộ",
                "push_summary": "Batch gồm 1 commit: thêm embedding pipeline",
                "significant_change": true
              }
            }
            """;

    public static final String AGGREGATE_JSON = """
            {
              "tech_stack": { "frameworks": ["FastAPI"], "llm_models": ["gemini"], "vector_db": ["chroma"], "agent_frameworks": [], "third_party_tools": [] },
              "inventory_exhaustive": {
                "languages": ["Python"],
                "frameworks_libraries": ["FastAPI", "LangChain"],
                "data_stores": ["Chroma"],
                "ai_ml_stack": ["Gemini"],
                "devops_infra": ["Docker"]
              },
              "rag_maturity": { "level": "Advanced", "features_detected": ["agent", "rerank"] },
              "agent_intelligence": {
                "reasoning_pattern": "ReAct-style tool loop tổng hợp từ lịch sử",
                "detected_skills": ["retrieval", "tool_calling"],
                "tool_definitions": ["search_docs"],
                "has_agent_config_files": false
              },
              "assessment": {
                "advantages": "Tiến bộ ổn",
                "disadvantages": "Observability mỏng",
                "improvement_areas": "Thêm metrics",
                "security": "OK",
                "completeness": "Gần demo",
                "latency": "Chưa benchmark",
                "observability": "Thiếu dashboard",
                "error_handling": "Retry đơn giản"
              },
              "criteria_comments": {
                "R1_01": "Giải pháp khớp đề — Tốt",
                "R1_02": "Chunking cơ bản — Khá",
                "R1_03": "Chưa citation đầy đủ — Trung bình",
                "R1_04": "System prompt ổn — Tốt",
                "R1_05": "README đủ — Khá",
                "R2_01": "Chưa multi-hop — Trung bình",
                "R2_02": "Chưa log token — Yếu",
                "R2_03": "Retry cơ bản — Khá",
                "R2_04": "Graph RAG chưa có — Trung bình",
                "R2_05": "Câu hỏi phản biện cần chuẩn bị — Khá"
              },
              "smb_scale_advisory": {
                "system_identity_recap": "RAG FAQ nội bộ",
                "summary": "Phù hợp SMB nhỏ với lưu lượng vừa",
                "tech_and_architecture": "Monolith + vector DB",
                "cost_for_smb": "Chi phí API LLM cần theo dõi",
                "throughput_and_reliability": "Cần queue khi tải tăng",
                "observability_and_operations": "Thiếu metrics",
                "data_and_integrations": "Import CSV đơn giản"
              },
              "overall_picture": {
                "historical_synthesis": "Team đi từ prototype tới RAG pipeline",
                "evolution_notes": "Thêm vector DB ở commit gần nhất",
                "push_summary": "Tổng hợp tiến độ hackathon"
              },
              "suggested_questions_for_team": ["Demo edge case retrieval?"]
            }
            """;

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public String analyzeCodeDiff(String prompt) {
        if (prompt != null && prompt.contains("SỬA JSON")) {
            if (prompt.contains("criteria_comments") || prompt.contains("TEAM_AGGREGATE") || prompt.contains("tổng hợp cấp đội")) {
                return AGGREGATE_JSON;
            }
            return PER_PUSH_JSON;
        }
        if (prompt != null && prompt.contains("tổng hợp cấp đội")) {
            return AGGREGATE_JSON;
        }
        return PER_PUSH_JSON;
    }
}

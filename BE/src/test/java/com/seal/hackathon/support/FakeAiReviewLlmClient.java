package com.seal.hackathon.support;

import com.seal.hackathon.aireview.client.AiReviewLlmClient;

/** Deterministic LLM responses for integration tests. */
public class FakeAiReviewLlmClient implements AiReviewLlmClient {

    public static final String PER_PUSH_JSON = """
            {
              "tech_stack": { "frameworks": ["FastAPI"], "llm_models": ["gemini"], "vector_db": ["chroma"], "agent_frameworks": [], "third_party_tools": [] },
              "rag_maturity": { "level": "Advanced", "features_detected": ["chunking", "embedding"] },
              "assessment": {
                "advantages": "Pipeline RAG rõ ràng",
                "disadvantages": "Thiếu citation",
                "improvement_areas": "Thêm hybrid search",
                "security": "Không thấy lộ API key",
                "completeness": "MVP ổn"
              },
              "suggested_test_cases": ["Test retrieval với câu hỏi mơ hồ"],
              "suggested_questions_for_team": ["Vì sao chọn chunk size hiện tại?"],
              "overall_picture": {
                "project_about": "Chatbot RAG nội bộ",
                "push_summary": "Thêm embedding pipeline",
                "significant_change": true
              },
              "reference_score": 72
            }
            """;

    public static final String AGGREGATE_JSON = """
            {
              "rag_maturity": { "level": "Advanced", "features_detected": ["agent", "rerank"] },
              "assessment": { "advantages": "Tiến bộ ổn", "disadvantages": "Observability mỏng", "security": "OK", "completeness": "Gần demo" },
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
              "suggested_questions_for_team": ["Demo edge case retrieval?"],
              "reference_score": 68
            }
            """;

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public String analyzeCodeDiff(String prompt) {
        if (prompt != null && prompt.contains("tổng hợp cấp đội")) {
            return AGGREGATE_JSON;
        }
        return PER_PUSH_JSON;
    }
}

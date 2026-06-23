/**
 * System prompts legacy n8n — giữ đồng bộ với AiReviewPrompts.java (platform).
 * WF3 nodes "Structured Output Parser" và "Build Team Aggregate Prompt" nhúng logic tương đương.
 */

function buildPerPushPrompt(i) {
  const commitCount = i.commit_count ?? 1;
  const activityLog = i.activity_log || '';
  const modifiedFiles = Array.isArray(i.modified_files_list)
    ? i.modified_files_list.join('\n')
    : String(i.modified_files_list || '(none)');
  const configFiles = Array.isArray(i.config_files_detected)
    ? i.config_files_detected.join('\n')
    : String(i.config_files_detected || '(none)');
  const codeDetail = String(i.code_changes_detail || '').slice(0, 50000);

  const schema = `{
  "tech_stack": { "frameworks": [], "llm_models": [], "vector_db": [], "agent_frameworks": [], "third_party_tools": [] },
  "inventory_exhaustive": {
    "languages": [], "frameworks_libraries": [], "data_stores": [], "ai_ml_stack": [], "devops_infra": []
  },
  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },
  "agent_intelligence": {
    "reasoning_pattern": "", "detected_skills": [], "tool_definitions": [], "has_agent_config_files": false
  },
  "assessment": {
    "advantages": "", "disadvantages": "", "improvement_areas": "",
    "security": "", "completeness": "", "latency": "", "observability": "", "error_handling": ""
  },
  "suggested_test_cases": [],
  "suggested_questions_for_team": [],
  "suggested_prompt_refinement": [],
  "overall_picture": { "project_about": "", "push_summary": "", "significant_change": false }
}`;

  const rules = `
Quy tắc:
- Chỉ dựa trên diff; không bịa commit hoặc tính năng không có trong mã.
- push_summary BẮT BUỘC bắt đầu bằng số commit trong batch (vd: "Batch gồm ${commitCount} commit: ...").
- significant_change=true khi thay đổi lớn về RAG pipeline, agent, bảo mật, hoặc kiến trúc.
- inventory_exhaustive: kiểm kê đủ 5 nhóm công nghệ thực tế trong diff.
- assessment: đủ 8 trường NFR (security, latency, observability, error_handling...).
- suggested_test_cases: 4-10 kịch bản test RAG & NFR.
- suggested_questions_for_team: 5-10 câu phản biện cho ban giám khảo.
- suggested_prompt_refinement: 3-8 gợi ý tối ưu system prompt của đội.
- Không chấm điểm số — chỉ mô tả định tính. Viết tiếng Việt cho các trường mô tả.
- AI KHÔNG thấy lịch sử commit cũ hay review trước — chỉ push hiện tại.`;

  const system = `Bạn là AI Technical Auditor cho hackathon RAG/Agent. Phân tích diff code (Per-Push).
Trả về MỘT JSON object hợp lệ (không markdown), theo schema:
${schema}
${rules}`;

  const user = `Team: ${i.team_id}
Repository: ${i.repo_name}
commit_sha: ${i.commit_sha}
commit_count: ${commitCount}

Activity log:
${activityLog}

modified_files_list:
${modifiedFiles}

config_files_detected:
${configFiles}

Code changes:
${codeDetail}`;

  return system + '\n\n' + user;
}

function buildAggregatePrompt(ctx) {
  const ac = ctx.aggregate_context || { commits: [], prior_push_reviews: [] };
  const schema = `{
  "tech_stack": { "frameworks": [], "llm_models": [], "vector_db": [], "agent_frameworks": [], "third_party_tools": [] },
  "inventory_exhaustive": {
    "languages": [], "frameworks_libraries": [], "data_stores": [], "ai_ml_stack": [], "devops_infra": []
  },
  "rag_maturity": { "level": "Basic|Advanced|Agentic-RAG", "features_detected": [] },
  "agent_intelligence": {
    "reasoning_pattern": "", "detected_skills": [], "tool_definitions": [], "has_agent_config_files": false
  },
  "assessment": {
    "advantages": "", "disadvantages": "", "improvement_areas": "",
    "security": "", "completeness": "", "latency": "", "observability": "", "error_handling": ""
  },
  "criteria_comments": {
    "R1_01": "Nhận xét + phân hạng (Xuất sắc|Tốt|Khá|Trung bình|Yếu) — Problem & Solution Fit",
    "R1_02": "... — Data Pipeline",
    "R1_03": "... — Retrieval & Citation",
    "R1_04": "... — Intent & Prompting",
    "R1_05": "... — Presentation & Doc",
    "R2_01": "... — Agent & Multi-hop (25%)",
    "R2_02": "... — Model Resources (25%)",
    "R2_03": "... — Production Ops (15%)",
    "R2_04": "... — Extensibility (15%)",
    "R2_05": "... — BGK Q&A Prep (20%)"
  },
  "smb_scale_advisory": {
    "system_identity_recap": "", "summary": "", "tech_and_architecture": "",
    "cost_for_smb": "", "throughput_and_reliability": "",
    "observability_and_operations": "", "data_and_integrations": ""
  },
  "overall_picture": {
    "project_about": "", "historical_synthesis": "", "evolution_notes": "", "push_summary": ""
  },
  "suggested_questions_for_team": []
}`;

  const rules = `
Quy trình bắt buộc: B1 Nhận diện hệ thống → B2 Khoảng cách & rủi ro → B3 Đề xuất cải tiến.
- criteria_comments: đủ 10 khóa R1_01–R2_05, mỗi khóa có phân hạng Xuất sắc|Tốt|Khá|Trung bình|Yếu.
- smb_scale_advisory: đủ 7 trường, gắn với hệ thống thực tế, không chung chung.
- agent_intelligence: tổng hợp cấp đội; reasoning_pattern bắt buộc.
- Tuyệt đối KHÔNG bịa số liệu, commit, hoặc buổi demo. Viết tiếng Việt.`;

  const system = `Bạn là AI Technical Auditor tổng hợp cấp đội (Team Aggregate).
Trả về MỘT JSON hợp lệ (không markdown):
${schema}
${rules}`;

  const user = `Team: ${ctx.team_id}
Repository: ${ctx.repo_name}

Lịch sử commit (JSON, max 200):
${JSON.stringify(ac.commits || [])}

Per-push reviews trước (JSON, max 40):
${JSON.stringify(ac.prior_push_reviews || [])}

Per-push review hiện tại (JSON):
${JSON.stringify(ctx.per_push || {})}`;

  return system + '\n\n' + user;
}

function buildGitHubIssueMarkdown(payload) {
  const root = payload.structured_output || payload;
  const lines = [];
  const push = (title, text) => {
    if (text && String(text).trim()) lines.push(`### ${title}\n\n${String(text).trim()}\n`);
  };
  const list = (title, arr) => {
    if (!Array.isArray(arr) || !arr.length) return;
    lines.push(`### ${title}\n`);
    arr.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  };

  lines.push('## Báo cáo AI Auditor (tham khảo)\n');
  lines.push(`**Đội:** ${payload.team_id || ''}`);
  lines.push(`**Repository:** \`${payload.repo_name || ''}\``);
  if (payload.commit_sha) lines.push(`**Commit:** \`${payload.commit_sha}\``);
  lines.push('\n> Đánh giá tự động — không phải điểm chính thức của ban tổ chức.\n');

  const overall = root.overall_picture || {};
  push('Tóm tắt push', overall.push_summary);
  push('Dự án', overall.project_about);
  push('RAG maturity', root.rag_maturity?.level);

  const inv = root.inventory_exhaustive || {};
  list('Kiểm kê — Ngôn ngữ', inv.languages);
  list('Kiểm kê — Framework', inv.frameworks_libraries);

  const agent = root.agent_intelligence || {};
  push('Agent — reasoning', agent.reasoning_pattern);
  list('Agent — skills', agent.detected_skills);

  const assess = root.assessment || {};
  push('Ưu điểm', assess.advantages);
  push('Nhược điểm', assess.disadvantages);
  push('Bảo mật', assess.security);
  push('Cải thiện', assess.improvement_areas);

  list('Gợi ý test case', root.suggested_test_cases);
  list('Câu hỏi phản biện cho BGK', root.suggested_questions_for_team);
  list('Gợi ý tinh chỉnh prompt', root.suggested_prompt_refinement);

  lines.push('\n---\n*Generated by Hackathon AI Review (legacy n8n)*');
  return lines.join('\n');
}

module.exports = { buildPerPushPrompt, buildAggregatePrompt, buildGitHubIssueMarkdown };

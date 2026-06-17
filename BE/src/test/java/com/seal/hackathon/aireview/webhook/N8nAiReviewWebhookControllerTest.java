package com.seal.hackathon.aireview.webhook;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.seal.hackathon.aireview.dto.N8nLegacyRepoItem;
import com.seal.hackathon.aireview.service.AiReviewService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class N8nAiReviewWebhookControllerTest {

  @Mock AiReviewService aiReviewService;

  @InjectMocks N8nAiReviewWebhookController controller;

  MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(controller, "n8nWebhookSecret", "test-n8n-secret");
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Test
  void legacyRepos_returnsProvisionedRepositories() throws Exception {
    when(aiReviewService.listProvisionedReposForLegacyN8n())
        .thenReturn(List.of(new N8nLegacyRepoItem("org-a", "team-one", 10L, 100L)));

    mockMvc
        .perform(
            get("/api/v1/webhooks/n8n/ai-review/legacy-repos")
                .header("X-N8N-Secret", "test-n8n-secret"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].owner").value("org-a"))
        .andExpect(jsonPath("$[0].repo").value("team-one"))
        .andExpect(jsonPath("$[0].teamId").value(10))
        .andExpect(jsonPath("$[0].repositoryId").value(100));
  }

  @Test
  void legacyRepos_rejectsInvalidSecret() throws Exception {
    mockMvc
        .perform(
            get("/api/v1/webhooks/n8n/ai-review/legacy-repos").header("X-N8N-Secret", "wrong"))
        .andExpect(status().isUnauthorized());
  }
}

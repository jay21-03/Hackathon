package com.seal.hackathon.github.webhook;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class GitHubWebhookIntegrationTest {

    private static final String WEBHOOK_SECRET = "test-github-webhook-secret";

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_github_webhook_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.github.webhook-secret", () -> WEBHOOK_SECRET);
    }

    @Autowired MockMvc mockMvc;
    @Autowired TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    @Autowired com.seal.hackathon.registration.repository.TeamRepository teamRepository;
    @Autowired EventRepository eventRepository;
    @Autowired AcademicTermRepository academicTermRepository;

    private TeamRepository trackedRepository;

    @BeforeEach
    void setUp() {
        teamRepositoryEntityRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();

        Event event = eventRepository.save(Event.builder()
                .name("Webhook Event")
                .description("desc")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now())
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Alpha")
                .contactEmail("alpha@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        trackedRepository = teamRepositoryEntityRepository.save(TeamRepository.builder()
                .teamId(team.getId())
                .githubOwner("hack-org")
                .githubRepoName("team-alpha")
                .githubRepoId(424242L)
                .repositoryUrl("https://github.com/hack-org/team-alpha")
                .repositoryName("team-alpha")
                .accessStatus(RepositoryAccessStatus.OPEN)
                .provisionStatus(RepositoryProvisionStatus.CREATED)
                .status(SubmissionStatus.SUBMITTED)
                .reviewIntervalMinutes(30)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void pushWebhook_updatesLastPushAt() throws Exception {
        String payload = """
                {
                  "ref": "refs/heads/main",
                  "repository": {
                    "id": 424242,
                    "name": "team-alpha",
                    "owner": { "login": "hack-org" }
                  },
                  "head_commit": {
                    "timestamp": "2026-06-10T10:15:30Z"
                  }
                }
                """;

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/webhooks/github")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "push")
                        .header("X-Hub-Signature-256", sign(payload))
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk());

        TeamRepository updated = teamRepositoryEntityRepository.findById(trackedRepository.getId()).orElseThrow();
        assertThat(updated.getLastPushAt()).isEqualTo(OffsetDateTime.parse("2026-06-10T10:15:30Z"));
    }

    @Test
    void pushWebhook_rejectsInvalidSignature() throws Exception {
        String payload = "{\"repository\":{\"id\":424242,\"name\":\"team-alpha\",\"owner\":{\"login\":\"hack-org\"}}}";

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/webhooks/github")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "push")
                        .header("X-Hub-Signature-256", "sha256=deadbeef")
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    private String sign(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder("sha256=");
        for (byte value : digest) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }
}

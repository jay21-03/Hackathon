package com.seal.hackathon.aireview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.client.AiReviewLlmClient;
import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.aireview.repository.AiReviewRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.AiReviewKind;
import com.seal.hackathon.common.enums.AiReviewStatus;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.github.client.GitHubCommitDetail;
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.github.util.GitHubRepositoryNameSlug;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.FakeAiReviewLlmClient;
import com.seal.hackathon.support.FakeGitHubRepositoryClient;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
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
class AiReviewIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_ai_review_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.github.mode", () -> "pat");
        registry.add("app.github.org", () -> "seal-org");
        registry.add("app.github.template-owner", () -> "seal-org");
        registry.add("app.github.template-repo", () -> "hackathon-starter");
        registry.add("app.github.default-branch", () -> "main");
        registry.add("app.github.pat", () -> "test-pat-token");
        registry.add("app.github.scheduler-enabled", () -> "false");
        registry.add("app.ai.review.scheduler-enabled", () -> "false");
        registry.add("app.ai.review.api-key", () -> "test-ai-key");
        registry.add("app.ai.review.github-issues-enabled", () -> "true");
        registry.add("app.ai.review.interval-minutes", () -> "5");
    }

    @TestConfiguration
    static class FakeClientsConfig {
        @Bean
        FakeGitHubRepositoryClient fakeGitHubRepositoryClient() {
            return new FakeGitHubRepositoryClient();
        }

        @Bean
        @Primary
        GitHubRepositoryClient githubRepositoryClient(FakeGitHubRepositoryClient fake) {
            return fake;
        }

        @Bean
        FakeAiReviewLlmClient fakeAiReviewLlmClient() {
            return new FakeAiReviewLlmClient();
        }

        @Bean
        @Primary
        AiReviewLlmClient aiReviewLlmClient(FakeAiReviewLlmClient fake) {
            return fake;
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired EventRepository eventRepository;
    @Autowired AcademicTermRepository academicTermRepository;
    @Autowired RoundRepository roundRepository;
    @Autowired BoardRepository boardRepository;
    @Autowired BoardSlotRepository boardSlotRepository;
    @Autowired JudgeAssignmentRepository judgeAssignmentRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired ProblemRepository problemRepository;
    @Autowired ProblemRepositoryTemplateRepository templateRepository;
    @Autowired TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    @Autowired AiReviewRepository aiReviewRepository;
    @Autowired FakeGitHubRepositoryClient fakeGitHub;
    @Autowired IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    User outsider;
    User judge;
    Event event;
    Board board;
    Problem problem;
    Team team;
    String organizerJwt;
    String participantJwt;
    String outsiderJwt;
    String judgeJwt;

    @BeforeEach
    void setUp() {
        aiReviewRepository.deleteAll();
        teamRepositoryEntityRepository.deleteAll();
        templateRepository.deleteAll();
        problemRepository.deleteAll();
        boardSlotRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        dataCleaner.clearEventMessaging();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        OffsetDateTime now = OffsetDateTime.now();
        organizer = saveUser("organizer-ai@example.com", "Organizer", "seal-organizer");
        participant = saveUser("participant-ai@example.com", "Participant", "seal-participant");
        outsider = saveUser("outsider-ai@example.com", "Outsider", "seal-outsider");
        judge = saveUser("judge-ai@example.com", "Judge", "seal-judge");
        saveRole(organizer.getId(), SystemRole.ORGANIZER);
        saveRole(participant.getId(), SystemRole.PARTICIPANT);
        saveRole(outsider.getId(), SystemRole.PARTICIPANT);
        saveRole(judge.getId(), SystemRole.JUDGE);

        event = eventRepository.save(Event.builder()
                .name("AiReviewEvent")
                .description("desc")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(now)
                .registrationEndAt(now.plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        Round round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .startAt(now.minusHours(2))
                .endAt(now.plusDays(1))
                .status(RoundStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build());

        board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build());

        team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Alpha")
                .contactEmail("team-alpha@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .teamId(team.getId())
                .eventId(event.getId())
                .userId(participant.getId())
                .email(participant.getEmail())
                .fullName(participant.getFullName())
                .contactPerson(true)
                .status(TeamMemberStatus.CONFIRMED)
                .confirmedAt(now)
                .resendCount(0)
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(now)
                .assignedBy(organizer.getId())
                .createdAt(now)
                .build());

        judgeAssignmentRepository.save(JudgeAssignment.builder()
                .boardId(board.getId())
                .judgeId(judge.getId())
                .createdAt(now)
                .createdBy(organizer.getId())
                .build());

        problem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề RAG")
                .description("Mô tả")
                .releaseAt(now.minusHours(1))
                .closeAt(now.plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        participantJwt = jwtService.generateToken(participant, Set.of("PARTICIPANT"));
        outsiderJwt = jwtService.generateToken(outsider, Set.of("PARTICIPANT"));
        judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));
    }

    @Test
    void triggerReviewCreatesPerPushAggregateAndGitHubIssue() throws Exception {
        provisionRepository();
        stubCommitWithPatch();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/teams/{teamId}/ai-reviews/run", team.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.reviewKind").value("TEAM_AGGREGATE"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.ragLevel").value("Advanced"));

        List<AiReview> reviews = aiReviewRepository.findByTeamIdOrderByReviewedAtDescCreatedAtDesc(team.getId());
        assertThat(reviews).hasSize(2);
        assertThat(reviews)
                .extracting(AiReview::getReviewKind)
                .containsExactlyInAnyOrder(AiReviewKind.PER_PUSH, AiReviewKind.TEAM_AGGREGATE);

        AiReview perPush = reviews.stream()
                .filter(r -> r.getReviewKind() == AiReviewKind.PER_PUSH)
                .findFirst()
                .orElseThrow();
        assertThat(perPush.getStatus()).isEqualTo(AiReviewStatus.COMPLETED);
        assertThat(perPush.getGithubIssueUrl()).contains("/issues/");

        AiReview aggregate = reviews.stream()
                .filter(r -> r.getReviewKind() == AiReviewKind.TEAM_AGGREGATE)
                .findFirst()
                .orElseThrow();
        JsonNode structured = objectMapper.readTree(aggregate.getStructuredOutput());
        assertThat(structured.path("criteria_comments").path("R1_01").asText()).contains("Tốt");
    }

    @Test
    void participantCanViewLatestAggregateOutsiderCannot() throws Exception {
        provisionRepository();
        stubCommitWithPatch();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/teams/{teamId}/ai-reviews/run", team.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/teams/{teamId}/ai-review", team.getId())
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.reviewKind").value("TEAM_AGGREGATE"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/teams/{teamId}/ai-review", team.getId())
                        .header("Authorization", "Bearer " + outsiderJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void assignedJudgeCanViewLatestAggregate() throws Exception {
        provisionRepository();
        stubCommitWithPatch();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/teams/{teamId}/ai-reviews/run", team.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/teams/{teamId}/ai-review", team.getId())
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.reviewKind").value("TEAM_AGGREGATE"));
    }

    private void provisionRepository() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/{problemId}/repo-template", problem.getId())
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "templateOwner", "seal-org",
                                "templateRepo", "starter-template",
                                "defaultBranch", "main",
                                "enabled", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/problems/{problemId}/repositories/provision", problem.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    private void stubCommitWithPatch() {
        String repo = GitHubRepositoryNameSlug.build(event.getName(), team.getName(), problem.getTitle());
        String sha = "deadbeef1234567890abcdef1234567890abcd";
        fakeGitHub.stubCommitDetail(
                "seal-org",
                repo,
                GitHubCommitDetail.builder()
                        .sha(sha)
                        .message("Add RAG pipeline")
                        .authorName("Participant")
                        .authorEmail("participant-ai@example.com")
                        .committedAt(OffsetDateTime.now())
                        .htmlUrl("https://github.com/seal-org/" + repo + "/commit/" + sha)
                        .additions(42)
                        .deletions(3)
                        .file(GitHubCommitDetail.GitHubCommitFileChange.builder()
                                .filename("rag.py")
                                .status("added")
                                .additions(42)
                                .deletions(0)
                                .patch("+def embed():\n+    return True\n")
                                .build())
                        .build());
    }

    private User saveUser(String email, String fullName, String githubUsername) {
        OffsetDateTime now = OffsetDateTime.now();
        return userRepository.save(User.builder()
                .email(email)
                .fullName(fullName)
                .githubUsername(githubUsername)
                .status(UserStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private void saveRole(Long userId, SystemRole role) {
        userRoleRepository.save(UserRole.builder()
                .userId(userId)
                .role(role)
                .createdAt(OffsetDateTime.now())
                .build());
    }
}

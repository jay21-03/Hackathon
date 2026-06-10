package com.seal.hackathon.github;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
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
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.github.util.GitHubRepositoryNameSlug;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.support.FakeGitHubRepositoryClient;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
class JudgeRepositoryAccessIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_judge_repo_test")
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
    }

    @TestConfiguration
    static class FakeGitHubConfig {
        @Bean
        FakeGitHubRepositoryClient fakeGitHubRepositoryClient() {
            return new FakeGitHubRepositoryClient();
        }

        @Bean
        @Primary
        GitHubRepositoryClient githubRepositoryClient(FakeGitHubRepositoryClient fakeGitHubRepositoryClient) {
            return fakeGitHubRepositoryClient;
        }
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JwtService jwtService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    AcademicTermRepository academicTermRepository;

    @Autowired
    RoundRepository roundRepository;

    @Autowired
    BoardRepository boardRepository;

    @Autowired
    BoardSlotRepository boardSlotRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    TeamMemberRepository teamMemberRepository;

    @Autowired
    ProblemRepository problemRepository;

    @Autowired
    ProblemRepositoryTemplateRepository problemRepositoryTemplateRepository;

    @Autowired
    TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Autowired
    JudgeAssignmentRepository judgeAssignmentRepository;

    @Autowired
    FakeGitHubRepositoryClient fakeGitHubRepositoryClient;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    User judge;
    Event event;
    Round round;
    Board board;
    Team team;
    Problem problem;
    String organizerJwt;
    String judgeJwt;

    @BeforeEach
    void setUp() {
        teamRepositoryEntityRepository.deleteAll();
        problemRepositoryTemplateRepository.deleteAll();
        problemRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        boardSlotRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        dataCleaner.clearEventMessaging();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        OffsetDateTime now = OffsetDateTime.now();

        organizer = saveUser("org-judge-repo@example.com", "Organizer", "seal-organizer");
        participant = saveUser("participant-judge-repo@example.com", "Participant", "seal-participant");
        judge = saveUser("judge-repo@example.com", "Judge", "seal-judge");

        saveRole(organizer.getId(), SystemRole.ORGANIZER);
        saveRole(participant.getId(), SystemRole.PARTICIPANT);
        saveRole(judge.getId(), SystemRole.JUDGE);

        event = eventRepository.save(Event.builder()
                .name("JudgeRepoEvent")
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

        round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .startAt(now.minusHours(2))
                .endAt(now.plusHours(2))
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
                .name("Đội Alpha")
                .contactEmail("team@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(team.getId())
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

        problem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề A")
                .description("Mô tả")
                .releaseAt(now.minusHours(1))
                .closeAt(now.plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));
    }

    @Test
    void grantJudgeAccessAndListRepositories() throws Exception {
        saveTemplate(problem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision", problem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/rounds/{roundId}/repositories/grant-judge-access", round.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.grantedCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.grants[0].status").value("GRANTED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.grants[0].judgeUsername").value("seal-judge"));

        String repoName = GitHubRepositoryNameSlug.build(event.getName(), team.getName(), problem.getTitle());
        assertThat(fakeGitHubRepositoryClient.collaboratorPermission("seal-org", repoName, "seal-judge"))
                .isEqualTo("pull");

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/judge/repositories")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].teamName").value("Đội Alpha"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].judgeGithubAccessGranted").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].provisionStatus").value("CREATED"));

        mockMvc.perform(MockMvcRequestBuilders.get(
                        "/api/v1/me/judge/rounds/{roundId}/repositories", round.getId())
                .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1));
    }

    @Test
    void lockProblemAutoGrantsJudgeAccess() throws Exception {
        saveTemplate(problem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision", problem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        OffsetDateTime now = OffsetDateTime.now();
        problem.setCloseAt(now.minusMinutes(5));
        problem.setUpdatedAt(now);
        problemRepository.save(problem);

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/lock", problem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        String repoName = GitHubRepositoryNameSlug.build(event.getName(), team.getName(), problem.getTitle());
        assertThat(fakeGitHubRepositoryClient.collaboratorPermission("seal-org", repoName, "seal-judge"))
                .isEqualTo("pull");
    }

    @Test
    void grantSkipsJudgeWithoutGithubUsername() throws Exception {
        User judgeNoGithub = userRepository.save(User.builder()
                .email("judge-no-gh@example.com")
                .fullName("Judge No GH")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(judgeNoGithub.getId())
                .role(SystemRole.JUDGE)
                .createdAt(OffsetDateTime.now())
                .build());

        saveTemplate(problem.getId());
        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision", problem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judgeNoGithub.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/rounds/{roundId}/repositories/grant-judge-access", round.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.skippedCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.grants[0].error").value("MISSING_GITHUB_USERNAME"));
    }

    private void saveTemplate(Long problemId) throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/{problemId}/repo-template", problemId)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "templateOwner", "seal-org",
                                "templateRepo", "hackathon-starter",
                                "defaultBranch", "main",
                                "enabled", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());
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

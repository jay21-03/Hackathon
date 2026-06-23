package com.seal.hackathon.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.repository.RepoCommitRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
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
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class RepositoryProvisioningIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_repo_test")
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
        registry.add("app.github.webhook-secret", () -> "test-github-webhook-secret");
        registry.add("app.github.webhook-url", () -> "https://api.example.com/api/v1/webhooks/github");
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
    FakeGitHubRepositoryClient fakeGitHubRepositoryClient;

    @Autowired
    RepoCommitRepository repoCommitRepository;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    User outsider;
    Event event;
    Round round;
    Board board;
    Team team;
    Problem releasedProblem;
    Problem unreleasedProblem;
    String organizerJwt;
    String participantJwt;
    String outsiderJwt;

    @BeforeEach
    void setUp() {
        teamRepositoryEntityRepository.deleteAll();
        problemRepositoryTemplateRepository.deleteAll();
        problemRepository.deleteAll();
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

        organizer = saveUser("organizer-repo@example.com", "Organizer", "seal-organizer");
        participant = saveUser("participant-repo@example.com", "Participant", "seal-participant");
        outsider = saveUser("outsider-repo@example.com", "Outsider", "seal-outsider");

        saveRole(organizer.getId(), SystemRole.ORGANIZER);
        saveRole(participant.getId(), SystemRole.PARTICIPANT);
        saveRole(outsider.getId(), SystemRole.PARTICIPANT);

        event = eventRepository.save(Event.builder()
                .name("RepoProvisioningEvent")
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
                .endAt(now.minusMinutes(5))
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
                .name("Đội Repo")
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

        releasedProblem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề đã mở")
                .description("Mô tả")
                .releaseAt(now.minusHours(1))
                .closeAt(now.plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        unreleasedProblem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề chưa mở")
                .description("Mô tả")
                .releaseAt(now.plusDays(1))
                .closeAt(now.plusDays(2))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        participantJwt = jwtService.generateToken(participant, Set.of("PARTICIPANT"));
        outsiderJwt = jwtService.generateToken(outsider, Set.of("PARTICIPANT"));
    }

    @Test
    void organizerCanConfigureTemplateAndProvisionReleasedProblem() throws Exception {
        saveTemplate(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.createdCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].provisionStatus").value("CREATED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].accessStatus").value("OPEN"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].submissionStatus").value("DRAFT"));

        assertThat(fakeGitHubRepositoryClient.collaboratorPermission("seal-org", repoName(team.getId(), releasedProblem.getId()), "seal-participant"))
                .isEqualTo("push");
        assertThat(fakeGitHubRepositoryClient.hasPushWebhook(
                        "seal-org",
                        repoName(team.getId(), releasedProblem.getId()),
                        "https://api.example.com/api/v1/webhooks/github"))
                .isTrue();
    }

    @Test
    void participantCannotConfigureTemplate() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/{problemId}/repo-template", releasedProblem.getId())
                        .header("Authorization", "Bearer " + participantJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "templateOwner", "seal-org",
                                "templateRepo", "starter",
                                "enabled", true))))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void provisionBeforeReleaseIsRejectedUnlessForced() throws Exception {
        saveTemplate(unreleasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        unreleasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isConflict());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision?force=true",
                        unreleasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.createdCount").value(1));
    }

    @Test
    void participantCanViewOwnRepositoriesButNotOtherTeams() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/repositories")
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].repositoryUrl").value(
                        "https://github.com/seal-org/" + repoName(team.getId(), releasedProblem.getId())));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/teams/{teamId}/repository", team.getId())
                        .header("Authorization", "Bearer " + outsiderJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void participantRepositoryListSurvivesUnresolvableEventContext() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/teams/{teamId}/repository", team.getId())
                        .param("eventId", "999999")
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].repositoryUrl").value(
                        "https://github.com/seal-org/" + repoName(team.getId(), releasedProblem.getId())))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].provisionStatus").value("CREATED"));
    }

    @Test
    void participantRepositoryListShowsClosedAfterProblemCloseAt() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        OffsetDateTime now = OffsetDateTime.now();
        releasedProblem.setCloseAt(now.minusMinutes(1));
        problemRepository.save(releasedProblem);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/teams/{teamId}/repository", team.getId())
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].accessStatus").value("CLOSED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].submissionStatus").value("SUBMITTED"));
    }

    @Test
    void lockProblemRepositoriesAfterCloseAt() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        OffsetDateTime now = OffsetDateTime.now();
        releasedProblem.setCloseAt(now.minusMinutes(1));
        problemRepository.save(releasedProblem);

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/lock", releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.lockedCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].accessStatus").value("CLOSED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].submissionStatus").value("SUBMITTED"));

        assertThat(fakeGitHubRepositoryClient.collaboratorPermission("seal-org", repoName(team.getId(), releasedProblem.getId()), "seal-participant"))
                .isEqualTo("pull");
        assertThat(fakeGitHubRepositoryClient.isBranchProtected(
                        "seal-org", repoName(team.getId(), releasedProblem.getId()), "main"))
                .isTrue();

        var teamRepo = teamRepositoryEntityRepository.findAllByTeamId(team.getId()).getFirst();
        assertThat(repoCommitRepository.findTopByTeamRepositoryIdOrderByCommittedAtDescIdDesc(teamRepo.getId()))
                .isPresent();
    }

    @Test
    void participantCanRefreshAndViewLatestCommit() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        var teamRepo = teamRepositoryEntityRepository.findAllByTeamId(team.getId()).getFirst();

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/me/team-repositories/{repositoryId}/commits/refresh", teamRepo.getId())
                .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.sha").value("abc123def4567890"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.message").value("Initial commit"));

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/me/team-repositories/{repositoryId}/commits/refresh", teamRepo.getId())
                .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.sha").value("abc123def4567890"));

        assertThat(repoCommitRepository.findAll().stream()
                        .filter(commit -> teamRepo.getId().equals(commit.getTeamRepositoryId()))
                        .filter(commit -> "abc123def4567890".equals(commit.getCommitSha()))
                        .count())
                .isEqualTo(1);

        mockMvc.perform(MockMvcRequestBuilders.get(
                        "/api/v1/me/team-repositories/{repositoryId}/commits/latest", teamRepo.getId())
                .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.sha").value("abc123def4567890"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/teams/{teamId}/repository", team.getId())
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].latestCommit.sha").value("abc123def4567890"));
    }

    @Test
    void lockProblemRepositoriesAfterCloseAtIgnoresAlreadyCapturedCommit() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        var teamRepo = teamRepositoryEntityRepository.findAllByTeamId(team.getId()).getFirst();
        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/me/team-repositories/{repositoryId}/commits/refresh", teamRepo.getId())
                .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.sha").value("abc123def4567890"));

        OffsetDateTime now = OffsetDateTime.now();
        releasedProblem.setCloseAt(now.minusMinutes(1));
        problemRepository.save(releasedProblem);

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/lock", releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.lockedCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].accessStatus").value("CLOSED"));
    }

    @Test
    void missingGithubUsernameMarksRepositoryFailed() throws Exception {
        participant.setGithubUsername(null);
        userRepository.save(participant);
        saveTemplate(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.failedCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositories[0].provisionStatus").value("FAILED"));
    }

    @Test
    void lockBeforeProblemCloseIsRejected() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/lock", releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("PROBLEM_NOT_CLOSED"));
    }

    @Test
    void provisionIsIdempotentForSameTeamProblem() throws Exception {
        saveTemplate(releasedProblem.getId());
        provision(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.createdCount").value(0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.skippedCount").value(1));

        assertThat(teamRepositoryEntityRepository.findAll()).hasSize(1);
    }

    @Test
    void retryFailedRepositoryAfterGithubUsernameIsSet() throws Exception {
        participant.setGithubUsername(null);
        userRepository.save(participant);
        saveTemplate(releasedProblem.getId());

        MvcResult failed = mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        Long repositoryId = objectMapper.readTree(failed.getResponse().getContentAsString())
                .path("data")
                .path("repositories")
                .get(0)
                .path("id")
                .asLong();

        participant.setGithubUsername("seal-participant");
        userRepository.save(participant);

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/team-repositories/{repositoryId}/retry", repositoryId)
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repository.provisionStatus").value("CREATED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repository.accessStatus").value("OPEN"));
    }

    @Test
    void participantDoesNotSeeLastError() throws Exception {
        participant.setGithubUsername(null);
        userRepository.save(participant);
        saveTemplate(releasedProblem.getId());

        mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/repositories")
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].provisionStatus").value("FAILED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].lastError").doesNotExist());
    }

    @Test
    void getRepoTemplateAutoCreatesFromServerDefaultsWhenMissing() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get(
                        "/api/v1/admin/problems/{problemId}/repo-template", releasedProblem.getId())
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.templateOwner").value("seal-org"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.templateRepo").value("hackathon-starter"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.enabled").value(true));
    }

    private void saveTemplate(Long problemId) throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/{problemId}/repo-template", problemId)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "templateOwner", "seal-org",
                                "templateRepo", "starter-template",
                                "defaultBranch", "main",
                                "enabled", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    private void provision(Long problemId) throws Exception {
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post(
                        "/api/v1/admin/problems/{problemId}/repositories/provision",
                        problemId)
                .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("data").path("createdCount").asInt()).isEqualTo(1);
    }

    private String repoName(Long teamId, Long problemId) {
        Problem problem = problemId.equals(releasedProblem.getId())
                ? releasedProblem
                : problemRepository.findById(problemId).orElse(releasedProblem);
        Team namedTeam = teamId.equals(team.getId())
                ? team
                : teamRepository.findById(teamId).orElse(team);
        return GitHubRepositoryNameSlug.build(event.getName(), namedTeam.getName(), problem.getTitle());
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

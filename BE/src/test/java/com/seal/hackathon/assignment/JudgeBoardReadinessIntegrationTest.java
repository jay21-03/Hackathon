package com.seal.hackathon.assignment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.enums.SystemRole;
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
import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.math.BigDecimal;
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
class JudgeBoardReadinessIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_readiness_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.github.org", () -> "seal-org");
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
    ProblemRepository problemRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    ScoreCriteriaRepository scoreCriteriaRepository;

    @Autowired
    JudgeAssignmentRepository judgeAssignmentRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    ProblemRepositoryTemplateRepository problemRepositoryTemplateRepository;

    User organizer;
    User judge;
    Event event;
    Round round;
    Board board;
    Team team;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        scoreCriteriaRepository.deleteAll();
        problemRepositoryTemplateRepository.deleteAll();
        problemRepository.deleteAll();
        boardSlotRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        organizer = userRepository.save(User.builder()
                .email("org-readiness@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        judge = userRepository.save(User.builder()
                .email("judge-readiness@example.com")
                .fullName("Judge")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        userRoleRepository.save(UserRole.builder()
                .userId(organizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(judge.getId())
                .role(SystemRole.JUDGE)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("ReadinessEvent")
                .description("desc")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now())
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(com.seal.hackathon.common.enums.EventStatus.DRAFT)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .startAt(OffsetDateTime.now().plusHours(1))
                .endAt(OffsetDateTime.now().plusHours(2))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Đội Alpha")
                .contactEmail("team@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void judgeAssignmentsExposeReadinessWithoutProblem() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].readiness").value("NO_PROBLEM"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].eventName").value("ReadinessEvent"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].roundName").value("Vòng 1"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].boardName").value("Bảng A"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].academicTermId").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].academicTermStatus").value("ACTIVE"));
    }

    @Test
    void readyBoardNotifiesJudgeOnce() throws Exception {
        OffsetDateTime now = OffsetDateTime.now();
        problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề A")
                .description("Mô tả")
                .releaseAt(now.minusHours(1))
                .closeAt(now.plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        scoreCriteriaRepository.save(ScoreCriteria.builder()
                .roundId(round.getId())
                .code("R1_01")
                .name("Ý tưởng")
                .weight(new BigDecimal("100"))
                .minScore(new BigDecimal("0"))
                .maxScore(new BigDecimal("10"))
                .sortOrder(1)
                .levelDescriptors(List.of(LevelDescriptorDto.builder()
                        .level("GOOD")
                        .label("Tốt")
                        .minScore(new BigDecimal("7"))
                        .maxScore(new BigDecimal("10"))
                        .description("B")
                        .build()))
                .createdAt(now)
                .build());

        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].readiness").value("READY_TO_SCORE"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].teamsCount").value(1));

        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(judge.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getNotificationType()).isEqualTo(NotificationType.BOARD_READY_TO_SCORE);
        assertThat(notifications.get(0).getLinkUrl()).contains("/judge/scoring?boardId=" + board.getId());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(judge.getId())).hasSize(1);
    }

    @Test
    void savingRubricNotifiesAssignedJudgeWhenBoardBecomesReady() throws Exception {
        OffsetDateTime now = OffsetDateTime.now();
        problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề A")
                .description("Mô tả")
                .releaseAt(now.minusHours(1))
                .closeAt(now.plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        List<Map<String, Object>> levels = List.of(
                Map.of("level", "EXCELLENT", "label", "Xuất sắc", "minScore", 9, "maxScore", 10, "description", "A"),
                Map.of("level", "GOOD", "label", "Tốt", "minScore", 7, "maxScore", 8.9, "description", "B"),
                Map.of("level", "SATISFACTORY", "label", "Đạt", "minScore", 5, "maxScore", 6.9, "description", "C"),
                Map.of("level", "UNSATISFACTORY", "label", "Chưa đạt", "minScore", 0, "maxScore", 4.9, "description", "D"));

        Map<String, Object> rubricBody = Map.of(
                "replaceExisting", true,
                "criteria", List.of(Map.of(
                        "code", "R1_01",
                        "name", "Ý tưởng",
                        "weight", 100,
                        "minScore", 0,
                        "maxScore", 10,
                        "sortOrder", 1,
                        "levelDescriptors", levels)));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(rubricBody)))
                .andExpect(MockMvcResultMatchers.status().isOk());

        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(judge.getId());
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getNotificationType()).isEqualTo(NotificationType.BOARD_READY_TO_SCORE);
    }

    @Test
    void closedProblemWithoutReposShowsProblemClosedNotWaitingRepositories() throws Exception {
        OffsetDateTime now = OffsetDateTime.now();
        Problem problem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề đã đóng")
                .description("Mô tả")
                .releaseAt(now.minusDays(2))
                .closeAt(now.minusHours(1))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        problemRepositoryTemplateRepository.save(ProblemRepositoryTemplate.builder()
                .problemId(problem.getId())
                .templateOwner("seal-org")
                .templateRepo("starter")
                .defaultBranch("main")
                .enabled(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        scoreCriteriaRepository.save(ScoreCriteria.builder()
                .roundId(round.getId())
                .code("R1_01")
                .name("Ý tưởng")
                .weight(new BigDecimal("100"))
                .minScore(new BigDecimal("0"))
                .maxScore(new BigDecimal("10"))
                .sortOrder(1)
                .levelDescriptors(List.of(LevelDescriptorDto.builder()
                        .level("GOOD")
                        .label("Tốt")
                        .minScore(new BigDecimal("7"))
                        .maxScore(new BigDecimal("10"))
                        .description("B")
                        .build()))
                .createdAt(now)
                .build());

        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].readiness").value("PROBLEM_CLOSED"));
    }

    @Test
    void unreleasedProblemShowsWaitingRelease() throws Exception {
        OffsetDateTime now = OffsetDateTime.now();
        problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề chưa mở")
                .description("Mô tả")
                .releaseAt(now.plusDays(1))
                .closeAt(now.plusDays(2))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        scoreCriteriaRepository.save(ScoreCriteria.builder()
                .roundId(round.getId())
                .code("R1_01")
                .name("Ý tưởng")
                .weight(new BigDecimal("100"))
                .minScore(new BigDecimal("0"))
                .maxScore(new BigDecimal("10"))
                .sortOrder(1)
                .levelDescriptors(List.of(LevelDescriptorDto.builder()
                        .level("GOOD")
                        .label("Tốt")
                        .minScore(new BigDecimal("7"))
                        .maxScore(new BigDecimal("10"))
                        .description("B")
                        .build()))
                .createdAt(now)
                .build());

        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].readiness").value("WAITING_PROBLEM_RELEASE"));
    }
}

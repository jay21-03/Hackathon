package com.seal.hackathon.ranking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
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
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
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
class RankingIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_ranking_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
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
    JudgeAssignmentRepository judgeAssignmentRepository;

    @Autowired
    ScoreCriteriaRepository scoreCriteriaRepository;

    @Autowired
    ScoreSheetRepository scoreSheetRepository;

    @Autowired
    ScoreItemRepository scoreItemRepository;

    @Autowired
    RankingResultRepository rankingResultRepository;

    @Autowired
    TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User judge;
    Event event;
    Round round;
    Board board;
    Team team;

    @BeforeEach
    void setUp() {
        rankingResultRepository.deleteAll();
        scoreItemRepository.deleteAll();
        scoreSheetRepository.deleteAll();
        scoreCriteriaRepository.deleteAll();
        teamRepositoryEntityRepository.deleteAll();
        boardSlotRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        dataCleaner.clearNotifications();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        organizer = userRepository.save(User.builder()
                .email("org-ranking@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        judge = userRepository.save(User.builder()
                .email("judge-ranking@example.com")
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
                .name("RankingTestEvent")
                .description("desc")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now())
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.IN_PROGRESS)
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
                .name("Team Alpha")
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
        seedManualRepository(team, board);
    }

    private void seedManualRepository(Team targetTeam, Board targetBoard) {
        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(targetTeam.getId())
                .roundId(round.getId())
                .boardId(targetBoard.getId())
                .repositoryUrl("https://github.com/org/" + targetTeam.getName().toLowerCase().replace(" ", "-"))
                .repositoryName(targetTeam.getName())
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void calculatePublishAndPublicResultsFlow() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

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

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "replaceExisting", true,
                                "criteria", List.of(Map.of(
                                        "code", "R1_01",
                                        "name", "Ý tưởng",
                                        "weight", 100,
                                        "minScore", 0,
                                        "maxScore", 10,
                                        "sortOrder", 1,
                                        "levelDescriptors", levels))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        MvcResult matrixResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode matrix = objectMapper.readTree(matrixResult.getResponse().getContentAsString());
        long criteriaId = matrix.path("data").path("criteria").get(0).path("id").asLong();
        long teamId = matrix.path("data").path("teams").get(0).path("teamId").asLong();

        Board boardWithoutRanking = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Board B")
                .boardOrder(2)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        Team teamWithoutRanking = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Beta")
                .contactEmail("team-beta@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        boardSlotRepository.save(BoardSlot.builder()
                .roundId(round.getId())
                .boardId(boardWithoutRanking.getId())
                .teamNumber(1)
                .teamId(teamWithoutRanking.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rows", List.of(Map.of(
                                        "teamId", teamId,
                                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 8.0))))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("submitAll", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teamCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.entries[0].rank").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.entries[0].averageScore").value(80.0));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/rankings")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards.length()").value(2))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards[1].boardId").value(boardWithoutRanking.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards[1].teamCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards[1].entries.length()").value(0));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events/" + event.getId() + "/results"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.published").value(false))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards.length()").value(0));

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/rankings/publish")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.newlyPublishedBoards").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teamsRanked").value(1));

        MvcResult publicResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/events/" + event.getId() + "/results"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.published").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards.length()").value(1))
                .andReturn();

        JsonNode published = objectMapper.readTree(publicResult.getResponse().getContentAsString());
        assertThat(published.path("data").path("boards").get(0).path("entries").get(0).path("teamName").asText())
                .isEqualTo("Team Alpha");

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isConflict());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .param("force", "true")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.published").value(false));
    }

    @Test
    void calculateRankingFailsWhenBoardTeamHasNoRepository() throws Exception {
        teamRepositoryEntityRepository.deleteAll();
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(
                        org.hamcrest.Matchers.startsWith("BOARD_REPOSITORIES_NOT_READY")));
    }
}

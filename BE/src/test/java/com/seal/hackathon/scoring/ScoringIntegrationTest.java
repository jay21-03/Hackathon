package com.seal.hackathon.scoring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
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
class ScoringIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_scoring_test")
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
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User judge;
    Event event;
    Round round;
    Board board;
    Team team;

    @BeforeEach
    void setUp() {
        scoreItemRepository.deleteAll();
        scoreSheetRepository.deleteAll();
        scoreCriteriaRepository.deleteAll();
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
                .email("org-scoring@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        judge = userRepository.save(User.builder()
                .email("judge-scoring@example.com")
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
                .name("ScoringTestEvent")
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
    void rubricMatrixSubmitAndProgressFlow() throws Exception {
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
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalWeight").value(100));

        MvcResult matrixResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teams.length()").value(1))
                .andReturn();

        JsonNode matrix = objectMapper.readTree(matrixResult.getResponse().getContentAsString());
        long criteriaId = matrix.path("data").path("criteria").get(0).path("id").asLong();
        long teamId = matrix.path("data").path("teams").get(0).path("teamId").asLong();

        Map<String, Object> saveBody = Map.of(
                "rows", List.of(Map.of(
                        "teamId", teamId,
                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 7.0)))));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(saveBody)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.savedTeamIds.length()").value(1));

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("submitAll", true))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.submitted.length()").value(1));

        MvcResult progressResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/admin/boards/" + board.getId() + "/score-progress")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.summary.submittedSheets").value(1))
                .andReturn();

        JsonNode progress = objectMapper.readTree(progressResult.getResponse().getContentAsString());
        assertThat(progress.path("data").path("summary").path("completionPercent").asDouble()).isEqualTo(100.0);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(rubricBody)))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("RUBRIC_LOCKED"));
    }

    @Test
    void judgeCanUpdateSubmittedScoreSheet() throws Exception {
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

        MvcResult matrixResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode matrix = objectMapper.readTree(matrixResult.getResponse().getContentAsString());
        long criteriaId = matrix.path("data").path("criteria").get(0).path("id").asLong();
        long teamId = matrix.path("data").path("teams").get(0).path("teamId").asLong();

        Map<String, Object> initialSave = Map.of(
                "rows", List.of(Map.of(
                        "teamId", teamId,
                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 7.0)))));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(initialSave)))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("teamIds", List.of(teamId)))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.submitted.length()").value(1));

        Map<String, Object> updatedSave = Map.of(
                "rows", List.of(Map.of(
                        "teamId", teamId,
                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 9.0)))));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(updatedSave)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.savedTeamIds.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.skippedSubmittedTeamIds.length()").value(0));

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("teamIds", List.of(teamId)))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.submitted.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.submitted[0].judgeTeamScore").value(90.0));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teams[0].editable").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teams[0].computed.judgeTeamScore").value(90.0));
    }

    @Test
    void computedTotalMatchesBr013() throws Exception {
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

        Map<String, Object> rubricBody = Map.of(
                "replaceExisting", true,
                "criteria", List.of(
                        Map.of("code", "R1_01", "name", "A", "weight", 30, "minScore", 0, "maxScore", 10, "sortOrder", 1, "levelDescriptors", levels),
                        Map.of("code", "R1_02", "name", "B", "weight", 25, "minScore", 0, "maxScore", 10, "sortOrder", 2, "levelDescriptors", levels),
                        Map.of("code", "R1_03", "name", "C", "weight", 15, "minScore", 0, "maxScore", 10, "sortOrder", 3, "levelDescriptors", levels),
                        Map.of("code", "R1_04", "name", "D", "weight", 20, "minScore", 0, "maxScore", 10, "sortOrder", 4, "levelDescriptors", levels),
                        Map.of("code", "R1_05", "name", "E", "weight", 10, "minScore", 0, "maxScore", 10, "sortOrder", 5, "levelDescriptors", levels)));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(rubricBody)))
                .andExpect(MockMvcResultMatchers.status().isOk());

        MvcResult matrixResult = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode matrix = objectMapper.readTree(matrixResult.getResponse().getContentAsString());
        JsonNode criteria = matrix.path("data").path("criteria");
        long teamId = matrix.path("data").path("teams").get(0).path("teamId").asLong();

        double[] scores = {6, 7, 7, 9, 9};
        List<Map<String, Object>> scoreInputs = new java.util.ArrayList<>();
        for (int i = 0; i < scores.length; i++) {
            scoreInputs.add(Map.of(
                    "criteriaId", criteria.get(i).path("id").asLong(),
                    "scoreValue", scores[i]));
        }

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("rows", List.of(Map.of("teamId", teamId, "scores", scoreInputs))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        Map<String, Object> updatedRubricBody = Map.of(
                "replaceExisting", true,
                "criteria", List.of(
                        Map.of("code", "R1_01", "name", "A updated", "weight", 30, "minScore", 0, "maxScore", 10, "sortOrder", 1, "levelDescriptors", levels),
                        Map.of("code", "R1_02", "name", "B", "weight", 25, "minScore", 0, "maxScore", 10, "sortOrder", 2, "levelDescriptors", levels),
                        Map.of("code", "R1_03", "name", "C", "weight", 15, "minScore", 0, "maxScore", 10, "sortOrder", 3, "levelDescriptors", levels),
                        Map.of("code", "R1_04", "name", "D", "weight", 20, "minScore", 0, "maxScore", 10, "sortOrder", 4, "levelDescriptors", levels),
                        Map.of("code", "R1_05", "name", "E", "weight", 10, "minScore", 0, "maxScore", 10, "sortOrder", 5, "levelDescriptors", levels)));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(updatedRubricBody)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.criteria[0].name").value("A updated"));

        MvcResult afterSave = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        BigDecimal total = new BigDecimal(
                objectMapper.readTree(afterSave.getResponse().getContentAsString())
                        .path("data")
                        .path("teams")
                        .get(0)
                        .path("computed")
                        .path("judgeTeamScore")
                        .asText());
        assertThat(total).isEqualByComparingTo(new BigDecimal("73.00"));
    }

    @Test
    void foreignOrganizerCannotAccessRubricOrProgress() throws Exception {
        User otherOrganizer = userRepository.save(User.builder()
                .email("other-org@example.com")
                .fullName("Other Org")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(otherOrganizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());

        String otherJwt = jwtService.generateToken(otherOrganizer, Set.of("ORGANIZER"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .header("Authorization", "Bearer " + otherJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("EVENT_ACCESS_DENIED"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/boards/" + board.getId() + "/score-progress")
                        .header("Authorization", "Bearer " + otherJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("EVENT_ACCESS_DENIED"));
    }
}

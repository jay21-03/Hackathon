package com.seal.hackathon.ranking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.seal.hackathon.ranking.repository.AdvancementRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
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
class AdvancementIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_advancement_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
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
    @Autowired TeamRepository teamRepository;
    @Autowired JudgeAssignmentRepository judgeAssignmentRepository;
    @Autowired ScoreCriteriaRepository scoreCriteriaRepository;
    @Autowired ScoreSheetRepository scoreSheetRepository;
    @Autowired ScoreItemRepository scoreItemRepository;
    @Autowired RankingResultRepository rankingResultRepository;
    @Autowired AdvancementRepository advancementRepository;
    @Autowired IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User judge;
    Event event;
    Round groupRound;
    Round finalsRound;
    Board groupBoard;
    Board finalsBoard;
    BoardSlot finalsSlot;
    Team team;
    String orgJwt;

    @BeforeEach
    void setUp() {
        advancementRepository.deleteAll();
        rankingResultRepository.deleteAll();
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
                .email("org-advance@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        judge = userRepository.save(User.builder()
                .email("judge-advance@example.com")
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
                .name("Advancement Event")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
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

        groupRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng bảng")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Chung kết")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        groupBoard = boardRepository.save(Board.builder()
                .roundId(groupRound.getId())
                .name("Bảng A")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        finalsBoard = boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Bảng CK")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Advance")
                .contactEmail("team@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(groupRound.getId())
                .boardId(groupBoard.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        finalsSlot = boardSlotRepository.save(BoardSlot.builder()
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .teamNumber(1)
                .createdAt(OffsetDateTime.now())
                .build());

        orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
    }

    @Test
    void previewAndExecuteAdvancement_assignsFinalsSlot() throws Exception {
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + groupBoard.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        List<Map<String, Object>> levels = List.of(
                Map.of("level", "EXCELLENT", "label", "Xuất sắc", "minScore", 9, "maxScore", 10, "description", "A"),
                Map.of("level", "GOOD", "label", "Tốt", "minScore", 7, "maxScore", 8.9, "description", "B"),
                Map.of("level", "SATISFACTORY", "label", "Đạt", "minScore", 5, "maxScore", 6.9, "description", "C"),
                Map.of("level", "UNSATISFACTORY", "label", "Chưa đạt", "minScore", 0, "maxScore", 4.9, "description", "D"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + groupRound.getId() + "/criteria")
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
                                "/api/v1/judge/boards/" + groupBoard.getId() + "/score-matrix")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode matrix = objectMapper.readTree(matrixResult.getResponse().getContentAsString());
        long criteriaId = matrix.path("data").path("criteria").get(0).path("id").asLong();
        long teamId = matrix.path("data").path("teams").get(0).path("teamId").asLong();

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + groupBoard.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rows", List.of(Map.of(
                                        "teamId", teamId,
                                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 8.5))))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + groupBoard.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("submitAll", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + groupBoard.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/rankings/publish")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/advancements/preview")
                        .param("fromRoundId", String.valueOf(groupRound.getId()))
                        .param("toRoundId", String.valueOf(finalsRound.getId()))
                        .param("topNPerBoard", "1")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.candidates.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.candidates[0].teamName").value("Team Advance"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.eligibleTeams.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.eligibleTeams[0].teamName").value("Team Advance"));

        MvcResult executeResult = mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/advancements/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fromRoundId", groupRound.getId(),
                                "toRoundId", finalsRound.getId(),
                                "topNPerBoard", 1,
                                "targetBoardId", finalsBoard.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teamsAdvanced").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.slotsAssigned").value(1))
                .andReturn();

        JsonNode executeJson = objectMapper.readTree(executeResult.getResponse().getContentAsString());
        assertThat(executeJson.path("data").path("advancements").get(0).path("teamId").asLong())
                .isEqualTo(team.getId());

        BoardSlot updatedSlot = boardSlotRepository.findById(finalsSlot.getId()).orElseThrow();
        assertThat(updatedSlot.getTeamId()).isEqualTo(team.getId());
        assertThat(advancementRepository.findByToRoundId(finalsRound.getId())).hasSize(1);

        rankingResultRepository.findByBoardIdOrderByRankAsc(groupBoard.getId()).forEach(result ->
                assertThat(result.getPublishedAt()).isNotNull());
        assertThat(rankingResultRepository.findByBoardIdOrderByRankAsc(groupBoard.getId()).get(0).getAverageScore())
                .isEqualByComparingTo(BigDecimal.valueOf(85.0));
    }
}

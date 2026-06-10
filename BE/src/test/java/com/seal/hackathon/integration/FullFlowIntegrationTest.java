package com.seal.hackathon.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
class FullFlowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_fullflow")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.outbox.poll-delay-ms", () -> "60000");
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired EventRepository eventRepository;

    @Autowired
    AcademicTermRepository academicTermRepository;
    @Autowired RoundRepository roundRepository;
    @Autowired BoardRepository boardRepository;
    @Autowired BoardSlotRepository boardSlotRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired IntegrationTestDataCleaner dataCleaner;
    @Autowired JudgeAssignmentRepository judgeAssignmentRepository;
    @Autowired ScoreItemRepository scoreItemRepository;
    @Autowired ScoreSheetRepository scoreSheetRepository;
    @Autowired ScoreCriteriaRepository scoreCriteriaRepository;
    @Autowired RankingResultRepository rankingResultRepository;

    User captain;
    User judge;
    User organizer;
    Event event;
    Round round;
    Board board;
    BoardSlot slot;

    @BeforeEach
    void setUp() {
        rankingResultRepository.deleteAll();
        scoreItemRepository.deleteAll();
        scoreSheetRepository.deleteAll();
        scoreCriteriaRepository.deleteAll();
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
        captain = userRepository.save(User.builder()
                .email("captain@example.com")
                .fullName("Captain")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        organizer = userRepository.save(User.builder()
                .email("org-full@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        judge = userRepository.save(User.builder()
                .email("judge-full@example.com")
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
                .name("Full Flow Event")
                .description("E2E chain")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now().minusHours(1))
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.REGISTRATION_OPEN)
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
                .endAt(OffsetDateTime.now().plusHours(3))
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

        slot = boardSlotRepository.save(BoardSlot.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamNumber(1)
                .createdAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void registerConfirmAssignAndAuditFlow() throws Exception {
        String captainJwt = jwtService.generateToken(captain, Set.of("PARTICIPANT"));
        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String idemKey = UUID.randomUUID().toString();

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/" + event.getId() + "/teams")
                        .header("Authorization", "Bearer " + captainJwt)
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Team Flow",
                                  "members": [
                                    {"email": "captain@example.com", "fullName": "Captain", "studentId": "S100", "university": "SEAL U"}
                                  ]
                                }
                                """))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();

        JsonNode registerJson = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        long teamId = registerJson.path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/v1/teams/" + teamId + "/status")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        String assignKey = UUID.randomUUID().toString();
        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/rounds/" + round.getId() + "/boards/slots/" + slot.getId() + "/assign")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .header("Idempotency-Key", assignKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teamId\": " + teamId + ", \"forceReplace\": false}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/rounds/" + round.getId() + "/boards/slots/" + slot.getId() + "/assign")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .header("Idempotency-Key", assignKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teamId\": " + teamId + ", \"forceReplace\": false}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        MvcResult pagedTeams = mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events/" + event.getId() + "/teams")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        JsonNode paged = objectMapper.readTree(pagedTeams.getResponse().getContentAsString());
        assertThat(paged.path("data").path("total").asLong()).isEqualTo(1);

        MvcResult myBoard = mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/my/board")
                        .header("Authorization", "Bearer " + captainJwt)
                        .param("eventId", String.valueOf(event.getId())))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(myBoard.getResponse().getContentAsString())
                        .path("data").path("assigned").asBoolean())
                .isTrue();

        MvcResult audit = mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/admin/events/" + event.getId() + "/audit-logs")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        String auditBody = audit.getResponse().getContentAsString();
        assertThat(auditBody).contains("SLOT_ASSIGNED");
    }

    @Test
    void waitlistTeamBlockedFromBoard() throws Exception {
        Team waitlistTeam = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Waitlist Team")
                .contactUserId(captain.getId())
                .contactEmail(captain.getEmail())
                .status(TeamStatus.WAITLIST)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(waitlistTeam.getId())
                .userId(captain.getId())
                .email(captain.getEmail())
                .fullName(captain.getFullName())
                .contactPerson(true)
                .status(TeamMemberStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .build());

        String captainJwt = jwtService.generateToken(captain, Set.of("PARTICIPANT"));
        MvcResult myBoard = mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/my/board")
                        .header("Authorization", "Bearer " + captainJwt)
                        .param("eventId", String.valueOf(event.getId())))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode boardJson = objectMapper.readTree(myBoard.getResponse().getContentAsString());
        assertThat(boardJson.path("data").path("assigned").asBoolean()).isFalse();
        assertThat(boardJson.path("data").path("reason").asText()).isEqualTo("TEAM_WAITLIST");
        assertThat(waitlistTeam.getStatus()).isEqualTo(TeamStatus.WAITLIST);
    }

    @Test
    void registerScoreRankPublishChain() throws Exception {
        String captainJwt = jwtService.generateToken(captain, Set.of("PARTICIPANT"));
        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/" + event.getId() + "/teams")
                        .header("Authorization", "Bearer " + captainJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Team Publish",
                                  "members": [
                                    {"email": "captain@example.com", "fullName": "Captain", "studentId": "S200", "university": "SEAL U"}
                                  ]
                                }
                                """))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();
        long teamId = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/v1/teams/" + teamId + "/status")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/rounds/" + round.getId() + "/boards/slots/" + slot.getId() + "/assign")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teamId\": " + teamId + ", \"forceReplace\": false}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        List<Map<String, Object>> levels = List.of(
                Map.of("level", "EXCELLENT", "label", "Xuất sắc", "minScore", 9, "maxScore", 10, "description", "A"),
                Map.of("level", "GOOD", "label", "Tốt", "minScore", 7, "maxScore", 8.9, "description", "B"),
                Map.of("level", "SATISFACTORY", "label", "Đạt", "minScore", 5, "maxScore", 6.9, "description", "C"),
                Map.of("level", "UNSATISFACTORY", "label", "Chưa đạt", "minScore", 0, "maxScore", 4.9, "description", "D"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
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

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rows", List.of(Map.of(
                                        "teamId", teamId,
                                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 8.5))))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("submitAll", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.entries[0].teamName").value("Team Publish"));

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/rankings/publish")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.newlyPublishedBoards").value(1));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events/" + event.getId() + "/results"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.published").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.boards[0].entries[0].teamName").value("Team Publish"));
    }

    @Test
    void publishReadinessBeforeAndAfterScoring() throws Exception {
        String captainJwt = jwtService.generateToken(captain, Set.of("PARTICIPANT"));
        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/admin/events/" + event.getId() + "/publish-readiness")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.ready").value(false));

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/" + event.getId() + "/teams")
                        .header("Authorization", "Bearer " + captainJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Team Ready",
                                  "members": [
                                    {"email": "captain@example.com", "fullName": "Captain", "studentId": "S300", "university": "SEAL U"}
                                  ]
                                }
                                """))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();
        long teamId = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/v1/teams/" + teamId + "/status")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/rounds/" + round.getId() + "/boards/slots/" + slot.getId() + "/assign")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teamId\": " + teamId + ", \"forceReplace\": false}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content(objectMapper.writeValueAsString(Map.of("userId", judge.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        List<Map<String, Object>> levels = List.of(
                Map.of("level", "EXCELLENT", "label", "Xuất sắc", "minScore", 9, "maxScore", 10, "description", "A"),
                Map.of("level", "GOOD", "label", "Tốt", "minScore", 7, "maxScore", 8.9, "description", "B"),
                Map.of("level", "SATISFACTORY", "label", "Đạt", "minScore", 5, "maxScore", 6.9, "description", "C"),
                Map.of("level", "UNSATISFACTORY", "label", "Chưa đạt", "minScore", 0, "maxScore", 4.9, "description", "D"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/rounds/" + round.getId() + "/criteria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
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

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/judge/boards/" + board.getId() + "/score-matrix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rows", List.of(Map.of(
                                        "teamId", teamId,
                                        "scores", List.of(Map.of("criteriaId", criteriaId, "scoreValue", 7.0))))))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/judge/boards/" + board.getId() + "/score-matrix/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + judgeJwt)
                        .content(objectMapper.writeValueAsString(Map.of("submitAll", true))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/boards/" + board.getId() + "/rankings/calculate")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get(
                                "/api/v1/admin/events/" + event.getId() + "/publish-readiness")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.ready").value(true));
    }
}

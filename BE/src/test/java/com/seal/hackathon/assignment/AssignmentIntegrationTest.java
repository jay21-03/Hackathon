package com.seal.hackathon.assignment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
public class AssignmentIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_test")
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
    MentorAssignmentRepository mentorAssignmentRepository;

    @Autowired
    JudgeAssignmentRepository judgeAssignmentRepository;

    User organizer;
    User mentor;
    User judge;
    User mentorJudge;
    Event event;
    Round round;
    Board board;

    @BeforeEach
    void setUp() {
        mentorAssignmentRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        organizer = userRepository.save(User.builder()
                .email("org@example.com")
                .fullName("Org")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        mentor = userRepository.save(User.builder()
                .email("mentor@example.com")
                .fullName("Mentor")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        judge = userRepository.save(User.builder()
                .email("judge@example.com")
                .fullName("Judge")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        mentorJudge = userRepository.save(User.builder()
                .email("mentor-judge@example.com")
                .fullName("Mentor Judge")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        // roles
        userRoleRepository.save(UserRole.builder().userId(organizer.getId()).role(SystemRole.ORGANIZER).createdAt(OffsetDateTime.now()).build());
        userRoleRepository.save(UserRole.builder().userId(mentor.getId()).role(SystemRole.MENTOR).createdAt(OffsetDateTime.now()).build());
        userRoleRepository.save(UserRole.builder().userId(judge.getId()).role(SystemRole.JUDGE).createdAt(OffsetDateTime.now()).build());
        userRoleRepository.save(UserRole.builder().userId(mentorJudge.getId()).role(SystemRole.MENTOR).createdAt(OffsetDateTime.now()).build());
        userRoleRepository.save(UserRole.builder().userId(mentorJudge.getId()).role(SystemRole.JUDGE).createdAt(OffsetDateTime.now()).build());

        event = eventRepository.save(Event.builder()
                .name("AssignTestEvent")
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
                .name("R1")
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
                .name("Board A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void mentorAssignListDeleteFlow() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String mentorJwt = jwtService.generateToken(mentor, Set.of("MENTOR"));

        // assign mentor
        String payload = objectMapper.writeValueAsString(java.util.Map.of("userId", mentor.getId()));
        MvcResult assign = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andReturn();

        JsonNode body = objectMapper.readTree(assign.getResponse().getContentAsString());
        assertThat(body.path("data").path("assigneeId").asLong()).isEqualTo(mentor.getId());

        // idempotent assign again
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));

        // mentor lists assignments
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/mentors/assignments")
                        .header("Authorization", "Bearer " + mentorJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1));

        // delete assignment
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/boards/" + board.getId() + "/mentors/" + mentor.getId())
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));

        // mentor list now empty
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/mentors/assignments")
                        .header("Authorization", "Bearer " + mentorJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(0));
    }

    @Test
    void judgeAssignListDeleteFlow() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String judgeJwt = jwtService.generateToken(judge, Set.of("JUDGE"));

        String payload = objectMapper.writeValueAsString(java.util.Map.of("userId", judge.getId()));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1));

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/boards/" + board.getId() + "/judges/" + judge.getId())
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/judges/assignments")
                        .header("Authorization", "Bearer " + judgeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(0));
    }

    @Test
    void mentorCannotBeAssignedToTwoBoardsInSameRound() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        Board secondBoard = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Board B")
                .boardOrder(2)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        String payload = objectMapper.writeValueAsString(java.util.Map.of("userId", mentor.getId()));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + secondBoard.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("MENTOR_ALREADY_ASSIGNED_IN_ROUND"));
    }

    @Test
    void staffCanMentorAndJudgeInDifferentRounds() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        Round finalRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("R2")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .startAt(OffsetDateTime.now().plusHours(3))
                .endAt(OffsetDateTime.now().plusHours(4))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        Board finalBoard = boardRepository.save(Board.builder()
                .roundId(finalRound.getId())
                .name("Final Board")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        String payload = objectMapper.writeValueAsString(java.util.Map.of("userId", mentorJudge.getId()));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + finalBoard.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void staffCannotMentorAndJudgeInSameRound() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        Board secondBoard = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Board B")
                .boardOrder(2)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        String payload = objectMapper.writeValueAsString(java.util.Map.of("userId", mentorJudge.getId()));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/mentors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + secondBoard.getId() + "/judges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(payload))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("STAFF_ROLE_CONFLICT_IN_ROUND"));
    }
}

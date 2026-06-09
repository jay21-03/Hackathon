package com.seal.hackathon.submission;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
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
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.support.IntegrationTestConfig;
import java.time.OffsetDateTime;
import java.time.LocalDate;
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
class SubmissionIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_submission_test")
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
    TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User participant;
    Event event;
    Team team;

    @BeforeEach
    void setUp() {
        teamRepositoryEntityRepository.deleteAll();
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

        participant = userRepository.save(User.builder()
                .email("participant-sub@example.com")
                .fullName("Participant")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(participant.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("SubmissionTestEvent")
                .description("desc")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now())
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Round round = roundRepository.save(Round.builder()
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

        Board board = boardRepository.save(Board.builder()
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
                .name("Đội Beta")
                .contactEmail("team@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(team.getId())
                .userId(participant.getId())
                .email(participant.getEmail())
                .fullName(participant.getFullName())
                .contactPerson(true)
                .status(TeamMemberStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề thi")
                .description("Mô tả đề")
                .releaseAt(OffsetDateTime.now().minusHours(1))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void draftSubmitAndInvalidUrlFlow() throws Exception {
        String jwt = jwtService.generateToken(participant, Set.of());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/my/submission")
                        .param("eventId", String.valueOf(event.getId()))
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.teamId").value(team.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.editable").value(true));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/my/submission/draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://github.com/org/repo"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("DRAFT"));

        MvcResult submitResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/my/submission/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of("eventId", event.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("SUBMITTED"))
                .andReturn();

        JsonNode submitted = objectMapper.readTree(submitResult.getResponse().getContentAsString());
        assertThat(submitted.path("data").path("submittedAt").asText()).isNotBlank();

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/my/submission/draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://github.com/org/other"))))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("SUBMISSION_ALREADY_SUBMITTED"));

        String orgJwt = jwtService.generateToken(participant, Set.of("ORGANIZER", "PARTICIPANT"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/submissions")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].teamId").value(team.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].status").value("SUBMITTED"));
    }

    @Test
    void invalidRepositoryUrlIsRejectedBeforeSubmit() throws Exception {
        String jwt = jwtService.generateToken(participant, Set.of());

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/my/submission/draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://evil.com/repo"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("INVALID_REPOSITORY_URL"));
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/my/submission")
                        .param("eventId", String.valueOf(event.getId())))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }
}

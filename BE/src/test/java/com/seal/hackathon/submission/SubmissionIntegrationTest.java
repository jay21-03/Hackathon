package com.seal.hackathon.submission;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
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
import com.seal.hackathon.submission.service.SubmissionService;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
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
    TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Autowired
    SubmissionService submissionService;

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
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
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
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].teamId").value(team.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].status").value("SUBMITTED"));
    }

    @Test
    void listSubmissionsByRoundDoesNotLeakPreviousRoundRepository() throws Exception {
        Board roundOneBoard = boardRepository.findAll().get(0);
        Problem roundOneProblem = problemRepository.findByBoardId(roundOneBoard.getId()).get(0);
        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(team.getId())
                .problemId(roundOneProblem.getId())
                .roundId(roundOneBoard.getRoundId())
                .boardId(roundOneBoard.getId())
                .repositoryUrl("https://github.com/org/round-one-repo")
                .repositoryName("round-one-repo")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(OffsetDateTime.now())
                .provisionStatus(RepositoryProvisionStatus.CREATED)
                .reviewIntervalMinutes(30)
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Round finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Chung kết")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .startAt(OffsetDateTime.now().plusHours(3))
                .endAt(OffsetDateTime.now().plusHours(4))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Board finalsBoard = boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Bảng A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build());

        problemRepository.save(Problem.builder()
                .boardId(finalsBoard.getId())
                .title("Đề chung kết")
                .description("Mô tả")
                .releaseAt(OffsetDateTime.now().minusHours(1))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        String orgJwt = jwtService.generateToken(participant, Set.of("ORGANIZER", "PARTICIPANT"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/submissions")
                        .param("roundId", String.valueOf(finalsRound.getId()))
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].teamId").value(team.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].status").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].repositoryUrl").isEmpty());
    }

    @Test
    void listSubmissionsDedupesTeamAcrossRounds() throws Exception {
        Round finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Chung kết")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .startAt(OffsetDateTime.now().plusHours(3))
                .endAt(OffsetDateTime.now().plusHours(4))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Board finalsBoard = boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Bảng A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build());

        String orgJwt = jwtService.generateToken(participant, Set.of("ORGANIZER", "PARTICIPANT"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/submissions")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].teamId").value(team.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].boardName").value("Bảng A"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].slotNumber").value(1));
    }

    @Test
    void participantCanSubmitSeparateRepositoryForFinalRoundProblem() throws Exception {
        String jwt = jwtService.generateToken(participant, Set.of());
        Board groupBoard = boardRepository.findAll().get(0);
        Problem groupProblem = problemRepository.findByBoardId(groupBoard.getId()).get(0);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/my/submission/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://github.com/org/group-repo",
                                "repositoryName", "group-repo"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("SUBMITTED"));

        Round groupRound = roundRepository.findById(groupBoard.getRoundId()).orElseThrow();
        groupRound.setStartAt(OffsetDateTime.now().minusHours(4));
        groupRound.setEndAt(OffsetDateTime.now().minusHours(3));
        roundRepository.save(groupRound);

        Round finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Final")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .startAt(OffsetDateTime.now().minusMinutes(10))
                .endAt(OffsetDateTime.now().plusHours(4))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Board finalsBoard = boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Final Board")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardSlotRepository.save(BoardSlot.builder()
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        Problem finalsProblem = problemRepository.save(Problem.builder()
                .boardId(finalsBoard.getId())
                .title("Final problem")
                .description("Final description")
                .releaseAt(OffsetDateTime.now().minusMinutes(5))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/my/submission/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://github.com/org/final-repo",
                                "repositoryName", "final-repo"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.repositoryUrl").value("https://github.com/org/final-repo"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("SUBMITTED"));

        var groupRepository = teamRepositoryEntityRepository
                .findByTeamIdAndProblemId(team.getId(), groupProblem.getId())
                .orElseThrow();
        var finalRepository = teamRepositoryEntityRepository
                .findByTeamIdAndProblemId(team.getId(), finalsProblem.getId())
                .orElseThrow();

        assertThat(groupRepository.getId()).isNotEqualTo(finalRepository.getId());
        assertThat(groupRepository.getRoundId()).isEqualTo(groupRound.getId());
        assertThat(groupRepository.getRepositoryUrl()).isEqualTo("https://github.com/org/group-repo");
        assertThat(finalRepository.getRoundId()).isEqualTo(finalsRound.getId());
        assertThat(finalRepository.getBoardId()).isEqualTo(finalsBoard.getId());
        assertThat(finalRepository.getRepositoryUrl()).isEqualTo("https://github.com/org/final-repo");
    }

    @Test
    void autoFinalizeOnlyUsesRepositoryForClosedProblem() {
        Board groupBoard = boardRepository.findAll().get(0);
        Problem groupProblem = problemRepository.findByBoardId(groupBoard.getId()).get(0);
        Round groupRound = roundRepository.findById(groupBoard.getRoundId()).orElseThrow();
        groupProblem.setCloseAt(OffsetDateTime.now().minusMinutes(5));
        problemRepository.save(groupProblem);

        Round finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Final")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .startAt(OffsetDateTime.now().plusHours(3))
                .endAt(OffsetDateTime.now().plusHours(4))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        Board finalsBoard = boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Final Board")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        boardSlotRepository.save(BoardSlot.builder()
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .teamNumber(1)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .build());
        Problem finalsProblem = problemRepository.save(Problem.builder()
                .boardId(finalsBoard.getId())
                .title("Final problem")
                .description("Final description")
                .releaseAt(OffsetDateTime.now().minusMinutes(5))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(team.getId())
                .roundId(groupRound.getId())
                .boardId(groupBoard.getId())
                .problemId(groupProblem.getId())
                .repositoryUrl("https://github.com/org/group-repo")
                .repositoryName("group-repo")
                .status(SubmissionStatus.DRAFT)
                .provisionStatus(RepositoryProvisionStatus.CREATED)
                .reviewIntervalMinutes(30)
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(team.getId())
                .roundId(finalsRound.getId())
                .boardId(finalsBoard.getId())
                .problemId(finalsProblem.getId())
                .repositoryUrl("https://github.com/org/final-repo")
                .repositoryName("final-repo")
                .status(SubmissionStatus.DRAFT)
                .provisionStatus(RepositoryProvisionStatus.CREATED)
                .reviewIntervalMinutes(30)
                .createdBy(participant.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        assertThat(submissionService.finalizeSubmissionsForClosedProblems()).isEqualTo(1);

        var groupRepository = teamRepositoryEntityRepository
                .findByTeamIdAndProblemId(team.getId(), groupProblem.getId())
                .orElseThrow();
        var finalRepository = teamRepositoryEntityRepository
                .findByTeamIdAndProblemId(team.getId(), finalsProblem.getId())
                .orElseThrow();
        assertThat(groupRepository.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
        assertThat(finalRepository.getStatus()).isEqualTo(SubmissionStatus.DRAFT);
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

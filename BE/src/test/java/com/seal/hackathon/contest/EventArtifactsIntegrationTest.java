package com.seal.hackathon.contest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
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
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
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
class EventArtifactsIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_artifacts_test")
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
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    Event event;
    Team submittedTeam;
    Team draftTeam;
    Round round;
    Board board;
    Problem problem;

    @BeforeEach
    void setUp() throws Exception {
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

        organizer = userRepository.save(User.builder()
                .email("organizer-artifacts@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(organizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());

        participant = userRepository.save(User.builder()
                .email("participant-artifacts@example.com")
                .fullName("Participant")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(participant.getId())
                .role(SystemRole.PARTICIPANT)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("ArtifactsTestEvent")
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

        submittedTeam = saveTeam("Đội Submitted", 1);
        draftTeam = saveTeam("Đội Draft", 2);

        problem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề thi")
                .description("Mô tả")
                .releaseAt(OffsetDateTime.now().minusHours(1))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(submittedTeam.getId())
                .roundId(round.getId())
                .boardId(board.getId())
                .problemId(problem.getId())
                .repositoryUrl("https://github.com/seal-org/repo-submitted")
                .repositoryName("repo-submitted")
                .githubOwner("seal-org")
                .githubRepoName("repo-submitted")
                .accessStatus(RepositoryAccessStatus.OPEN)
                .provisionStatus(RepositoryProvisionStatus.CREATED)
                .provisionedAt(OffsetDateTime.now())
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(draftTeam.getId())
                .roundId(round.getId())
                .boardId(board.getId())
                .problemId(problem.getId())
                .repositoryUrl(null)
                .accessStatus(RepositoryAccessStatus.FAILED)
                .provisionStatus(RepositoryProvisionStatus.FAILED)
                .lastError("GitHub username invalid for team member")
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    private Team saveTeam(String name, int slotNumber) throws Exception {
        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name(name)
                .contactEmail(name.toLowerCase().replace(" ", "") + "@example.com")
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
                .teamNumber(slotNumber)
                .teamId(team.getId())
                .assignedAt(OffsetDateTime.now())
                .assignedBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        String jwt = jwtService.generateToken(participant, Set.of());

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/my/submission/draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + jwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventId", event.getId(),
                                "repositoryUrl", "https://github.com/org/" + name.replace(" ", "-").toLowerCase()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        if ("Đội Submitted".equals(name)) {
            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/my/submission/submit")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Authorization", "Bearer " + jwt)
                            .content(objectMapper.writeValueAsString(Map.of("eventId", event.getId()))))
                    .andExpect(MockMvcResultMatchers.status().isOk());
        }

        return team;
    }

    @Test
    void artifactsSummaryAggregatesSubmissionsAndRepositories() throws Exception {
        String organizerJwt = jwtService.generateToken(organizer, Set.of(SystemRole.ORGANIZER.name()));

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get(
                        "/api/v1/admin/events/{eventId}/artifacts-summary", event.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");

        assertThat(data.path("submissions").path("totalTeams").asLong()).isEqualTo(2);
        assertThat(data.path("submissions").path("submittedCount").asLong()).isEqualTo(1);
        assertThat(data.path("submissions").path("draftCount").asLong()).isEqualTo(1);

        assertThat(data.path("repositories").path("total").asLong()).isEqualTo(2);
        assertThat(data.path("repositories").path("open").asLong()).isEqualTo(1);
        assertThat(data.path("repositories").path("failed").asLong()).isEqualTo(1);
        assertThat(data.path("repositories").path("created").asLong()).isEqualTo(1);
        assertThat(data.path("repositories").path("githubIssueCount").asLong()).isEqualTo(1);
    }
}

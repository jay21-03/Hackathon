package com.seal.hackathon.assignment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
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
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
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
class StaffInvitationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.invitation.token-secret", () -> "integration-invite-secret-which-is-long-enough");
        registry.add("app.outbox.poll-delay-ms", () -> "60000");
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
    StaffInvitationRepository staffInvitationRepository;

    @Autowired
    MentorAssignmentRepository mentorAssignmentRepository;

    @Autowired
    JudgeAssignmentRepository judgeAssignmentRepository;

    @Autowired
    OutboxMessageRepository outboxMessageRepository;

    @Autowired
    RankingResultRepository rankingResultRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    NotificationRepository notificationRepository;

    User organizer;
    User guestJudge;
    Event event;
    Board board;
    Round round;

    @BeforeEach
    void setUp() {
        outboxMessageRepository.deleteAll();
        notificationRepository.deleteAll();
        staffInvitationRepository.deleteAll();
        mentorAssignmentRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        rankingResultRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        OffsetDateTime now = OffsetDateTime.now();
        organizer = userRepository.save(User.builder()
                .email("org@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(organizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(now)
                .build());

        guestJudge = userRepository.save(User.builder()
                .email("guest.judge@gmail.com")
                .fullName("Guest Judge")
                .githubUsername("guest-judge")
                .status(UserStatus.PENDING_APPROVAL)
                .profileCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        event = eventRepository.save(Event.builder()
                .name("StaffInviteEvent")
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
                .name("Final")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .startAt(now.plusHours(1))
                .endAt(now.plusHours(2))
                .status(RoundStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build());

        board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Board A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Test
    void acceptJudgeInvitationActivatesPendingGuestAccount() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        String guestJwt = jwtService.generateToken(guestJudge, Set.of());

        String createPayload = objectMapper.writeValueAsString(Map.of(
                "email", guestJudge.getEmail(),
                "role", "JUDGE"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/boards/" + board.getId() + "/staff-invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(createPayload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.email").value(guestJudge.getEmail()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.role").value("JUDGE"));

        String inviteToken = extractLatestStaffInviteToken(guestJudge.getEmail());
        String acceptPayload = objectMapper.writeValueAsString(Map.of("token", inviteToken));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/staff-invitations/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + guestJwt)
                        .content(acceptPayload))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.role").value("JUDGE"));

        User activated = userRepository.findById(guestJudge.getId()).orElseThrow();
        assertThat(activated.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(userRoleRepository.existsByUserIdAndRole(guestJudge.getId(), SystemRole.JUDGE)).isTrue();
        assertThat(judgeAssignmentRepository.findByBoardIdAndJudgeId(board.getId(), guestJudge.getId()))
                .isPresent();
    }

    @Test
    void createStaffInvitationBlockedWhenBoardHasRanking() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        Team rankedTeam = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Ranked Team Create")
                .contactEmail("ranked-create@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        rankingResultRepository.save(RankingResult.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamId(rankedTeam.getId())
                .rank(1)
                .averageScore(BigDecimal.valueOf(90.0))
                .calculatedAt(OffsetDateTime.now())
                .publishedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/boards/" + board.getId() + "/staff-invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", guestJudge.getEmail(),
                                "role", "JUDGE"))))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("STAFF_INVITATION_BOARD_LOCKED"));
    }

    @Test
    void resendStaffInvitationBlockedWhenBoardHasRanking() throws Exception {
        String orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        MvcResult createResult = mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/boards/" + board.getId() + "/staff-invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", guestJudge.getEmail(),
                                "role", "JUDGE"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        long invitationId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asLong();

        Team rankedTeam = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Ranked Team")
                .contactEmail("ranked@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        rankingResultRepository.save(RankingResult.builder()
                .roundId(round.getId())
                .boardId(board.getId())
                .teamId(rankedTeam.getId())
                .rank(1)
                .averageScore(BigDecimal.valueOf(90.0))
                .calculatedAt(OffsetDateTime.now())
                .publishedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/staff-invitations/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of("staffInvitationId", invitationId))))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("STAFF_INVITATION_BOARD_LOCKED"));
    }

    private String extractLatestStaffInviteToken(String email) throws Exception {
        List<OutboxMessage> messages = outboxMessageRepository.findAll();
        OutboxMessage invitationMessage = messages.stream()
                .filter(message -> "StaffInvitationSent".equals(message.getEventType()))
                .max(Comparator.comparing(OutboxMessage::getCreatedAt))
                .orElseThrow();

        JsonNode payload = objectMapper.readTree(invitationMessage.getPayload());
        assertThat(payload.path("email").asText().equalsIgnoreCase(email)).isTrue();
        return payload.path("inviteToken").asText();
    }
}

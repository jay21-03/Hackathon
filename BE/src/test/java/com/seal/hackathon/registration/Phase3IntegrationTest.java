package com.seal.hackathon.registration;

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
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
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
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
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
class Phase3IntegrationTest {

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
    TeamRepository teamRepository;

    @Autowired
    TeamMemberRepository teamMemberRepository;

    @Autowired
    RoundRepository roundRepository;

    @Autowired
    BoardRepository boardRepository;

    @Autowired
    BoardSlotRepository boardSlotRepository;

    @Autowired
    TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Autowired
    OutboxMessageRepository outboxMessageRepository;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User creator;
    User invitee;
    User organizer;
    Event event;

    @BeforeEach
    void setUp() {
        outboxMessageRepository.deleteAll();
        dataCleaner.clearNotifications();
        teamRepositoryEntityRepository.deleteAll();
        boardSlotRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        creator = userRepository.save(User.builder()
                .email("creator@example.com")
                .fullName("Creator User")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        invitee = userRepository.save(User.builder()
                .email("invitee@example.com")
                .fullName("Invitee User")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        organizer = userRepository.save(User.builder()
                .email("organizer@example.com")
                .fullName("Organizer User")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(organizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("Hackathon 2026")
                .description("Phase 3 integration test")
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
    }

    @Test
    void registerConfirmAndListTeamsFlowWorksEndToEnd() throws Exception {
        String creatorJwt = jwtService.generateToken(creator, Set.of("PARTICIPANT"));
        String inviteeJwt = jwtService.generateToken(invitee, Set.of("PARTICIPANT"));
        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        String registerPayload = """
                {
                  "name": "Alpha Team",
                  "members": [
                    {"email": "creator@example.com", "fullName": "Creator User", "studentId": "S001", "university": "SEAL University"},
                    {"email": "invitee@example.com", "fullName": "Invitee User", "studentId": "S002", "university": "SEAL University"}
                  ]
                }
                """;

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/{eventId}/teams", event.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .header("Idempotency-Key", "phase3-register-1")
                        .content(registerPayload))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.name").value("Alpha Team"))
                .andReturn();

        JsonNode registerBody = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        Long teamId = registerBody.path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/teams/{teamId}", teamId)
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value(teamId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.name").value("Alpha Team"));

        InvitationSnapshot initialInvitation = extractLatestInvitation(teamId);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content("{" + "\"teamMemberId\":" + initialInvitation.teamMemberId() + "}"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.PENDING.name()));

        InvitationSnapshot resentInvitation = extractLatestInvitation(teamId);
        assertThat(resentInvitation.teamMemberId()).isEqualTo(initialInvitation.teamMemberId());
        assertThat(resentInvitation.token()).isNotEqualTo(initialInvitation.token());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + inviteeJwt)
                        .content("{" + "\"token\":\"" + initialInvitation.token() + "\"}"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Invalid invitation token"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .content("{" + "\"token\":\"" + resentInvitation.token() + "\"}"))
                .andExpect(MockMvcResultMatchers.status().isForbidden())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Invitation does not belong to current user"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + inviteeJwt)
                        .content("{" + "\"token\":\"" + resentInvitation.token() + "\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.PENDING.name()));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + inviteeJwt)
                        .content("{" + "\"token\":\"" + resentInvitation.token() + "\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.PENDING.name()));

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/v1/teams/{teamId}/status", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content("{" + "\"status\":\"CONFIRMED\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.team.status").value(TeamStatus.CONFIRMED.name()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/teams/{teamId}", teamId)
                        .header("Authorization", "Bearer " + inviteeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.CONFIRMED.name()));

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/v1/teams/{teamId}/status", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content("{" + "\"status\":\"DISQUALIFIED\",\"reason\":\"Organizer removed team\"}"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.team.status").value(TeamStatus.DISQUALIFIED.name()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.team.rejectedReason").value("Organizer removed team"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.competitionCleanupApplied").value(true));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/my/teams")
                        .param("eventId", String.valueOf(event.getId()))
                        .header("Authorization", "Bearer " + inviteeJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].status").value(TeamStatus.DISQUALIFIED.name()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events/{eventId}/teams", event.getId())
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].status").value(TeamStatus.DISQUALIFIED.name()));

        assertThat(teamRepository.findById(teamId)).isPresent();
    }

    @Test
    void captainCanInviteAdditionalMembersAfterRegistration() throws Exception {
        String creatorJwt = jwtService.generateToken(creator, Set.of("PARTICIPANT"));
        String inviteeJwt = jwtService.generateToken(invitee, Set.of("PARTICIPANT"));

        String registerPayload = """
                {
                  "name": "Solo Then Grow",
                  "members": [
                    {"email": "creator@example.com", "fullName": "Creator User", "studentId": "S001", "university": "SEAL University"}
                  ]
                }
                """;

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/{eventId}/teams", event.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .header("Idempotency-Key", "phase3-register-solo")
                        .content(registerPayload))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();

        Long teamId = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/teams/{teamId}/members", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + inviteeJwt)
                        .content("""
                                {"member":{"email":"invitee@example.com","fullName":"Invitee User"}}
                                """))
                .andExpect(MockMvcResultMatchers.status().isForbidden());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/teams/{teamId}/members", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .content("""
                                {"member":{"email":"invitee@example.com","fullName":"Invitee User"}}
                                """))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.members.length()").value(2))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.PENDING.name()));

        assertThat(extractLatestInvitation(teamId).teamMemberId()).isPositive();
    }

    @Test
    void captainCanCancelPendingInvitation() throws Exception {
        String creatorJwt = jwtService.generateToken(creator, Set.of());
        String registerPayload = """
                {
                  "name": "Cancel Invite Team",
                  "members": [
                    {"email": "creator@example.com", "fullName": "Creator User", "studentId": "S001", "university": "SEAL University"}
                  ]
                }
                """;

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/{eventId}/teams", event.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .header("Idempotency-Key", "phase3-register-cancel")
                        .content(registerPayload))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();

        Long teamId = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/teams/{teamId}/members", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .content("""
                                {"member":{"email":"invitee@example.com","fullName":"Invitee User"}}
                                """))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.members.length()").value(2));

        Long memberId = extractLatestInvitation(teamId).teamMemberId();

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/teams/{teamId}/members/{memberId}", teamId, memberId)
                        .header("Authorization", "Bearer " + creatorJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.members.length()").value(1));
    }

    @Test
    void organizerCanListPendingTeamInvitationsWithoutEmailFilter() throws Exception {
        String creatorJwt = jwtService.generateToken(creator, Set.of("PARTICIPANT"));
        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/{eventId}/teams", event.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + creatorJwt)
                        .header("Idempotency-Key", "phase3-register-invite-list")
                        .content("""
                                {
                                  "name": "Invite List Team",
                                  "members": [
                                    {"email": "creator@example.com", "fullName": "Creator User", "studentId": "S001", "university": "SEAL University"},
                                    {"email": "invitee@example.com", "fullName": "Invitee User", "studentId": "S002", "university": "SEAL University"}
                                  ]
                                }
                                """))
                .andExpect(MockMvcResultMatchers.status().isCreated());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events/{eventId}/team-invitations", event.getId())
                        .param("status", "INVITED")
                        .param("page", "0")
                        .param("size", "25")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].email").value("invitee@example.com"));
    }

    @Test
    void resendInvitationBlockedWhenTeamAssignedToBoard() throws Exception {
        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Locked Assignment Team")
                .contactEmail(creator.getEmail())
                .contactUserId(creator.getId())
                .status(TeamStatus.PENDING)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        TeamMember pendingMember = teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(team.getId())
                .userId(invitee.getId())
                .email(invitee.getEmail())
                .fullName(invitee.getFullName())
                .contactPerson(false)
                .status(TeamMemberStatus.INVITED)
                .invitedAt(OffsetDateTime.now())
                .build());

        Round round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        Board board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
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

        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content("{" + "\"teamMemberId\":" + pendingMember.getId() + "}"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("TEAM_ROSTER_LOCKED_AFTER_ASSIGNMENT"));
    }

    @Test
    void resendInvitationBlockedWhenTeamHasRepository() throws Exception {
        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Locked Repo Team")
                .contactEmail(creator.getEmail())
                .contactUserId(creator.getId())
                .status(TeamStatus.PENDING)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        TeamMember pendingMember = teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(team.getId())
                .userId(invitee.getId())
                .email(invitee.getEmail())
                .fullName(invitee.getFullName())
                .contactPerson(false)
                .status(TeamMemberStatus.INVITED)
                .invitedAt(OffsetDateTime.now())
                .build());

        Round round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        Board board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        teamRepositoryEntityRepository.save(com.seal.hackathon.aireview.entity.TeamRepository.builder()
                .teamId(team.getId())
                .roundId(round.getId())
                .boardId(board.getId())
                .repositoryUrl("https://github.com/org/locked-repo-team")
                .repositoryName("locked-repo-team")
                .reviewIntervalMinutes(60)
                .createdBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        String organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/team-invitations/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + organizerJwt)
                        .content("{" + "\"teamMemberId\":" + pendingMember.getId() + "}"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("TEAM_ROSTER_LOCKED_AFTER_OPERATION"));
    }

        private InvitationSnapshot extractLatestInvitation(Long teamId) throws Exception {
                List<OutboxMessage> messages = outboxMessageRepository.findAll();
                OutboxMessage invitationMessage = messages.stream()
                                .filter(message -> "InvitationSent".equals(message.getEventType()))
                                .filter(message -> message.getAggregateId() != null)
                                .filter(message -> {
                                        try {
                                                JsonNode payload = objectMapper.readTree(message.getPayload());
                                                return payload.path("teamId").asLong() == teamId;
                                        } catch (Exception ex) {
                                                return false;
                                        }
                                })
                                .max(Comparator.comparing(OutboxMessage::getCreatedAt))
                                .orElseThrow();

                JsonNode payload = objectMapper.readTree(invitationMessage.getPayload());
                assertThat(payload.path("teamId").asLong()).isEqualTo(teamId);
                return new InvitationSnapshot(payload.path("teamMemberId").asLong(), payload.path("inviteToken").asText());
        }

        private record InvitationSnapshot(Long teamMemberId, String token) {
        }
}

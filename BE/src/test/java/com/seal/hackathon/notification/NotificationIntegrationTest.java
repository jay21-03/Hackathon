package com.seal.hackathon.notification;

import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class NotificationIntegrationTest {

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
    TeamRepository teamRepository;

    @Autowired
    TeamMemberRepository teamMemberRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    NotificationService notificationService;

    @Autowired
    IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    Event event;
    Team team;

    @BeforeEach
    void setUp() {
        dataCleaner.clearEventMessaging();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        OffsetDateTime now = OffsetDateTime.now();
        organizer = userRepository.save(User.builder()
                .email("org-notif@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .profileCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(organizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(now)
                .build());

        participant = userRepository.save(User.builder()
                .email("participant-notif@example.com")
                .fullName("Participant")
                .status(UserStatus.ACTIVE)
                .profileCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        event = eventRepository.save(Event.builder()
                .name("Notification Test Event")
                .status(EventStatus.REGISTRATION_OPEN)
                .maxTeams(50)
                .minTeamSize(1)
                .maxTeamSize(5)
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository)).build());

        team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Alpha")
                .contactEmail(participant.getEmail())
                .contactUserId(participant.getId())
                .status(TeamStatus.CONFIRMED)
                .createdAt(now)
                .updatedAt(now)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .teamId(team.getId())
                .eventId(event.getId())
                .userId(participant.getId())
                .email(participant.getEmail())
                .fullName(participant.getFullName())
                .status(TeamMemberStatus.CONFIRMED)
                .contactPerson(true)
                .build());
    }

    @Test
    void organizerCreatesAnnouncementAndParticipantSeesNotification() throws Exception {
        String orgToken = bearerToken(organizer);
        String participantToken = "Bearer " + jwtService.generateToken(participant, Set.of("PARTICIPANT"));

        String body = """
                {"title":"Thong bao test","content":"Noi dung thong bao chung","publishNow":true}
                """;

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/announcements")
                        .header("Authorization", orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.title").value("Thong bao test"));

        MvcResult listResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications")
                        .header("Authorization", participantToken))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.unreadCount").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].type").value("ANNOUNCEMENT"))
                .andReturn();

        JsonNode items = objectMapper.readTree(listResult.getResponse().getContentAsString())
                .path("data")
                .path("items");
        long notificationId = items.get(0).path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/me/notifications/" + notificationId + "/read")
                        .header("Authorization", participantToken))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.read").value(true));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications/unread-count")
                        .header("Authorization", participantToken))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").value(0));
    }

    @Test
    void backfillInSameTransactionAsNewUser_linksPendingNotifications() {
        OffsetDateTime now = OffsetDateTime.now();
        String email = "first-google@fpt.edu.vn";
        notificationRepository.save(com.seal.hackathon.notification.entity.Notification.builder()
                .email(email)
                .eventId(event.getId())
                .notificationType(NotificationType.GENERAL)
                .title("Invite before signup")
                .content("Please login")
                .isRead(false)
                .createdAt(now)
                .build());

        User newUser = userRepository.save(User.builder()
                .email(email)
                .googleSub("google-sub-first-login")
                .fullName("New Google User")
                .status(UserStatus.ACTIVE)
                .profileCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build());
        userRepository.flush();

        int updated = notificationService.backfillUserIdOnLogin(newUser.getId(), newUser.getEmail());
        assertThat(updated).isEqualTo(1);
        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(newUser.getId())).hasSize(1);
    }

    @Test
    void backfillLinksEmailOnlyNotificationsOnLogin() {
        notificationRepository.save(com.seal.hackathon.notification.entity.Notification.builder()
                .email(participant.getEmail())
                .eventId(event.getId())
                .notificationType(NotificationType.GENERAL)
                .title("Legacy")
                .content("Before login")
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build());

        assertThat(notificationRepository.findByEmailIgnoreCaseOrderByCreatedAtDesc(participant.getEmail()))
                .allMatch(row -> row.getUserId() == null);

        notificationService.backfillUserIdOnLogin(participant.getId(), participant.getEmail());

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(participant.getId()))
                .hasSize(1)
                .allMatch(row -> participant.getId().equals(row.getUserId()));
    }

    @Test
    void listNotificationsCanFilterByType() throws Exception {
        String participantToken = "Bearer " + jwtService.generateToken(participant, Set.of("PARTICIPANT"));

        notificationRepository.save(com.seal.hackathon.notification.entity.Notification.builder()
                .userId(participant.getId())
                .email(participant.getEmail())
                .eventId(event.getId())
                .notificationType(NotificationType.TEAM_STATUS)
                .title("Team update")
                .content("Status changed")
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build());

        String orgToken = bearerToken(organizer);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/announcements")
                        .header("Authorization", orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Filter test","content":"Announcement body","publishNow":true}
                                """))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications")
                        .header("Authorization", participantToken)
                        .param("type", "ANNOUNCEMENT"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].type").value("ANNOUNCEMENT"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications")
                        .header("Authorization", participantToken)
                        .param("type", "TEAM_STATUS"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].type").value("TEAM_STATUS"));
    }

    @Test
    void announcementAudienceParticipantsOnly() throws Exception {
        String orgToken = bearerToken(organizer);
        String participantToken = "Bearer " + jwtService.generateToken(participant, Set.of("PARTICIPANT"));

        User judge = userRepository.save(User.builder()
                .email("judge-notif@example.com")
                .fullName("Judge")
                .status(UserStatus.ACTIVE)
                .profileCompleted(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(judge.getId())
                .role(SystemRole.JUDGE)
                .createdAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/announcements")
                        .header("Authorization", orgToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Participants only","content":"For teams","publishNow":true,"audience":"PARTICIPANTS"}
                                """))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications")
                        .header("Authorization", participantToken))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(1));

        String judgeToken = "Bearer " + jwtService.generateToken(judge, Set.of("JUDGE"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/me/notifications")
                        .header("Authorization", judgeToken))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.total").value(0));
    }

    private String bearerToken(User user) {
        Set<SystemRole> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(UserRole::getRole)
                .collect(java.util.stream.Collectors.toSet());
        Set<String> roleNames = roles.stream().map(Enum::name).collect(java.util.stream.Collectors.toSet());
        return "Bearer " + jwtService.generateToken(user, roleNames);
    }
}

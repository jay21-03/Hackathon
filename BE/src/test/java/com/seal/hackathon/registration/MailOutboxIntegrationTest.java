package com.seal.hackathon.registration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
class MailOutboxIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_mail_outbox_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.invitation.token-secret", () -> "integration-invite-secret-which-is-long-enough");
        registry.add("app.outbox.poll-delay-ms", () -> "60000");
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired EventRepository eventRepository;
    @Autowired AcademicTermRepository academicTermRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired OutboxMessageRepository outboxMessageRepository;
    @Autowired IntegrationTestDataCleaner dataCleaner;

    User captain;
    User invitee;
    Event event;

    @BeforeEach
    void setUp() {
        outboxMessageRepository.deleteAll();
        dataCleaner.clearNotifications();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        captain = userRepository.save(User.builder()
                .email("captain-mail@example.com")
                .fullName("Captain Mail")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        invitee = userRepository.save(User.builder()
                .email("invitee-mail@example.com")
                .fullName("Invitee Mail")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("Mail Outbox Event")
                .startDate(LocalDate.now().plusDays(3))
                .endDate(LocalDate.now().plusDays(4))
                .registrationStartAt(OffsetDateTime.now().minusDays(1))
                .registrationEndAt(OffsetDateTime.now().plusDays(2))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.REGISTRATION_OPEN)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void memberInvite_persistsInvitationSentOutboxMessage() throws Exception {
        String captainJwt = jwtService.generateToken(captain, Set.of("PARTICIPANT"));

        MvcResult registerResult = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/events/{eventId}/teams", event.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + captainJwt)
                        .header("Idempotency-Key", "mail-outbox-register")
                        .content("""
                                {
                                  "name": "Mail Team",
                                  "members": [
                                    {"email": "captain-mail@example.com", "fullName": "Captain Mail", "studentId": "S001", "university": "SEAL U"}
                                  ]
                                }
                                """))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andReturn();

        Long teamId = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/teams/{teamId}/members", teamId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + captainJwt)
                        .content("""
                                {"member":{"email":"invitee-mail@example.com","fullName":"Invitee Mail"}}
                                """))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value(TeamStatus.PENDING.name()));

        List<OutboxMessage> messages = outboxMessageRepository.findAll();
        OutboxMessage invitation = messages.stream()
                .filter(message -> "InvitationSent".equals(message.getEventType()))
                .findFirst()
                .orElseThrow();

        JsonNode payload = objectMapper.readTree(invitation.getPayload());
        assertThat(payload.path("teamId").asLong()).isEqualTo(teamId);
        assertThat(payload.path("email").asText()).isEqualTo("invitee-mail@example.com");
        assertThat(invitation.getProcessed()).isFalse();
    }
}

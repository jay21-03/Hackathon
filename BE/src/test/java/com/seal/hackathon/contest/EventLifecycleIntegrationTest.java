package com.seal.hackathon.contest;

import static org.assertj.core.api.Assertions.assertThat;

import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.service.EventLifecycleService;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestDataCleaner;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class EventLifecycleIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_lifecycle_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.event.lifecycle.scheduler-enabled", () -> "false");
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    EventLifecycleService eventLifecycleService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    JwtService jwtService;

    @Autowired
    AcademicTermRepository academicTermRepository;

    @Autowired
    IntegrationTestDataCleaner integrationTestDataCleaner;

    String organizerJwt;
    Event event;

    @BeforeEach
    void setUp() {
        integrationTestDataCleaner.clearEventMessaging();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        User organizer = userRepository.save(User.builder()
                .email("lifecycle-organizer@example.com")
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
        organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        OffsetDateTime now = OffsetDateTime.now();
        event = eventRepository.save(Event.builder()
                .name("Lifecycle Event")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .registrationStartAt(now.minusHours(2))
                .registrationEndAt(now.plusHours(2))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Test
    void manualLifecycleTransitions() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/open-registration")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("REGISTRATION_OPEN"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/close-registration")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("REGISTRATION_CLOSED"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/start-competition")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("IN_PROGRESS"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/complete-competition")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    void schedulerAutoOpensAndClosesRegistration() {
        OffsetDateTime now = OffsetDateTime.now();
        event.setRegistrationStartAt(now.minusMinutes(5));
        event.setRegistrationEndAt(now.plusHours(2));
        eventRepository.save(event);

        int openTick = eventLifecycleService.runScheduledTransitions();
        assertThat(openTick).isEqualTo(1);
        assertThat(eventRepository.findById(event.getId()).orElseThrow().getStatus())
                .isEqualTo(EventStatus.REGISTRATION_OPEN);

        Event openEvent = eventRepository.findById(event.getId()).orElseThrow();
        openEvent.setRegistrationEndAt(now.minusMinutes(1));
        eventRepository.save(openEvent);

        int closeTick = eventLifecycleService.runScheduledTransitions();
        assertThat(closeTick).isEqualTo(1);
        assertThat(eventRepository.findById(event.getId()).orElseThrow().getStatus())
                .isEqualTo(EventStatus.REGISTRATION_CLOSED);
    }

    @Test
    void schedulerAutoStartsAndCompletesCompetition() {
        LocalDate today = LocalDate.now();
        event.setStatus(EventStatus.REGISTRATION_CLOSED);
        event.setStartDate(today);
        event.setEndDate(today.plusDays(2));
        eventRepository.save(event);

        int startTick = eventLifecycleService.runScheduledTransitions();
        assertThat(startTick).isEqualTo(1);
        assertThat(eventRepository.findById(event.getId()).orElseThrow().getStatus())
                .isEqualTo(EventStatus.IN_PROGRESS);

        Event running = eventRepository.findById(event.getId()).orElseThrow();
        running.setStartDate(today.minusDays(3));
        running.setEndDate(today.minusDays(1));
        eventRepository.save(running);

        int completeTick = eventLifecycleService.runScheduledTransitions();
        assertThat(completeTick).isEqualTo(1);
        assertThat(eventRepository.findById(event.getId()).orElseThrow().getStatus())
                .isEqualTo(EventStatus.COMPLETED);
    }
}

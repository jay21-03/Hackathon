package com.seal.hackathon.award;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.award.repository.AwardCategoryRepository;
import com.seal.hackathon.award.repository.TeamAwardRepository;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.common.enums.TeamMemberStatus;
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
class AwardIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_award_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired EventRepository eventRepository;
    @Autowired AcademicTermRepository academicTermRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired AwardCategoryRepository awardCategoryRepository;
    @Autowired TeamAwardRepository teamAwardRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired IntegrationTestDataCleaner dataCleaner;

    User organizer;
    User participant;
    Event event;
    Team teamAlpha;
    Team teamBeta;
    String orgJwt;
    String participantJwt;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        teamAwardRepository.deleteAll();
        awardCategoryRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        dataCleaner.clearNotifications();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        organizer = userRepository.save(User.builder()
                .email("org-award@example.com")
                .fullName("Organizer")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        participant = userRepository.save(User.builder()
                .email("participant-award@example.com")
                .fullName("Participant")
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
                .userId(participant.getId())
                .role(SystemRole.PARTICIPANT)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("Award Event")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
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

        teamAlpha = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Alpha")
                .contactEmail("alpha@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        teamBeta = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Beta")
                .contactEmail("beta@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(teamAlpha.getId())
                .userId(participant.getId())
                .email(participant.getEmail())
                .fullName(participant.getFullName())
                .contactPerson(true)
                .status(TeamMemberStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .invitedAt(OffsetDateTime.now())
                .build());

        orgJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
        participantJwt = jwtService.generateToken(participant, Set.of("PARTICIPANT"));
    }

    @Test
    void awardLifecycle_createAssignPublishPublic() throws Exception {
        MvcResult categoryResult = mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/award-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Giải nhất",
                                "code", "FIRST_PRIZE",
                                "awardType", "RANK",
                                "rankOrder", 1,
                                "maxWinners", 1))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        JsonNode categoryJson = objectMapper.readTree(categoryResult.getResponse().getContentAsString());
        long categoryId = categoryJson.path("data").path("id").asLong();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/awards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "awardCategoryId", categoryId,
                                "teamId", teamAlpha.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/awards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "awardCategoryId", categoryId,
                                "teamId", teamAlpha.getId()))))
                .andExpect(MockMvcResultMatchers.status().isConflict());

        MvcResult publicBefore = mockMvc.perform(
                        MockMvcRequestBuilders.get("/api/v1/events/" + event.getId() + "/awards"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        JsonNode publicBeforeJson = objectMapper.readTree(publicBefore.getResponse().getContentAsString());
        assertThat(publicBeforeJson.path("data").path("published").asBoolean()).isFalse();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/awards/publish")
                        .header("Authorization", "Bearer " + orgJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        MvcResult publicAfter = mockMvc.perform(
                        MockMvcRequestBuilders.get("/api/v1/events/" + event.getId() + "/awards"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        JsonNode publicAfterJson = objectMapper.readTree(publicAfter.getResponse().getContentAsString());
        assertThat(publicAfterJson.path("data").path("published").asBoolean()).isTrue();
        assertThat(publicAfterJson.path("data").path("categories").get(0).path("winners").size())
                .isEqualTo(1);
        assertThat(notificationRepository.count()).isGreaterThan(0);
    }

    @Test
    void participantCannotManageAwards() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/award-categories")
                        .header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void maxWinnersEnforced() throws Exception {
        MvcResult categoryResult = mockMvc.perform(MockMvcRequestBuilders.post(
                                "/api/v1/admin/events/" + event.getId() + "/award-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Khuyến khích",
                                "code", "ENCOURAGEMENT",
                                "awardType", "CUSTOM",
                                "maxWinners", 1))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
        long categoryId = objectMapper
                .readTree(categoryResult.getResponse().getContentAsString())
                .path("data")
                .path("id")
                .asLong();

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/awards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "awardCategoryId", categoryId,
                                "teamId", teamAlpha.getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/awards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + orgJwt)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "awardCategoryId", categoryId,
                                "teamId", teamBeta.getId()))))
                .andExpect(MockMvcResultMatchers.status().isConflict());
    }
}

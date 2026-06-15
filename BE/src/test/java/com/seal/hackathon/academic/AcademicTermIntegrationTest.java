package com.seal.hackathon.academic;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
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
class AcademicTermIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_term_test")
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
    AcademicTermRepository academicTermRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    TeamMemberRepository teamMemberRepository;

    @Autowired
    RoundRepository roundRepository;

    @Autowired
    BoardRepository boardRepository;

    @Autowired
    MentorAssignmentRepository mentorAssignmentRepository;

    @Autowired
    JudgeAssignmentRepository judgeAssignmentRepository;

    String organizerJwt;
    AcademicTerm springTerm;

    @BeforeEach
    void setUp() {
        mentorAssignmentRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        academicTermRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        User organizer = userRepository.save(User.builder()
                .email("organizer-term@example.com")
                .fullName("Organizer Term")
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
        springTerm = academicTermRepository.save(AcademicTerm.builder()
                .code("SPRING_2026")
                .name("Spring 2026")
                .year(2026)
                .termType(AcademicTermType.SPRING)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 5, 31))
                .status(AcademicTermStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Test
    void createTerm_listTerms_and_filterEvents() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/academic-terms/" + springTerm.getId())
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ARCHIVED"))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/academic-terms")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "code", "FALL_2026",
                                "name", "Fall 2026",
                                "year", 2026,
                                "termType", "FALL",
                                "startDate", "2026-09-01",
                                "endDate", "2026-12-31",
                                "status", "ACTIVE"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.code").value("FALL_2026"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(2));

        MvcResult createEvent = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Hackathon Fall",
                                "startDate", "2026-10-10",
                                "endDate", "2026-10-12",
                                "registrationStartAt", "2026-09-10T08:00:00+07:00",
                                "registrationEndAt", "2026-10-01T23:59:00+07:00",
                                "maxTeams", 20,
                                "academicTermId", academicTermRepository.findByCode("FALL_2026").orElseThrow().getId()))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        JsonNode eventNode = objectMapper.readTree(createEvent.getResponse().getContentAsString());
        Long fallTermId = academicTermRepository.findByCode("FALL_2026").orElseThrow().getId();

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/events")
                        .param("academicTermId", String.valueOf(fallTermId)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].academicTermCode").value("FALL_2026"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + fallTermId + "/events")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void createEvent_requiresActiveTerm() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "No Term Event",
                                "startDate", "2026-06-01",
                                "endDate", "2026-06-02",
                                "registrationStartAt", "2026-05-25T08:00:00+07:00",
                                "registrationEndAt", "2026-05-31T23:59:00+07:00",
                                "maxTeams", 10))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void dashboard_returnsTermAggregates() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/dashboard")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.academicTerm.code").value("SPRING_2026"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.eventCount").exists());
    }

    @Test
    void onlyOneActiveTermAllowed() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/academic-terms")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "code", "FALL_2026",
                                "name", "Fall 2026",
                                "year", 2026,
                                "termType", "FALL",
                                "startDate", "2026-09-01",
                                "endDate", "2026-12-31",
                                "status", "ACTIVE"))))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("ACADEMIC_TERM_ACTIVE_EXISTS"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms")
                        .param("status", "ARCHIVED")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(0));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/academic-terms/" + springTerm.getId())
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ARCHIVED"))))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms")
                        .param("status", "ARCHIVED")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.length()").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].status").value("ARCHIVED"));
    }

    @Test
    void archiveTerm_preservesEvents() throws Exception {
        eventRepository.save(Event.builder()
                .name("Spring Event")
                .startDate(LocalDate.of(2026, 3, 1))
                .endDate(LocalDate.of(2026, 3, 2))
                .registrationStartAt(OffsetDateTime.now().minusDays(10))
                .registrationEndAt(OffsetDateTime.now().plusDays(10))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(springTerm.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/academic-terms/" + springTerm.getId())
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ARCHIVED"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.status").value("ARCHIVED"));

        assertThat(eventRepository.findAll()).hasSize(1);
    }

    @Test
    void termScopedLists_supportPagination() throws Exception {
        Event event = eventRepository.save(Event.builder()
                .name("Spring Event")
                .startDate(LocalDate.of(2026, 3, 1))
                .endDate(LocalDate.of(2026, 3, 2))
                .registrationStartAt(OffsetDateTime.now().minusDays(10))
                .registrationEndAt(OffsetDateTime.now().plusDays(10))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(springTerm.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team Alpha")
                .contactEmail("alpha@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(team.getId())
                .email("alpha@example.com")
                .fullName("Alpha User")
                .contactPerson(true)
                .status(TeamMemberStatus.CONFIRMED)
                .confirmedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/participants")
                        .param("page", "0")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.page").value(0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].fullName").value("Alpha User"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/mentors")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(0));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/judges")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void termScopedMentorsAndJudges_listAssignedStaff() throws Exception {
        User mentor = userRepository.save(User.builder()
                .email("mentor-term@example.com")
                .fullName("Mentor Term")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(mentor.getId())
                .role(SystemRole.MENTOR)
                .createdAt(OffsetDateTime.now())
                .build());

        User judge = userRepository.save(User.builder()
                .email("judge-term@example.com")
                .fullName("Judge Term")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(judge.getId())
                .role(SystemRole.JUDGE)
                .createdAt(OffsetDateTime.now())
                .build());

        Event event = eventRepository.save(Event.builder()
                .name("Term Staff Event")
                .startDate(LocalDate.of(2026, 3, 1))
                .endDate(LocalDate.of(2026, 3, 2))
                .registrationStartAt(OffsetDateTime.now().minusDays(10))
                .registrationEndAt(OffsetDateTime.now().plusDays(10))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(springTerm.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
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

        mentorAssignmentRepository.save(MentorAssignment.builder()
                .boardId(board.getId())
                .mentorId(mentor.getId())
                .createdAt(OffsetDateTime.now())
                .createdBy(userRepository.findByEmail("organizer-term@example.com").orElseThrow().getId())
                .build());

        judgeAssignmentRepository.save(JudgeAssignment.builder()
                .boardId(board.getId())
                .judgeId(judge.getId())
                .createdAt(OffsetDateTime.now())
                .createdBy(userRepository.findByEmail("organizer-term@example.com").orElseThrow().getId())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/mentors")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].email").value("mentor-term@example.com"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/academic-terms/" + springTerm.getId() + "/judges")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].email").value("judge-term@example.com"));

        mockMvc.perform(MockMvcRequestBuilders.get(
                        "/api/v1/admin/academic-terms/" + springTerm.getId() + "/judges/candidates")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.totalElements").value(1))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.items[0].email").value("judge-term@example.com"));
    }
}

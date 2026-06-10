package com.seal.hackathon.contest;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.seal.hackathon.support.IntegrationTestConfig;
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ContestTimelineValidationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_timeline_test")
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
    AcademicTermRepository academicTermRepository;

    String organizerJwt;
    Event event;
    Round round;
    Board board;

    @BeforeEach
    void setUp() {
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        User organizer = userRepository.save(User.builder()
                .email("timeline-organizer@example.com")
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

        event = eventRepository.save(Event.builder()
                .name("Timeline Event")
                .startDate(LocalDate.of(2026, 6, 10))
                .endDate(LocalDate.of(2026, 6, 12))
                .registrationStartAt(OffsetDateTime.parse("2026-06-01T08:00:00+07:00"))
                .registrationEndAt(OffsetDateTime.parse("2026-06-09T23:59:00+07:00"))
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
                .startAt(OffsetDateTime.parse("2026-06-10T08:00:00+07:00"))
                .endAt(OffsetDateTime.parse("2026-06-11T18:00:00+07:00"))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Test
    void createEvent_rejectsRegistrationEndAfterEventEnd() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Bad Event",
                                "startDate", "2026-06-10",
                                "endDate", "2026-06-12",
                                "registrationStartAt", "2026-06-01T08:00:00+07:00",
                                "registrationEndAt", "2026-06-15T23:59:00+07:00",
                                "maxTeams", 10,
                                "academicTermId",
                                        IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository)))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void createRound_rejectsTimelineOutsideEvent() throws Exception {
        String body = """
                {
                  "name": "Vòng ngoài",
                  "roundType": "GROUP_STAGE",
                  "roundOrder": 2,
                  "startAt": "2026-06-09T08:00:00+07:00",
                  "endAt": "2026-06-11T18:00:00+07:00"
                }
                """;
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/rounds")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message")
                        .value("round startAt must be on or after event startDate"));
    }

    @Test
    void createEvent_rejectsDatesOutsideAcademicTerm() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Out of term",
                                "startDate", "2026-06-10",
                                "endDate", "2026-06-12",
                                "registrationStartAt", "2026-06-01T08:00:00+07:00",
                                "registrationEndAt", "2026-06-09T23:59:00+07:00",
                                "maxTeams", 10,
                                "academicTermId",
                                        IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository)))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(
                        "event dates must be within academic term startDate and endDate"));
    }

    @Test
    void createRound_rejectsOverlappingTimeline() throws Exception {
        String body = """
                {
                  "name": "Vòng chồng",
                  "roundType": "GROUP_STAGE",
                  "roundOrder": 2,
                  "startAt": "2026-06-10T10:00:00+07:00",
                  "endAt": "2026-06-11T12:00:00+07:00"
                }
                """;
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/events/" + event.getId() + "/rounds")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(org.hamcrest.Matchers.containsString(
                        "round timeline overlaps")));
    }

    @Test
    void createProblem_rejectsWindowOutsideRound() throws Exception {
        String body = """
                {
                  "title": "Đề ngoài vòng",
                  "releaseAt": "2026-06-09T08:00:00+07:00",
                  "closeAt": "2026-06-11T10:00:00+07:00"
                }
                """;
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admin/boards/" + board.getId() + "/problems")
                        .header("Authorization", "Bearer " + organizerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.message")
                        .value("releaseAt must be on or after round startAt"));
    }
}

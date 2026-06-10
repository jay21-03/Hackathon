package com.seal.hackathon.phase7;

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
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
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
class Phase7IntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_phase7_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired EventRepository eventRepository;
    @Autowired AcademicTermRepository academicTermRepository;
    @Autowired RoundRepository roundRepository;
    @Autowired BoardRepository boardRepository;
    @Autowired BoardSlotRepository boardSlotRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    User participant;
    User organizer;
    Event event;
    Round round;
    Board board;
    Team team;
    String organizerJwt;

    @BeforeEach
    void setUp() {
        teamRepositoryEntityRepository.deleteAll();
        boardSlotRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        boardRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        organizer = userRepository.save(User.builder()
                .email("org-phase7@example.com")
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
                .email("part-phase7@example.com")
                .fullName("Participant")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("Phase7 Event")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .registrationStartAt(OffsetDateTime.now())
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

        round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
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

        team = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Team P7")
                .contactEmail(participant.getEmail())
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
                .assignedBy(organizer.getId())
                .createdAt(OffsetDateTime.now())
                .build());

        organizerJwt = jwtService.generateToken(organizer, Set.of("ORGANIZER"));
    }

    @Test
    void advancement_previewReturnsEmptyWhenNoRankings() throws Exception {
        Round finalsRound = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Chung kết")
                .roundType(RoundType.FINAL)
                .roundOrder(2)
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        boardRepository.save(Board.builder()
                .roundId(finalsRound.getId())
                .name("Bảng CK")
                .boardOrder(1)
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/admin/events/" + event.getId() + "/advancements/preview")
                        .param("fromRoundId", String.valueOf(round.getId()))
                        .param("toRoundId", String.valueOf(finalsRound.getId()))
                        .param("topNPerBoard", "2")
                        .header("Authorization", "Bearer " + organizerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.candidates").isArray())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.candidates.length()").value(0));
    }
}

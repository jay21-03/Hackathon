package com.seal.hackathon.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.service.WaitlistPromotionService;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.time.OffsetDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class WaitlistPromotionIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_waitlist_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @Autowired
    WaitlistPromotionService waitlistPromotionService;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    TeamMemberRepository teamMemberRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    JwtService jwtService;

    @Autowired
    AcademicTermRepository academicTermRepository;

    Event event;
    Team confirmedTeam;
    Team waitlistTeam;

    @BeforeEach
    void setUp() {
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        User organizer = userRepository.save(User.builder()
                .email("waitlist-organizer@example.com")
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
        jwtService.generateToken(organizer, Set.of("ORGANIZER"));

        OffsetDateTime now = OffsetDateTime.now();
        event = eventRepository.save(Event.builder()
                .name("Waitlist Event")
                .maxTeams(1)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.REGISTRATION_CLOSED)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdBy(organizer.getId())
                .createdAt(now)
                .updatedAt(now)
                .build());

        confirmedTeam = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Confirmed Team")
                .contactEmail("confirmed@example.com")
                .status(TeamStatus.CONFIRMED)
                .confirmedAt(now)
                .createdAt(now.minusHours(2))
                .updatedAt(now)
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(confirmedTeam.getId())
                .email("confirmed@example.com")
                .fullName("Captain")
                .status(TeamMemberStatus.CONFIRMED)
                .contactPerson(true)
                .confirmedAt(now)
                .build());

        waitlistTeam = teamRepository.save(Team.builder()
                .eventId(event.getId())
                .name("Waitlist Team")
                .contactEmail("waitlist@example.com")
                .status(TeamStatus.WAITLIST)
                .createdAt(now.minusHours(1))
                .updatedAt(now)
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .eventId(event.getId())
                .teamId(waitlistTeam.getId())
                .email("waitlist@example.com")
                .fullName("Wait Captain")
                .status(TeamMemberStatus.CONFIRMED)
                .contactPerson(true)
                .confirmedAt(now)
                .build());
    }

    @Test
    void promotesOldestWaitlistTeamWhenConfirmedSlotFrees() {
        confirmedTeam.setStatus(TeamStatus.DISQUALIFIED);
        confirmedTeam.setRejectedReason("Removed");
        teamRepository.save(confirmedTeam);

        int promoted = waitlistPromotionService.promoteWaitlistIfSlotsAvailable(event.getId());
        assertThat(promoted).isEqualTo(1);

        Team updated = teamRepository.findById(waitlistTeam.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(TeamStatus.CONFIRMED);
        assertThat(updated.getConfirmedAt()).isNotNull();
    }
}

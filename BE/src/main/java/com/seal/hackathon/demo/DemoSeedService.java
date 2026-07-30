package com.seal.hackathon.demo;

import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.aireview.entity.RepoCommit;
import com.seal.hackathon.aireview.repository.AiReviewRepository;
import com.seal.hackathon.aireview.repository.RepoCommitRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.award.entity.AwardCategory;
import com.seal.hackathon.award.entity.TeamAward;
import com.seal.hackathon.award.enums.AwardType;
import com.seal.hackathon.award.repository.AwardCategoryRepository;
import com.seal.hackathon.award.repository.TeamAwardRepository;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import com.seal.hackathon.common.enums.AiReviewKind;
import com.seal.hackathon.common.enums.AiReviewStatus;
import com.seal.hackathon.common.enums.AnnouncementAudience;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.common.enums.StudentType;
import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.demo.dto.DemoRegistrationSeedResponse;
import com.seal.hackathon.demo.dto.HistoricalDemoSeedResponse;
import com.seal.hackathon.demo.entity.DemoSeedRun;
import com.seal.hackathon.demo.repository.DemoSeedRunRepository;
import com.seal.hackathon.notification.entity.Announcement;
import com.seal.hackathon.notification.entity.Notification;
import com.seal.hackathon.notification.repository.AnnouncementRepository;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.ranking.entity.Advancement;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.AdvancementRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.entity.ScoreItem;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DemoSeedService {
    private static final String SUMMER_2026 = "SUMMER_2026";

    private final DemoSeedProperties properties;
    private final DemoSeedRunRepository demoSeedRunRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final PasswordEncoder passwordEncoder;
    private final AcademicTermRepository academicTermRepository;
    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final RepoCommitRepository repoCommitRepository;
    private final RankingResultRepository rankingResultRepository;
    private final AdvancementRepository advancementRepository;
    private final AwardCategoryRepository awardCategoryRepository;
    private final TeamAwardRepository teamAwardRepository;
    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final AiReviewRepository aiReviewRepository;

    @Transactional
    public HistoricalDemoSeedResponse seedHistoricalData() {
        CurrentUserPrincipal organizer = requireOrganizer();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        Counts counts = new Counts();
        AcademicTerm fall = ensureTerm("FALL_2025", AcademicTermType.FALL, 2025,
                LocalDate.parse("2025-09-01"), LocalDate.parse("2025-12-31"),
                AcademicTermStatus.ARCHIVED, counts, now);
        AcademicTerm spring = ensureTerm("SPRING_2026", AcademicTermType.SPRING, 2026,
                LocalDate.parse("2026-01-01"), LocalDate.parse("2026-04-30"),
                AcademicTermStatus.ARCHIVED, counts, now);
        ensureTerm(SUMMER_2026, AcademicTermType.SUMMER, 2026,
                LocalDate.parse("2026-05-01"), LocalDate.parse("2026-08-31"),
                AcademicTermStatus.ACTIVE, counts, now);

        seedHistoricalEvent(fall, "SEAL Fall Hackathon 2025", LocalDate.parse("2025-10-10"), counts, organizer, now);
        seedHistoricalEvent(fall, "SEAL Smart Campus Challenge 2025", LocalDate.parse("2025-11-14"), counts, organizer, now);
        seedHistoricalEvent(spring, "SEAL Spring Innovation Challenge 2026", LocalDate.parse("2026-02-20"), counts, organizer, now);
        seedHistoricalEvent(spring, "SEAL AI and Cloud Hackathon 2026", LocalDate.parse("2026-03-20"), counts, organizer, now);
        remember("historical-data", "HISTORICAL", null, organizer.getUserId(), now, "{}");
        return HistoricalDemoSeedResponse.builder()
                .termsCreated(counts.termsCreated)
                .termsReused(counts.termsReused)
                .eventsCreated(counts.eventsCreated)
                .eventsReused(counts.eventsReused)
                .teamsCreated(counts.teamsCreated)
                .usersCreated(counts.usersCreated)
                .usersReused(counts.usersReused)
                .scoreSheetsCreated(counts.scoreSheetsCreated)
                .rankingResultsCreated(counts.rankingResultsCreated)
                .awardsCreated(counts.awardsCreated)
                .warnings(counts.warnings)
                .build();
    }

    @Transactional
    public DemoRegistrationSeedResponse seedRegistrations(Long eventId) {
        CurrentUserPrincipal organizer = requireOrganizer();
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        AcademicTerm term = academicTermRepository.findById(event.getAcademicTermId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ACADEMIC_TERM_NOT_FOUND"));
        if (!SUMMER_2026.equals(term.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DEMO_REGISTRATION_REQUIRES_SUMMER_2026");
        }
        if (event.getStatus() != EventStatus.REGISTRATION_OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DEMO_REQUIRES_REGISTRATION_OPEN");
        }

        Counts counts = new Counts();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        int createdRegular = 0;
        int createdSolo = 0;
        int skipped = 0;

        for (int teamNo = 1; teamNo <= 14; teamNo++) {
            String teamName = "Demo Team %02d".formatted(teamNo);
            int memberCount = 3 + ((teamNo - 1) % 3);
            SeedTeamResult result = ensureSeedTeam(eventId, teamName, teamNo, memberCount, counts, organizer.getUserId(), now);
            if (result.created()) createdRegular++; else skipped++;
        }
        List<SoloSeed> solos = List.of(
                new SoloSeed("se184678lamthanhphuc@gmail.com", "phuclt01", "PhucLT Solo 01", "Lam Thanh Phuc"),
                new SoloSeed("phucthanhlam03@gmail.com", "phuclt02", "PhucLT Solo 02", "Phuc Thanh Lam 03"),
                new SoloSeed("phucthanhlam02@gmail.com", "phuclt03", "PhucLT Solo 03", "Phuc Thanh Lam 02"),
                new SoloSeed("phucthanhlam04@gmail.com", "phuclt04", "PhucLT Solo 04", "Phuc Thanh Lam 04"),
                new SoloSeed("phucthanhlam05@gmail.com", "phuclt05", "PhucLT Solo 05", "Phuc Thanh Lam 05"),
                new SoloSeed("dathtse183241@fpt.edu.vn", "jay21-03", "Jay Solo 06", "Dat Hoang"));
        int soloIndex = 15;
        for (SoloSeed solo : solos) {
            SeedTeamResult result = ensureSoloTeam(eventId, solo, soloIndex++, counts, organizer.getUserId(), now);
            if (result.created()) createdSolo++; else skipped++;
        }

        int totalTeams = teamRepository.findByEventId(eventId).size();
        int syntheticTeams = demoSeedRunRepository.findBySeedTypeAndScopeId("REGISTRATION_TEAM", eventId).size();
        int realTeams = Math.max(totalTeams - syntheticTeams, 0);
        if (!Objects.equals(event.getMaxTeams(), 20)) {
            counts.warnings.add("EVENT_QUOTA_NOT_20");
        }
        remember("registration:event:" + eventId, "REGISTRATION", eventId, organizer.getUserId(), now,
                "{\"syntheticTeams\":" + syntheticTeams + "}");
        return DemoRegistrationSeedResponse.builder()
                .eventId(eventId)
                .existingRealTeamCount(realTeams)
                .regularTeamsCreated(createdRegular)
                .singleMemberTeamsCreated(createdSolo)
                .teamsSkipped(skipped)
                .usersCreated(counts.usersCreated)
                .usersReused(counts.usersReused)
                .membersCreated(counts.membersCreated)
                .totalTeamsAfterSeed(totalTeams)
                .eventQuota(event.getMaxTeams())
                .expectedConfirmedAfterApproval(Math.min(totalTeams, event.getMaxTeams() == null ? 0 : event.getMaxTeams()))
                .expectedWaitlistAfterApproval(Math.max(totalTeams - (event.getMaxTeams() == null ? 0 : event.getMaxTeams()), 0))
                .warnings(counts.warnings)
                .build();
    }

    private void seedHistoricalEvent(
            AcademicTerm term, String eventName, LocalDate startDate, Counts counts,
            CurrentUserPrincipal organizer, OffsetDateTime now) {
        Event event = findEvent(term.getId(), eventName).orElse(null);
        if (event == null) {
            event = eventRepository.save(Event.builder()
                    .name(eventName)
                    .description("Demo historical event")
                    .rules("Demo rules")
                    .startDate(startDate)
                    .endDate(startDate.plusDays(2))
                    .registrationStartAt(startDate.minusDays(20).atStartOfDay().atOffset(ZoneOffset.UTC))
                    .registrationEndAt(startDate.minusDays(2).atTime(23, 0).atOffset(ZoneOffset.UTC))
                    .maxTeams(8)
                    .minTeamSize(1)
                    .maxTeamSize(5)
                    .status(EventStatus.COMPLETED)
                    .academicTermId(term.getId())
                    .createdBy(organizer.getUserId())
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            counts.eventsCreated++;
        } else {
            counts.eventsReused++;
        }
        List<Team> teams = ensureHistoricalTeams(event, counts, now);
        Round group = ensureRound(event, "Round 1 - Group Stage", RoundType.GROUP_STAGE, 1,
                startDate.atTime(9, 0).atOffset(ZoneOffset.UTC),
                startDate.atTime(18, 0).atOffset(ZoneOffset.UTC), now);
        Round fin = ensureRound(event, "Round 2 - Final", RoundType.FINAL, 2,
                startDate.plusDays(1).atTime(9, 0).atOffset(ZoneOffset.UTC),
                startDate.plusDays(1).atTime(18, 0).atOffset(ZoneOffset.UTC), now);
        group.setStatus(RoundStatus.COMPLETED);
        fin.setStatus(RoundStatus.COMPLETED);
        roundRepository.save(group);
        roundRepository.save(fin);
        List<Board> groupBoards = List.of(
                ensureBoard(group, "Board A", 1, now),
                ensureBoard(group, "Board B", 2, now));
        Board finalBoard = ensureBoard(fin, "Final Board", 1, now);
        for (Board board : groupBoards) {
            ensureBoardStaff(group, board, organizer.getUserId(), counts, now);
            ensureProblem(board, organizer.getUserId(), now);
        }
        ensureBoardStaff(fin, finalBoard, organizer.getUserId(), counts, now);
        ensureProblem(finalBoard, organizer.getUserId(), now);
        ensureRubric(group, now);
        ensureRubric(fin, now);
        assignTeams(groupBoards.get(0), teams.subList(0, 4), organizer.getUserId(), now);
        assignTeams(groupBoards.get(1), teams.subList(4, 8), organizer.getUserId(), now);
        for (Board board : groupBoards) {
            ensureScoringData(event, group, board, counts, organizer.getUserId(), now);
            publishRanking(board, group, counts, now);
        }
        List<Team> finalists = rankingResultRepository.findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(group.getId())
                .stream()
                .filter(r -> r.getRank() <= 2)
                .map(r -> teamRepository.findById(r.getTeamId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
        assignTeams(finalBoard, finalists, organizer.getUserId(), now);
        ensureAdvancements(group, fin, finalBoard, organizer.getUserId(), now);
        ensureScoringData(event, fin, finalBoard, counts, organizer.getUserId(), now);
        publishRanking(finalBoard, fin, counts, now);
        ensureAwards(event, fin, finalBoard, counts, organizer.getUserId(), now);
        ensureAnnouncement(event, organizer.getUserId(), now);
        remember("historical:event:" + eventName, "HISTORICAL_EVENT", event.getId(), organizer.getUserId(), now,
                "{\"eventId\":" + event.getId() + "}");
    }

    private AcademicTerm ensureTerm(
            String code, AcademicTermType type, int year, LocalDate start, LocalDate end,
            AcademicTermStatus status, Counts counts, OffsetDateTime now) {
        Optional<AcademicTerm> existing = academicTermRepository.findByCode(code);
        if (existing.isPresent()) {
            counts.termsReused++;
            return existing.get();
        }
        if (status == AcademicTermStatus.ACTIVE) {
            academicTermRepository.findByStatusOrderByYearDescTermTypeAsc(AcademicTermStatus.ACTIVE)
                    .forEach(term -> {
                        term.setStatus(AcademicTermStatus.ARCHIVED);
                        term.setUpdatedAt(now);
                        academicTermRepository.save(term);
                    });
        }
        counts.termsCreated++;
        return academicTermRepository.save(AcademicTerm.builder()
                .code(code)
                .name(code)
                .year(year)
                .termType(type)
                .startDate(start)
                .endDate(end)
                .status(status)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private SeedTeamResult ensureSeedTeam(
            Long eventId, String teamName, int teamNo, int memberCount, Counts counts, Long organizerId, OffsetDateTime now) {
        if (teamRepository.existsByEventIdAndNameIgnoreCase(eventId, teamName)) {
            return new SeedTeamResult(false);
        }
        List<User> users = new ArrayList<>();
        for (int memberNo = 1; memberNo <= memberCount; memberNo++) {
            String email = "demo.su26.e%d.t%02d.m%02d@seal.local".formatted(eventId, teamNo, memberNo);
            String github = "seal-demo-e%d-t%02d-m%02d".formatted(eventId, teamNo, memberNo);
            users.add(ensureParticipant(email, github, "Demo Member %02d-%02d".formatted(teamNo, memberNo),
                    "DEMO%03d%02d".formatted(teamNo, memberNo), false, counts, now));
        }
        createTeamWithMembers(eventId, teamName, teamNo, users, organizerId, now);
        counts.teamsCreated++;
        counts.membersCreated += users.size();
        remember("registration:event:%d:team:%s".formatted(eventId, teamName), "REGISTRATION_TEAM",
                eventId, organizerId, now, "{\"teamName\":\"" + teamName + "\"}");
        return new SeedTeamResult(true);
    }

    private SeedTeamResult ensureSoloTeam(
            Long eventId, SoloSeed solo, int sequence, Counts counts, Long organizerId, OffsetDateTime now) {
        if (teamRepository.existsByEventIdAndNameIgnoreCase(eventId, solo.teamName())) {
            return new SeedTeamResult(false);
        }
        User user = ensureParticipant(solo.email(), solo.githubUsername(), solo.fullName(),
                "SOLO%03d".formatted(sequence), true, counts, now);
        createTeamWithMembers(eventId, solo.teamName(), sequence, List.of(user), organizerId, now);
        counts.teamsCreated++;
        counts.membersCreated++;
        remember("registration:event:%d:team:%s".formatted(eventId, solo.teamName()), "REGISTRATION_TEAM",
                eventId, organizerId, now, "{\"teamName\":\"" + solo.teamName() + "\"}");
        return new SeedTeamResult(true);
    }

    private User ensureParticipant(
            String email, String github, String fullName, String studentId,
            boolean allowDemoOverwrite, Counts counts, OffsetDateTime now) {
        User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT)).orElse(null);
        if (user == null) {
            assertGithubAvailable(email, github);
            user = User.builder()
                    .email(email.toLowerCase(Locale.ROOT))
                    .passwordHash(passwordEncoder.encode(properties.getDefaultPassword()))
                    .fullName(fullName)
                    .githubUsername(github)
                    .profileCompleted(true)
                    .studentId(studentId)
                    .studentType(StudentType.FPT)
                    .university("FPT University")
                    .status(UserStatus.ACTIVE)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            user = userRepository.save(user);
            counts.usersCreated++;
        } else {
            if (allowDemoOverwrite) {
                assertGithubAvailable(email, github);
                user.setGithubUsername(github);
                user.setPasswordHash(passwordEncoder.encode(properties.getDefaultPassword()));
            }
            user.setStatus(UserStatus.ACTIVE);
            user.setProfileCompleted(true);
            user.setStudentType(StudentType.FPT);
            user.setUniversity("FPT University");
            user.setUpdatedAt(now);
            user = userRepository.save(user);
            counts.usersReused++;
        }
        ensureRole(user.getId(), SystemRole.PARTICIPANT, now);
        return user;
    }

    private void createTeamWithMembers(Long eventId, String teamName, int sequence, List<User> users, Long actorId, OffsetDateTime now) {
        User contact = users.get(0);
        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name(teamName)
                .sequenceNo(sequence)
                .contactUserId(contact.getId())
                .contactEmail(contact.getEmail())
                .status(TeamStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build());
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            teamMemberRepository.save(TeamMember.builder()
                    .eventId(eventId)
                    .teamId(team.getId())
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .studentId(user.getStudentId())
                    .university(user.getUniversity())
                    .contactPerson(i == 0)
                    .status(TeamMemberStatus.CONFIRMED)
                    .confirmedAt(now)
                    .resendCount(0)
                    .build());
        }
    }

    private List<Team> ensureHistoricalTeams(Event event, Counts counts, OffsetDateTime now) {
        List<Team> teams = new ArrayList<>();
        for (int teamNo = 1; teamNo <= 8; teamNo++) {
            String teamName = "Historical Demo Team %02d - E%d".formatted(teamNo, event.getId());
            Team team = teamRepository.findByEventId(event.getId()).stream()
                    .filter(t -> t.getName().equalsIgnoreCase(teamName))
                    .findFirst()
                    .orElse(null);
            if (team == null) {
                List<User> users = new ArrayList<>();
                for (int memberNo = 1; memberNo <= 3 + ((teamNo - 1) % 3); memberNo++) {
                    String email = "demo.hist.e%d.t%02d.m%02d@seal.local".formatted(event.getId(), teamNo, memberNo);
                    String github = "seal-demo-h%d-t%02d-m%02d".formatted(event.getId(), teamNo, memberNo);
                    users.add(ensureParticipant(email, github, "Historical Member %02d-%02d".formatted(teamNo, memberNo),
                            "HIST%03d%02d".formatted(teamNo, memberNo), false, counts, now));
                }
                createTeamWithMembers(event.getId(), teamName, teamNo, users, event.getCreatedBy(), now);
                team = teamRepository.findByEventId(event.getId()).stream()
                        .filter(t -> t.getName().equalsIgnoreCase(teamName))
                        .findFirst()
                        .orElseThrow();
                team.setStatus(TeamStatus.CONFIRMED);
                team.setConfirmedAt(now);
                teamRepository.save(team);
                counts.teamsCreated++;
                counts.membersCreated += users.size();
                remember("historical:event:%d:team:%02d".formatted(event.getId(), teamNo), "HISTORICAL_TEAM",
                        event.getId(), event.getCreatedBy(), now, "{\"teamId\":" + team.getId() + "}");
            }
            teams.add(team);
        }
        return teams;
    }

    private Round ensureRound(Event event, String name, RoundType type, int order, OffsetDateTime start, OffsetDateTime end, OffsetDateTime now) {
        return roundRepository.findByEventId(event.getId()).stream()
                .filter(r -> Objects.equals(r.getRoundOrder(), order))
                .findFirst()
                .orElseGet(() -> roundRepository.save(Round.builder()
                        .eventId(event.getId())
                        .name(name)
                        .roundType(type)
                        .roundOrder(order)
                        .startAt(start)
                        .endAt(end)
                        .status(RoundStatus.COMPLETED)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    private Board ensureBoard(Round round, String name, int order, OffsetDateTime now) {
        return boardRepository.findByRoundId(round.getId()).stream()
                .filter(b -> Objects.equals(b.getBoardOrder(), order))
                .findFirst()
                .orElseGet(() -> boardRepository.save(Board.builder()
                        .roundId(round.getId())
                        .name(name)
                        .boardOrder(order)
                        .description("Demo board")
                        .status(BoardStatus.COMPLETED)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    private void ensureBoardStaff(Round round, Board board, Long organizerId, Counts counts, OffsetDateTime now) {
        List<User> judges = ensureDemoJudges(counts, now);
        int offset = board.getBoardOrder() != null && board.getBoardOrder() > 1 ? 3 : 0;
        for (int i = 0; i < 3; i++) {
            User judge = judges.get((offset + i) % judges.size());
            if (!judgeAssignmentRepository.existsByBoardIdAndJudgeId(board.getId(), judge.getId())) {
                judgeAssignmentRepository.save(JudgeAssignment.builder()
                        .boardId(board.getId())
                        .judgeId(judge.getId())
                        .createdBy(organizerId)
                        .createdAt(now)
                        .build());
            }
        }
        User mentor = ensureStaff("demo.mentor%02d@seal.local".formatted(board.getBoardOrder()),
                "seal-demo-mentor%02d".formatted(board.getBoardOrder()), "Demo Mentor " + board.getBoardOrder(),
                SystemRole.MENTOR, false, counts, now);
        if (!mentorAssignmentRepository.existsByBoardIdAndMentorId(board.getId(), mentor.getId())) {
            mentorAssignmentRepository.save(MentorAssignment.builder()
                    .boardId(board.getId())
                    .mentorId(mentor.getId())
                    .createdBy(organizerId)
                    .createdAt(now)
                    .build());
        }
    }

    public List<User> ensureDemoJudges(Counts counts, OffsetDateTime now) {
        List<User> judges = new ArrayList<>();
        judges.add(ensureStaff("phucthanhlam050204@gmail.com", "plt524", "Lam Thanh Phuc", SystemRole.JUDGE, true, counts, now));
        for (int i = 2; i <= 6; i++) {
            judges.add(ensureStaff("demo.judge%02d@seal.local".formatted(i), "seal-demo-judge%02d".formatted(i),
                    "Demo Judge %02d".formatted(i), SystemRole.JUDGE, false, counts, now));
        }
        return judges;
    }

    private User ensureStaff(
            String email, String github, String fullName, SystemRole role, boolean allowOverwrite,
            Counts counts, OffsetDateTime now) {
        User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT)).orElse(null);
        if (user == null) {
            assertGithubAvailable(email, github);
            user = userRepository.save(User.builder()
                    .email(email.toLowerCase(Locale.ROOT))
                    .passwordHash(passwordEncoder.encode(properties.getDefaultPassword()))
                    .fullName(fullName)
                    .githubUsername(github)
                    .profileCompleted(true)
                    .status(UserStatus.ACTIVE)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            counts.usersCreated++;
        } else {
            if (allowOverwrite) {
                assertGithubAvailable(email, github);
                user.setGithubUsername(github);
                user.setPasswordHash(passwordEncoder.encode(properties.getDefaultPassword()));
            }
            user.setStatus(UserStatus.ACTIVE);
            user.setProfileCompleted(true);
            user.setUpdatedAt(now);
            user = userRepository.save(user);
            counts.usersReused++;
        }
        ensureRole(user.getId(), role, now);
        return user;
    }

    private Problem ensureProblem(Board board, Long createdBy, OffsetDateTime now) {
        return problemRepository.findByBoardId(board.getId()).stream()
                .findFirst()
                .orElseGet(() -> problemRepository.save(Problem.builder()
                        .boardId(board.getId())
                        .title("Demo Problem - " + board.getName())
                        .description("Build a demo-ready solution.")
                        .releaseAt(now.minusDays(3))
                        .closeAt(now.minusDays(2))
                        .createdBy(createdBy)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    private void ensureRubric(Round round, OffsetDateTime now) {
        if (!scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId()).isEmpty()) {
            return;
        }
        List<CriterionSeed> criteria = List.of(
                new CriterionSeed("INNOVATION", "Innovation", "25", 1),
                new CriterionSeed("TECHNICAL", "Technical", "35", 2),
                new CriterionSeed("COMPLETENESS", "Completeness", "25", 3),
                new CriterionSeed("PRESENTATION", "Presentation", "15", 4));
        for (CriterionSeed c : criteria) {
            scoreCriteriaRepository.save(ScoreCriteria.builder()
                    .roundId(round.getId())
                    .code(c.code())
                    .name(c.name())
                    .description(c.name())
                    .weight(new BigDecimal(c.weight()))
                    .minScore(BigDecimal.ZERO)
                    .maxScore(BigDecimal.TEN)
                    .sortOrder(c.order())
                    .levelDescriptors(defaultLevels())
                    .createdAt(now)
                    .build());
        }
    }

    private List<LevelDescriptorDto> defaultLevels() {
        return List.of(
                LevelDescriptorDto.builder().level("UNSATISFACTORY").label("Needs work").minScore(BigDecimal.ZERO).maxScore(new BigDecimal("4.99")).description("Below expectation").build(),
                LevelDescriptorDto.builder().level("SATISFACTORY").label("Satisfactory").minScore(new BigDecimal("5.00")).maxScore(new BigDecimal("6.99")).description("Acceptable").build(),
                LevelDescriptorDto.builder().level("GOOD").label("Good").minScore(new BigDecimal("7.00")).maxScore(new BigDecimal("8.49")).description("Strong").build(),
                LevelDescriptorDto.builder().level("EXCELLENT").label("Excellent").minScore(new BigDecimal("8.50")).maxScore(BigDecimal.TEN).description("Excellent").build());
    }

    private void assignTeams(Board board, List<Team> teams, Long actorId, OffsetDateTime now) {
        for (int i = 0; i < teams.size(); i++) {
            int teamNumber = i + 1;
            BoardSlot slot = boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(board.getId()).stream()
                    .filter(s -> Objects.equals(s.getTeamNumber(), teamNumber))
                    .findFirst()
                    .orElseGet(() -> boardSlotRepository.save(BoardSlot.builder()
                            .roundId(board.getRoundId())
                            .boardId(board.getId())
                            .teamNumber(teamNumber)
                            .createdAt(now)
                            .build()));
            if (slot.getTeamId() == null) {
                slot.setTeamId(teams.get(i).getId());
                slot.setAssignedAt(now);
                slot.setAssignedBy(actorId);
                boardSlotRepository.save(slot);
            }
        }
    }

    private void ensureScoringData(Event event, Round round, Board board, Counts counts, Long actorId, OffsetDateTime now) {
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        Problem problem = ensureProblem(board, actorId, now);
        List<JudgeAssignment> judges = judgeAssignmentRepository.findByBoardId(board.getId());
        List<BoardSlot> slots = boardSlotRepository.findByBoardId(board.getId()).stream()
                .filter(s -> s.getTeamId() != null)
                .toList();
        for (BoardSlot slot : slots) {
            com.seal.hackathon.aireview.entity.TeamRepository repo =
                    ensureDemoRepository(event, round, board, problem, slot.getTeamId(), actorId, now);
            ensureCommits(repo, now);
            for (JudgeAssignment judge : judges) {
                ScoreSheet sheet = scoreSheetRepository.findByBoardIdAndTeamIdAndJudgeId(board.getId(), slot.getTeamId(), judge.getJudgeId())
                        .orElseGet(() -> {
                            counts.scoreSheetsCreated++;
                            return scoreSheetRepository.save(ScoreSheet.builder()
                                    .boardId(board.getId())
                                    .teamId(slot.getTeamId())
                                    .judgeId(judge.getJudgeId())
                                    .judgeAssignmentId(judge.getId())
                                    .status(ScoreSheetStatus.DRAFT)
                                    .createdAt(now)
                                    .updatedAt(now)
                                    .build());
                        });
                if (sheet.getStatus() != ScoreSheetStatus.SUBMITTED) {
                    scoreItemRepository.deleteByScoreSheetId(sheet.getId());
                    for (ScoreCriteria criterion : criteria) {
                        scoreItemRepository.save(ScoreItem.builder()
                                .scoreSheetId(sheet.getId())
                                .criteriaId(criterion.getId())
                                .scoreValue(DemoSeedDataFactory.deterministicScore(event.getId(), round.getId(), board.getId(), slot.getTeamId(), judge.getJudgeId(), criterion.getId()))
                                .comment("Demo score for " + criterion.getName())
                                .build());
                    }
                    sheet.setStatus(ScoreSheetStatus.SUBMITTED);
                    sheet.setSubmittedAt(now.minusDays(1));
                    sheet.setGeneralFeedback("Demo auto-score: Phiếu được sinh tự động để hoàn tất quy trình trình diễn.");
                    sheet.setUpdatedAt(now);
                    scoreSheetRepository.save(sheet);
                }
            }
            ensureAiReviews(slot.getTeamId(), repo, round.getId(), now);
        }
    }

    private com.seal.hackathon.aireview.entity.TeamRepository ensureDemoRepository(
            Event event, Round round, Board board, Problem problem, Long teamId, Long actorId, OffsetDateTime now) {
        return teamRepositoryEntityRepository.findByTeamIdAndProblemId(teamId, problem.getId())
                .orElseGet(() -> {
                    String repoName = "event-%d-team-%d-problem-%d".formatted(event.getId(), teamId, problem.getId());
                    return teamRepositoryEntityRepository.save(
                            com.seal.hackathon.aireview.entity.TeamRepository.builder()
                            .teamId(teamId)
                            .roundId(round.getId())
                            .boardId(board.getId())
                            .problemId(problem.getId())
                            .repositoryUrl("https://github.com/seal-demo/" + repoName)
                            .repositoryName(repoName)
                            .githubOwner("seal-demo")
                            .githubRepoName(repoName)
                            .reviewIntervalMinutes(60)
                            .createdBy(actorId)
                            .createdAt(now)
                            .updatedAt(now)
                            .status(SubmissionStatus.SUBMITTED)
                            .submittedAt(now.minusDays(2))
                            .accessStatus(RepositoryAccessStatus.CLOSED)
                            .provisionStatus(RepositoryProvisionStatus.CREATED)
                            .openedAt(now.minusDays(3))
                            .closedAt(now.minusDays(2))
                            .provisionedAt(now.minusDays(3))
                            .lastPushAt(now.minusDays(2))
                            .build());
                });
    }

    private void ensureCommits(com.seal.hackathon.aireview.entity.TeamRepository repo, OffsetDateTime now) {
        for (int i = 1; i <= 2; i++) {
            String sha = DemoSeedDataFactory.demoSha("demo-" + i, repo.getId(), repo.getTeamId(), repo.getProblemId());
            if (repoCommitRepository.findByTeamRepositoryIdAndCommitSha(repo.getId(), sha).isEmpty()) {
                repoCommitRepository.save(RepoCommit.builder()
                        .teamRepositoryId(repo.getId())
                        .commitSha(sha)
                        .authorName("SEAL Demo")
                        .authorEmail("demo@seal.local")
                        .message("Demo commit " + i)
                        .committedAt(now.minusDays(3).plusHours(i))
                        .branch("main")
                        .commitUrl(repo.getRepositoryUrl() + "/commit/" + sha)
                        .source("DEMO")
                        .createdAt(now)
                        .build());
            }
        }
    }

    private void publishRanking(Board board, Round round, Counts counts, OffsetDateTime now) {
        if (rankingResultRepository.existsByBoardId(board.getId())) {
            return;
        }
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        List<TeamScore> scores = new ArrayList<>();
        for (BoardSlot slot : boardSlotRepository.findByBoardId(board.getId())) {
            if (slot.getTeamId() == null) continue;
            List<ScoreSheet> sheets = scoreSheetRepository.findByBoardIdAndTeamId(board.getId(), slot.getTeamId()).stream()
                    .filter(s -> s.getStatus() == ScoreSheetStatus.SUBMITTED)
                    .toList();
            if (sheets.isEmpty()) continue;
            BigDecimal avg = sheets.stream()
                    .map(s -> weightedScore(s, criteria))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(sheets.size()), 2, RoundingMode.HALF_UP);
            scores.add(new TeamScore(slot.getTeamId(), avg));
        }
        scores.sort(Comparator.comparing(TeamScore::score).reversed().thenComparing(TeamScore::teamId));
        int rank = 0;
        BigDecimal previous = null;
        for (int i = 0; i < scores.size(); i++) {
            TeamScore score = scores.get(i);
            if (previous == null || previous.compareTo(score.score()) != 0) {
                rank = i + 1;
                previous = score.score();
            }
            rankingResultRepository.save(RankingResult.builder()
                    .roundId(round.getId())
                    .boardId(board.getId())
                    .teamId(score.teamId())
                    .rank(rank)
                    .averageScore(score.score())
                    .calculatedAt(now)
                    .publishedAt(now)
                    .build());
            counts.rankingResultsCreated++;
        }
    }

    private BigDecimal weightedScore(ScoreSheet sheet, List<ScoreCriteria> criteria) {
        Map<Long, ScoreCriteria> byId = criteria.stream().collect(Collectors.toMap(ScoreCriteria::getId, c -> c));
        BigDecimal sum = BigDecimal.ZERO;
        for (ScoreItem item : scoreItemRepository.findByScoreSheetId(sheet.getId())) {
            ScoreCriteria criterion = byId.get(item.getCriteriaId());
            if (criterion != null) {
                sum = sum.add(item.getScoreValue().multiply(criterion.getWeight()));
            }
        }
        return sum.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);
    }

    private void ensureAdvancements(Round fromRound, Round toRound, Board finalBoard, Long actorId, OffsetDateTime now) {
        for (BoardSlot slot : boardSlotRepository.findByBoardId(finalBoard.getId())) {
            if (slot.getTeamId() == null) continue;
            boolean exists = advancementRepository.findByToRoundIdOrderByCreatedAtDescIdDesc(toRound.getId()).stream()
                    .anyMatch(a -> a.getTeamId().equals(slot.getTeamId()));
            if (exists) continue;
            RankingResult basis = rankingResultRepository.findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(fromRound.getId()).stream()
                    .filter(r -> r.getTeamId().equals(slot.getTeamId()))
                    .findFirst()
                    .orElse(null);
            advancementRepository.save(Advancement.builder()
                    .fromRoundId(fromRound.getId())
                    .fromBoardId(basis != null ? basis.getBoardId() : null)
                    .toRoundId(toRound.getId())
                    .toBoardId(finalBoard.getId())
                    .teamId(slot.getTeamId())
                    .basisRank(basis != null ? basis.getRank() : null)
                    .basisScore(basis != null ? basis.getAverageScore() : null)
                    .createdBy(actorId)
                    .createdAt(now)
                    .build());
        }
    }

    private void ensureAwards(Event event, Round finalRound, Board finalBoard, Counts counts, Long actorId, OffsetDateTime now) {
        List<AwardSeed> seeds = List.of(
                new AwardSeed("FIRST_PRIZE", "First Prize", AwardType.RANK, 1, 1),
                new AwardSeed("SECOND_PRIZE", "Second Prize", AwardType.RANK, 2, 2),
                new AwardSeed("THIRD_PRIZE", "Third Prize", AwardType.RANK, 3, 3),
                new AwardSeed("BEST_INNOVATION", "Best Innovation", AwardType.CUSTOM, null, 4));
        for (AwardSeed seed : seeds) {
            AwardCategory category = awardCategoryRepository.findByEventIdOrderBySortOrderAscIdAsc(event.getId()).stream()
                    .filter(c -> c.getCode().equals(seed.code()))
                    .findFirst()
                    .orElseGet(() -> {
                        counts.awardsCreated++;
                        return awardCategoryRepository.save(AwardCategory.builder()
                                .eventId(event.getId())
                                .roundId(finalRound.getId())
                                .code(seed.code())
                                .name(seed.name())
                                .awardType(seed.type())
                                .rankOrder(seed.rank())
                                .maxWinners(1)
                                .sortOrder(seed.order())
                                .isActive(true)
                                .createdAt(now)
                                .updatedAt(now)
                                .build());
                    });
            Long teamId = rankingResultRepository.findByBoardIdOrderByRankAsc(finalBoard.getId()).stream()
                    .filter(r -> seed.rank() == null || Objects.equals(r.getRank(), seed.rank()))
                    .findFirst()
                    .map(RankingResult::getTeamId)
                    .orElse(null);
            if (teamId != null && !teamAwardRepository.existsByAwardCategoryIdAndTeamId(category.getId(), teamId)) {
                teamAwardRepository.save(TeamAward.builder()
                        .eventId(event.getId())
                        .roundId(finalRound.getId())
                        .awardCategoryId(category.getId())
                        .teamId(teamId)
                        .awardedBy(actorId)
                        .awardedAt(now)
                        .published(true)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());
            }
        }
    }

    private void ensureAnnouncement(Event event, Long actorId, OffsetDateTime now) {
        if (announcementRepository.findByEventIdOrderByPublishedAtDescCreatedAtDesc(event.getId()).isEmpty()) {
            announcementRepository.save(Announcement.builder()
                    .eventId(event.getId())
                    .title("Demo event completed")
                    .content("Historical demo data is available.")
                    .audience(AnnouncementAudience.ALL)
                    .recipientCount(teamMemberRepository.findByTeamIdIn(
                            teamRepository.findByEventId(event.getId()).stream().map(Team::getId).toList()).size())
                    .publishedAt(now)
                    .createdBy(actorId)
                    .createdAt(now)
                    .build());
        }
        String key = "demo-announcement-event-" + event.getId();
        if (!notificationRepository.existsByDedupeKey(key)) {
            notificationRepository.save(Notification.builder()
                    .eventId(event.getId())
                    .title("Demo announcement")
                    .content("Historical demo event seeded.")
                    .notificationType(NotificationType.ANNOUNCEMENT)
                    .dedupeKey(key)
                    .isRead(false)
                    .createdAt(now)
                    .build());
        }
    }

    private void ensureAiReviews(Long teamId, com.seal.hackathon.aireview.entity.TeamRepository repo, Long roundId, OffsetDateTime now) {
        List<RepoCommit> commits = repoCommitRepository.findByTeamRepositoryIdInOrderByCommittedAtDescIdDesc(
                List.of(repo.getId()), org.springframework.data.domain.PageRequest.of(0, 1));
        if (!commits.isEmpty()
                && aiReviewRepository.findByTeamRepositoryIdAndCommitShaAndReviewKind(
                        repo.getId(), commits.get(0).getCommitSha(), AiReviewKind.PER_PUSH).isEmpty()) {
            aiReviewRepository.save(buildAiReview(teamId, repo, roundId, commits.get(0), AiReviewKind.PER_PUSH, now));
        }
        if (aiReviewRepository.findFirstByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
                teamId, AiReviewKind.TEAM_AGGREGATE).isEmpty()) {
            aiReviewRepository.save(buildAiReview(teamId, repo, roundId, commits.isEmpty() ? null : commits.get(0), AiReviewKind.TEAM_AGGREGATE, now));
        }
    }

    private AiReview buildAiReview(
            Long teamId,
            com.seal.hackathon.aireview.entity.TeamRepository repo,
            Long roundId,
            RepoCommit commit,
            AiReviewKind kind,
            OffsetDateTime now) {
        return AiReview.builder()
                .teamId(teamId)
                .teamRepositoryId(repo.getId())
                .roundId(roundId)
                .repoCommitId(commit != null ? commit.getId() : null)
                .commitSha(commit != null ? commit.getCommitSha() : null)
                .reviewKind(kind)
                .status(AiReviewStatus.COMPLETED)
                .reviewScore(new BigDecimal("8.20"))
                .summary("Demo AI review completed.")
                .issues("[]")
                .suggestions("[]")
                .aiModel("demo-offline")
                .structuredOutput("{\"summary\":\"Demo AI review completed\",\"issues\":[],\"suggestions\":[],\"score\":8.2}")
                .reviewedAt(now)
                .createdAt(now)
                .build();
    }

    private Optional<Event> findEvent(Long termId, String name) {
        return eventRepository.findByAcademicTermId(termId, org.springframework.data.domain.Sort.by("id")).stream()
                .filter(e -> e.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    private void assertGithubAvailable(String ownerEmail, String github) {
        if (!StringUtils.hasText(github) || github.length() > 39 || !github.matches("^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "INVALID_DEMO_GITHUB_USERNAME:" + github);
        }
        String normalizedEmail = ownerEmail.toLowerCase(Locale.ROOT);
        boolean used = userRepository.findAll().stream()
                .filter(u -> u.getGithubUsername() != null)
                .anyMatch(u -> u.getGithubUsername().equalsIgnoreCase(github)
                        && !u.getEmail().equalsIgnoreCase(normalizedEmail));
        if (used) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DEMO_GITHUB_USERNAME_CONFLICT:" + github);
        }
    }

    private void ensureRole(Long userId, SystemRole role, OffsetDateTime now) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, role)) {
            userRoleRepository.save(UserRole.builder()
                    .userId(userId)
                    .role(role)
                    .createdAt(now)
                    .build());
        }
    }

    private CurrentUserPrincipal requireOrganizer() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "DEMO_SEED_DISABLED");
        }
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains(SystemRole.ORGANIZER.name())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        return principal;
    }

    private void remember(String seedKey, String seedType, Long scopeId, Long createdBy, OffsetDateTime now, String summary) {
        DemoSeedRun run = demoSeedRunRepository.findBySeedKey(seedKey)
                .orElseGet(() -> DemoSeedRun.builder()
                        .id(UUID.randomUUID().toString())
                        .seedKey(seedKey)
                        .seedType(seedType)
                        .scopeId(scopeId)
                        .createdBy(createdBy)
                        .createdAt(now)
                        .build());
        run.setSummary(summary);
        run.setEntityIds(summary);
        run.setUpdatedAt(now);
        demoSeedRunRepository.save(run);
    }

    private record SoloSeed(String email, String githubUsername, String teamName, String fullName) {}
    private record SeedTeamResult(boolean created) {}
    private record CriterionSeed(String code, String name, String weight, int order) {}
    private record TeamScore(Long teamId, BigDecimal score) {}
    private record AwardSeed(String code, String name, AwardType type, Integer rank, int order) {}

    public static class Counts {
        int termsCreated;
        int termsReused;
        int eventsCreated;
        int eventsReused;
        int teamsCreated;
        int usersCreated;
        int usersReused;
        int membersCreated;
        int scoreSheetsCreated;
        int rankingResultsCreated;
        int awardsCreated;
        List<String> warnings = new ArrayList<>();
    }
}

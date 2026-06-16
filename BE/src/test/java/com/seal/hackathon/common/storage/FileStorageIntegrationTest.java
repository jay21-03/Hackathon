package com.seal.hackathon.common.storage;

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
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.support.IntegrationTestConfig;
import com.seal.hackathon.support.IntegrationTestFixtures;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import com.jayway.jsonpath.JsonPath;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class FileStorageIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_hackathon_file_storage_test")
            .withUsername("postgres")
            .withPassword("postgres");

    private static Path storageDir;

    @BeforeAll
    static void initStorage() throws Exception {
        storageDir = Files.createTempDirectory("seal-file-storage-test");
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        IntegrationTestConfig.registerPostgres(
                registry, postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        registry.add("app.file-storage-path", () -> storageDir.toString());
    }

    @Autowired
    MockMvc mockMvc;

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
    RoundRepository roundRepository;

    @Autowired
    BoardRepository boardRepository;

    @Autowired
    ProblemRepository problemRepository;

    @Autowired
    FileStorageService fileStorageService;

    User owner;
    User participant;
    User foreignOrganizer;
    Event event;
    Board board;
    Problem problem;
    String ownerJwt;
    String participantJwt;
    String foreignJwt;

    @BeforeEach
    void setUp() throws Exception {
        try {
            Files.list(storageDir).forEach(path -> {
                try {
                    if (Files.isDirectory(path)) {
                        deleteRecursively(path);
                    } else {
                        Files.deleteIfExists(path);
                    }
                } catch (Exception ignored) {
                    // best effort cleanup between tests
                }
            });
        } catch (Exception ignored) {
            // best effort cleanup between tests
        }

        String suffix = String.valueOf(System.nanoTime());
        owner = userRepository.save(User.builder()
                .email("owner-files-" + suffix + "@example.com")
                .fullName("Owner")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        participant = userRepository.save(User.builder()
                .email("participant-files-" + suffix + "@example.com")
                .fullName("Participant")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());
        foreignOrganizer = userRepository.save(User.builder()
                .email("foreign-files-" + suffix + "@example.com")
                .fullName("Foreign")
                .status(UserStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        userRoleRepository.save(UserRole.builder()
                .userId(owner.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());
        userRoleRepository.save(UserRole.builder()
                .userId(foreignOrganizer.getId())
                .role(SystemRole.ORGANIZER)
                .createdAt(OffsetDateTime.now())
                .build());

        event = eventRepository.save(Event.builder()
                .name("File Storage Event")
                .description("desc")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(3))
                .registrationStartAt(OffsetDateTime.now())
                .registrationEndAt(OffsetDateTime.now().plusDays(1))
                .maxTeams(10)
                .minTeamSize(1)
                .maxTeamSize(5)
                .status(EventStatus.DRAFT)
                .academicTermId(IntegrationTestFixtures.defaultAcademicTermId(academicTermRepository))
                .createdBy(owner.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        Round round = roundRepository.save(Round.builder()
                .eventId(event.getId())
                .name("Vòng 1")
                .roundType(RoundType.GROUP_STAGE)
                .roundOrder(1)
                .startAt(OffsetDateTime.now().minusHours(2))
                .endAt(OffsetDateTime.now().plusDays(2))
                .status(RoundStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        board = boardRepository.save(Board.builder()
                .roundId(round.getId())
                .name("Bảng A")
                .boardOrder(1)
                .description("")
                .status(BoardStatus.DRAFT)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        problem = problemRepository.save(Problem.builder()
                .boardId(board.getId())
                .title("Đề có file")
                .description("<p>Nội dung</p>")
                .releaseAt(OffsetDateTime.now().minusHours(1))
                .closeAt(OffsetDateTime.now().plusDays(1))
                .createdBy(owner.getId())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build());

        ownerJwt = jwtService.generateToken(owner, Set.of("ORGANIZER"));
        participantJwt = jwtService.generateToken(participant, Set.of());
        foreignJwt = jwtService.generateToken(foreignOrganizer, Set.of("ORGANIZER"));
    }

    @Test
    void organizerCanUploadAndAuthenticatedUserCanDownload() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "de-thi.pdf",
                "application/pdf",
                "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8));

        MvcResult uploadResult = mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/admin/events/" + event.getId() + "/files")
                        .file(file)
                        .header("Authorization", "Bearer " + ownerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.fileName").value("de-thi.pdf"))
                .andReturn();

        String fileUrl = JsonPath.read(uploadResult.getResponse().getContentAsString(), "$.data.url");
        org.junit.jupiter.api.Assertions.assertTrue(fileStorageService.existsByPublicUrl(fileUrl));

        mockMvc.perform(MockMvcRequestBuilders.get(fileUrl).header("Authorization", "Bearer " + participantJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.header().exists("Content-Disposition"));

        mockMvc.perform(MockMvcRequestBuilders.get(fileUrl))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    void foreignOrganizerCannotUploadOrDeleteFiles() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "de-thi.pdf",
                "application/pdf",
                "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/admin/events/" + event.getId() + "/files")
                        .file(file)
                        .header("Authorization", "Bearer " + foreignJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden());

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/admin/events/" + event.getId() + "/files")
                        .param("url", "/api/v1/files/problems/" + event.getId() + "/missing.pdf")
                        .header("Authorization", "Bearer " + foreignJwt))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void organizerCanDeleteUploadedFileAndClearProblemAttachment() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "de-thi.pdf",
                "application/pdf",
                "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8));

        MvcResult uploadResult = mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/admin/events/" + event.getId() + "/files")
                        .file(file)
                        .header("Authorization", "Bearer " + ownerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        String fileUrl = JsonPath.read(uploadResult.getResponse().getContentAsString(), "$.data.url");
        org.junit.jupiter.api.Assertions.assertTrue(fileStorageService.existsByPublicUrl(fileUrl));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/" + problem.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "attachmentUrl": "%s"
                                }
                                """.formatted(fileUrl))
                        .header("Authorization", "Bearer " + ownerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/admin/events/" + event.getId() + "/files")
                        .param("url", fileUrl)
                        .header("Authorization", "Bearer " + ownerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());

        org.junit.jupiter.api.Assertions.assertFalse(fileStorageService.existsByPublicUrl(fileUrl));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/admin/problems/" + problem.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "attachmentUrl": null
                                }
                                """)
                        .header("Authorization", "Bearer " + ownerJwt))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    private static void deleteRecursively(Path path) throws Exception {
        if (Files.isDirectory(path)) {
            try (var children = Files.list(path)) {
                for (Path child : children.toList()) {
                    deleteRecursively(child);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}

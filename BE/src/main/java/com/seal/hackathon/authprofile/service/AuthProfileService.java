package com.seal.hackathon.authprofile.service;

import com.seal.hackathon.authprofile.dto.AssignRoleRequest;
import com.seal.hackathon.authprofile.dto.AuthResponse;
import com.seal.hackathon.authprofile.dto.CurrentUserResponse;
import com.seal.hackathon.authprofile.dto.LoginRequest;
import com.seal.hackathon.authprofile.dto.RegisterRequest;
import com.seal.hackathon.authprofile.dto.SetPasswordRequest;
import com.seal.hackathon.authprofile.dto.UpdateProfileRequest;
import com.seal.hackathon.authprofile.dto.UpdateUserApprovalRequest;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.common.enums.StudentType;
import com.seal.hackathon.authprofile.security.AuthCredentialPolicy;
import com.seal.hackathon.authprofile.security.EmailDomainPolicy;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.authprofile.security.GoogleIdTokenVerifierService;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.authprofile.security.VerifiedGoogleUser;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.common.response.PagedResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.seal.hackathon.common.util.PageRequestUtils;
import org.springframework.data.domain.Sort;
import com.seal.hackathon.common.enums.UserStatus;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class AuthProfileService {

    private static final String PARTICIPANT_ROLE = "PARTICIPANT";

    private static final Set<String> STAFF_ROLES = Set.of("ORGANIZER", "MENTOR", "JUDGE");
    private static final Set<String> MENTOR_JUDGE_ROLES = Set.of("MENTOR", "JUDGE");

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final StaffInvitationRepository staffInvitationRepository;
    private final GoogleIdTokenVerifierService googleIdTokenVerifierService;
    private final JwtService jwtService;
    private final CurrentUserProvider currentUserProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailDomainPolicy emailDomainPolicy;
    private final String bootstrapOrganizerEmail;
    private final NotificationService notificationService;

    public AuthProfileService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            StaffInvitationRepository staffInvitationRepository,
            GoogleIdTokenVerifierService googleIdTokenVerifierService,
            JwtService jwtService,
            CurrentUserProvider currentUserProvider,
            PasswordEncoder passwordEncoder,
            EmailDomainPolicy emailDomainPolicy,
            NotificationService notificationService,
            @Value("${app.auth.bootstrap-organizer-email:}") String bootstrapOrganizerEmailRaw) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.staffInvitationRepository = staffInvitationRepository;
        this.googleIdTokenVerifierService = googleIdTokenVerifierService;
        this.jwtService = jwtService;
        this.currentUserProvider = currentUserProvider;
        this.passwordEncoder = passwordEncoder;
        this.emailDomainPolicy = emailDomainPolicy;
        this.notificationService = notificationService;
        this.bootstrapOrganizerEmail = normalizeEmailNullable(bootstrapOrganizerEmailRaw);
    }

    @Transactional
    public AuthResponse googleLogin(String idToken) {
        VerifiedGoogleUser verifiedUser = googleIdTokenVerifierService.verify(idToken);
        User user = findOrCreateGoogleUser(verifiedUser);
        return issueAuthResponse(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmailNullable(request.getEmail());
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email must not be blank");
        }
        emailDomainPolicy.assertAllowed(email);
        AuthCredentialPolicy.assertPassword(request.getPassword());

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS");
        }

        boolean staffProfile = usesStaffProfileForEmail(email);
        String fullName = normalizeTextRequired(request.getFullName(), "fullName must not be blank");

        StudentType studentType = null;
        String studentId = null;
        String university = null;
        String githubUsername = null;

        if (staffProfile) {
            if (hasPendingStaffInvitation(email)) {
                githubUsername = normalizeTextRequired(request.getGithubUsername(), "githubUsername must not be blank");
                AuthCredentialPolicy.assertUsername(githubUsername);
            }
        } else {
            studentType = request.getStudentType();
            if (studentType == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentType must not be null");
            }
            studentId = normalizeTextRequired(request.getStudentId(), "studentId must not be blank");
            university = resolveUniversityForStudentType(studentType, request.getUniversity());
            githubUsername = normalizeTextRequired(request.getGithubUsername(), "githubUsername must not be blank");
            AuthCredentialPolicy.assertUsername(githubUsername);
        }

        UserStatus initialStatus = isBootstrapOrganizerEmail(email)
                ? UserStatus.ACTIVE
                : UserStatus.PENDING_APPROVAL;

        OffsetDateTime now = OffsetDateTime.now();
        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(fullName)
                .studentType(studentType)
                .studentId(studentId)
                .university(university)
                .githubUsername(githubUsername)
                .status(initialStatus)
                .profileCompleted(false)
                .createdAt(now)
                .updatedAt(now)
                .build());

        syncProfileCompleted(user, loadRoles(user.getId()));
        userRepository.flush();

        return issueAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmailNullable(request.getEmail());
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email must not be blank");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        if (!StringUtils.hasText(user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "PASSWORD_NOT_SET");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        return issueAuthResponse(user);
    }

    @Transactional
    public CurrentUserResponse setPassword(SetPasswordRequest request) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

        AuthCredentialPolicy.assertPassword(request.getNewPassword());

        if (StringUtils.hasText(user.getPasswordHash())) {
            if (!StringUtils.hasText(request.getCurrentPassword())
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CURRENT_PASSWORD");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        Set<String> roles = loadRoles(user.getId());
        return toCurrentUserResponse(user, roles);
    }

    private AuthResponse issueAuthResponse(User user) {
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is disabled");
        }
        Set<String> roles = loadRoles(user.getId());
        syncProfileCompleted(user, roles);
        userRepository.flush();
        try {
            notificationService.backfillUserIdOnLogin(user.getId(), user.getEmail());
        } catch (RuntimeException ex) {
            log.warn("Notification backfill skipped on login for userId={}: {}", user.getId(), ex.getMessage());
        }
        ensureBootstrapOrganizerRole(user);
        ensureBootstrapOrganizerApproved(user);
        roles = loadRoles(user.getId());
        String accessToken = jwtService.generateToken(user, roles);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationSeconds())
                .user(toCurrentUserResponse(user, roles))
                .build();
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUserProfile() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        Set<String> roles = loadRoles(user.getId());
        return toCurrentUserResponse(user, roles);
    }

    @Transactional
    public CurrentUserResponse updateProfile(UpdateProfileRequest request) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is disabled");
        }

        Set<String> roles = loadRoles(user.getId());
        boolean staffProfile = usesStaffProfile(user, roles);

        user.setFullName(normalizeTextRequired(request.getFullName(), "fullName must not be blank"));
        user.setAvatarUrl(normalizeTextNullable(request.getAvatarUrl()));

        if (staffProfile) {
            if (requiresGithubForStaffProfile(user, roles)) {
                String github = normalizeTextRequired(
                        request.getGithubUsername(), "githubUsername must not be blank");
                AuthCredentialPolicy.assertUsername(github);
                user.setGithubUsername(github);
            }
            user.setUpdatedAt(OffsetDateTime.now());
            syncProfileCompleted(user, roles);
            userRepository.save(user);
            return toCurrentUserResponse(user, roles);
        }

        StudentType studentType = request.getStudentType();
        if (studentType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentType must not be null");
        }
        user.setStudentType(studentType);
        user.setStudentId(normalizeTextRequired(request.getStudentId(), "studentId must not be blank"));
        user.setUniversity(resolveUniversityForStudentType(studentType, request.getUniversity()));
        if (StringUtils.hasText(request.getGithubUsername())) {
            AuthCredentialPolicy.assertUsername(request.getGithubUsername());
        }
        user.setGithubUsername(normalizeTextNullable(request.getGithubUsername()));
        user.setUpdatedAt(OffsetDateTime.now());
        syncProfileCompleted(user, roles);
        userRepository.save(user);

        return toCurrentUserResponse(user, roles);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listUsers() {
        return listUsersPaged(0, 500, null).getItems();
    }

    private String normalizeSearchQuery(String query) {
        if (!StringUtils.hasText(query)) {
            return null;
        }
        return query.trim();
    }

    @Transactional(readOnly = true)
    public PagedResult<UserSummaryResponse> listUsersPaged(int page, int size, String query) {
        int resolvedSize = PageRequestUtils.resolveSize(size);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        PageRequest pageRequest = PageRequest.of(
                resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedQuery = normalizeSearchQuery(query);
        Page<User> userPage = StringUtils.hasText(normalizedQuery)
                ? userRepository.searchByKeyword(normalizedQuery, pageRequest)
                : userRepository.findAll(pageRequest);
        List<UserSummaryResponse> items = userPage.getContent().stream()
                .map(this::toUserSummaryResponse)
                .toList();
        return PagedResult.<UserSummaryResponse>builder()
                .items(items)
                .page(resolvedPage)
                .size(resolvedSize)
                .total(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .build();
    }

    @Transactional
    public UserSummaryResponse assignRole(Long userId, AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        SystemRole role = request.getRole();
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role must not be null");
        }
        if (!EnumSet.of(SystemRole.ORGANIZER, SystemRole.MENTOR, SystemRole.JUDGE).contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ORGANIZER, MENTOR, or JUDGE");
        }

        if (!userRoleRepository.existsByUserIdAndRole(userId, role)) {
            UserRole userRole = UserRole.builder()
                    .userId(userId)
                    .role(role)
                    .createdAt(OffsetDateTime.now())
                    .build();
            userRoleRepository.save(userRole);
        }

        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            user.setStatus(UserStatus.ACTIVE);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
        }

        return toUserSummaryResponse(user);
    }

    @Transactional
    public UserSummaryResponse updateUserApproval(Long userId, UpdateUserApprovalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getAction() == UpdateUserApprovalRequest.ApprovalAction.APPROVE) {
            if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "USER_NOT_PENDING_APPROVAL");
            }
            user.setStatus(UserStatus.ACTIVE);
        } else {
            if (user.getStatus() == UserStatus.DISABLED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "USER_ALREADY_DISABLED");
            }
            user.setStatus(UserStatus.DISABLED);
        }

        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);
        if (request.getAction() == UpdateUserApprovalRequest.ApprovalAction.APPROVE) {
            notificationService.notifyUserAccountApproved(user);
        }
        return toUserSummaryResponse(user);
    }

    private User findOrCreateGoogleUser(VerifiedGoogleUser verifiedUser) {
        User userByGoogleSub = userRepository.findByGoogleSub(verifiedUser.getGoogleSub()).orElse(null);
        User userByEmail = userRepository.findByEmail(verifiedUser.getEmail()).orElse(null);

        if (userByGoogleSub != null && userByEmail != null && !userByGoogleSub.getId().equals(userByEmail.getId())) {
            if (!StringUtils.hasText(userByEmail.getGoogleSub())) {
                userByGoogleSub.setGoogleSub(null);
                userRepository.save(userByGoogleSub);
                userByEmail.setGoogleSub(verifiedUser.getGoogleSub());
                userByEmail.setUpdatedAt(OffsetDateTime.now());
                userByEmail = userRepository.save(userByEmail);
                userByGoogleSub = null;
            } else {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "GOOGLE_ACCOUNT_LINK_CONFLICT");
            }
        }

        User targetUser = userByEmail != null ? userByEmail : userByGoogleSub;

        if (targetUser == null) {
            OffsetDateTime now = OffsetDateTime.now();
            User newUser = User.builder()
                    .email(verifiedUser.getEmail())
                    .googleSub(verifiedUser.getGoogleSub())
                    .fullName(verifiedUser.getFullName())
                    .avatarUrl(verifiedUser.getAvatarUrl())
                    .status(UserStatus.PENDING_APPROVAL)
                    .profileCompleted(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            return userRepository.save(newUser);
        }

        boolean changed = false;

        if (!verifiedUser.getGoogleSub().equals(targetUser.getGoogleSub())) {
            targetUser.setGoogleSub(verifiedUser.getGoogleSub());
            changed = true;
        }

        String normalizedFullName = normalizeTextNullable(verifiedUser.getFullName());
        if (normalizedFullName != null && !normalizedFullName.equals(targetUser.getFullName())) {
            targetUser.setFullName(normalizedFullName);
            changed = true;
        }

        String normalizedAvatar = normalizeTextNullable(verifiedUser.getAvatarUrl());
        if (normalizedAvatar != null && !normalizedAvatar.equals(targetUser.getAvatarUrl())) {
            targetUser.setAvatarUrl(normalizedAvatar);
            changed = true;
        }

        if (!verifiedUser.getEmail().equals(targetUser.getEmail())) {
            targetUser.setEmail(verifiedUser.getEmail());
            changed = true;
        }

        if (changed) {
            targetUser.setUpdatedAt(OffsetDateTime.now());
            return userRepository.save(targetUser);
        }
        return targetUser;
    }

    private void ensureBootstrapOrganizerRole(User user) {
        if (bootstrapOrganizerEmail == null) {
            return;
        }

        if (!bootstrapOrganizerEmail.equals(normalizeEmailNullable(user.getEmail()))) {
            return;
        }

        if (!userRoleRepository.existsByUserIdAndRole(user.getId(), SystemRole.ORGANIZER)) {
            UserRole organizerRole = UserRole.builder()
                    .userId(user.getId())
                    .role(SystemRole.ORGANIZER)
                    .createdAt(OffsetDateTime.now())
                    .build();
            userRoleRepository.save(organizerRole);
        }
    }

    private Set<String> loadRoles(Long userId) {
        LinkedHashSet<String> roles = userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        roles.add(PARTICIPANT_ROLE);
        return roles;
    }

    private CurrentUserResponse toCurrentUserResponse(User user, Set<String> roles) {
        return CurrentUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .githubUsername(user.getGithubUsername())
                .fullName(user.getFullName())
                .studentType(user.getStudentType())
                .studentId(user.getStudentId())
                .university(user.getUniversity())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .profileCompleted(user.getProfileCompleted())
                .hasPassword(StringUtils.hasText(user.getPasswordHash()))
                .roles(roles)
                .build();
    }

    private UserSummaryResponse toUserSummaryResponse(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .studentType(user.getStudentType())
                .studentId(user.getStudentId())
                .university(user.getUniversity())
                .status(user.getStatus())
                .roles(loadRoles(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private boolean isBootstrapOrganizerEmail(String email) {
        return bootstrapOrganizerEmail != null
                && bootstrapOrganizerEmail.equals(normalizeEmailNullable(email));
    }

    private void ensureBootstrapOrganizerApproved(User user) {
        if (!isBootstrapOrganizerEmail(user.getEmail())) {
            return;
        }
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            user.setStatus(UserStatus.ACTIVE);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
        }
    }

    private String resolveUniversityForStudentType(StudentType studentType, String universityRaw) {
        if (studentType == StudentType.FPT) {
            String normalized = normalizeTextNullable(universityRaw);
            return normalized != null ? normalized : "FPT University";
        }
        return normalizeTextRequired(universityRaw, "university must not be blank");
    }

    private boolean hasMentorOrJudgeRole(Set<String> roles) {
        return roles.stream().anyMatch(MENTOR_JUDGE_ROLES::contains);
    }

    private boolean requiresGithubForStaffProfile(User user, Set<String> roles) {
        if (hasMentorOrJudgeRole(roles)) {
            return true;
        }
        return hasPendingStaffInvitation(user.getEmail());
    }

    private boolean usesStaffProfileForEmail(String email) {
        return isBootstrapOrganizerEmail(email) || hasPendingStaffInvitation(email);
    }

    private boolean hasStaffRole(Set<String> roles) {
        return roles.stream().anyMatch(STAFF_ROLES::contains);
    }

    private boolean hasPendingStaffInvitation(String email) {
        String normalized = normalizeEmailNullable(email);
        if (normalized == null) {
            return false;
        }
        return staffInvitationRepository.existsByEmailIgnoreCaseAndStatus(
                normalized, StaffInvitationStatus.INVITED);
    }

    private boolean usesStaffProfile(User user, Set<String> roles) {
        if (hasStaffRole(roles)) {
            return true;
        }
        return usesStaffProfileForEmail(user.getEmail());
    }

    private boolean isProfileComplete(User user, Set<String> roles) {
        if (!StringUtils.hasText(user.getFullName())) {
            return false;
        }
        if (usesStaffProfile(user, roles)) {
            if (requiresGithubForStaffProfile(user, roles)) {
                return StringUtils.hasText(user.getGithubUsername());
            }
            return true;
        }
        if (!StringUtils.hasText(user.getStudentId())
                || !StringUtils.hasText(user.getGithubUsername())
                || user.getStudentType() == null) {
            return false;
        }
        if (user.getStudentType() == StudentType.EXTERNAL) {
            return StringUtils.hasText(user.getUniversity());
        }
        return true;
    }

    private void syncProfileCompleted(User user, Set<String> roles) {
        boolean complete = isProfileComplete(user, roles);
        Boolean current = user.getProfileCompleted();
        if (current == null || current != complete) {
            user.setProfileCompleted(complete);
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
        }
    }

    private String normalizeEmailNullable(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeTextNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String normalizeTextRequired(String value, String errorMessage) {
        String normalized = normalizeTextNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return normalized;
    }
}

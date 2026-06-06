package com.seal.hackathon.authprofile.service;

import com.seal.hackathon.authprofile.dto.AssignRoleRequest;
import com.seal.hackathon.authprofile.dto.AuthResponse;
import com.seal.hackathon.authprofile.dto.CurrentUserResponse;
import com.seal.hackathon.authprofile.dto.LoginRequest;
import com.seal.hackathon.authprofile.dto.RegisterRequest;
import com.seal.hackathon.authprofile.dto.SetPasswordRequest;
import com.seal.hackathon.authprofile.dto.UpdateProfileRequest;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
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
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthProfileService {

    private static final String PARTICIPANT_ROLE = "PARTICIPANT";

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
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
            GoogleIdTokenVerifierService googleIdTokenVerifierService,
            JwtService jwtService,
            CurrentUserProvider currentUserProvider,
            PasswordEncoder passwordEncoder,
            EmailDomainPolicy emailDomainPolicy,
            NotificationService notificationService,
            @Value("${app.auth.bootstrap-organizer-email:}") String bootstrapOrganizerEmailRaw) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
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

        OffsetDateTime now = OffsetDateTime.now();
        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(displayNameFromEmail(email))
                .status(UserStatus.ACTIVE)
                .profileCompleted(true)
                .createdAt(now)
                .updatedAt(now)
                .build());

        return issueAuthResponse(user);
    }

    @Transactional(readOnly = true)
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
        notificationService.backfillUserIdOnLogin(user.getId(), user.getEmail());
        ensureBootstrapOrganizerRole(user);
        Set<String> roles = loadRoles(user.getId());
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

        user.setFullName(normalizeTextRequired(request.getFullName(), "fullName must not be blank"));
        user.setStudentId(normalizeTextNullable(request.getStudentId()));
        user.setUniversity(normalizeTextNullable(request.getUniversity()));
        user.setAvatarUrl(normalizeTextNullable(request.getAvatarUrl()));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        Set<String> roles = loadRoles(user.getId());
        return toCurrentUserResponse(user, roles);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return users.stream()
                .map(user -> UserSummaryResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .status(user.getStatus())
                        .roles(loadRoles(user.getId()))
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
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

        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus())
                .roles(loadRoles(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private User findOrCreateGoogleUser(VerifiedGoogleUser verifiedUser) {
        User userByGoogleSub = userRepository.findByGoogleSub(verifiedUser.getGoogleSub()).orElse(null);
        User userByEmail = userRepository.findByEmail(verifiedUser.getEmail()).orElse(null);

        if (userByGoogleSub != null && userByEmail != null && !userByGoogleSub.getId().equals(userByEmail.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Google account is already linked to another user");
        }

        User targetUser = userByEmail != null ? userByEmail : userByGoogleSub;

        if (targetUser == null) {
            OffsetDateTime now = OffsetDateTime.now();
            User newUser = User.builder()
                    .email(verifiedUser.getEmail())
                    .googleSub(verifiedUser.getGoogleSub())
                    .fullName(verifiedUser.getFullName())
                    .avatarUrl(verifiedUser.getAvatarUrl())
                    .status(UserStatus.ACTIVE)
                    .profileCompleted(true)
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
                .fullName(user.getFullName())
                .studentId(user.getStudentId())
                .university(user.getUniversity())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .profileCompleted(user.getProfileCompleted())
                .hasPassword(StringUtils.hasText(user.getPasswordHash()))
                .roles(roles)
                .build();
    }

    private String displayNameFromEmail(String email) {
        int at = email.indexOf('@');
        if (at > 0) {
            return email.substring(0, at);
        }
        return email;
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

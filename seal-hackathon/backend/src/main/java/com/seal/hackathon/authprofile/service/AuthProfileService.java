package com.seal.hackathon.authprofile.service;

import com.seal.hackathon.authprofile.dto.AssignRoleRequest;
import com.seal.hackathon.authprofile.dto.AuthResponse;
import com.seal.hackathon.authprofile.dto.CurrentUserResponse;
import com.seal.hackathon.authprofile.dto.UpdateProfileRequest;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.authprofile.security.GoogleIdTokenVerifierService;
import com.seal.hackathon.authprofile.security.JwtService;
import com.seal.hackathon.authprofile.security.VerifiedGoogleUser;
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
    private final String bootstrapOrganizerEmail;

    public AuthProfileService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            GoogleIdTokenVerifierService googleIdTokenVerifierService,
            JwtService jwtService,
            CurrentUserProvider currentUserProvider,
            @Value("${app.auth.bootstrap-organizer-email:}") String bootstrapOrganizerEmailRaw) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.googleIdTokenVerifierService = googleIdTokenVerifierService;
        this.jwtService = jwtService;
        this.currentUserProvider = currentUserProvider;
        this.bootstrapOrganizerEmail = normalizeEmailNullable(bootstrapOrganizerEmailRaw);
    }

    @Transactional
    public AuthResponse googleLogin(String idToken) {
        VerifiedGoogleUser verifiedUser = googleIdTokenVerifierService.verify(idToken);
        User user = findOrCreateGoogleUser(verifiedUser);

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is disabled");
        }

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
                .fullName(user.getFullName())
                .studentId(user.getStudentId())
                .university(user.getUniversity())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .roles(roles)
                .build();
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

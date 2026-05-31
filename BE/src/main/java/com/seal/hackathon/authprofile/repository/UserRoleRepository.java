package com.seal.hackathon.authprofile.repository;

import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.common.enums.SystemRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUserId(Long userId);

    boolean existsByUserIdAndRole(Long userId, SystemRole role);
}

package com.seal.hackathon.authprofile.repository;

import com.seal.hackathon.authprofile.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
}

package com.seal.hackathon.authprofile.repository;

import com.seal.hackathon.authprofile.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}

package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
}

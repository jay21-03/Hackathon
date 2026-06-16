package com.seal.hackathon.academic.repository;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicTermQueryRepository extends JpaRepository<Team, Long> {

    @Query("""
            SELECT DISTINCT t FROM Team t
            JOIN Event e ON e.id = t.eventId
            WHERE e.academicTermId = :termId
            ORDER BY t.createdAt DESC, t.id DESC
            """)
    List<Team> findTeamsByTermId(@Param("termId") Long termId);

    @Query("""
            SELECT DISTINCT m FROM TeamMember m
            JOIN Team tm ON tm.id = m.teamId
            JOIN Event e ON e.id = tm.eventId
            WHERE e.academicTermId = :termId
            ORDER BY m.fullName ASC, m.id ASC
            """)
    List<TeamMember> findParticipantsByTermId(@Param("termId") Long termId);

    @Query(value = """
            SELECT DISTINCT ma.mentor_id
            FROM mentor_assignments ma
            JOIN boards b ON b.id = ma.board_id
            JOIN rounds r ON r.id = b.round_id
            JOIN events e ON e.id = r.event_id
            WHERE e.academic_term_id = :termId
            ORDER BY ma.mentor_id
            """, nativeQuery = true)
    List<Long> findMentorIdsByTermId(@Param("termId") Long termId);

    @Query(value = """
            SELECT DISTINCT ja.judge_id
            FROM judge_assignments ja
            JOIN boards b ON b.id = ja.board_id
            JOIN rounds r ON r.id = b.round_id
            JOIN events e ON e.id = r.event_id
            WHERE e.academic_term_id = :termId
            ORDER BY ja.judge_id
            """, nativeQuery = true)
    List<Long> findJudgeIdsByTermId(@Param("termId") Long termId);

    @Query(value = """
            SELECT DISTINCT combined.user_id FROM (
                SELECT ma.mentor_id AS user_id
                FROM mentor_assignments ma
                JOIN boards b ON b.id = ma.board_id
                JOIN rounds r ON r.id = b.round_id
                JOIN events e ON e.id = r.event_id
                WHERE e.academic_term_id = :termId
                UNION
                SELECT u.id AS user_id
                FROM staff_invitations si
                JOIN boards b ON b.id = si.board_id
                JOIN rounds r ON r.id = b.round_id
                JOIN events e ON e.id = r.event_id
                JOIN users u ON LOWER(u.email) = LOWER(si.email)
                WHERE e.academic_term_id = :termId
                  AND si.role = 'MENTOR'
                  AND si.status IN ('INVITED', 'ACCEPTED')
                UNION
                SELECT u.id AS user_id
                FROM staff_invitations si
                JOIN events e ON e.id = si.event_id
                JOIN users u ON LOWER(u.email) = LOWER(si.email)
                WHERE e.academic_term_id = :termId
                  AND si.board_id IS NULL
                  AND si.role = 'MENTOR'
                  AND si.status IN ('INVITED', 'ACCEPTED')
            ) combined
            ORDER BY combined.user_id
            """, nativeQuery = true)
    List<Long> findMentorCandidateIdsByTermId(@Param("termId") Long termId);

    @Query(value = """
            SELECT DISTINCT combined.user_id FROM (
                SELECT ja.judge_id AS user_id
                FROM judge_assignments ja
                JOIN boards b ON b.id = ja.board_id
                JOIN rounds r ON r.id = b.round_id
                JOIN events e ON e.id = r.event_id
                WHERE e.academic_term_id = :termId
                UNION
                SELECT u.id AS user_id
                FROM staff_invitations si
                JOIN boards b ON b.id = si.board_id
                JOIN rounds r ON r.id = b.round_id
                JOIN events e ON e.id = r.event_id
                JOIN users u ON LOWER(u.email) = LOWER(si.email)
                WHERE e.academic_term_id = :termId
                  AND si.role = 'JUDGE'
                  AND si.status IN ('INVITED', 'ACCEPTED')
                UNION
                SELECT u.id AS user_id
                FROM staff_invitations si
                JOIN events e ON e.id = si.event_id
                JOIN users u ON LOWER(u.email) = LOWER(si.email)
                WHERE e.academic_term_id = :termId
                  AND si.board_id IS NULL
                  AND si.role = 'JUDGE'
                  AND si.status IN ('INVITED', 'ACCEPTED')
            ) combined
            ORDER BY combined.user_id
            """, nativeQuery = true)
    List<Long> findJudgeCandidateIdsByTermId(@Param("termId") Long termId);

    @Query("""
            SELECT rr FROM RankingResult rr
            JOIN Board b ON b.id = rr.boardId
            JOIN Round r ON r.id = b.roundId
            JOIN Event e ON e.id = r.eventId
            WHERE e.academicTermId = :termId
            ORDER BY r.roundOrder ASC, b.boardOrder ASC, rr.rank ASC
            """)
    List<RankingResult> findRankingsByTermId(@Param("termId") Long termId);

    @Query("""
            SELECT repo FROM TeamRepository repo
            JOIN Team tm ON tm.id = repo.teamId
            JOIN Event e ON e.id = tm.eventId
            WHERE e.academicTermId = :termId
            ORDER BY repo.createdAt DESC, repo.id DESC
            """)
    List<TeamRepository> findRepositoriesByTermId(@Param("termId") Long termId);

    @Query("""
            SELECT ss FROM ScoreSheet ss
            JOIN Board b ON b.id = ss.boardId
            JOIN Round r ON r.id = b.roundId
            JOIN Event e ON e.id = r.eventId
            WHERE e.academicTermId = :termId
            ORDER BY ss.createdAt DESC, ss.id DESC
            """)
    List<ScoreSheet> findScoreSheetsByTermId(@Param("termId") Long termId);

    @Query("SELECT COUNT(t) FROM Team t JOIN Event e ON e.id = t.eventId WHERE e.academicTermId = :termId")
    long countTeamsByTermId(@Param("termId") Long termId);

    @Query("""
            SELECT COUNT(DISTINCT m) FROM TeamMember m
            JOIN Team tm ON tm.id = m.teamId
            JOIN Event e ON e.id = tm.eventId
            WHERE e.academicTermId = :termId
            """)
    long countParticipantsByTermId(@Param("termId") Long termId);
}

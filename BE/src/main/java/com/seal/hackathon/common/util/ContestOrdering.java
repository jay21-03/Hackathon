package com.seal.hackathon.common.util;

import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Round;
import java.util.Comparator;
import java.util.List;

public final class ContestOrdering {

    private ContestOrdering() {
    }

    public static Comparator<Round> roundComparator() {
        return Comparator
                .comparing(Round::getRoundOrder, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Round::getId, Comparator.nullsLast(Long::compareTo));
    }

    public static Comparator<Board> boardComparator() {
        return Comparator
                .comparing(Board::getBoardOrder, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(Board::getId, Comparator.nullsLast(Long::compareTo));
    }

    public static List<Round> sortRounds(List<Round> rounds) {
        return rounds.stream().sorted(roundComparator()).toList();
    }

    public static List<Board> sortBoards(List<Board> boards) {
        return boards.stream().sorted(boardComparator()).toList();
    }
}

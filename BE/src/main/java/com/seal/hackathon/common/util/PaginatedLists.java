package com.seal.hackathon.common.util;

import java.util.List;

public final class PaginatedLists {

    private PaginatedLists() {
    }

    public static <T> List<T> slice(List<T> all, Integer page, Integer size) {
        if (page == null && size == null) {
            return all;
        }
        int resolvedPage = page != null ? Math.max(page, 0) : 0;
        int resolvedSize = size != null ? Math.max(size, 1) : 50;
        int start = resolvedPage * resolvedSize;
        if (start >= all.size()) {
            return List.of();
        }
        int end = Math.min(start + resolvedSize, all.size());
        return all.subList(start, end);
    }

    public static int totalPages(long total, int size) {
        if (size <= 0) {
            return 0;
        }
        return (int) ((total + size - 1) / size);
    }
}

package com.seal.hackathon.common.util;

public final class PageRequestUtils {

    public static final int DEFAULT_MAX_PAGE_SIZE = 200;

    private PageRequestUtils() {
    }

    public static int resolvePage(int page) {
        return Math.max(page, 0);
    }

    public static int resolveSize(int size) {
        return resolveSize(size, DEFAULT_MAX_PAGE_SIZE);
    }

    public static int resolveSize(int size, int maxSize) {
        int cappedMax = Math.max(maxSize, 1);
        return Math.min(Math.max(size, 1), cappedMax);
    }
}

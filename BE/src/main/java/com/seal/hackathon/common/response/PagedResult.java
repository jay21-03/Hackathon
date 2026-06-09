package com.seal.hackathon.common.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResult<T> {
    private List<T> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
}

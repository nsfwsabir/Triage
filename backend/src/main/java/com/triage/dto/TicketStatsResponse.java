package com.triage.dto;

public record TicketStatsResponse(long total, long open, long inProgress, long resolved, long highPriority) {
}

package com.triage.dto;

import com.triage.entity.Ticket;
import com.triage.entity.TicketCategory;
import com.triage.entity.TicketPriority;
import com.triage.entity.TicketStatus;

import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String title,
        String description,
        TicketCategory category,
        TicketPriority priority,
        TicketStatus status,
        UserResponse createdBy,
        UserResponse assignedTo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime resolvedAt) {

    public static TicketResponse from(Ticket t) {
        return new TicketResponse(
                t.getId(), t.getTitle(), t.getDescription(), t.getCategory(),
                t.getPriority(), t.getStatus(),
                UserResponse.from(t.getCreatedBy()),
                t.getAssignedTo() == null ? null : UserResponse.from(t.getAssignedTo()),
                t.getCreatedAt(), t.getUpdatedAt(), t.getResolvedAt());
    }
}

package com.triage.dto;

import com.triage.entity.Ticket;
import com.triage.entity.TicketCategory;
import com.triage.entity.TicketComment;
import com.triage.entity.TicketPriority;
import com.triage.entity.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;

public record TicketDetailResponse(
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
        LocalDateTime resolvedAt,
        List<CommentResponse> comments) {

    public static TicketDetailResponse from(Ticket t, List<CommentResponse> comments) {
        return new TicketDetailResponse(
                t.getId(), t.getTitle(), t.getDescription(), t.getCategory(),
                t.getPriority(), t.getStatus(),
                UserResponse.from(t.getCreatedBy()),
                t.getAssignedTo() == null ? null : UserResponse.from(t.getAssignedTo()),
                t.getCreatedAt(), t.getUpdatedAt(), t.getResolvedAt(), comments);
    }

    public record CommentResponse(Long id, String content, UserResponse author, LocalDateTime createdAt) {

        public static CommentResponse from(TicketComment c) {
            return new CommentResponse(c.getId(), c.getContent(), UserResponse.from(c.getAuthor()), c.getCreatedAt());
        }
    }
}

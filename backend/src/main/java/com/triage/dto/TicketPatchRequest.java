package com.triage.dto;

import com.triage.entity.TicketPriority;
import com.triage.entity.TicketStatus;

public record TicketPatchRequest(TicketStatus status, TicketPriority priority, Long assignedToId) {
}

package com.triage.dto;

import com.triage.entity.TicketCategory;
import com.triage.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @NotNull TicketCategory category,
        @NotNull TicketPriority priority) {
}

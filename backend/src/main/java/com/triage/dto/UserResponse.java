package com.triage.dto;

public record UserResponse(Long id, String fullName, String email, String role) {

    public static UserResponse from(com.triage.entity.User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }
}

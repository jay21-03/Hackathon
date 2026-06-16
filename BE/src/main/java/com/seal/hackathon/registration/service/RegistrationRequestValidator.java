package com.seal.hackathon.registration.service;

import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class RegistrationRequestValidator {

    private final EventRepository eventRepository;

    public void validateForEvent(Long eventId, RegisterTeamRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        int memberCount = request.getMembers() == null ? 0 : request.getMembers().size();
        if (memberCount < event.getMinTeamSize() || memberCount > event.getMaxTeamSize()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Team size must be between " + event.getMinTeamSize() + " and " + event.getMaxTeamSize());
        }
    }
}

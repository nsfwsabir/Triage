package com.triage.config;

import com.triage.entity.Role;
import com.triage.entity.Ticket;
import com.triage.entity.TicketCategory;
import com.triage.entity.TicketPriority;
import com.triage.entity.TicketStatus;
import com.triage.entity.User;
import com.triage.repository.TicketRepository;
import com.triage.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    public ApplicationRunner seedData(UserRepository userRepository, TicketRepository ticketRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() > 0) {
                return;
            }

            User admin = new User();
            admin.setFullName("Amelia Hart");
            admin.setEmail("admin@triage.dev");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin = userRepository.save(admin);

            User student = new User();
            student.setFullName("Dev Patel");
            student.setEmail("student@triage.dev");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setRole(Role.USER);
            student = userRepository.save(student);

            Ticket a = new Ticket();
            a.setTitle("Email notifications not delivered after password reset");
            a.setDescription("Reset the password at 09:40 and the confirmation email never arrived. Checked spam and the mail server logs show no delivery attempt for my address.");
            a.setCategory(TicketCategory.BUG);
            a.setPriority(TicketPriority.HIGH);
            a.setStatus(TicketStatus.OPEN);
            a.setCreatedBy(student);
            ticketRepository.save(a);

            Ticket b = new Ticket();
            b.setTitle("Lab workstation LT-014 will not power on after firmware update");
            b.setDescription("Updated the BIOS on the Dell Latitude in lab 2 last evening. Since then the unit shows a blinking power LED and never reaches POST. Tried a 30-second power drain with no effect.");
            b.setCategory(TicketCategory.HARDWARE);
            b.setPriority(TicketPriority.CRITICAL);
            b.setStatus(TicketStatus.IN_PROGRESS);
            b.setCreatedBy(student);
            b.setAssignedTo(admin);
            ticketRepository.save(b);

            Ticket c = new Ticket();
            c.setTitle("VPN access expired before the end of internship project");
            c.setDescription("My VPN profile was set to expire on the 10th but the capstone demo is on the 20th. Please extend access for the account used by the data-pipeline team.");
            c.setCategory(TicketCategory.ACCESS);
            c.setPriority(TicketPriority.MEDIUM);
            c.setStatus(TicketStatus.RESOLVED);
            c.setCreatedBy(student);
            c.setAssignedTo(admin);
            c.setResolvedAt(LocalDateTime.now().minusHours(6));
            ticketRepository.save(c);

            Ticket d = new Ticket();
            d.setTitle("Weekly report export stalls at 40 percent in Chrome");
            d.setDescription("Exporting the weekly usage report hangs at 40 percent in Chrome 140 and never completes. The same export finishes fine in Firefox within two minutes.");
            d.setCategory(TicketCategory.OTHER);
            d.setPriority(TicketPriority.LOW);
            d.setStatus(TicketStatus.CLOSED);
            d.setCreatedBy(student);
            d.setAssignedTo(admin);
            d.setResolvedAt(LocalDateTime.now().minusDays(2));
            ticketRepository.save(d);
        };
    }
}

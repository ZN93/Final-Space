package com.finalspace.backend.config;

import com.finalspace.backend.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner init() {
        return args -> {

            if (userRepository.findByEmail("admin@finalspace.com").isEmpty()) {

                User admin = User.builder()
                        .email("admin@finalspace.com")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role(RoleType.ADMIN)
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build();

                userRepository.save(admin);
                System.out.println("Admin user created");
            }
        };
    }
}
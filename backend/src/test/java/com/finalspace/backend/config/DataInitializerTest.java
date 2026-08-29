package com.finalspace.backend.config;

import com.finalspace.backend.user.RoleType;
import com.finalspace.backend.user.User;
import com.finalspace.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    private static final String ADMIN_EMAIL = "admin@finalspace.test";
    private static final String ADMIN_PASSWORD = "strong-admin-password";
    private static final String ENCODED_PASSWORD = "encoded-admin-password";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer(userRepository, passwordEncoder);
    }

    @Test
    void shouldRejectBootstrapWhenAdminEmailIsBlank() {
        configureBootstrap(" ", ADMIN_PASSWORD);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> dataInitializer.init().run()
        );

        assertEquals(expectedMissingCredentialsMessage(), exception.getMessage());
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void shouldRejectBootstrapWhenAdminPasswordIsBlank() {
        configureBootstrap(ADMIN_EMAIL, " ");

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> dataInitializer.init().run()
        );

        assertEquals(expectedMissingCredentialsMessage(), exception.getMessage());
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void shouldCreateConfiguredAdministratorWhenItDoesNotExist() throws Exception {
        configureBootstrap(ADMIN_EMAIL, ADMIN_PASSWORD);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(ADMIN_PASSWORD)).thenReturn(ENCODED_PASSWORD);

        dataInitializer.init().run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertAll(
                () -> assertEquals(ADMIN_EMAIL, savedUser.getEmail()),
                () -> assertEquals(ENCODED_PASSWORD, savedUser.getPasswordHash()),
                () -> assertEquals(RoleType.ADMIN, savedUser.getRole()),
                () -> assertTrue(savedUser.isActive()),
                () -> assertNotNull(savedUser.getCreatedAt())
        );
    }

    @Test
    void shouldKeepExistingAdministratorUnchanged() throws Exception {
        configureBootstrap(ADMIN_EMAIL, ADMIN_PASSWORD);
        User existingAdmin = User.builder()
                .email(ADMIN_EMAIL)
                .role(RoleType.ADMIN)
                .build();
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existingAdmin));

        dataInitializer.init().run();

        verify(userRepository).findByEmail(ADMIN_EMAIL);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    private void configureBootstrap(String email, String password) {
        ReflectionTestUtils.setField(dataInitializer, "adminEmail", email);
        ReflectionTestUtils.setField(dataInitializer, "adminPassword", password);
    }

    private String expectedMissingCredentialsMessage() {
        return "APP_BOOTSTRAP_ADMIN_EMAIL and APP_BOOTSTRAP_ADMIN_PASSWORD are required "
                + "when APP_BOOTSTRAP_ENABLED=true";
    }
}

package com.finalspace.backend.user;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("Utilisateur introuvable avec l'identifiant : " + id);
    }
}
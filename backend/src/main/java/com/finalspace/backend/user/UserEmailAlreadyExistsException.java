package com.finalspace.backend.user;

public class UserEmailAlreadyExistsException extends RuntimeException {

    public UserEmailAlreadyExistsException(String email) {
        super("Un utilisateur existe déjà avec l'email : " + email);
    }
}
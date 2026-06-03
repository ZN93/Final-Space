package com.finalspace.backend.common.exception;

public abstract class AppException extends RuntimeException {

    protected AppException(String message) {
        super(message);
    }
}
package com.ga.sudoku.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(
        value = HttpStatus.BAD_REQUEST,
        reason = "Invalid character found in Sudoku puzzle"
)
public class InvalidCharacterException extends RuntimeException{
    public InvalidCharacterException(String message) {
        super(message);
    }
}

package com.ga.sudoku.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class SudokuExceptionHandler {
    @ExceptionHandler(InvalidCharacterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidCharacter(InvalidCharacterException e) {
        return e.getMessage();
    }

    @ExceptionHandler(SudokuFileNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleFileNotFound(SudokuFileNotFoundException e) {
        return e.getMessage();
    }
}

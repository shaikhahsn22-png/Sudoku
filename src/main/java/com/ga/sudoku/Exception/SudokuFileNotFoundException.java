package com.ga.sudoku.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class SudokuFileNotFoundException extends RuntimeException{
    public SudokuFileNotFoundException(String message) {
        super(message);
    }
}

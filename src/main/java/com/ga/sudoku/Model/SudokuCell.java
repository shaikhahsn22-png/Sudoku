package com.ga.sudoku.Model;

import lombok.AllArgsConstructor;
import lombok.Getter;

//a sudoku cell represents one cell in the 9x9 board
@AllArgsConstructor
@Getter
public class SudokuCell {
    //fields
    private int value;
    private boolean fixed;

    //set new value for the cell
    public void setValue(int newValue){
        //if cell not fixed, new value must be between 0-9
        if(!fixed && newValue >= 0 && newValue <= 9) {
            this.value = newValue;
        } else {
            //otherwise do not allow change
            return;
        }
    }
}

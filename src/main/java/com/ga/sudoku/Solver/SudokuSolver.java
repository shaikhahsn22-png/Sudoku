package com.ga.sudoku.Solver;

import com.ga.sudoku.Model.Sudoku;
import com.ga.sudoku.Model.SudokuCell;

/**
 * This class is used to solve the Sudoku puzzle
 * It checks if a number can be placed in a cell
 * and uses backtracking to solve the board.
 */
public class SudokuSolver {

    /**
     * Checks if a number can be placed in a cell.
     * It checks the row, column, and 3x3 box
     * to make sure the number does not already exist.
     *
     * @param board the Sudoku board
     * @param row the row of the cell
     * @param col the column of the cell
     * @param num the number to check
     * @return true if the number is valid, otherwise false
     */
    public boolean isValid(SudokuCell[][] board, int row, int col, int num) {
        //check the row
        for(int i = 0; i < 9; i++){
            //check each cell in the row
            if(board[row][i].getValue() == num){
                return false;
            }
        }

        //check the col
        for(int i = 0; i < 9; i++){
            //check each cell in the row
            if(board[i][col].getValue() == num){
                return false;
            }
        }

        //check the 3x3 box
        //to find where 3×3 box starts
        int startRow = (row / 3) * 3;
        int startCol = (col /3 )*3;

        //outer loop: 3 rows
        for (int i = startRow; i < startRow + 3; i++) {
            //inner loop: 3 columns
            for(int j = startCol; j < startCol + 3; j++){
                if(board[i][j].getValue() ==num){
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Solves the Sudoku puzzle using backtracking
     * It finds an empty cell and tries numbers from 1 to 9
     * If a number is valid, it places it and continues solving.
     * If it does not work, it removes the number and tries again.
     *
     * @param board the Sudoku board to solve
     * @return true if the puzzle is solved, otherwise false
     */
    public boolean solve(SudokuCell[][] board){

        //outer loop that iterates through the 9 rows
        for (int row =0; row < 9; row++ ) {
            //inner loop that iterates through the 9 columns
            for (int col = 0; col < 9; col++) {
                //find an empty cell
                if(board[row][col].getValue() == 0){
                    //try numbers 1-9
                    for (int num = 1; num <= 9; num++){
                        //check num is valid
                        if(isValid(board,row,col,num)){
                            //set num into cell
                            board[row][col].setValue(num); //place it temporarily

                            //call solve again until all cells are filled
                            if(solve(board)){
                                //return true if puzzle have been solved
                                return true;
                            }

                            //backtracking: remove number if it did not work
                            board[row][col].setValue(0);
                        }
                    }
                    //tried every number and none worked
                    return false;
                }
            }
        }
        return true; //puzzle is solved
    }

}

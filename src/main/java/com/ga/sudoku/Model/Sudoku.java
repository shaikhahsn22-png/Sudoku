package com.ga.sudoku.Model;

import com.ga.sudoku.Exception.InvalidCharacterException;
import com.ga.sudoku.Exception.SudokuFileNotFoundException;
import lombok.Getter;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.Scanner;

@Getter
public class Sudoku {

    //two-dimensional array of SudokuCell: to arrange a table or grid with columns and rows
    private SudokuCell[][] sudokuBoard;

    //constructor
    public Sudoku() {
        //creates a new empty 9×9, 81 references
        this.sudokuBoard = new SudokuCell[9][9];
    }

    //method to load the puzzle
    public void loadPuzzle(String filePath){
        //create file object
        File file = new File(filePath);

        try (Scanner scanner = new Scanner(file)){
            //read the 9x9 sudoku
            //for every cell: read one int at a time and create a SudokuCell object
            //outer loop that goes through the 9 rows
            for (int row =0; row < 9; row++ ){
                //inner loop that goes through the 9 columns
                for (int col=0; col < 9; col++){
                    //handle invalid char
                    if(!scanner.hasNextInt()){
                        throw new InvalidCharacterException("File contain invalid Sudoku value");
                    }

                    int value = scanner.nextInt(); //read next int

                    //check if value is valid
                    if(value < 0 || value >9){
                        throw new InvalidCharacterException("Invalid Sudoku value: " + value);
                    }

                    //determine fixed when it has value = true, when 0 = false
                    boolean fixed = (value != 0);

                    //create SudokuCell object
                    SudokuCell sudokuCell = new SudokuCell(value, fixed);

                    //store it in the 9 × 9 board
                    sudokuBoard[row][col] = sudokuCell;
                }
            }

            //validate the number of values in the file = 81
            if(scanner.hasNext()){
                throw new InvalidCharacterException("Sudoku file contains extra values");
            }

        }catch (FileNotFoundException e){
            throw new SudokuFileNotFoundException("Unable to open Sudoku file: " + filePath);
        }
    }

    //method to print sudoku board
    public void printBoard(){
        //outer loop that iterates through the 9 rows
        for (int row =0; row < 9; row++ ) {
            //inner loop that iterates through the 9 columns
            for (int col = 0; col < 9; col++) {
                //print each cell
                System.out.print(sudokuBoard[row][col].getValue()+ " ");
                //add | after every three columns (2 and 5)
                if (col == 2 || col == 5) {
                    System.out.print("| ");
                }
            }
            System.out.println();//new line after each row

            //add horizontal separator after rows 2 and 5
            if (row == 2 || row == 5) {
                System.out.println("----------------------");
            }
        }
    }

    //method to save solution
    public void saveSolution(String filePath) {
        try (PrintWriter writer = new PrintWriter(filePath)) {
            //save sudoku solution: 9x9: 81 numbers

            //outer loop that goes through the 9 rows
            for (int row =0; row < 9; row++ ) {
                //inner loop that goes through the 9 columns
                for (int col = 0; col < 9; col++) {
                    int num= sudokuBoard[row][col].getValue();
                    writer.print(num + " ");
                }
                writer.println();
            }

        } catch (FileNotFoundException e) {
            throw new SudokuFileNotFoundException("Cannot save sudoku solution to: "+filePath);
        }
    }

}

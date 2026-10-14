package com.ga.sudoku.Controller;

import com.ga.sudoku.Model.Sudoku;
import com.ga.sudoku.Solver.SudokuSolver;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SudokuController {

    @GetMapping("/sudoku/solve")
    public String solveSudoku(@RequestParam String file){
        //create Sudoku object
        Sudoku sudoku = new Sudoku();
        sudoku.loadPuzzle("src/main/resources/puzzles/" + file);

        //create solver object
        SudokuSolver solver = new SudokuSolver();

        if(solver.solve(sudoku.getSudokuBoard())){
            StringBuilder result = new StringBuilder();
            result.append("Puzzle solved\n\n");

            //outer loop: that goes through the 9 rows
            for (int row = 0; row < 9; row++) {
                //inner loop: that goes through the 9 columns
                for (int col = 0; col < 9; col++) {
                    int num = sudoku.getSudokuBoard()[row][col].getValue();
                    result.append(num).append(" ");
                }
                result.append("\n");//move to next row
            }

            //save solved puzzle to txt file
            String outputFile = file.replace(".txt", ".solution.txt");
            sudoku.saveSolution("src/main/resources/puzzles/" + outputFile);

            return result.toString();
        }

        return "No solution found";
    }

}

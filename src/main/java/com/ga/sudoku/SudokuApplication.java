package com.ga.sudoku;

import com.ga.sudoku.Model.Sudoku;
import com.ga.sudoku.Solver.SudokuSolver;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SudokuApplication {

	public static void main(String[] args) {

		SpringApplication.run(SudokuApplication.class, args);

		//create sudoku object
		Sudoku sudoku = new Sudoku();

		//load puzzle from file
		//sudoku.loadPuzzle("src/main/resources/puzzles/puzzle1.txt");

		//System.out.println("Puzzle 1");
		//sudoku.printBoard();

		//create solve object
		//SudokuSolver solver = new SudokuSolver();
		//if(solver.solve(sudoku.getSudokuBoard())){
			//System.out.println("\nPuzzle 1 Solved");
			//sudoku.printBoard();
			//sudoku.saveSolution("src/main/resources/puzzles/puzzle1.solution.txt");
		//} else{
			//System.out.println("No solution found");
		//}

	}

}

# Sudoku Solver

This project is a Sudoku solver built using Java and Spring Boot. It uses recursion and backtracking to solve Sudoku puzzles by checking the numbers in each row, column, and 3x3 box.

The program reads a puzzle from a text file, finds the empty cells, and tries numbers from 1 to 9 until the puzzle is solved. After solving, it displays the completed board and saves the solution in a new text file.

I also created a REST API to test the Sudoku solver using Postman. The project includes exception handling for missing files, invalid characters, and incorrect Sudoku values.

## Features

- **Load Puzzle:** Reads a Sudoku puzzle from a text file and stores the numbers in a 9x9 board.
- **Print Board:** Displays the Sudoku puzzle with separators between the 3x3 boxes.
- **Check Numbers:** Checks the row, column, and 3x3 box before placing a number.
- **Solve Puzzle:** Uses recursion and backtracking to find the correct numbers for empty cells.
- **Save Solution:** Saves the solved puzzle into a new `.solution.txt` file.
- **REST API:** Allows users to solve Sudoku puzzles by sending a GET request through Postman.
- **Exception Handling:** Handles missing files, invalid characters, and incorrect Sudoku values with error messages.

# Sudoku Solver

This project is a Sudoku solver built using Java and Spring Boot. It uses recursion and backtracking to solve Sudoku puzzles by checking the numbers in each row, column, and 3x3 box.

The program reads a puzzle from a text file, finds the empty cells, and tries numbers from 1 to 9 until the puzzle is solved. After solving, it displays the completed board and saves the solution in a new text file.

I also created a REST API to test the Sudoku solver using Postman. The project includes exception handling for missing files, invalid characters, and incorrect Sudoku values.

## Features

- **Load Puzzle:** Reads a Sudoku puzzle from a text file and stores the numbers in a 9x9 board.
- **Print Board:** Displays the Sudoku puzzle with separators between the 3x3 boxes.
- **Check Numbers:** Checks the row, column, and 3x3 box before placing a number.
- **Solve Puzzle:** Uses recursion and backtracking to find the correct numbers for empty cells.
- **Save Solution:** Saves the solved puzzle into a new `.solution.txt` file.
- **REST API:** Allows users to solve Sudoku puzzles by sending a GET request through Postman.
- **Exception Handling:** Handles missing files, invalid characters, and incorrect Sudoku values with error messages.

## How to Run the Project

1. Clone the repository from GitHub.
2. Open the project in IntelliJ IDEA.
3. Wait for Maven to load the dependencies.
4. Run `SudokuApplication.java`.
5. The application will start on port `8081`.

## How to Test Using Postman

1. Open Postman and create a new GET request.
2. Enter the URL:

   `http://localhost:8081/sudoku/solve`

3. Under the **Params** tab, add:
   - **Key:** `file`
   - **Value:** `puzzle1.txt`
4. Click **Send**.
5. The solved Sudoku board will appear in the response, and the solution will be saved as `puzzle1.solution.txt`.

You can also test `puzzle2.txt`, `puzzle3.txt`, and `puzzle4.txt` by changing the filename.

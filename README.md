# Sudoku Solver | Sudoku Studio

This project is a Sudoku solver built using Java and Spring Boot. It uses recursion and backtracking to solve Sudoku puzzles by checking the numbers in each row, column, and 3x3 box.

The program reads a puzzle from a text file, finds the empty cells, and tries numbers from 1 to 9 until the puzzle is solved. After solving, it displays the completed board and saves the solution in a new text file.

I also created a REST API to test the Sudoku solver using Postman. As an additional feature, I developed **Sudoku Studio**, an interactive web interface where users can play Sudoku with different difficulty levels and game controls.

## Features

### Sudoku Solver
- Loads Sudoku puzzles from text files into a 9x9 board.
- Checks rows, columns, and 3x3 boxes before placing numbers.
- Solves puzzles using recursion and backtracking.
- Displays the completed Sudoku board.
- Saves solutions into `.solution.txt` files.
- Handles missing files and invalid puzzle values.

### Sudoku Studio — Interactive Game
- **Interactive Board:** Users can select cells and enter numbers from 1 to 9.
- **Difficulty Levels:** Easy, medium, and hard puzzles.
- **Timer:** Tracks the time spent playing, with pause and resume options.
- **Hint System:** Helps users by revealing a correct number.
- **Input Validation:** Prevents invalid number entries.
- **Error Highlighting:** Highlights numbers that break Sudoku rules.
- **Check Solution:** Checks the player's completed or current board.
- **New Game:** Starts a new Sudoku game.
- **Save/Load:** Allows users to save their current game and continue later in the same browser.
- **Keyboard Support:** Supports number entry, arrow keys, and erase.

## Technologies Used

- **Java:** Sudoku logic and solving algorithm.
- **Spring Boot:** REST API and web application.
- **HTML:** Webpage structure.
- **CSS:** Navy blue and white responsive interface.
- **JavaScript:** Game interaction, timer, hints, and controls.
- **Maven:** Dependency management.
- **Postman:** REST API testing.
- **IntelliJ IDEA:** Development environment.

## How to Run the Project

1. Clone the repository from GitHub.
2. Open the project in IntelliJ IDEA.
3. Wait for Maven to load the dependencies.
4. Run `SudokuApplication.java` with the project root as the working directory.
5. The application starts on port `8081`.

### Play Sudoku Studio

Open your browser and visit:

`http://localhost:8081/`

Choose a difficulty level, select an empty cell, and enter a number using the number pad or keyboard.

You can use the timer, hints, erase, check solution, and save/load features while playing.

### Test the REST API Using Postman

Create a GET request:

`http://localhost:8081/sudoku/solve?file=puzzle1.txt`

The API loads the puzzle, solves it, returns the completed board, and saves the solution to a text file.

You can also test `puzzle2.txt`, `puzzle3.txt`, and `puzzle4.txt`.

## Error Handling

The project includes two custom exceptions:

- **InvalidCharacterException:** Handles invalid characters, incorrect values, incomplete puzzles, and extra values. Returns `400 Bad Request`.
- **SudokuFileNotFoundException:** Handles missing puzzle files. Returns `404 Not Found`.

The `SudokuExceptionHandler` class handles these exceptions and returns the error messages.

### Testing Error Handling

| Test File | Expected Result |
|---|---|
| `test/invalidPuzzle.txt` | 400 Bad Request |
| `test/incompletePuzzle.txt` | 400 Bad Request |
| `test/extraValuesPuzzle.txt` | 400 Bad Request |
| `missing.txt` | 404 Not Found |

## Testing

The Sudoku solver was tested using four puzzle files, and the REST API was tested using Postman.

The interactive web interface was also tested for number entry, difficulty selection, hints, timer, validation, error highlighting, and other game controls.

## Additional Notes

- The interactive interface uses the existing Java Sudoku solver through the REST API.
- Save/Load stores one game in the user's browser.
- The difficulty levels use selected puzzles from the existing puzzle collection.
- The project does not require a separate frontend server.

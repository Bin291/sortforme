import {Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, Input} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {RandomDialogComponent} from '../random-dialog/random-dialog.component';
import {CodeHighlightComponent} from '../code-highlight/code-highlight.component';
import {SortingChartComponent} from '../sorting-chart/sorting-chart.component';
interface AlgorithmState {
  name: string; // Kept: e.g., 'insertion', 'bubble'
  numbers: number[]; // Kept: The array being sorted
  currentStep: number; // Kept: General step counter
  isFinished: boolean; // Kept: Flag indicating completion
  startTime: number; // Kept: For timing execution
  endTime?: number; // Kept: For timing execution
  instructions?: string[]; // New: Pseudocode instructions for the current step

  steps?: any[];
  history?: { // Kept: Used by backStep logic
    numbers: number[];
    currentStep: number;
    swapIndices?: [number, number];
    currentAction: string;
    shellGap?: number;
    shellI?: number;
    radixDigit?: number;
    // Add copies of the new state fields here if backStep needs to restore them precisely
    compareIndices?: [number, number];
    i?: number; j?: number; key?: number; // Insertion
    swappedInPass?: boolean; // Bubble
    minIndex?: number; // Selection
    // No QuickSort specific state here as we use original steps logic
    shellJ?: number; shellTemp?: number; // Shell
    maxNum?: number; // Radix
    initialized?: boolean;
  }[];

  // --- Highlighting ---
  swapIndices?: [number, number]; // Kept: Indices just swapped/moved
  compareIndices?: [number, number]; // New: Indices being compared

  // --- Algorithm Specific State (New/Adapted) ---
  initialized?: boolean; // New: Flag for first run setup

  // Insertion Sort state
  i?: number;
  j?: number;
  key?: number;

  // Bubble Sort state
  // i?: number; // Using existing currentStep or deriving if needed
  // j?: number; // Using existing currentStep or deriving if needed
  swappedInPass?: boolean;

  // Selection Sort state
  // i?: number; // Using existing currentStep or deriving if needed
  // j?: number; // Using existing currentStep or deriving if needed
  minIndex?: number;

  // Quick Sort uses original `steps` logic - no new state needed here for that specific implementation


  shellGap?: number; // Kept: Current gap value
  shellI?: number; // Kept: Outer loop index for the current gap ('i')
  shellJ?: number; // New: Inner loop index ('j')
  shellTemp?: number; // New: Value being inserted ('temp')

  // Radix Sort state
  radixDigit?: number; // Kept: Current digit multiplier (1, 10, 100...)
  maxNum?: number; // New: Maximum number in the array (for termination check)

}
interface Step {
  action: string;
  snapshot: number[];
  low?: number;
  high?: number;
  i?: number;
  j?: number;
  pivotIndex?: number;
  line: number;
}



@Component({
  selector: 'app-sort-lab',
  templateUrl: 'sort-lab.component.html',
  styleUrls: ['sort-lab.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    NgForOf,
    NgClass,
    NgIf,
    CodeHighlightComponent,
    SortingChartComponent,
  ],
})

export class SortLabComponent implements OnInit, OnDestroy {
  mode: 'single' | 'dual' | 'all' = 'single';
  selectedAlgorithm: string = 'insertion';
  selectedAlgorithm2: string = 'bubble';
  numbers: number[] = [1, 2, 10, 23, 12, 18, 9 , 20, 25, 6, 7];
  newNumber: number | null = null;
  @Input() algorithmDescription: string = '';
  speed: number = 1;
  isPlaying: boolean = false;
  // currentStep: number = 0; // This is now managed per-state, but keep perhaps for global display? Check template usage.
  playButtonText: string = 'Play';
  pauseButtonText: string = 'Pause';
  private timeoutId: any = null;
  // --- Store full AlgorithmState for back/next ---
  previousStates: AlgorithmState[][] = []; // Store snapshots of the entire algorithmStates array
  currentAction: string = '';
  currentPseudoCode: string[] = [];
  currentLineIndex = -1; // Use -1 for no highlight initially


  @Output() stepChange = new EventEmitter<number>();

  @ViewChild('chart') chartComponent!: any; // Check if still needed with new structure
  previousValues: number[] = [];

  storePreviousValue(index: number): void {
    this.previousValues[index] = this.numbers[index];
  }


  // --- Holds the state for each active algorithm panel ---
  algorithmStates: AlgorithmState[] = [];

  algorithms: string[] = ['insertion', 'bubble', 'quick', 'shell', 'radix', 'selection'];
  algorithmNames: { [key: string]: string } = {
    insertion: 'Insertion Sort',
    bubble: 'Bubble Sort',
    quick: 'Quick Sort',
    shell: 'Shell Sort',
    radix: 'Radix Sort',
    selection: 'Selection Sort',
  };

  // --- Pseudocode remains the same ---
  pseudoCodes: { [key: string]: string[] } = {
    bubble: [
      'for (int i = 0; i < n - 1; i++) {',
      '  for (int j = 0; j < n - i - 1; j++) {',
      '    if (arr[j] > arr[j + 1]) {',
      '      swap(arr[j], arr[j + 1]);',
      '    }',
      '  }',
      '}'
    ],

    selection: [
      'for (int i = 0; i < n - 1; i++) {',
      '  int minIndex = i;',
      '  for (int j = i + 1; j < n; j++) {',
      '    if (arr[j] < arr[minIndex]) {',
      '      minIndex = j;',
      '    }',
      '  }',
      '  swap(arr[i], arr[minIndex]);',
      '}'
    ],

    insertion: [
      'for (int i = 1; i < n; i++) {',
      '  int key = arr[i];',
      '  int j = i - 1;',
      '  while (j >= 0 && arr[j] > key) {',
      '    arr[j + 1] = arr[j];',
      '    j--;',
      '  }',
      '  arr[j + 1] = key;',
      '}'
    ],

    quick: [
      'void quickSort(int arr[], int low, int high) {',
      '  if (low < high) {',
      '    int pi = partition(arr, low, high);',
      '    quickSort(arr, low, pi - 1);',
      '    quickSort(arr, pi + 1, high);',
      '  }',
      '}'
    ],

    shell: [
      'for (int gap = n / 2; gap > 0; gap /= 2) {',
      '  for (int i = gap; i < n; i++) {',
      '    int temp = arr[i];',
      '    int j;',
      '    for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {',
      '      arr[j] = arr[j - gap];',
      '    }',
      '    arr[j] = temp;',
      '  }',
      '}'
    ],

    radix: [
      'int max = getMax(arr, n);',
      'for (int exp = 1; max / exp > 0; exp *= 10) {',
      '  countSort(arr, n, exp);',
      '}'
    ]
  };




  algorithmDescriptions: { [key: string]: string } = {
    insertion: `1. Iterate through the array, starting from the second element\n
2. For each element, compare it with the elements to its left\n
3. Insert the element in the correct position in the sorted portion\n
- Time Complexity: Best O(n), Average/Worst O(n^2)\n
- Space Complexity: O(1)`,

    bubble: `'1. Iterate through the array multiple times' \n\
    2. Compare adjacent elements and swap if they are in the wrong order \n\
    3. Repeat until no swaps are needed \n\
    - Time Complexity: Best O(n), Average/Worst O(n^2) \n\
    - Space Complexity: O(1)`,



    shell: `1. Start with a large gap, compare elements far apart\n
2. Reduce the gap and repeat comparisons (insertion sort on gapped elements)\n
3. Finish with gap = 1 (standard insertion sort on nearly sorted array)
- Time Complexity: Depends on gap sequence, typically between O(n) and O(n^2)
- Space Complexity: O(1)`,

    radix: `1. Sort numbers based on least significant digit using a stable sort (counting sort)
2. Move to the next significant digit and repeat the stable sort
3. Continue until the most significant digit is processed
- Time Complexity: O(nk), where k is the number of digits
- Space Complexity: O(n + k)`,

    selection: `1. Find the minimum element in the unsorted portion
2. Swap it with the first element of the unsorted portion
3. Move the boundary of the sorted portion one step to the right
- Time Complexity: O(n^2) in all cases
- Space Complexity: O(1)`
  };


  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    const savedMode = localStorage.getItem('sortLabMode') as 'single' | 'dual' | 'all';
    this.mode = savedMode || 'single';
    this.updateDescription();
    this.reset();
  }

  ngOnDestroy() {
    this.clearTimeout();
  }

  setMode(mode: 'single' | 'dual' | 'all') {
    this.mode = mode;
    localStorage.setItem('sortLabMode', mode);
    this.reset();
  }

  // --- UI Helper functions (getMaxHeight, getBarHeight, getBarWidth) remain unchanged ---
  getMaxHeight(numbers: number[]): number {
    const maxValue = Math.max(...numbers, 1);
    const maxHeight = this.mode === 'all' ? 150 : 300;
    const minHeightFactor = 2;

    if (maxValue < 10) {
      return (maxHeight / 10) * minHeightFactor;
    }
    const scaleFactor = maxHeight / Math.min(maxValue, 1000);
    return scaleFactor;
  }

  getBarHeight(num: number, numbers: number[]): number {
    const minHeight = 10;
    const calculatedHeight = num * this.getMaxHeight(numbers);
    return Math.max(minHeight, calculatedHeight);
  }

  getBarWidth(numbers: number[]): number {
    const baseWidth = this.mode === 'all' ? 10 : 15;
    const minWidth = this.mode === 'all' ? 5 : 10;
    const maxElements = 50;
    const numElements = numbers.length;

    let calculatedWidth = baseWidth;
    if (numElements > maxElements) {
      calculatedWidth = baseWidth * (maxElements / numElements);
    }
    return Math.max(minWidth, calculatedWidth);
  }

  getCompactMaxHeight(numbers: number[]): number {
    const maxValue = Math.max(...numbers, 1);
    const maxHeight = 150; // Height of the div
    const minHeightFactor = 2;

    if (maxValue < 10) {
      return (maxHeight / 10) * minHeightFactor;
    }
    const scaleFactor = maxHeight / Math.min(maxValue, 1000);
    return scaleFactor;
  }

  getCompactBarHeight(num: number, numbers: number[]): number {
    const minHeight = 5; // Smaller minimum height for compact view
    const calculatedHeight = num * this.getCompactMaxHeight(numbers);
    return Math.max(minHeight, calculatedHeight);
  }

  getCompactBarWidth(numbers: number[]): number {
    const baseWidth = 10; // Adjusted for compact view
    const minWidth = 5; // Smaller minimum width for compact view
    const maxElements = 30; // Fewer elements for compact view
    const numElements = numbers.length;

    let calculatedWidth = baseWidth;
    if (numElements > maxElements) {
      calculatedWidth = baseWidth * (maxElements / numElements);
    }
    return Math.max(minWidth, calculatedWidth);
  }



  addNumber() {
    if (this.newNumber !== null) {
      if (this.newNumber > 1000) {
        alert('Input number cannot be greater than 1000!');
        this.newNumber = null;
        return;
      }
      // Ensure numbers don't exceed reasonable limit for visualization
      if (this.numbers.length >= 100) {
        alert('Maximum number of elements (100) reached.');
        this.newNumber = null;
        return;
      }
      this.numbers.push(this.newNumber);
      this.newNumber = null;
      this.reset();
    }
  }
  checkEmptyOrInvalid(index: number): void {
    const value = this.numbers[index];
    if (
      value == null ||
      isNaN(Number(value)) ||
      !Number.isInteger(value) ||
      Number(value) < 0
    ) {
      alert('Please enter a non-negative integer.');
      this.removeNumber(index);
    } else if (Number(value) > 1000) {
      alert('Input number cannot be greater than 1000!');
      this.removeNumber(index);
    }
  }

  removeNumber(index: number): void {
    this.numbers.splice(index, 1);
    this.reset();
  }


  randomize() {
    const dialogRef = this.dialog.open(RandomDialogComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result <= 100 && result > 0) { // Limit random elements
        this.numbers = Array.from({ length: result }, () => Math.floor(Math.random() * 100) + 1); // Adjust range if needed
        this.reset();
      } else if (result > 100) {
        alert("Maximum number of elements to randomize is 100.");
      }
    });
  }

  clear() {
    this.numbers = [];
    this.reset();
  }

  // reset() {
  //   this.isPlaying = false;
  //   // this.currentStep = 0; // Remove reliance on global currentStep
  //   this.currentAction = '';
  //   this.playButtonText = 'Play';
  //   this.pauseButtonText = 'Pause';
  //   this.isPaused = false; // Ensure pause state is reset
  //   this.clearTimeout();
  //   this.currentLineIndex = -1; // Reset highlight
  //   this.stepChange.emit(this.currentLineIndex); // Emit reset highlight
  //   this.clearTimeout();
  //   this.algorithmStates = [];
  //   this.previousStates = []; // Clear history
  //
  //   // Ensure numbers array has valid data before creating states
  //   if (!this.numbers || this.numbers.length === 0) {
  //     this.numbers = [1, 2, 10, 23, 12, 18, 9 , 20, 25, 6, 7]; // Default if empty
  //   } else {
  //     // Optional: Ensure all numbers are valid integers
  //     this.numbers = this.numbers.map(n => Number.isInteger(n) && n >= 0 && n <= 1000 ? n : 0).filter(n => n !== null);
  //   }
  //   const createInitialState = (algoName: string): AlgorithmState => ({
  //     name: algoName,
  //     numbers: [...this.numbers],
  //     currentStep: 0,
  //     isFinished: false,
  //     startTime: 0,
  //     history: [],
  //     initialized: false, // Ensure step function initializes state
  //     compareIndices: undefined, // Ensure these are reset
  //     swapIndices: undefined,
  //     // Reset other specific fields
  //     i: undefined, j: undefined, key: undefined, // Insertion
  //     swappedInPass: undefined, // Bubble
  //     minIndex: undefined, // Selection
  //     shellGap: undefined, shellI: undefined, shellJ: undefined, shellTemp: undefined, // Shell
  //     radixDigit: undefined, maxNum: undefined, // Radix
  //     steps: (algoName === 'quick') ? this.generateQuickSortSteps([...this.numbers], 0, this.numbers.length - 1) : undefined,
  //   });
  //
  //
  //   if (this.mode === 'single') {
  //     this.algorithmStates = [
  //       { name: this.selectedAlgorithm, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
  //     ];
  //   } else if (this.mode === 'dual') {
  //     this.algorithmStates = [
  //       { name: this.selectedAlgorithm, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
  //       { name: this.selectedAlgorithm2, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
  //     ];
  //   } else if (this.mode === 'all') {
  //     this.algorithmStates = this.algorithms.map(algo => ({
  //       name: algo,
  //       numbers: [...this.numbers],
  //       currentStep: 0,
  //       isFinished: false,
  //       startTime: 0,
  //     }));
  //   }
  //
  //   // Update description for single mode
  //   if (this.mode === 'single') {
  //     this.updateDescription();
  //     this.currentPseudoCode = this.pseudoCodes[this.selectedAlgorithm] || [];
  //   } else {
  //     this.algorithmDescription = ''; // Clear description in multi modes maybe?
  //     this.currentPseudoCode = []; // Clear pseudocode in multi modes
  //   }
  //
  //   this.algorithmStates.forEach(state => {
  //     if (state.name === 'quick') {
  //       state.steps = this.generateQuickSortSteps([...state.numbers], 0, state.numbers.length - 1);
  //     } else if (state.name === 'shell') {
  //       state.shellGap = Math.floor(state.numbers.length / 2);
  //       state.shellI = state.shellGap;
  //     } else if (state.name === 'radix') {
  //       state.radixDigit = 1;
  //     }
  //   });
  //
  // }
  reset() {
    this.isPlaying = false;
    // this.currentStep = 0;
    this.currentAction = '';
    this.playButtonText = 'Play';
    this.pauseButtonText = 'Pause';
    this.clearTimeout(); // Hủy setTimeout khi reset
    this.algorithmStates = [];

    if (this.mode === 'single') {
      this.algorithmStates = [
        { name: this.selectedAlgorithm, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0, instructions: [...this.updateDescription()]},

      ];
    } else if (this.mode === 'dual') {
      this.algorithmStates = [
        { name: this.selectedAlgorithm, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
        { name: this.selectedAlgorithm2, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
      ];
    } else if (this.mode === 'all') {
      this.algorithmStates = this.algorithms.map(algo => ({
        name: algo,
        numbers: [...this.numbers],
        currentStep: 0,
        isFinished: false,
        startTime: 0,
      }));
    }

    this.algorithmStates.forEach(state => {
      if (state.name === 'quick') {
        state.steps = this.generateQuickSortSteps([...state.numbers], 0, state.numbers.length - 1);
      } else if (state.name === 'shell') {
        state.shellGap = Math.floor(state.numbers.length / 2);
        state.shellI = state.shellGap;
      } else if (state.name === 'radix') {
        state.radixDigit = 1;
      }
    });
  }


  submit() {
    this.play();
    this.reset();

  }

  play() {
    // Check if already finished or numbers are empty
    if (this.algorithmStates.every(s => s.isFinished) || this.numbers.length === 0) {
      this.reset(); // Reset if finished or empty before playing
    }
    if (this.isPaused) {
      this.resumeSorting();
      return;
    }
    this.isPlaying = true;
    this.isPaused = false;
    this.playButtonText = 'Playing...';
    this.pauseButtonText = 'Pause'; // Set pause button text correctly
    this.currentAction = 'Sorting started!';
    // Record start time only if not already started/resumed
    this.algorithmStates.forEach(state => {
      if (state.startTime === 0) state.startTime = Date.now()
    });
    this.runAlgorithms();
  }

  // --- Pause/Resume logic remains unchanged ---
  isPaused = false;

  togglePause() {
    if (!this.isPlaying && !this.isPaused) return; // Do nothing if not playing or already paused

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseSorting();
    } else {
      this.resumeSorting();
    }
  }

  pauseSorting() {
    this.isPlaying = false; // Set playing to false when paused
    // Keep isPaused = true
    this.playButtonText = 'Play'; // Show 'Play' as it's paused
    this.pauseButtonText = 'Resume'; // Indicate pausing action changes to resume
    this.currentAction = 'Sorting paused!';
    this.clearTimeout();
  }

  resumeSorting() {
    if (!this.isPaused) return; // Should not happen if called from togglePause

    this.isPlaying = true;
    this.isPaused = false;
    this.playButtonText = 'Playing...'; // Indicate it's running
    this.pauseButtonText = 'Pause'; // Indicate pausing action is available
    this.currentAction = 'Sorting resumed!';
    this.runAlgorithms(); // Continue the loop
  }

  // --- Step Forward/Backward Logic (Adjusted for AlgorithmState[][]) ---
  nextStep() {
    if (this.isPlaying || this.algorithmStates.every(s => s.isFinished)) return; // Don't step if playing or finished

    // Clone the entire array of states for history
    const clonedStates: AlgorithmState[] = JSON.parse(JSON.stringify(this.algorithmStates));
    this.previousStates.push(clonedStates); // Push the snapshot before the step

    let actionTaken = false;
    this.algorithmStates.forEach(state => {
      if (!state.isFinished) {
        this.runAlgorithmStep(state); // Execute one step for each *active* state
        actionTaken = true; // Record that at least one step was taken
        // Update global line index if in single mode for code highlight
        if (this.mode === 'single') {
          // this.currentLineIndex is updated inside runAlgorithmStep via this.stepChange.emit
        }
      }
    });

    if (!actionTaken) {
      this.currentAction = "Sorting already complete.";
      this.previousStates.pop(); // Remove the state we just pushed as nothing happened
    } else {
      this.currentAction = 'Stepped forward'; // General action message
    }
    // Update global highlight if needed (e.g., for single mode)
    if (this.mode === 'single' && this.algorithmStates.length > 0) {
      // The highlight is set within runAlgorithmStep using stepChange.emit
    }
  }


  backStep() {
    if (this.isPlaying || this.previousStates.length === 0) return; // Don't step back if playing or no history

    this.clearTimeout(); // Stop any potential execution
    this.isPlaying = false;
    this.isPaused = false; // Ensure not paused
    this.playButtonText = 'Play';
    this.pauseButtonText = 'Pause';


    const previousSnapshot = this.previousStates.pop();
    if (previousSnapshot) {
      // Restore the entire array of states
      this.algorithmStates = JSON.parse(JSON.stringify(previousSnapshot));
      this.currentAction = 'Stepped back';
      // Update highlight based on the restored state(s)
      if (this.mode === 'single' && this.algorithmStates.length > 0) {
        this.currentLineIndex = -1; // Reset highlight
        this.stepChange.emit(this.currentLineIndex);

        // If the history object stored more details, we could restore precisely:
        // const singleState = this.algorithmStates[0];
        // const lastHistoryEntry = singleState.history?.[singleState.history.length - 1];
        // this.currentLineIndex = lastHistoryEntry?.currentLineIndex ?? -1; // Assuming currentLineIndex was saved
        // this.stepChange.emit(this.currentLineIndex);
      }
    }
  }

  canGoBack(): boolean {
    // Can go back if not playing and history exists
    return !this.isPlaying && this.previousStates.length > 0;
  }

  // --- Speed Control remains unchanged ---
  onSpeedChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value);
    console.log('Speed changed to:', value);
    this.speed = Math.max(0.1, value); // Prevent speed being 0 or negative
    if (this.isPlaying && !this.isPaused) { // Only restart loop if actively playing
      this.clearTimeout();
      this.runAlgorithms();
    }
  }

  updateDescription(): string[] {
    this.algorithmDescription = this.algorithmDescriptions[this.selectedAlgorithm] || ' ';
    this.currentPseudoCode = this.pseudoCodes[this.selectedAlgorithm] || [];
    this.currentLineIndex = -1;
    this.stepChange.emit(this.currentLineIndex);
    return this.currentPseudoCode;
  }
  // --- Bar Color Logic (uses compareIndices now too) ---
  getBarColor(index: number, state: AlgorithmState): string {
    if (state.isFinished) {
      return '#4CAF50'; // Green for finished sorted elements
    }
    if (state.swapIndices) {
      if (index === state.swapIndices[0] || index === state.swapIndices[1]) {
        return '#ffeb3b'; // Yellow for swapped/moved elements
      }
    }
    if (state.compareIndices) {
      if (index === state.compareIndices[0] || index === state.compareIndices[1]) {
        return '#ff9800'; // Orange for comparing elements
      }
    }
    // Optional: Highlight pivot in QuickSort (if state tracking allows)
    // if (state.name === 'quick' && index === state.pivotIndex) {
    //     return '#f44336'; // Red for pivot
    // }
    // Optional: Highlight 'key' or 'temp' element being inserted/shifted
    // This requires storing the *index* of the key/temp if different from swap/compare indices
    // if (state.name === 'insertion' && index === state.i) return '#9c27b0'; // Purple for element being processed
    // if (state.name === 'shell' && index === state.shellI) return '#9c27b0'; // Purple for element being processed


    return '#673ab7'; // Default bar color
  }

  // --- runAlgorithms loop remains unchanged ---
  runAlgorithms() {
    if (!this.isPlaying || this.isPaused) return; // Stop if paused or manually stopped

    this.clearTimeout(); // Clear previous timeout before setting a new one

    this.timeoutId = setTimeout(() => {
      if (!this.isPlaying || this.isPaused) return; // Check again in case state changed during timeout

      let allFinished = true;
      let actionTakenInStep = false; // Track if any state actually advanced

      this.algorithmStates.forEach(state => {
        if (!state.isFinished) {
          const stepBefore = state.currentStep; // Store step before running
          this.runAlgorithmStep(state);
          if (state.currentStep !== stepBefore || state.isFinished) {
            actionTakenInStep = true; // An action occurred (step incremented or finished)
          }
          if (!state.isFinished) {
            allFinished = false;
          } else if (!state.endTime) { // Set end time only once
            state.endTime = Date.now();
          }
        }
      });

      // Only continue looping if not all finished AND an action was taken
      // This prevents infinite loops if runAlgorithmStep gets stuck
      if (!allFinished && actionTakenInStep) {
        this.runAlgorithms(); // Schedule next step
      } else if (allFinished) {
        this.isPlaying = false;
        this.isPaused = false;
        this.playButtonText = 'Play';
        this.pauseButtonText = 'Pause';
        this.currentAction = 'Sorting complete!';
        this.currentLineIndex = -1; // Clear highlight on finish
        this.stepChange.emit(this.currentLineIndex);
        // Final highlight for sorted state (optional)
        this.algorithmStates.forEach(state => state.swapIndices = undefined); // Clear swap highlight
      } else if (!actionTakenInStep) {
        console.warn("Algorithm loop stopped: No state advanced in the last step. Possible infinite loop or error in algorithm logic.");
        this.isPlaying = false; // Stop execution
        this.isPaused = false;
        this.playButtonText = 'Play';
        this.pauseButtonText = 'Pause';
        this.currentAction = 'Sorting stopped due to potential issue.';
      }
    }, 2000 / this.speed); // Use speed for delay
  }

  // --- clearTimeout remains unchanged ---
  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }


  runAlgorithmStep(state: AlgorithmState) {
    const nums = state.numbers;

    // Prevent running if already finished
    if (state.isFinished) {
      return;
    }

    // Reset highlights for this step
    state.compareIndices = undefined;
    state.swapIndices = undefined;
    // Don't reset currentLineIndex here, let the algorithm logic set it

    // Initialize state on the very first call for this specific algorithm run
    if (!state.initialized) {
      state.initialized = true;
      // currentStep is already 0 from reset()
      switch (state.name) {
        case 'insertion':
          state.i = 1; // Start insertion from the second element
          if (nums.length > 1) {
            state.key = nums[1];
            state.j = 0; // j starts at i - 1
          } else state.isFinished = true;
          break;
        case 'bubble':
          state.i = 0; // Pass number
          state.j = 0; // Comparison index in the current pass
          state.swappedInPass = false;
          if (nums.length <= 1) state.isFinished = true;
          break;
        case 'selection':
          state.i = 0; // Position to fill
          state.minIndex = 0;
          state.j = 1; // Start searching for min from i+1
          if (nums.length <= 1) state.isFinished = true;
          break;

        case 'quick':
              if (!state.steps) {
                state.steps = this.generateQuickSortSteps([...nums], 0, nums.length - 1);
                if (!state.steps) {
                  state.isFinished = true;
                  this.currentAction = "Error generating QuickSort steps.";
                  this.currentLineIndex = -1;
                  break;
                }
              }

              if (state.currentStep < state.steps.length) {
                const step = state.steps[state.currentStep];
                this.currentLineIndex = step.line ?? 2;
                this.stepChange.emit(this.currentLineIndex);

                // Update the display array from the snapshot
                if (step.snapshot) {
                  this.numbers = [...step.snapshot];
                }

                state.swapIndices = [step.i, step.j];
                this.currentAction = `QuickSort: Swapped ${step.snapshot?.[step.i]} and ${step.snapshot?.[step.j]}`;
                state.currentStep++;

              } else {
                if (!state.isFinished) {
                  state.isFinished = true;
                  state.swapIndices = undefined;
                  this.currentAction = "QuickSort finished.";
                  this.currentLineIndex = -1;
                }
              }
              break;

        case 'shell':
          state.shellGap = Math.floor(nums.length / 2);
          if (state.shellGap > 0) {
            state.shellI = state.shellGap; // Outer loop index ('i') starts at gap
            state.shellTemp = nums[state.shellI]; // Element to insert
            state.shellJ = state.shellI; // Inner loop index ('j') starts at i
          } else {
            state.isFinished = true; // No gaps needed
          }
          if (nums.length <= 1) state.isFinished = true;
          break;
        case 'radix':
          state.radixDigit = 1;
          state.maxNum = nums.length > 0 ? Math.max(...nums) : 0;
          if ((state.maxNum === 0 && nums.length <= 1) || nums.length === 0) {
            state.isFinished = true; // Handle empty or single zero element
          }
          break;
      }
      // Initial highlight might be the first line of the relevant pseudocode
      this.currentLineIndex = 0; // Default to first line on init
      this.stepChange.emit(this.currentLineIndex);
    }

    // --- Execute one step based on algorithm ---
    const algo = state.name;
    let nextLineIndex = this.currentLineIndex; // Track next highlight index

    switch (algo) {
      case 'insertion':
        if (state.i! < nums.length) {
          nextLineIndex = 0; // About to check/enter loop for i

          if (state.j! >= 0 && nums[state.j!] > state.key!) {
            // --- Shift Step ---
            nextLineIndex = 3; // While condition was true
            this.stepChange.emit(nextLineIndex); // Highlight check
            nextLineIndex = 4; // Action: arr[j + 1] = arr[j]
            nums[state.j! + 1] = nums[state.j!];
            state.swapIndices = [state.j! + 1, state.j!]; // Visualize shift
            this.currentAction = `Shifting ${nums[state.j! + 1]} to position ${state.j! + 1}`; // Use value *after* move
            state.j!--;
            nextLineIndex = 5; // Action: j = j - 1 (implicit) -> highlight while again next
          } else {
            // --- Insertion Step ---
            nextLineIndex = 3; // While condition is now false (or was initially)
            this.stepChange.emit(nextLineIndex); // Highlight check
            nextLineIndex = 6; // Action: arr[j + 1] = key
            nums[state.j! + 1] = state.key!;
            // Use state.i for original position if needed for visualization
            state.swapIndices = [state.j! + 1, state.i!]; // Show insertion point and original slot conceptually
            this.currentAction = `Inserted ${state.key!} at position ${state.j! + 1}`;

            // --- Move to next element ---
            state.i!++;
            if (state.i! < nums.length) {
              state.key = nums[state.i!];
              state.j = state.i! - 1;
              nextLineIndex = 0; // Next step will highlight outer loop start conceptually
            } else {
              state.isFinished = true;
              this.currentAction = 'Array is sorted';
              nextLineIndex = -1; // Finished
            }
          }
        } else {
          if (!state.isFinished) { // Ensure finish state is set only once
            state.isFinished = true;
            this.currentAction = 'Array is sorted';
            nextLineIndex = -1;
          }
        }
        break;

      case 'bubble':
        const n_bubble = nums.length;
        if (state.i! < n_bubble - 1) {
          nextLineIndex = 0; // Outer loop start/continue

          if (state.j! < n_bubble - state.i! - 1) {
            // --- Compare Step ---
            nextLineIndex = 1; // Inner loop start/continue
            this.stepChange.emit(nextLineIndex);
            nextLineIndex = 2; // Condition: if arr[j] > arr[j+1]
            state.compareIndices = [state.j!, state.j! + 1];
            this.currentAction = `Comparing ${nums[state.j!]} and ${nums[state.j! + 1]}`;

            if (nums[state.j!] > nums[state.j! + 1]) {
              // --- Swap Step ---
              this.stepChange.emit(nextLineIndex); // Emit line 2 (comparison was true)
              nextLineIndex = 3; // Action: swap(arr[j], arr[j+1])
              [nums[state.j!], nums[state.j! + 1]] = [nums[state.j! + 1], nums[state.j!]];
              state.swapIndices = [state.j!, state.j! + 1];
              state.swappedInPass = true;
              this.currentAction = `Swapped ${nums[state.j! + 1]} with ${nums[state.j!]}`; // Describe post-swap
            }
            state.j!++;
          } else {
            nextLineIndex = 0;
            if (!state.swappedInPass!) {
              state.isFinished = true;
              this.currentAction = 'Array is sorted (no swaps in last pass)';
              nextLineIndex = -1;
            } else {
              state.i!++;
              state.j = 0;
              state.swappedInPass = false;
              if (state.i! >= n_bubble - 1) {
                state.isFinished = true;
                this.currentAction = 'Array is sorted';
                nextLineIndex = -1;
              }
            }
          }
        } else {
          if (!state.isFinished) {
            state.isFinished = true;
            this.currentAction = 'Array is sorted';
            nextLineIndex = -1;
          }
        }
        break;

      case 'selection':
        const n_selection = nums.length;
        if (state.i! < n_selection - 1) {
          nextLineIndex = 0; // Outer loop start/continue

          if (state.j! < n_selection) {
            // --- Inner loop: Find minimum ---
            nextLineIndex = 1; // Inner loop start/continue
            this.stepChange.emit(nextLineIndex);
            nextLineIndex = 2; // Condition: if arr[j] < arr[minIndex]
            state.compareIndices = [state.j!, state.minIndex!];
            this.currentAction = `Comparing ${nums[state.j!]} with current min ${nums[state.minIndex!]}`;

            if (nums[state.j!] < nums[state.minIndex!]) {
              this.stepChange.emit(nextLineIndex); // Emit line 2 (comparison was true)
              nextLineIndex = 3; // Action: minIndex = j (implicit line)
              state.minIndex = state.j!;
              this.currentAction += `. New min found: ${nums[state.minIndex!]}`;
            }
            // --- Move to next element to check ---
            state.j!++;
            // nextLineIndex remains 1 for next inner loop iteration or 4 if loop ends

          } else {
            // --- End of inner loop: Swap minimum to position i ---
            nextLineIndex = 4; // Action: swap(arr[i], arr[minIndex])
            if (state.minIndex !== state.i!) {
              [nums[state.i!], nums[state.minIndex!]] = [nums[state.minIndex!], nums[state.i!]];
              state.swapIndices = [state.i!, state.minIndex!];
              this.currentAction = `Swapped min ${nums[state.i!]} into position ${state.i!}`; // Describe post-swap
            } else {
              this.currentAction = `Element ${nums[state.i!]} already in correct position ${state.i!}`;
              state.swapIndices = undefined;
            }

            // --- Move to next position to fill ---
            state.i!++;
            if (state.i! < n_selection - 1) {
              state.minIndex = state.i!;
              state.j = state.i! + 1;
              nextLineIndex = 0; // Next step starts outer loop again
            } else {
              state.isFinished = true;
              this.currentAction = 'Array is sorted';
              nextLineIndex = -1;
            }
          }
        } else {
          if (!state.isFinished) {
            state.isFinished = true;
            this.currentAction = 'Array is sorted';
            nextLineIndex = -1;
          }
        }
        break;

      case 'quick':
        if (!state.steps) {
          state.steps = this.generateQuickSortSteps([...nums], 0, nums.length - 1);
          if (!state.steps) {
            state.isFinished = true;
            this.currentAction = "Error generating QuickSort steps.";
            nextLineIndex = -1;
            break;
          }
        }

        if (state.currentStep < state.steps.length) {
          const step = state.steps[state.currentStep];
          nextLineIndex = step.line ?? 2;
          this.stepChange.emit(nextLineIndex);

          if (step.snapshot) {
            state.numbers = [...step.snapshot];
          }

          state.swapIndices = [step.i, step.j];
          this.currentAction = `QuickSort: Swapped ${step.snapshot?.[step.i]} and ${step.snapshot?.[step.j]}`;
          state.currentStep++;

        } else {
          if (!state.isFinished) {
            state.isFinished = true;
            state.swapIndices = undefined;
            this.currentAction = "QuickSort finished.";
            nextLineIndex = -1;
          }
        }
        break;

      case 'shell':
        // Adapted to use shellGap, shellI, shellJ, shellTemp
        if (state.shellGap! > 0) {
          nextLineIndex = 0; // Outer loop (gap change)

          if (state.shellI! < nums.length) {
            // --- Insertion sort within the gap ---
            nextLineIndex = 1; // Inner loop (i = gap to n-1)

            // Compare/Shift part (while loop)
            if (state.shellJ! >= state.shellGap! && nums[state.shellJ! - state.shellGap!] > state.shellTemp!) {
              // --- Shift Step ---
              nextLineIndex = 3; // While condition was true
              this.stepChange.emit(nextLineIndex);
              nextLineIndex = 4; // Action: arr[j] = arr[j-gap]
              nums[state.shellJ!] = nums[state.shellJ! - state.shellGap!];
              state.swapIndices = [state.shellJ!, state.shellJ! - state.shellGap!];
              this.currentAction = `Shell Shift (gap ${state.shellGap!}): Moved ${nums[state.shellJ!]} from index ${state.shellJ! - state.shellGap!}`;
              state.shellJ! -= state.shellGap!;
              nextLineIndex = 5; // Action: j -= gap (implicit) -> back to while check
            } else {
              // --- Insertion Step ---
              nextLineIndex = 3; // While condition is false
              this.stepChange.emit(nextLineIndex);
              nextLineIndex = 6; // Action: arr[j] = temp
              nums[state.shellJ!] = state.shellTemp!;
              // Visualize insertion relative to original position 'i'
              state.swapIndices = [state.shellJ!, state.shellI!];
              this.currentAction = `Shell Insert (gap ${state.shellGap!}): Placed ${state.shellTemp!} at index ${state.shellJ!}`;

              // --- Move to next element for this gap (increment i) ---
              state.shellI!++;
              if (state.shellI! < nums.length) {
                state.shellTemp = nums[state.shellI!];
                state.shellJ = state.shellI!;
                nextLineIndex = 1; // Next step conceptually highlights inner loop start again
              }
              // If state.shellI reaches nums.length, the outer loop for this gap is done. Fall through to gap reduction.
            }
          }

          if (state.shellI! >= nums.length) {
            // --- Finished pass for current gap, move to next gap ---
            nextLineIndex = 0; // Conceptually finishing the gap loop pass
            state.shellGap = Math.floor(state.shellGap! / 2);
            if (state.shellGap! > 0) {
              state.shellI = state.shellGap!;
              state.shellTemp = nums[state.shellI!];
              state.shellJ = state.shellI!;
              this.currentAction = `Starting next Shell pass with gap ${state.shellGap!}`;
              // nextLineIndex remains 0 for the new pass start
            } else {
              // --- All gaps processed ---
              if (!state.isFinished) {
                state.isFinished = true;
                this.currentAction = 'Array is sorted';
                nextLineIndex = -1;
              }
            }
          }
        } else {
          // Should have been caught by gap > 0 check, but safety finish
          if (!state.isFinished) {
            state.isFinished = true;
            this.currentAction = 'Array is sorted';
            nextLineIndex = -1;
          }
        }
        break; // End case 'shell'


      case 'radix':
        // Performs one pass of counting sort for the current digit place
        // Use state.maxNum calculated during initialization
        if (state.radixDigit! <= state.maxNum! && state.maxNum! > 0 && nums.length > 0) {
          const digit = state.radixDigit!;
          this.currentAction = `Radix Sort: Processing digit place ${digit}`;

          nextLineIndex = 1; // Conceptual start of counting sort for digit
          this.stepChange.emit(nextLineIndex);

          const output = new Array(nums.length).fill(0);
          const count = new Array(10).fill(0);

          // 1. Count frequencies
          nextLineIndex = 2; // count frequency
          this.stepChange.emit(nextLineIndex);
          for (let i = 0; i < nums.length; i++) {
            const digitValue = Math.floor(nums[i] / digit) % 10;
            count[digitValue]++;
          }

          // 2. Cumulative count
          nextLineIndex = 3; // cumulative count
          this.stepChange.emit(nextLineIndex);
          for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
          }

          // 3. Build output array (stable)
          nextLineIndex = 4; // build output array
          this.stepChange.emit(nextLineIndex);
          for (let i = nums.length - 1; i >= 0; i--) {
            const digitValue = Math.floor(nums[i] / digit) % 10;
            output[count[digitValue] - 1] = nums[i];
            count[digitValue]--;
          }

          // 4. Copy output back to nums
          nextLineIndex = 5; // copy to nums
          this.stepChange.emit(nextLineIndex);
          let changed = false;
          for (let i = 0; i < nums.length; i++) {
            if (nums[i] !== output[i]) changed = true;
            nums[i] = output[i];
          }

          // --- Prepare for next digit ---
          state.radixDigit! *= 10;
          this.currentAction = `Radix Sort: Finished pass for digit ${digit}`;
          // Highlight the whole array briefly to show the pass completed
          // state.swapIndices = [0, nums.length - 1]; // Or remove this for less flashing

          // Check if next digit pass is needed
          if (state.radixDigit! > state.maxNum!) {
            if (!state.isFinished) {
              state.isFinished = true;
              this.currentAction = 'Array is sorted';
              nextLineIndex = -1;
            }
          } else {
            nextLineIndex = 1; // Ready for next digit pass
          }

        } else {
          if (!state.isFinished) {
            state.isFinished = true;
            this.currentAction = 'Array is sorted';
            nextLineIndex = -1;
          }
        }
        break; // End case 'radix'
    } // End switch(algo)


    if (!state.isFinished && this.isSorted(nums)) {
      console.warn(`Algorithm '${state.name}' reported not finished, but array is sorted. Marking finished.`);
      state.isFinished = true;
      state.swapIndices = undefined;
      state.compareIndices = undefined;
      this.currentAction = 'Array is sorted';
      nextLineIndex = -1; // Mark as finished visually
    }


    if (this.mode === 'single') {
      this.currentLineIndex = nextLineIndex;
      this.stepChange.emit(this.currentLineIndex);
    } else {

    }


    state.currentStep++;


    // NO setTimeout here - runAlgorithms handles the delay
  } // End runAlgorithmStep

  isSorted(nums: number[]): boolean {
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i] > nums[i + 1]) {
        return false;
      }
    }
    return true;
  }

  generateQuickSortSteps(nums: number[], low: number, high: number): any[] {
    const steps: any[] = [];
    const numsCopy = [...nums];
    this.quickSortSteps(numsCopy, 0, numsCopy.length - 1, steps);
    console.log("Steps:", steps);
    console.log("Final sorted array:", numsCopy);
    console.log("Sorted:", numsCopy);
    console.log("isSorted:", this.isSorted(numsCopy)); // true

    return steps;
  }

  quickSortSteps(arr: number[], low: number, high: number, steps: Step[]): void {
    const stack: { low: number; high: number }[] = [];
    stack.push({ low, high });

    while (stack.length > 0) {
      const { low, high } = stack.pop()!;
      if (low < high) {
        steps.push({
          action: 'recursive-call',
          low,
          high,
          snapshot: [...arr],
          line: 1
        });

        const pi = this.partition(arr, low, high, steps);

        stack.push({ low: pi + 1, high: high });
        stack.push({ low: low, high: pi - 1 });
      }
    }
  }




  partition(arr: number[], low: number, high: number, steps: any[]): number {
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
      action: 'choose-pivot',
      pivotIndex: high,
      snapshot: [...arr],
      line: 2
    });

    for (let j = low; j < high; j++) {
      steps.push({
        action: 'compare',
        i,
        j,
        pivotIndex: high,
        snapshot: [...arr],
        line: 3
      });

      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];

        steps.push({
          action: 'swap',
          i,
          j,
          value1: arr[i],
          value2: arr[j],
          snapshot: [...arr],
          line: 4
        });

      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

    steps.push({
      action: 'pivot-swap',
      i: i + 1,
      j: high,
      value1: arr[i + 1],
      value2: arr[high],
      snapshot: [...arr],
      line: 5
    });


    return i + 1;
    }


  formatSpeedLabel(value: number): string {
    return `${value}x`;
  }


  getExecutionTime(state: AlgorithmState): string {
    if (!state.startTime) return '...'; // Not started
    if (!state.isFinished || !state.endTime) return 'Running...';
    const time = (state.endTime - state.startTime) / 1000;
    return `${time.toFixed(2)}s`;
  }

  // --- getAvailableAlgorithmsForSecondDropdown remains unchanged ---
  getAvailableAlgorithmsForSecondDropdown(): string[] {
    return this.algorithms.filter(algo => algo !== this.selectedAlgorithm);
  }
}

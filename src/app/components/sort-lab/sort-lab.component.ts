import {Component, OnInit, OnDestroy, SimpleChanges, Output, EventEmitter, ViewChild} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import { Router } from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {RandomDialogComponent} from '../random-dialog/random-dialog.component';
import { AlgorithmPseudocode } from '../../shared/algorithm-pseudo';
import {CodeHighlightComponent} from '../code-highlight/code-highlight.component';
import {SortingChartComponent} from '../sorting-chart/sorting-chart.component';
import {delay} from 'rxjs';


interface AlgorithmState {
  name: string;
  numbers: number[];
  currentStep: number;
  isFinished: boolean;
  startTime: number;
  endTime?: number;
  swapIndices?: [number, number];
  steps?: any[];
  shellGap?: number;
  shellI?: number;
  radixDigit?: number;
  history?: {
    numbers: number[];
    currentStep: number;
    swapIndices?: [number, number];
    currentAction: string;
    shellGap?: number;
    shellI?: number;
    radixDigit?: number;
  }[];
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
  algorithmDescription: string = '';
  speed: number = 1;
  isPlaying: boolean = false;
  currentStep: number = 0;
  playButtonText: string = 'Play';
  pauseButtonText: string = 'Pause';
  private timeoutId: any = null;
  previousStates: any[][] = [];
  currentAction: string = '';
  currentPseudoCode: string[] = [];
  // pseudoCodeList: string[] = ['Line 1', 'Line 2', 'Line 3'];
  currentLineIndex = 0;


  @Output() stepChange = new EventEmitter<number>();




  @ViewChild('chart') chartComponent!: any;


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




  pseudoCodes: { [key in typeof this.selectedAlgorithm]: string[] } = {
    bubble: [
      'for i from 0 to n-1',
      '  for j from 0 to n-i-1',
      '    if arr[j] > arr[j+1]',
      '      swap(arr[j], arr[j+1])'
    ],
    selection: [
      'for i from 0 to n-1',
      '  minIndex = i',
      '  for j from i+1 to n',
      '    if arr[j] < arr[minIndex]',
      '      minIndex = j',
      '  swap(arr[i], arr[minIndex])'
    ],
    insertion: [
      'for i from 1 to n-1',
      '  key = arr[i]',
      '  j = i - 1',
      '  while j >= 0 and arr[j] > key',
      '    arr[j + 1] = arr[j]',
      '    j = j - 1',
      '  arr[j + 1] = key'
    ],
    quick: [
      'quickSort(arr, low, high)',
      '  if low < high',
      '    pi = partition(arr, low, high)',
      '    quickSort(arr, low, pi - 1)',
      '    quickSort(arr, pi + 1, high)'
    ],
    shell: [
      'for gap = n/2 down to 1',
      '  for i = gap to n-1',
      '    temp = arr[i]',
      '    j = i',
      '    while j >= gap and arr[j - gap] > temp',
      '      arr[j] = arr[j - gap]',
      '      j -= gap',
      '    arr[j] = temp'
    ],
   g radix: [
      'getMax(arr, n)',
      'for exp = 1; max/exp > 0; exp *= 10',
      '  countSort(arr, n, exp)'
    ]
  };


  algorithmDescriptions: { [key: string]: string } = {
    insertion: '1. Iterate through the array, starting from the second element\n2. For each element, compare it with the elements to its left\n3. Insert the element in the correct position in the sorted portion',
    bubble: '1. Iterate through the array multiple times\n2. Compare adjacent elements and swap if they are in the wrong order\n3. Repeat until no swaps are needed',
    quick: '1. Choose a pivot element\n2. Partition the array around the pivot\n3. Recursively sort the sub-arrays',
    shell: '1. Divide the array into smaller subarrays using a gap\n2. Sort each subarray using insertion sort\n3. Reduce the gap and repeat until the gap is 1',
    radix: '1. Sort numbers digit by digit, starting from the least significant digit\n2. Use counting sort for each digit\n3. Repeat for all digits until the most significant digit',
    selection: '1. Iterate through the array to find the minimum element\n2. Swap the minimum element with the first unsorted element\n3. Repeat for the remaining unsorted portion',
  };
  // constructor(private router: Router) {}
  //
  // goBack() {
  //   this.router.navigate(['/home']).catch(err => console.error('Navigation error:', err));
  // }

  constructor(private dialog: MatDialog) {}


  ngOnInit() {
    const savedMode = localStorage.getItem('sortLabMode') as 'single' | 'dual' | 'all';
    this.mode = savedMode || 'single';
    this.updateDescription();
    this.reset();


  }





  ngOnDestroy() {
    // Hủy setTimeout khi component bị hủy
    this.clearTimeout();
  }



  setMode(mode: 'single' | 'dual' | 'all') {
    this.mode = mode;
    localStorage.setItem('sortLabMode', mode);
    this.reset();
  }

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


getBarHeightOriginal(num: number, numbers: number[]): number {
  const containerHeight = 300; // Maximum height of the container
  const maxNumber = Math.max(...numbers); // Find the maximum number in the array
  const minHeight = 10; // Minimum bar height
  const calculatedHeight = (num / maxNumber) * containerHeight; // Scale height based on the container
  return Math.max(minHeight, calculatedHeight); // Ensure it doesn't go below the minimum height
}

getBarWidthOriginal(numbers: number[]): number {
  const containerWidth = 225; // Maximum width of the container
  const numElements = numbers.length; // Number of elements
  const baseWidth = containerWidth / numElements; // Calculate width based on the container
  const maxWidth = 10; // Maximum bar width
  const minWidth = 5; // Minimum bar width
  return Math.max(minWidth, baseWidth); // Ensure it doesn't go below the minimum width
}




  addNumber() {
    if (this.newNumber !== null) {
      if (this.newNumber > 1000) {
        alert('Input number cannot be greater than 1000!');
        this.newNumber = null;
        return;
      }
      this.numbers.push(this.newNumber);
      this.newNumber = null;
      this.reset();
    }
  }
  checkEmptyOrInvalid(index: number) {
    const value = this.numbers[index];


    if (value == null || isNaN(Number(value))) {
      this.removeNumber(index);
    }
  }





  removeNumber(index: number): void {
    this.numbers.splice(index, 1);
    this.reset(); // xử lý lại nếu cần
  }

  onInputChange(index: number): void {
    if (this.numbers[index] == null) {
      this.removeNumber(index);
    }

  }
  // randomize() {
  //   this.numbers = Array.from({ length: 25 }, () => Math.floor(Math.random() * 20) + 1);
  //   this.reset();
  // }
  randomize() {
    const dialogRef = this.dialog.open(RandomDialogComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result <= 27 && result > 0) {
        this.numbers = Array.from({ length: result }, () => Math.floor(Math.random() * 20) + 1);
        this.reset();
      }
    });
  }


  clear() {
    this.numbers = [];
    this.reset();
  }

  reset() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.currentAction = '';
    this.playButtonText = 'Play';
    this.pauseButtonText = 'Pause';
    this.clearTimeout(); // Hủy setTimeout khi reset
    this.algorithmStates = [];

    if (this.mode === 'single') {
      this.algorithmStates = [
        { name: this.selectedAlgorithm, numbers: [...this.numbers], currentStep: 0, isFinished: false, startTime: 0 },
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
    this.reset();
    this.play();
  }

  play() {
    this.isPlaying = true;
    this.playButtonText = 'Playing...';
    this.currentAction = 'Sorting started!';
    this.algorithmStates.forEach(state => (state.startTime = Date.now()));
    this.runAlgorithms();
  }

  // pause() {
  //   this.isPlaying = false;
  //   this.playButtonText = 'Play';
  //   this.pauseButtonText = 'Paused';
  //   this.currentAction = 'Sorting paused!';
  //   this.clearTimeout(); // Hủy setTimeout khi tạm dừng
  // }
  isPaused = false;

  togglePause() {
    if (this.isPaused) {

      this.resumeSorting();
    } else {

      this.pauseSorting();
    }
    this.isPaused = !this.isPaused;
  }

  pauseSorting() {
    this.isPlaying = false;
    this.playButtonText = 'Play';
    this.pauseButtonText = 'Paused';
    this.currentAction = 'Sorting paused!';
    this.clearTimeout();
  }

  startSorting() {
    this.isPlaying = true;
    this.currentAction = 'Sorting started!';
    this.runAlgorithms();
  }

  resumeSorting() {
    this.isPlaying = true;
    this.playButtonText = 'Playing...';
    this.pauseButtonText = 'Running';
    this.currentAction = 'Sorting resumed!';
    this.startSorting();
  }


  nextStep() {
    const clonedState = JSON.parse(JSON.stringify(this.algorithmStates));
    this.previousStates.push(clonedState);
    this.algorithmStates.forEach(state => {
      if (!state.isFinished) {
        this.runAlgorithmStep(state);
      }
    });
    if (this.currentStep < this.currentPseudoCode.length - 1) {
      this.currentStep++;
    }
  }
  backStep() {
    const prevState = this.previousStates.pop();
    if (prevState) {
      this.algorithmStates = prevState;
      this.currentAction = 'Stepped back';
    }
  }


  canGoBack(): boolean {
    return this.previousStates.length > 0;

  }



  onSpeedChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value);
    console.log('Speed changed to:', value);
    this.speed = value;
    if (this.isPlaying) {
      this.clearTimeout();
      this.runAlgorithms();
    }
  }


  updateDescription() {
    this.algorithmDescription = this.algorithmDescriptions[this.selectedAlgorithm] || 'Select an algorithm to see its description.';
  }

  getBarColor(index: number, state: AlgorithmState): string {
    if (state.swapIndices && !state.isFinished) {
      if (index === state.swapIndices[0]) return '#ff0000';
      if (index === state.swapIndices[1]) return '#00ff00';
    }
    return index === state.currentStep && !state.isFinished ? '#1a73e8' : '#673ab7';
  }



  runAlgorithms() {
    if (!this.isPlaying) return;

    this.timeoutId = setTimeout(() => {
      let allFinished = true;
      this.algorithmStates.forEach(state => {
        if (!state.isFinished) {
          this.runAlgorithmStep(state);
          if (!state.isFinished) {
            allFinished = false;
          } else {
            state.endTime = Date.now();
          }
        }
      });

      if (!allFinished) {
        this.runAlgorithms();
      } else {
        this.isPlaying = false;
        this.playButtonText = 'Play';
        this.pauseButtonText = 'Pause';
        this.currentAction = 'Sorting complete! Compare the results.';
      }
    }, 2000 / this.speed);
  }

  // Hàm để hủy setTimeout
  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  runAlgorithmStep(state: AlgorithmState) {
    const algo = state.name;
    const nums = state.numbers;

    if (state.isFinished) return;

    switch (algo) {
      case 'insertion':
        if (state.currentStep < nums.length - 1) {
          let i = state.currentStep + 1;

          const key = nums[i];
          let j = i - 1;

          this.currentLineIndex = 0; // for i from 1 to length-1
          this.stepChange.emit(this.currentLineIndex);
          while (j >= 0 && nums[j] > key) {
            this.currentLineIndex = 1; // while j >= 0 and arr[j] > key
            this.stepChange.emit(this.currentLineIndex);
            nums[j + 1] = nums[j];
            j--;
            this.currentLineIndex = 2; // arr[j+1] = arr[j]
            this.stepChange.emit(this.currentLineIndex);
          }
          nums[j + 1] = key;
          this.currentLineIndex = 3; // arr[j+1] = key
          this.stepChange.emit(this.currentLineIndex);

          state.swapIndices = [j + 1, i];
          this.currentAction = `Inserted ${key} at position ${j + 1}`;
          state.currentStep++;
        } else {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        break;

      case 'bubble':
        let swapped = false;
        for (let i = 0; i < nums.length - 1; i++) {
          this.currentLineIndex = 0; // for i from 0 to n - 1
          this.stepChange.emit(this.currentLineIndex);
          for (let j = 0; j < nums.length - i - 1; j++) {
            this.currentLineIndex = 1; // for j from 0 to n - i - 1\
            this.stepChange.emit(this.currentLineIndex);
            if (nums[j] > nums[j + 1]) {
              this.currentLineIndex = 2; // if arr[j] > arr[j+1]
              this.stepChange.emit(this.currentLineIndex);
              [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
              state.swapIndices = [j, j + 1];
              this.currentAction = `Swapped ${nums[j]} with ${nums[j + 1]}`;
              this.currentLineIndex = 3; // swap(arr[j], arr[j+1])
              this.stepChange.emit(this.currentLineIndex);
              swapped = true;
              break;
            }
          }
          if (swapped) break;
        }
        state.currentStep++;
        if (!swapped) {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        break;

      case 'selection':
        if (state.currentStep < nums.length - 1) {
          let minIndex = state.currentStep;
          this.currentLineIndex = 0; // for i from 0 to n - 1
          this.stepChange.emit(this.currentLineIndex);
          for (let j = state.currentStep + 1; j < nums.length; j++) {
            this.currentLineIndex = 1; // for j from i+1 to n
            this.stepChange.emit(this.currentLineIndex);
            if (nums[j] < nums[minIndex]) {
              this.currentLineIndex = 2; // if arr[j] < arr[minIndex]
              this.stepChange.emit(this.currentLineIndex);
              minIndex = j;
            }
          }
          if (minIndex !== state.currentStep) {
            this.currentLineIndex = 3; // swap arr[i] with arr[minIndex]
            this.stepChange.emit(this.currentLineIndex);
            [nums[state.currentStep], nums[minIndex]] = [nums[minIndex], nums[state.currentStep]];
            state.swapIndices = [state.currentStep, minIndex];
            this.currentAction = `Swapped ${nums[state.currentStep]} with ${nums[minIndex]}`;
          }
          state.currentStep++;
        } else {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        break;

      case 'quick':
        if (!state.steps) {
          state.steps = this.generateQuickSortSteps([...nums], 0, nums.length - 1);
        }
        if (state.currentStep < state.steps.length) {
          const step = state.steps[state.currentStep];
          this.currentLineIndex = step.line ?? 0;
          [nums[step.i], nums[step.j]] = [step.value2, step.value1];
          state.swapIndices = [step.i, step.j];
          this.currentAction = `Swapped ${nums[step.i]} with ${nums[step.j]}`;
          state.currentStep++;
        } else {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        break;

      case 'shell':
        if (!state.shellGap) {
          state.shellGap = Math.floor(nums.length / 2);
          state.shellI = state.shellGap;
        }
        if (state.shellGap > 0) {
          const gap = state.shellGap;
          let swapped = false;
          this.currentLineIndex = 0; // gap = n / 2
          this.stepChange.emit(this.currentLineIndex);
          for (let i = gap; i < nums.length; i++) {
            this.currentLineIndex = 1; // for i from gap to n
            this.stepChange.emit(this.currentLineIndex);
            const temp = nums[i];
            let j = i;
            while (j >= gap && nums[j - gap] > temp) {
              this.currentLineIndex = 2; // while j >= gap and arr[j-gap] > temp
              this.stepChange.emit(this.currentLineIndex);
              nums[j] = nums[j - gap];
              j -= gap;
              swapped = true;
              this.currentLineIndex = 3; // arr[j] = arr[j-gap]
              this.stepChange.emit(this.currentLineIndex);
            }
            nums[j] = temp;
            this.currentLineIndex = 4; // arr[j] = temp
            this.stepChange.emit(this.currentLineIndex);
            if (swapped) {
              state.swapIndices = [j, i];
              this.currentAction = `Inserted ${temp} at position ${j} with gap ${gap}`;
              break;
            }
          }
          if (!swapped) {
            state.shellGap = Math.floor(state.shellGap / 2);
            state.shellI = state.shellGap;
          }
        } else {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        state.currentStep++;
        break;

      case 'radix':
        if (!state.radixDigit) state.radixDigit = 1;
        const maxNum = Math.max(...nums);
        if (state.radixDigit <= maxNum) {
          this.currentLineIndex = 0; // find max & start digit = 1
          this.stepChange.emit(this.currentLineIndex);
          const digit = state.radixDigit;
          const output = new Array(nums.length).fill(0);
          const count = new Array(10).fill(0);

          this.currentLineIndex = 1; // count frequency
          this.stepChange.emit(this.currentLineIndex);
          for (let i = 0; i < nums.length; i++) {
            const digitValue = Math.floor(nums[i] / digit) % 10;
            count[digitValue]++;
          }

          this.currentLineIndex = 2; // cumulative count
          this.stepChange.emit(this.currentLineIndex);
          for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
          }

          this.currentLineIndex = 3; // build output array
          this.stepChange.emit(this.currentLineIndex);
          for (let i = nums.length - 1; i >= 0; i--) {
            const digitValue = Math.floor(nums[i] / digit) % 10;
            output[count[digitValue] - 1] = nums[i];
            count[digitValue]--;
          }

          this.currentLineIndex = 4; // copy to nums
          this.stepChange.emit(this.currentLineIndex);
          for (let i = 0; i < nums.length; i++) {
            nums[i] = output[i];
          }

          state.swapIndices = [0, nums.length - 1];
          this.currentAction = `Sorted by digit ${digit}`;
          state.radixDigit *= 10;
        } else {
          state.isFinished = true;
          state.swapIndices = undefined;
        }
        state.currentStep++;
        break;
    }

    if (!state.isFinished && this.isSorted(nums)) {
      state.isFinished = true;
      state.swapIndices = undefined;
    }

    this.timeoutId = setTimeout(() => {
      this.currentStep = this.currentLineIndex;
      this.stepChange.emit(this.currentLineIndex); // chính là cái để highlight dòng
    }, 2000 / this.speed);


  }



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
    this.quickSortSteps(nums, low, high, steps);
    return steps;
  }

  quickSortSteps(nums: number[], low: number, high: number, steps: any[]) {
    if (low < high) {
      const pi = this.partition(nums, low, high, steps);
      this.quickSortSteps(nums, low, pi - 1, steps);
      this.quickSortSteps(nums, pi + 1, high, steps);
    }
  }

  partition(nums: number[], low: number, high: number, steps: any[]): number {
    const pivot = nums[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (nums[j] <= pivot) {
        i++;
        if (i !== j) {
          steps.push({ i, j, value1: nums[i], value2: nums[j] });
          [nums[i], nums[j]] = [nums[j], nums[i]];
        }
      }
    }
    if (i + 1 !== high) {
      steps.push({ i: i + 1, j: high, value1: nums[i + 1], value2: nums[high] });
      [nums[i + 1], nums[high]] = [nums[high], nums[i + 1]];
    }
    return i + 1;
  }

  formatSpeedLabel(value: number): string {
    return `${value}x`;
  }

  getExecutionTime(state: AlgorithmState): string {
    if (!state.endTime) return 'Running...';
    const time = (state.endTime - state.startTime) / 1000;
    return `${time.toFixed(2)}s`;
  }

  getAvailableAlgorithmsForSecondDropdown(): string[] {
    return this.algorithms.filter(algo => algo !== this.selectedAlgorithm);
  }


}

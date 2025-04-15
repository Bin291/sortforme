import {Component, Input} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-sort-visualization',
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './sort-visualization.component.html',
  styleUrl: './sort-visualization.component.scss'
})
export class SortVisualizationComponent {
  @Input() originalNumbers: number[] = [];
  @Input() algorithmStates: { name: string; numbers: number[] }[] = [];
  @Input() algorithmNames: { [key: string]: string } = {};


}

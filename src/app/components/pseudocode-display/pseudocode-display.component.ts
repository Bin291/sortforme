import {Component, Input} from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-pseudocode-display',
  imports: [
    NgForOf
  ],
  templateUrl: 'pseudocode-display.component.html',
  styleUrl: 'pseudocode-display.component.scss'
})
export class PseudocodeDisplayComponent {
  @Input() pseudocodeLines: string[] = [];
  @Input() currentLine: number = -1;
}

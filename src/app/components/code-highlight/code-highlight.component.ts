import {Component, Input, SimpleChanges} from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-code-highlight',
  imports: [
    NgForOf
  ],
  templateUrl: './code-highlight.component.html',
  styleUrl: './code-highlight.component.scss'
})
export class CodeHighlightComponent {
  @Input() codeLines: string[] = [];
  @Input() activeLine: number = -1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeLine']) {
      console.log('📌 Highlight line:', this.activeLine);
    }
  }
}

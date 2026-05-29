import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatOptionModule],
  templateUrl: './edit-modal.component.html',
  styleUrl: './edit-modal.component.scss'
})
export class EditModalComponent implements OnChanges, OnInit, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() description = '';
  @Input() priority = 'low';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ title: string; description: string; priority: string; }>();

  private isSelecting = false;

  private selectionListener = () => {
    const selection = window.getSelection();
    this.isSelecting = !!selection && selection.toString().length > 0;
  }

  ngOnInit() {
    document.addEventListener('selectionchange', this.selectionListener);
  }

  ngOnDestroy() {
    document.removeEventListener('selectionchange', this.selectionListener);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !changes['open'].currentValue) {
      this.title = '';
      this.description = '';
      this.priority = 'low';
    }
  }

  onSave() {
    if (!this.title.trim()) {
      return;
    }
    
    this.save.emit({
      title: this.title,
      description: this.description,
      priority: this.priority
    });
  }

  onBackdropPointerDown(event: PointerEvent) {
    if (this.isSelecting) return;
    if (event.target !== event.currentTarget) return;
    this.close.emit();
  }
}
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';

  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();

  private isSelecting = false;

  private readonly selectionListener = () => {
    const selection = window.getSelection();
    this.isSelecting = !!selection && selection.toString().length > 0;
  };

  private readonly escapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      this.cancelled.emit();
    }
  };

  ngOnInit() {
    document.addEventListener('selectionchange', this.selectionListener);
    document.addEventListener('keydown', this.escapeListener);
  }

  ngOnDestroy() {
    document.removeEventListener('selectionchange', this.selectionListener);
    document.removeEventListener('keydown', this.escapeListener);
  }

  onBackdropPointerDown(event: PointerEvent) {
    if (this.isSelecting) return;
    if (event.target !== event.currentTarget) return;
    this.cancelled.emit();
  }
}

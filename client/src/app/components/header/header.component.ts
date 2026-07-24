import { Component, EventEmitter, OnDestroy, OnInit, Output, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() logout = new EventEmitter<void>();

  aboutOpen = signal(false);

  private isSelecting = false;

  private selectionListener = () => {
    const selection = window.getSelection();
    this.isSelecting = !!selection && selection.toString().length > 0;
  };

  private escapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.aboutOpen()) {
      this.closeAbout();
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

  openAbout() {
    this.aboutOpen.set(true);
  }

  closeAbout() {
    this.aboutOpen.set(false);
  }

  onBackdropPointerDown(event: PointerEvent) {
    if (this.isSelecting) return;
    if (event.target !== event.currentTarget) return;
    this.closeAbout();
  }
}

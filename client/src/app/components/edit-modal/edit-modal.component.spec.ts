import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EditModalComponent } from './edit-modal.component';

describe('EditModalComponent', () => {
  let fixture: ComponentFixture<EditModalComponent>;
  let component: EditModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EditModalComponent);
    component = fixture.componentInstance;
    component.open = true;
    component.title = 'Original title';
    component.description = 'Original description';
    component.priority = 'medium';
    fixture.detectChanges();
  });

  it('renders a persistent label for each field (not just a placeholder)', () => {
    const labels = fixture.debugElement
      .queryAll(By.css('.field-label'))
      .map((el) => el.nativeElement.textContent.trim());
    expect(labels).toEqual(['Title', 'Priority', 'Description']);
  });

  it('does not emit save when the title is blank', () => {
    const emitted = vi.fn();
    component.save.subscribe(emitted);

    component.title = '   ';
    component.onSave();

    expect(emitted).not.toHaveBeenCalled();
  });

  it('emits save with the current field values when the title is present', () => {
    const emitted = vi.fn();
    component.save.subscribe(emitted);

    component.title = 'Updated title';
    component.description = 'Updated description';
    component.priority = 'high';
    component.onSave();

    expect(emitted).toHaveBeenCalledWith({
      title: 'Updated title',
      description: 'Updated description',
      priority: 'high'
    });
  });

  it('emits close when the close button is clicked', () => {
    const emitted = vi.fn();
    component.close.subscribe(emitted);

    fixture.debugElement.query(By.css('.modal-close-btn')).nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });

  it('resets fields to defaults when closed (open becomes false)', () => {
    component.open = false;
    component.ngOnChanges({
      open: {
        previousValue: true,
        currentValue: false,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.title).toBe('');
    expect(component.description).toBe('');
    expect(component.priority).toBe('low');
  });
});

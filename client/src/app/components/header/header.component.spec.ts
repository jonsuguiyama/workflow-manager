import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not show the About modal initially', () => {
    expect(fixture.debugElement.query(By.css('.modal-backdrop'))).toBeNull();
  });

  it('opens the About modal when the About button is clicked', () => {
    const aboutBtn = fixture.debugElement.query(By.css('.about-btn'));
    aboutBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.aboutOpen()).toBe(true);
    expect(fixture.debugElement.query(By.css('.modal-backdrop'))).not.toBeNull();
  });

  it('closes the About modal via the close button', () => {
    component.openAbout();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.close-btn')).nativeElement.click();
    fixture.detectChanges();

    expect(component.aboutOpen()).toBe(false);
  });

  it('closes the About modal when Escape is pressed', () => {
    component.openAbout();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.aboutOpen()).toBe(false);
  });

  it('emits logout when the Log out button is clicked', () => {
    const emitted = vi.fn();
    component.logout.subscribe(emitted);

    fixture.debugElement.query(By.css('.logout-btn')).nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });
});

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px 0;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: .5;
      }

      p { margin: 0; font-size: 15px; }
    }
  `],
})
export class EmptyState {
  readonly message = input('No se encontraron resultados.');
  readonly icon    = input('inbox');
}

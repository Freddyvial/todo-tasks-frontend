import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.XSmall)
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );
}

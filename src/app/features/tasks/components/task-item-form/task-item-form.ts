import { Component, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-task-item-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatCheckboxModule,
    MatInputModule, MatIconModule,
    MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './task-item-form.html',
  styleUrl: './task-item-form.scss',
})
export class TaskItemForm {
  readonly itemsArray = input.required<FormArray<FormGroup>>();
  readonly readonly   = input(false);

  readonly newItemCtrl = new FormControl('', { nonNullable: true });

  get completedCount(): number {
    return this.itemsArray().controls.filter(g => g.get('completed')?.value).length;
  }

  get totalCount(): number {
    return this.itemsArray().length;
  }

  get progressValue(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  getItemGroup(index: number): FormGroup {
    return this.itemsArray().at(index) as FormGroup;
  }

  addItem(): void {
    const text = this.newItemCtrl.value.trim();
    if (!text) {
      this.newItemCtrl.markAsTouched();
      return;
    }
    this.itemsArray().push(new FormGroup({
      id:          new FormControl<number | null>(null),
      description: new FormControl(text, { nonNullable: true }),
      completed:   new FormControl(false, { nonNullable: true }),
    }));
    this.newItemCtrl.reset('');
  }

  removeItem(index: number): void {
    this.itemsArray().removeAt(index);
  }

  onNewItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addItem();
    }
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'elapsedTime', standalone: true })
export class ElapsedTimePipe implements PipeTransform {
  transform(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs <= 0) return '';

    const totalMins = Math.floor(diffMs / 60_000);
    if (totalMins < 1)   return 'Hace menos de 1 min';
    if (totalMins < 60)  return `Hace ${totalMins} min`;

    const hours = Math.floor(totalMins / 60);
    if (hours < 24)      return `Hace ${hours} h ${totalMins % 60} min`;

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (remHours === 0)  return `Hace ${days} día${days > 1 ? 's' : ''}`;
    return `Hace ${days} día${days > 1 ? 's' : ''} y ${remHours} h`;
  }
}

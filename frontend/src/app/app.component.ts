import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);

  message: string = 'Chargement...';

  ngOnInit(): void {
    this.http.get('/api/test', { responseType: 'text' }).subscribe({
      next: (res: string) => {
        this.message = res;
      },
      error: (err) => {
        console.error(err);
        this.message = 'Erreur backend';
      }
    });
  }
}

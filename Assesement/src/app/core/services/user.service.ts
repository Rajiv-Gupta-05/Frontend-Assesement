import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';

export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _users = new BehaviorSubject<User[]>([
    { name: 'Rajiv Gupta', email: 'rajiv@example.com', role: 'Admin' },
    { name: 'Pritam Tharu', email: 'pritam@example.com', role: 'Editor' },
    { name: 'Abhishek Chauhan', email: 'abhishek@example.com', role: 'Viewer' },
    { name: 'Ayush Prajapati', email: 'ayush@example.com', role: 'Editor' },
    { name: 'Rashmi Gupta', email: 'rashmi@example.com', role: 'Viewer' },
    { name: 'Puja Chauhan', email: 'puja@example.com', role: 'Admin' },
    {name: 'Ruchika Bagale', email: 'ruchika@example.com', role: 'Viewer'}
  ]);

  users$: Observable<User[]> = this._users.asObservable();

  // Simulate network delay using RxJS to demonstrate async operation
  addUser(user: User): Observable<User> {
    return of(user).pipe(
      delay(800),
      tap(newUser => {
        const currentUsers = this._users.getValue();
        this._users.next([...currentUsers, newUser]);
      })
    );
  }
}

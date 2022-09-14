import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  username: string;
  password: string;

  constructor(public user: UserService, private router: Router) {}

  ngOnInit() {}

  async login() {
    let login = await this.user.login(this.username, this.password);
    if (login) {
      this.router.navigate(['/solver'])
    }
  }

}

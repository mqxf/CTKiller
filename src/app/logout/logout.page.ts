import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage implements OnInit {

  constructor(public user: UserService, private router: Router) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.user.logout();
    this.router.navigate(['login']);
  }

}

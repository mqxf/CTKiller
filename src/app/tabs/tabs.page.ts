import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(public userService: UserService, private router: Router) {}

  async ionViewWillEnter() {
    if (!await this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
    }
  }

}

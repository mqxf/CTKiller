import { Injectable } from '@angular/core';
import { getToken, refreshToken } from './api/network';
import { sleep } from './api/utils';
import jwt from "jsonwebtoken";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  token: string = "";
  userId: string = "";
  loginSessionId: string = "";
  private refreshToken: string = "";

  constructor() { }

  async isLoggedIn() { 
    if (this.token != "") return true;
    if (localStorage.getItem("token") == null || localStorage.getItem("token") == "") return false;
    return await this.tokenTest(localStorage.getItem("token"));
  }

  async login(username: string, password: string) {
    try {
      let res = await getToken(username, password);
      this.token = res.accessToken;
      this.refreshToken = res.refreshToken;
      localStorage.setItem("token", this.refreshToken);
      this.userInit();
      this.regenToken();
      return true;
    }
    catch (err) {
      return false;
    }
  }

  private async regenToken() {
    await sleep(540000);
    try {
      let res = await refreshToken(this.refreshToken);
      this.token = res.accessToken;
      this.refreshToken = res.refreshToken;
      localStorage.setItem('token', this.refreshToken);
      this.userInit();
      this.regenToken();
      return true;
    }
    catch (err) {
      return false;
    }
  }

  private async tokenTest(token: string) {
    try {
      let res = await refreshToken(token);
      this.token = res.accessToken;
      this.refreshToken = res.refreshToken;
      localStorage.setItem('token', this.refreshToken);
      return true;
    }
    catch (err) {
      return false;
    }
  }

  private userInit() {
    let user = jwt.decode(this.token) as jwt.JwtPayload;
    this.userId = user.sub!;
    this.loginSessionId = user.context.loginSessionId;
  }

  logout() {
    this.loginSessionId = "";
    this.userId = "";
    this.token = "";
    this.refreshToken = "";
    localStorage.removeItem("token");
  }

}

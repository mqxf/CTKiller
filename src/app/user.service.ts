import { Injectable } from '@angular/core';
import { getToken, refreshToken, Subject, SubjectGroups, subjects } from './api/network';
import { sleep } from './api/utils';
import jwt from "jsonwebtoken";

interface Organisation {
  organisationId: string
  organisationName: string
  parentId: string
  isPrimary?: boolean
  roles: string[]
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  token: string = "";
  userId: string = "";
  loginSessionId: string = "";
  organisationId: string = "";
  organisationName: string = "";
  subjects: Subject[];
  subjectGroups: SubjectGroups[];
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
      let subRes = await subjects(this.userId, this.token);
      this.subjects = subRes.data.userSubjects.subjects;
      this.subjectGroups = subRes.data.userSubjects.subjectGroups;
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
    let organisations: Organisation[] = user.context.organisations;
    let mainOrg: Organisation = organisations.find(org => org.isPrimary);
    if (mainOrg === null || !mainOrg.roles.includes("student") || user.context.isTest) {
      this.logout();
    }
    this.organisationId = mainOrg.organisationId;
    this.organisationName = mainOrg.organisationName;
  }

  logout() {
    this.loginSessionId = "";
    this.userId = "";
    this.token = "";
    this.refreshToken = "";
    this.organisationId = "";
    this.organisationName = "";
    localStorage.removeItem("token");
  }

}

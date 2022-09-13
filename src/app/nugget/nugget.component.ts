import { Component, Input, OnInit } from '@angular/core';
import { DisplayNugget } from '../api/network';

@Component({
  selector: 'app-nugget',
  templateUrl: './nugget.component.html',
  styleUrls: ['./nugget.component.scss'],
})
export class NuggetComponent implements OnInit {

  @Input()
  nugget: DisplayNugget

  constructor() { }

  ngOnInit() {}

}

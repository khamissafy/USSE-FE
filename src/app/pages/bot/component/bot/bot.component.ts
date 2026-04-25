import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.scss']
})
export class BotComponent implements OnInit {
  isBots: boolean = true;
  automationData: any;
  selectedTabIndex: number = 0;

  constructor() {}

  ngOnInit() {}

  backToBots() {
    this.isBots = true;
  }

  openNewAutomation(event: any) {
    this.isBots = !event.openNewAutomation;
    this.automationData = event.editAutomationData;
  }

  backToBotComponent(event: any) {
    this.isBots = event;
  }

  addAutomation() {
    this.automationData = null;
    this.isBots = false;
  }

  changeModal(event: any) {
    this.selectedTabIndex = event.index;
  }
}

import { Component, OnInit } from '@angular/core';
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';

@Component({
  selector: 'app-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.scss']
})
export class BotComponent implements OnInit {
  isBots: boolean = true;
  automationData: any;
  selectedTabIndex: number = 0;

  constructor(
    private subscriptionState: SubscriptionStateService,
    private toaster: ToasterServices
  ) {}

  ngOnInit() {}

  backToBots() {
    this.isBots = true;
    this.subscriptionState.refreshSnapshot().subscribe();
  }

  openNewAutomation(event: any) {
    this.isBots = !event.openNewAutomation;
    this.automationData = event.editAutomationData;
  }

  backToBotComponent(event: any) {
    this.isBots = event;
    this.subscriptionState.refreshSnapshot().subscribe();
  }

  addAutomation() {
    if (this.subscriptionState.isAtBotLimit()) {
      const msg = `You have reached the Bots limit for your current plan. <a href="/plans" style="text-decoration:underline;font-weight:600">Upgrade Plan</a>`;
      this.toaster.warning(msg, true);
      return;
    }
    this.automationData = null;
    this.isBots = false;
  }

  changeModal(event: any) {
    this.selectedTabIndex = event.index;
  }
}

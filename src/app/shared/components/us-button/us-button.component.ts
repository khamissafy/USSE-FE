import { Component, Input, OnInit , Output , EventEmitter, AfterViewInit  } from '@angular/core';

@Component({
  selector: 'us-button',
  templateUrl: './us-button.component.html',
  styleUrls: ['./us-button.component.scss']
})
export class UsButtonComponent implements OnInit ,AfterViewInit  {
  @Input() withTooltip?: boolean = false;
  @Input() tooltipMsg:string='';
  @Input() label:string = 'label';
  @Input() size:string = 'sm';
  @Input() matIcon:string = '';
  @Input() iconClass:string = '';
  @Input() img:string = '';
  @Input() loading:boolean = true;
  @Input() disabled:boolean = false;
  @Input() fill:boolean =true
  @Input() appearance:string ='primary'
  @Input() fullWidth?: boolean; // take full width of the parent
  @Input() noMinHight?: boolean=false; 

  @Input() counter: number = 0;
  countdown: number = 0;
  @Output() clicked = new EventEmitter<any>();
  setClick(clickInfo:Event) {
    this.clicked.emit(clickInfo);
    // Prevent the default click behavior if the button is disabled due to countdown
    if (this.counter > 0) {
      clickInfo.preventDefault();
      this.startCountdown();
    }
  }


  isButtonDisabled(): boolean {
    return this.disabled || this.counter > 0;
  }

  constructor() { }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.startCountdown();
    }, 0);
  }


  startCountdown() {
    // Check if the counter input is provided and greater than 0
    if (this.counter > 0) {
      // Disable the button initially
      this.disabled = true;

      // Start the countdown timer
      const countdownInterval = setInterval(() => {
        this.counter--;

        // If the countdown reaches 0, emit the countdownComplete event
        if (this.counter === 0) {
          clearInterval(countdownInterval);
          this.disabled = false;
          this.loading=false;
   
        }
      }, 1000);
    }
  }

  ngOnInit() {

    }
  }

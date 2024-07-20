import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { TranslateService } from '@ngx-translate/core';
import { InputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-hideOptions',
  templateUrl: './hideOptions.component.html',
  styleUrls: ['./hideOptions.component.scss']
})
export class HideOptionsComponent implements OnInit, AfterViewInit, OnChanges {
  active: boolean = false;
  @ViewChild('startInput') startInput:InputComponent
  directions: any =
    [
      { title: this.translate.instant('left'), value: 'l' },
      { title: this.translate.instant('right'), value: 'r' }
    ];
    @Input() isTextSelected:boolean;
  @Input() optionsData: {
    selectedText: string,
    startPosition: number,
    endPosition: number,
    length: number
  }
  @Output() hideOptionsData = new EventEmitter<any>
  lettersCount:any=[];


  directionControl :any= new FormControl([],Validators.required);
  hiddenLettersControl:any = new FormControl(null,Validators.required);
  startFromControl:any = new FormControl([],Validators.required);
  form = new FormGroup({
    directionControl:this.directionControl,
    hiddenLettersControl:this.hiddenLettersControl,
    startFromControl:this.startFromControl,

  });
    ngAfterViewInit() {

  }
  constructor(private translate: TranslateService) { }
  ngOnChanges(changes: SimpleChanges): void {
   
  }
  isValidNumers(){
    return (this.startFromControl.value && parseInt(this.startFromControl.value) < 1) 
      || (this.hiddenLettersControl.value &&  parseInt(this.hiddenLettersControl.value) < 1)
  }
  onClick(id){
    this.startInput.setFocus(id)
  }
  ngOnInit() {
    this.form.patchValue({
      directionControl:this.directions[0],
      startFromControl:1
    })
  }
  toggleActive() {
    this.active = !this.active
  }
  onSubmit(){
    event.preventDefault(); 

    this.hideOptionsData.emit({
      selectionStartPos:this.optionsData.startPosition,
      selectionEndPos:this.optionsData.endPosition,
      selectedText:this.optionsData.selectedText,
      maskingOptions:{
        startFrom:this.startFromControl.value,
        numberOfLetters:this.hiddenLettersControl.value,
        direction:this.form.value.directionControl.value
      }
    })
   
  }
}

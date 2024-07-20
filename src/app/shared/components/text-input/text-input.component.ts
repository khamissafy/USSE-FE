import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  HostListener,
  Renderer2
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

const VALUE_ACCESSOR_CONFIG = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InputComponent),
  multi: true,
};
interface maskingData {
    selectionStartPos:any,
    selectionEndPos:any,
    selectedText:any,
    maskingOptions:{
      startFrom:any,
      numberOfLetters:any,
      direction:any
    }
}
@Component({
  selector: 'us-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  providers: [VALUE_ACCESSOR_CONFIG],
})
export class InputComponent implements  AfterViewInit {

  // VALUE_ACCESSOR Methods & Properties
  private val: any = null;
  @Input() isDisabled: boolean;
  @ViewChild('srInputEl') textarea: ElementRef;
  @ViewChild('textareaContainer') textareaContainer: ElementRef;

  onChange: any = () => {};
  onTouched: any = () => {};
  isPasswordVisible: boolean = false;
  divHeight: string;

    togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
  writeValue(value: any): void {
    this.val = value;
    if (this.limitTextarea) {
      // Update the character count for the initial value
      this.charCount = this.val ? this.val.length : 0;
    }
  }
  // ================================

  // Inputs
  @Input() set value(value: any) {
    this.val = value;
   
    if(this.isTextArea){
      this.onChange(this.maskedMsg);

    }else{
      this.onChange(this.val);

    }
  } // we use set to do some logic every time we change this property ( value )
  @Input() key = ''; // <label [for]="key">, <input [name/id]="key">
  @Input() placeholder = ''; // placeholder for the input
  @Input() label?: string; // label above the input
  @Input() optional?: boolean; // optional indicator above the input
  @Input() iconClass?: string; // icon font class e.g. si-info
  @Input() hintText?: string; // a hint/caption below the input
  @Input() hintIcon = 'si-info'; // the icon before the hint
  @Input() type: 'text' | 'number' = 'text'; // type [ text or number ]
  @Input() error?: boolean; // change styles for error appearance
  @Input() warning?: boolean=false; // change styles for warning appearance
  @Input() fullWidth?: boolean; // take full width of the parent
  @Input() fullWidthAndHeight: boolean = false;
  @Input() hideSteppers?: boolean=false; // hide steppers butttons
  @Input() isCriteria?: boolean = false;
  @Input() trailingIcon?: boolean; // set icon to the END of the input [ in the START by default ]
  @Input() prefix?: string; // add a prefix
  @Input() suffix?: string; // add a suffix
  @Input() min?: number; // native attribute of number input
  @Input() max?: number; // native attribute of number input
  @Input() pattern!: string | RegExp; // regex for input validation
  @Input() grouped?: boolean; // in a group ?
  @Input() orderInGroup?: 'first' | 'last'; // order in group - to control border
  // an array of functions that takes input element as a parameter
  // and gets executed upon (ngModelChange) to modify the input value
  // e.g. input:number that has a max limit and you wanna reset the value if it exceeded the limit
  @Input() validators?: Function[];
  @Input() isTextArea?: boolean;
  @Input() isEmoji?: boolean = false;
  @Input() limitTextarea?: boolean = true;
  @Input() withTooltip?: boolean = false;
  @Input() tooltipMsg:string='';
  @Input() tooltipReadMoreLink:string=null;
  @Input() labelTopInMobileView?: boolean=true; 

  @Input() maxCharLimit?: number;
  charCount: number = 0;
  // Native Events
  @Output() keyup = new EventEmitter();
  @Output() keydown = new EventEmitter();
  @Output() input = new EventEmitter();
  @Output() copy = new EventEmitter();
  @Output() paste = new EventEmitter();
  @Output() change = new EventEmitter();
  @Output() clicked = new EventEmitter();
  // Custom Events
  @Output() submit = new EventEmitter(); // on enter click
  @Output() onIconClick = new EventEmitter(); // on icon click e.g. search-icon
  maskingMsg:{originalText:string,
              maskedText:string,
              selectedText:string
  }
  optionsData:{selectedText:string,
              startPosition:number,
              endPosition:number,
              length:number
  }
  maskedMsg: string='';
  originalMsg: any;
  arrayOfMasksCopy: { originalText: string; maskedText: string; index: any; }[];

  showEmoji = false;
  isEmojiClicked: boolean = false;

  isTextSelected: boolean;

 arrayOfMasks:{
  originalText:string,
  maskedText:string,
  index:any
 }[]=[]
   contextMenuPosition: any;
  
  constructor(private el: ElementRef,private renderer: Renderer2) {
    this.renderer.listen('document', 'click', (event) => {
      if (!this.textarea.nativeElement.contains(event.target)) {
        this.isTextSelected = false;
      }
    });
  }
  get value(): any {
    return this.val;
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateDivHeight();
      if (this.isTextArea && this.limitTextarea) {
        this.maxCharLimit=1600;
        // Emit the initial character count
        this.input.emit(this.val);
      }
      if(this.isTextArea){
        this.getOriginalMessage(this.value)
  
      }
    }, 0);
   
  }
  increment() {
    // increase the value of the number input
    if (typeof this.max == 'number' && this.value >= this.max) {
      this.value = this.max;
      return;
    }
    this.value = +this.value + 1;
    this.onChange(this.value);
  }

  decrement() {
    // decrease the value of the number input
    if (typeof this.min == 'number' && this.value <= this.min) {
      this.value = this.min;
    return;
    }
    if (typeof this.max == 'number' && +this.value >= this.max) {
      this.value = +this.max - 1;
    return;
    }
    this.value = +this.value - 1;
    this.onChange(this.value);
  }

  onValueChange(element: any) {
    if(this.isTextArea){
      this.isTextSelected=false;
    }
    if (this.validators?.length) this.validators.forEach((fn) => fn(element));
    if(this.limitTextarea){
        // Update the character count
      this.charCount = this.value ? this.value.length : 0;

      // Emit the input event
      this.input.emit(this.value);
    }
  }

onTextareaChange(event){
  this.updateMessages()
}
onSelectionChange(event: MouseEvent): void {
  this.isTextSelected = false;
  const textarea: HTMLTextAreaElement = this.textarea.nativeElement;
  const container: HTMLElement = this.textareaContainer.nativeElement;
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

  if (selectedText.length > 0) {
      const caretPosition = textarea.selectionEnd;

      // Calculate the position of the caret
      const textareaRect = textarea.getBoundingClientRect(); // Get textarea position relative to viewport
      const containerRect = container.getBoundingClientRect(); // Get container position relative to viewport

      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
      const rows = textarea.value.substr(0, caretPosition).split('\n').length;
      const y = lineHeight * (rows + 1 ); // Calculate y position relative to the textarea

      // Calculate x-coordinate based on the start of the selection
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeCaretText = textarea.value.substring(0, startPos);
      const dummySpan = document.createElement('span');
      dummySpan.style.fontSize = window.getComputedStyle(textarea).fontSize;
      dummySpan.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
      dummySpan.style.visibility = 'hidden';
      dummySpan.style.whiteSpace = 'pre';
      dummySpan.textContent = beforeCaretText.replace(/\n/g, ' '); // Replace newlines with spaces
      document.body.appendChild(dummySpan);
      const x = dummySpan.getBoundingClientRect().width; // Calculate x position relative to the textarea
      document.body.removeChild(dummySpan);

      // Calculate position relative to the container
      let relativeY = y + (textareaRect.top - containerRect.top) ;
      let relativeX = x + (textareaRect.left - containerRect.left);

      // Adjust position if it exceeds the container's dimensions
      const contextMenuHeight = 50; // Assuming a fixed height for the context menu
      const contextMenuWidth = 400; // Assuming a fixed width for the context menu

      if (relativeY + contextMenuHeight > container.clientHeight) {
          relativeY = container.clientHeight * .09;
      }
      const bodyDirection = document.documentElement.dir || 'ltr';
      if (bodyDirection === 'rtl') {
        if (relativeX >  container.clientWidth - contextMenuWidth) {
            relativeX =container.clientWidth *.1;
        }
    } else {
        if (relativeX + contextMenuWidth > container.clientWidth) {
            relativeX = container.clientWidth *.2;

        }
    }
      // Set position of the context menu relative to the container
      this.contextMenuPosition = {
        top: `${relativeY}px`
      };
      if(bodyDirection == 'rtl'){

        this.contextMenuPosition.right=`${relativeX}px`
      }else{
        this.contextMenuPosition.left=`${relativeX}px`

      }
      this.optionsData={
        selectedText:selectedText,
        startPosition:startPos,
        endPosition:endPos,
        length:selectedText.length
      }
      
      this.isTextSelected = true;
  } else {
      this.isTextSelected = false;
  }
  
}

onTextareaClick(event: MouseEvent): void {
  if (this.isTextSelected) {
    event.stopPropagation();
  } else {
    this.isTextSelected = false;
  }
}

onHideOptionsMouseDown(event: MouseEvent): void {
  event.preventDefault();
}

uplayMaskingOnSelectedTxt(maskingData: maskingData) {
  this.isTextSelected = false;
  this.maskingMsg = {
    maskedText: `{${maskingData.selectedText};${maskingData.maskingOptions.startFrom};${maskingData.maskingOptions.numberOfLetters};${maskingData.maskingOptions.direction}}`,
    originalText: `[${maskingData.selectedText}]`,
    selectedText: maskingData.selectedText
  };
  this.arrayOfMasks.push({
    originalText: this.maskingMsg.originalText,
    maskedText: this.maskingMsg.maskedText,
    index: maskingData.selectionStartPos
  });
  let currentMessage = this.value;
  this.originalMsg = this.getMaskedMessage(currentMessage, this.maskingMsg.originalText, maskingData.selectionStartPos, maskingData.selectionEndPos);
  this.value = this.originalMsg;
  this.updateMessages();

}

getMaskedMessage(currentMessage, maskedText, startPos, endPos) {
  let updatedMsg =
    currentMessage.substring(0, startPos) +
    maskedText +
    currentMessage.substring(endPos);
  return updatedMsg;
}
getOriginalMessage(maskedMessage){
  if(this.isTextArea){
    this.maskedMsg=maskedMessage;
    this.originalMsg=maskedMessage;
    const regex = /\{\w+\s*;\s*\d+\s*;\s*\d+\s*;\s*[a-zA-Z]\}/g; // Updated regex to handle spaces around commas
    let matches = maskedMessage.match(regex);
      if (matches) {
        matches.forEach(match => {
          let originalText = '['+ match.substring(match.indexOf('{')+1, match.indexOf(';'))+']';
          this.arrayOfMasks.push({
            originalText: originalText,
            maskedText: match,
            index: maskedMessage.indexOf(match)
          });
          // Replace maskedText with originalText in originalMsg
          this.originalMsg = this.originalMsg.replace(match, originalText);
        });
       
 this.value=this.originalMsg;
      }
    
  }
}

getOriginalMasked(message: string) {
  const regex = /\[(.*?)\]/g; // Regular expression to match [...]
  
  // Use match() method to find all matches
  const matches = message.match(regex);

  if (matches) {
    return matches.map(match => {
      let withNoBrackets = match.substring(1, match.length - 1);
      if (withNoBrackets.includes('[')) {
        let matchArr = withNoBrackets.split('');
        matchArr.splice(withNoBrackets.indexOf('['), 1);
        withNoBrackets = matchArr.join('');
        match = `[${withNoBrackets}]`;
      }
      return `${match}`;
    });
  } else {
    return [];
  }
}
setFocus(id){
  const inputElement = document.getElementById(id) as HTMLInputElement;
  if (inputElement) {
    inputElement.focus();
  }
}
updateMessages() {
  this.originalMsg = this.value;
  this.maskedMsg = this.originalMsg;
  this.arrayOfMasksCopy = [...this.arrayOfMasks]; // Make a copy of the array

  let originalMasks = this.getOriginalMasked(this.originalMsg);
  originalMasks.forEach((mask) => {
    let maskedText = this.getMaskedText(mask);
    this.maskedMsg = this.maskedMsg.replace(mask, maskedText);
  });
  this.onChange(this.maskedMsg);
}

getMaskedText(mask) {
  // Filter the array to find all elements where originalText matches the given mask
  let searchedMasks = this.arrayOfMasksCopy.filter((element) => element.originalText === mask);

  if (searchedMasks.length > 0) {
    let searchedMask;
    if (searchedMasks.length === 1) {
      searchedMask = searchedMasks[0];
    } else {
      // Use reduce to find the object with the maximum index value
      searchedMask = searchedMasks.reduce((max, current) => {
        return current.index < max.index ? current : max;
      });
    }

    // Find the index of maxIndexMask in the original array
    let indexToRemove = this.arrayOfMasksCopy.indexOf(searchedMask);
    if (indexToRemove > -1) {
      this.arrayOfMasksCopy.splice(indexToRemove, 1);
    }

    // Return the maskedText of the mask with the biggest index value
    return searchedMask.maskedText;
  } else {
    return mask;
  }
}



  addEmojiToTextArea(e){
    let val = this.value ? this.value : ""
    let emoji =e.emoji.native;
    this.value =  val.slice(0, this.curPos) + emoji + val.slice(this.curPos);
    this.isEmojiClicked = true;
  }
  addEmoji(e){
    if (this.isTextArea && this.limitTextarea) {
      if(this.charCount <this.maxCharLimit -1){
      this.addEmojiToTextArea(e);
      this.charCount = this.value ? this.value.length : 0;
      this.input.emit(this.value);

    
      }
    }
    else{
      this.addEmojiToTextArea(e)

    }
 

  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isEmojiClicked = false;
    }
  }
  curPos = 0;
  getCursorPosition(e){
    this.curPos = e.target.selectionStart;
  }
  updateDivHeight(): void {
    const textareaElement = this.textarea.nativeElement;
    const lineHeight = parseInt(window.getComputedStyle(textareaElement).lineHeight, 10);
    const lines = textareaElement.value.split('\n').length;
    const minHeight = 100; // Set your minimum height here

    this.divHeight = Math.max(minHeight, lines * lineHeight) + 'px';
  }
  getInitialHeight(): number {
    const resizableDiv = document.querySelector('.resizable-div') as HTMLElement;
    return resizableDiv ? resizableDiv.offsetHeight : 100;
  }
}

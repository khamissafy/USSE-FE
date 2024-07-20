import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OnInit } from '@angular/core';
import { SelectOption } from '../select-option.model';
import { DropdownAnimations } from '../dropdown.animations';

const VALUE_ACCESSOR_CONFIG = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectComponent),
  multi: true,
};

@Component({
  selector: 'us-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [VALUE_ACCESSOR_CONFIG],
  animations: [DropdownAnimations.fade, DropdownAnimations.fadeSlideY],
})
export class SelectComponent implements ControlValueAccessor, OnInit {
  private _options!: SelectOption[];
  /* *** Required *** */
  @Input() key: any;
  @Input() form: any;
  @Input('data') set options(value: SelectOption[]) {
    this._options = value;
    if (!this.searchText) this.filteredOptions = value;
    if (!this.throttle) this.isThrottling = false;
  }
  get options(): SelectOption[] {
    return this._options;
  }
  /* Optional [ Settings ] */
  @Input() forFiteringOnly: boolean = false;
  @Input() badgesLimit: number = 4;
  @Input() isSearchOnly: boolean = false;
  @Input() isListDevicesDropdown: boolean = false;
  @Input("enableDropdownWhileSearching") enableDropdownWhileSearching: boolean = true;
  @Input('maxListItemsWithoutSearch') maxWithoutSearch: number = 20; // when to enable search
  @Input('paginationThrottle') throttle?: number; // how much time [in milliseconds] to wait before next pagination
  @Input('multiSelect') isMulti?: boolean; // [ single or multi ]-select
  @Input() actions?: boolean; // clickable actions ( instead of selectable options )
  @Input('enableSearch') isSearchEnabled?: boolean; // enable search feature
  @Input('enableSelectAll') isSelectAllEnabled?: boolean; // enable select and deselect all
  @Input('fixedPlaceholder') isPlaceholderFixed?: boolean; // placeholder never changes when selecting options
  @Input('disableSelectedIndicator') isIndicatorDisabled?: boolean; // disable checkbox and radio-btn before each option
  @Input('enableParentSearch') isParentSearchEnabled?: boolean; // to search dynamically using http request from the parent
  @Input('showSelectedItemsNumberOnly') badgesNumberOnly?: boolean; // instead of showing badges, show the selected items number only
  @Input('searchbarOnToggler') togglerSearch?: boolean;
  @Input('showSelectionOnTop') selectionOnTop?: boolean;
  @Input() isLoading?: boolean; // force loading
  @Input() isDisabled?: boolean; // force disable dropdown
  @Input('custom') isCustom?: boolean;
  @Input() clearable?: boolean; // shows x icon to clear selection in single-select
  @Input() labelTopInMobileView?: boolean=true; 
  /*
	 ↓↓ use a custom css class to modify the styles in your platform ↓↓
	 [ it's recommended to modify this class in the main styles.css file ]
	*/
  @Input('customCssClass') class: string = '';
  /*
	 ↓↓ add a glyph icon before or after (or both) the placeholder ↓↓
	 [ you can use fontAwesome or any other font-icon class
		example: 'fa fa-arrow-down' or 'si-chevron-down' ]
	*/
  @Input('leadingIconClass') leadingIcon?: string;
  @Input('trailingIconClass') trailingIcon?: string;
  /*
		Text inputs, If you want to display custom or translated text ↓↓
		All the text in this component can be passed dynamically using inputs ↓↓
	*/
  @Input() placeholder?: string = 'Select';
  @Input() actionsIcon?: boolean = false;
  @Input() loadingText?: string = 'Loading ...';
  @Input() selectAllText?: string = 'All';
  @Input() searchPlaceholder?: string = 'Search';
  @Input() defaultOptionText?: string = '(Default)';
  @Input('searchNoResultText') noResultText?: string = 'No results';
  @Input() label?: string;
  @Input() optional?: string;
  @Input() description?: string;
  @Input('error') isError?: boolean;
  @Input() grouped?: boolean;
  @Input() sizeInGroup: '' | 'sm' | 'md' | 'lg' = '';
  @Input() hasBackground?: boolean;
  // @ Add a class to identify the first and last buttons in group to adjust styles @ //
  @Input() orderInGroup?: 'first' | 'last';
  @Input() fullWidth: boolean = false;
  @Input() fullWidthOptions: boolean = false;
  @Input() deviceLableGap: boolean = false;
  @Input() withTooltip?: boolean = false;
  @Input() tooltipMsg:string='';
  @Input() tooltipReadMoreLink:string=null;
  @Input() smallDropDown?: boolean = false;
  @Input() endLable?: any = null;

  // Outputs
  @Output() onSelect = new EventEmitter<SelectOption | null>();
  @Output() onDeSelect = new EventEmitter<SelectOption>();
  @Output() onScrolled = new EventEmitter<boolean>();
  @Output() onSearch = new EventEmitter<string>();
  @Output() onOpen = new EventEmitter<any>();
  @Output() onOpenNestedList = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<any>();
  @Output() onAction = new EventEmitter<any>();
  @Output() onSelectAll = new EventEmitter<SelectOption[]>();
  @Output() onDeSelectAll = new EventEmitter<SelectOption[]>();
  
  value: any = null;
  filteredOptions!: SelectOption[]; // the options that being filtered by search
  isOpen = false; // to toggle dropdown list
  isTouched = false; // to handle on touched only once
  searchText: string=null;
  isThrottling!: boolean;

  onChange = (value: any) => {}; // to register value accessor method onChange
  onTouched = () => {}; // to register value accessor method onTouched

  constructor(private eRef: ElementRef) {}

  ngOnInit(): void {
    // init type of value to be able to handle selection
    // if multiSelect value will be an array
    // otherwise will be an object and as no option is selected, will be null
    this.value = this.isMulti ? [] : null;
  }

  @ViewChild('searchbar') set focusOnSearch(searchEl: ElementRef) {
    if (searchEl) searchEl.nativeElement.focus();
  }
  @ViewChild('uList') set onListOpen(listEl: ElementRef) {
    // when dropdown isOpen, check if its X is outside the viewport (left or right)
    // if true, just reverse the X position (inset-inline-start = unset, inset-inline-end = 0)
    // if you didn't get it, please check the position of .list class
    if (listEl) this.whenListPositionIsOutsideViewport(listEl.nativeElement);
  }

  // Value Accessor Methods
  writeValue(value: any): void {
    if (!value) this.value = this.isMulti ? [] : null
    else this.value = value
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  handleTouched(): void {
    if (this.isTouched) this.onTouched();
  }

  // Listening to outer clicks
  @HostListener('document:mousedown', ['$event'])
  onMousedownFromOutside(e: any): void {
    const target = e.target;
    const host = this.eRef.nativeElement.querySelector('.host');

    //TODO: refactor this part so below check for tooltip is no needed
    // abort if click was on tooltip
    if (
      target.classList?.contains('sr-tooltip') ||
      target.parentNode?.classList?.contains('sr-tooltip')
    )
      return;

    if (!host.contains(target)) {
      if (this.isOpen) {
        this.clearSearch();
        this.isOpen = false;
        this.handleTouched();
        this.onClose.emit(this.cloneData(this.value));
      }
    }
  }
  // listening to scroll event for pagination
  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    event.stopPropagation();
    if (!this.isThrottling && !this.searchText)
      if (this.isScrolledToBottom(event)) {
        this.onScrolled.emit(true);
        this.throttlePagination();
      }
  }

  // Main Methods
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.isTouched = true;
    if (!this.isOpen) {
      this.onTouched();
      this.clearSearch();
      this.onClose.emit(this.cloneData(this.value));
    } else this.onOpen.emit(this.cloneData(this.value));
  }

  whenListPositionIsOutsideViewport(el: any): void {
    const offset = el.getBoundingClientRect();
    if (this.isOutsideViewport(offset)) el.classList.add('position_reverse');
    else el.classList.remove('position_reverse');
  }

  search(): void {
    // parent search enables [backend search using this $event]
    // use value to filter data async and just set data from parent to filtered
    // if (this.isParentSearchEnabled) this.onSearch.emit(this.searchText);
    this.onSearch.emit(this.searchText);
  }

  clearSearch(): void {
    this.searchText = '';
  }
  setCount(){
    if(this.value?.length){
      let count = this.value.length
      this.value.forEach((val:any) => {
        this.options.forEach((opt:any) => {
          if(val.value===opt.value && val.children && opt.children && val.children.length< opt.children.length){
            count --;
          }
        });
      });
      return count
    }
  }
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.value = [];
      this.onDeSelectAll.emit(this.cloneData(this.value));
    } else {
      this.value= this.cloneData(this.options);
      this.onSelectAll.emit(this.cloneData(this.value));
    }

    this.onChange(this.cloneData(this.value));
    this.handleTouched();
  }

  onOptionSelected(o: SelectOption | null,child?:any): void {
      if(o?.children) this.onOpenNestedList.emit(o);
      if (this.isMulti && o) this.handleMultiSelect(o,child);
      else this.handleSingleSelect(o);
      this.onChange(this.cloneData(this.value));
      this.handleTouched();
    
  }

  onActionClicked(o: SelectOption): void {
    this.onAction.emit(o);
    this.isOpen = false;
  }

  handleMultiSelect(o: SelectOption,child?:any): void {
    if(child){
      if(this.isSelected(o,child)){
        // deselect
        const i = this.getIndex(o);
        if(this.value[i].children.length === 1) this.value.splice(i, 1);
        else {
          const indx = this.getIndex(child,this.value[i].children);
          this.value[i].children.splice(indx, 1);
        }
        let deselectedArr:any = {...o};
        deselectedArr.children = [child];
        this.onDeSelect.emit(this.cloneData(deselectedArr));
      }else{
        // select
        let selectedArr:any = {...o};
        selectedArr.children = [child]
        const i = this.getIndex(o);

        if(i > -1) this.value[i].children.push(...selectedArr.children);
        else this.value.push(selectedArr);
        this.onSelect.emit(this.cloneData(selectedArr));
      }
    }else{
      if (this.isSelected(o)) {
        // deselect
        const i = this.getIndex(o);
        this.value.splice(i, 1);
        this.onDeSelect.emit(this.cloneData(o));
      }else{
        // select
        const i = this.getIndex(o);
        let selectedArr:any = {...o};
        if(o?.children && o.children.length >0) selectedArr.children =[...o.children];
        if(i > -1) this.value[i] = (selectedArr);
        else this.value.push(selectedArr);

        this.onSelect.emit(this.cloneData(o));
      }
    }
  }
  handleSingleSelect(o: SelectOption | null): void {
    this.value = o;
    this.isOpen = false;
    this.clearSearch();
    this.onSelect.emit(o);
  }

  onBadgeDeselect(e: MouseEvent, o: SelectOption): void {
    e.stopPropagation();
    this.onOptionSelected(o);
    this.onDeSelect.emit(o);
    this.handleTouched();
  }

  // Helper Methods
  getIndex(o: SelectOption,val = this.value): number {
    const found = val.find((opt: any) => opt.value === o.value);
    return val.indexOf(found);
  }
  isNestedListSelected(o: SelectOption){
    return this.value?.some((opt: any) => opt.value === o.value);
  }
  isSelected(o: SelectOption,child?:any): boolean {
    if(child){
      if (this.isMulti){
        const i = this.getIndex(o);
        if(i > -1) return this.value[i].children?.some((opt: any) => opt.value === child.value);
        else return false;
      }
      else return o.value === this.value?.value;
    }else{
      if (this.isMulti){
        for(let key of Object.keys(this.value)){
          if(this.value[key].value === o.value){
            if(
              this.value[key]?.children &&
              o?.children &&
              this.value[key].children.length != o.children.length
            ){
              if(this.value[key].children.length===0) {
                this.value[key] = this.cloneData(o);
                return true
              }
              return false;
            }
            return true;
          }
        };
        return false;
      }
      else return o.value === this.value?.value;
    }

  }

  isScrolledToBottom(event: any): boolean {
    const el: HTMLElement = event.target;
    const pos = el.scrollTop + el.offsetHeight;
    const max = el.scrollHeight;
    return pos >= max - 1;
  }

  throttlePagination(): void {
    this.isThrottling = true;
    if (this.throttle)
      setTimeout(() => {
        this.isThrottling = false;
      }, this.throttle);
  }

  isOutsideViewport(offset: any): boolean {
    return (
      offset.left < 0 ||
      offset.right > window.innerWidth ||
      offset.right > document.documentElement.clientWidth
    );
  }

  // Getters
  get isAllSelected(): boolean {
    return this.value?.length == this.options?.length;
  }
  get isSearchable(): boolean | undefined {
    if (this.isParentSearchEnabled) return true;
    else
      return (
        this.isSearchEnabled && this.options?.length > this.maxWithoutSearch
      );
  }

  //TODO: using stopPropagation() is bad practice refactor code to eliminate the need for it.
  stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }
  isOptNested(option:any){
    return Array.isArray(option)
  }
  cloneData(data:any){
    return JSON.parse(JSON.stringify(data));
  }
}

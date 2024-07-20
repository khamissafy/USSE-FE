import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textMasking'
})
export class TextMaskingPipe implements PipeTransform {
  arrayOfMasks: any=[];

  transform(value: any): any {
    return this.getOriginalMessage(value);
  }
  getOriginalMessage(maskedMessage){
      const regex = /\{\w+\s*;\s*\d+\s*;\s*\d+\s*;\s*[a-zA-Z]\}/g; // Updated regex to handle spaces around commas
      let matches = maskedMessage.match(regex);
      let originalMsg =maskedMessage
        if (matches) {
          matches.forEach(match => {
            let originalText = '['+ match.substring(match.indexOf('{')+1, match.indexOf(';'))+']';
            this.arrayOfMasks.push({
              originalText: originalText,
              maskedText: match,
              index: maskedMessage.indexOf(match)
            });
      
            // Replace maskedText with originalText in originalMsg
            originalMsg = originalMsg.replace(match, originalText);
          });
          return originalMsg
  
      
    
  }
  return originalMsg
  
}
}
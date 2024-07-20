import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lastMsgFileType'
})
export class LastMsgFileTypePipe implements PipeTransform {

  transform(value: any, args?: any): any {
   if(value){
    const  imageTypes = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "tiff",
      "tif",
      "webp",
      "svg",
      "raw"
    ];
    const videoTypes = [
      "mp4",
      "webm",
      "avi",
      "mov",
      "mkv",
      "flv",
      "wmv",
      "m4v",
      "3gp",
      "mpeg"
    ];
  const fileTypesMapping = {
      'txt': 'assets/icons/chat-file.svg',
      'pdf': 'assets/icons/chat-pdf.svg',
      'doc': 'assets/icons/chat-word.svg',
      'docx': 'assets/icons/chat-word.svg',
      'xls': 'assets/icons/chat-excel.svg',
      'xlsx': 'assets/icons/chat-excel.svg',
      'ppt': 'assets/icons/chat-file.svg',
      'pptx': 'assets/icons/chat-file.svg',
      'bin':'assets/icons/chat-file.svg'
  
    };
    const audioTypes = ["mp3", "wav", "ogg","oga", "aac", "flac"];
    const fileExtension = value.split(".").pop().toLowerCase();

    if (imageTypes.includes(fileExtension)) {
      return 'assets/icons/chat-image.svg';
    } else if (videoTypes.includes(fileExtension)) {
      return 'assets/icons/chat-video.svg';
    }else if (audioTypes.includes(fileExtension)) {
      return 'assets/icons/chat-audio.svg';
    }  else {
      return fileTypesMapping[fileExtension] || 'assets/icons/chat-file.svg';
    }
  
  }
   }
}

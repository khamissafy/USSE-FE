import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'attachType'
})
export class AttachTypePipe implements PipeTransform {

  transform(value: any, args?: any): any {
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
        'txt': 'assets/icons/text-icon.svg',
        'pdf': 'assets/icons/pdf-icon.svg',
        'doc': 'assets/icons/word-icon.svg',
        'docx': 'assets/icons/word-icon.svg',
        'xls': 'assets/icons/excel-icon.svg',
        'xlsx': 'assets/icons/excel-icon.svg',
        'ppt': 'assets/icons/powerpoint-icon.svg',
        'pptx': 'assets/icons/powerpoint-icon.svg',
        'bin':'assets/icons/pdf-icon.svg'
    
      };
      const audioTypes = ["mp3", "wav", "ogg","oga", "aac", "flac"];
      const fileExtension = value.split(".").pop().toLowerCase();
  
    if (videoTypes.includes(fileExtension)) {
        return 'assets/icons/video-icon.svg';
      }else if (audioTypes.includes(fileExtension)) {
        return 'assets/icons/audio-icon.svg';
      }  else {
        return fileTypesMapping[fileExtension] || 'assets/icons/pdf-icon.svg';
      }
    
    }
}

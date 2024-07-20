import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'type'
})
export class TypePipe implements PipeTransform {

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
      'txt': 'assets/images/text.svg',
      'pdf': 'assets/images/document.svg',
      'doc': 'assets/images/word.svg',
      'docx': 'assets/images/word.svg',
      'xls': 'assets/images/excel.svg',
      'xlsx': 'assets/images/excel.svg',
      'ppt': 'assets/images/powerpoint.svg',
      'pptx': 'assets/images/powerpoint.svg',
      'bin':'assets/images/document.svg'
  
    };
    const audioTypes = ["mp3", "wav", "ogg","oga", "aac", "flac"];
    const fileExtension = value.split(".").pop().toLowerCase();

    if (imageTypes.includes(fileExtension)) {
      return 'assets/images/image.svg';
    } else if (videoTypes.includes(fileExtension)) {
      return 'assets/images/vid.svg';
    }else if (audioTypes.includes(fileExtension)) {
      return 'assets/images/audio.svg';
    }  else {
      return fileTypesMapping[fileExtension] || 'assets/images/document.svg';
    }
  
  }

}

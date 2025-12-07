declare module 'exif-parser' {
  interface ExifTags {
    GPSLatitude?: number;
    GPSLongitude?: number;
    [key: string]: any;
  }

  interface ExifResult {
    tags: ExifTags;
    [key: string]: any;
  }

  interface ExifParser {
    parse(): ExifResult;
  }

  function create(buffer: Buffer): ExifParser;

  export = {
    create,
  };
}

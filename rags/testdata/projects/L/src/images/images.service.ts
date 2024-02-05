import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Photo as PhotoModel, Prompt as PromptModel, Post as PostModel, Prisma } from '@prisma/client';
import { arrayBuffer } from 'stream/consumers';
const { writeJPGMarker, writePNGtext, writeXMP, getMimeType } = require("image-metadata-editor");
import exifr from 'exifr'
import { capitalize } from '@mui/material';
import { PromptService } from 'L/src/prompt/prompt.service';
var exif = require('exiftool');
const exiftool = require("exiftool-vendored").exiftool
const fs = require("fs");
import { Buffer as nBuffer } from 'node:buffer';

@Injectable()
export class ImagesService {

  constructor(private prisma: PrismaService, private promptService: PromptService) { }

  findByPrompt(promptId: string) {
    return this.photos({ where: { promptId: promptId } })
  }

  async getUnsplash(query) {
    const header = { "Accept-Version": "v1", "redirect": "follow" }

    var config = {
      method: 'GET',
      headers: header,
    };
    let baseUrl = `https://api.unsplash.com`;
    let path = '/search/photos';
    let q = `?query=${encodeURI(query)}&orientation=landscape&client_id=${process.env.UNSPLASH_ID}`;

    const response = fetch(baseUrl + path + q, config)
      .then(response => response.json())
      .then(result => { return result.results.map(data => data.urls.full); })
      .catch(error => console.log('error', error));
    console.log(response)
    return response;
  }
  async getShutter(query) {
    const header = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${process.env.SHUTTER_KEY}`
    }
    let baseUrl = `https://api.shutterstock.com/v2`;
    let path = '/images/search';
    let q = `?query=${encodeURI(query)}&image_type=photo&orientation=horizontal`;

    let config = {
      method: 'GET',
      headers: header,
    };
    const response = await fetch(baseUrl + path + q, config)
      .then(async response => await response.json())
      .then(result => { console.log(result); return result['data'].map((res: any) => res.assets.preview_1000.url) })
      .catch(error => console.log('error', error));
    console.log("SHUTTERWORKS", response)
    return response;
  }

  async getWatermarkedblob(mainUrl, iconUrl): Promise<Blob> {
    const header = {
      "Content-Type": "application/json",
      "Cookie": process.env.WM_COOKIE
    }
    const raw = JSON.stringify({
      "key": process.env.WM_KEY,
      "mainImageUrl": mainUrl,
      "markImageUrl": iconUrl,
      "markRatio": 0.2,
      "opacity": 0.9,
      "position": "bottomLeft",
      "margin": "2%"
    });
    const config: any = {
      method: 'POST',
      headers: header,
      body: raw,
      redirect: 'follow'
    };
    const response = await fetch("https://quickchart.io/watermark", config).then(res => { console.log(res); return res.blob() }).then(blob => { console.log("my watermarker", blob); return blob });
    return response;
  }
  async simpleWM(mainUrl, iconUrl): Promise<Blob> {


    return await fetch(`https://quickchart.io/watermark?mainImageUrl=${mainUrl}&markImageUrl=${iconUrl}&markRatio=0.2&opacity=0.9&position=bottomLeft&margin=2%&key=q-6upmek9fkt8e6kz1oiyxa7qd7lswv4bu`)
      .then(response => response.blob())
      .then(result => { console.log(result); return result })
    // .catch(error => console.log('error', error));

    // const response = await fet.then(res => { console.log(res); return res.blob() }).then(async blob => blob.arrayBuffer()).then(res => { const buffer = Buffer.from(res); console.log(buffer); return buffer });
    // console.log(response);
    // return response
  }
  async simpleWMBuffer(mainUrl, iconUrl): Promise<nBuffer> {

    return await fetch(`https://quickchart.io/watermark?mainImageUrl=${mainUrl}&markImageUrl=${iconUrl}&markRatio=0.2&opacity=0.9&position=bottomLeft&margin=2%&key=q-6upmek9fkt8e6kz1oiyxa7qd7lswv4bu`)
      .then(response => response.blob())
      .then(async result => { return Buffer.from(await (result.arrayBuffer())) })


    // const response = await fet.then(res => { console.log(res); return res.blob() }).then(async blob => blob.arrayBuffer()).then(res => { const buffer = Buffer.from(res); console.log(buffer); return buffer });
    // console.log(response);
    // return response
  }
  async getWatermarked(mainUrl, iconUrl): Promise<Buffer> {
    const header = {
      "Content-Type": "application/json",
      "Cookie": process.env.WM_COOKIE
    }
    const raw = JSON.stringify({
      "key": process.env.WM_KEY,
      "mainImageUrl": mainUrl,
      "markImageUrl": iconUrl,
      "markRatio": 0.2,
      "opacity": 0.9,
      "position": "bottomLeft",
      "margin": "2%"
    });
    const config: any = {
      method: 'POST',
      headers: header,
      body: raw,
      redirect: 'follow'
    };
    const response = await fetch("https://quickchart.io/watermark", config).then(res => { console.log(res); return res.blob() }).then(blob => blob.arrayBuffer()).then(res => { const buffer = Buffer.from(res); console.log(buffer); return buffer });
    return response;
  }
  async photo(
    photoWhereUniqueInput: Prisma.PhotoWhereUniqueInput,
  ): Promise<PhotoModel | null> {
    return this.prisma.photo.findUnique({
      where: photoWhereUniqueInput,
    });
  }

  async photos(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PhotoWhereUniqueInput;
    where?: Prisma.PhotoWhereInput;
    orderBy?: Prisma.PhotoOrderByWithRelationInput;
  }): Promise<PhotoModel[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.photo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async SEOtagbyId(photoId: string, promptId: string) {
    let photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    let prompt = await this.prisma.prompt.findUnique({ where: { id: promptId } })
    const res = await this.SEOTagImage(photo, prompt)
    return res
  }

  async simpleExif(buff: Buffer, title: string, author: string, desc: string, keywords: string[], city: string, geodata: number[]) {
    //const blob = new Blob([res]);
    try {
      exif.metadata(buff, async function (err, metadata) {
        if (err)
          throw err;
        else {
          try {
            let tempwriter = await fs.createWriteStream(`resource/temp.png`);
            tempwriter.write(buff)
            await exiftool.write(`resource/temp.png`, {
              "EXIF:Copyright": `© 2024 ${author}`,
              "IPTC:Title": title,
              "IPTC:Description": desc,
              "IPTC:Author": author,
              "EXIF:Artist": author,
              "EXIF:ImageDescription": desc,
              "EXIF:profileDescription": desc,
              "EXIF:UserComment": desc,
              "IPTC:Keywords": keywords,
              "GPSLatitude": geodata[0],
              "GPSLongitude": geodata[1],
              "IPTC:City": city,
              "IPTC:Contact": author,
              "IPTC:Headline": author
            })
          }
          catch (err) {
            console.log(err);
          }
          let imgBuffer = await fs.readFileSync(`resource/temp.png`);
          console.log("\nbuffer\n", imgBuffer, "\nmeta:\n", "\nold full meta:\n", metadata)
          return imgBuffer;
        }
      });
    } catch (error) {
      console.log(error)
      return error;
    }
  }
  async pngMetadata(photo: PhotoModel, promptData: PromptModel) {
    const res = photo.blob
    console.log("parsing", res);
    //const blob = new Blob([res]);
    try {
      exif.metadata(res, async function (err, metadata) {
        if (err)
          throw err;
        else {
          // let refine = res;
          // refine = await writePNGtext(blob, 'Title', photo.keywords.join(' '));
          // let refined = await writePNGtext(refine, 'Author', promptData.firmName);
          // refine = await writePNGtext(refined, 'Description', photo.alt);

          console.log(`temp.png exists?`);
          try {
            let tempwriter = await fs.createWriteStream(`resource/temp.png`);
            tempwriter.write(res)
            await exiftool.write(`resource/temp.png`, {
              "EXIF:Copyright": `© 2024 ${promptData.firmName}`,
              "IPTC:Title": photo.keywords.join(' '),
              "IPTC:Description": photo.alt,
              "IPTC:Author": promptData.firmName,
              "EXIF:Artist": promptData.firmName,
              "EXIF:ImageDescription": photo.alt,
              "EXIF:profileDescription": photo.alt,
              "EXIF:UserComment": photo.keywords.join(' '),
              "IPTC:Keywords": photo.keywords,
              "GPSLatitude": Number(photo.geoData[0]),
              "GPSLongitude": Number(photo.geoData[1]),
              "IPTC:City": photo.geoData[3],
              "IPTC:Contact": promptData.firmName,
              "IPTC:Headline": promptData.firmName
            })
          }
          catch (err) {
            console.log(err);
          }
          // let output = await exifr.parse(`resource/temp.${metadata.fileTypeExtension}`);
          //console.log("out:\n", output, "\n\n\n");
          //store as buffer again
          let imgBuffer = await fs.readFileSync(`resource/temp.png`);
          console.log("\nbuffer\n", imgBuffer, "\nmeta:\n", "\nold full meta:\n", metadata)
          return imgBuffer;
        }
      });
    } catch (error) {
      console.log(error)
      return error;

    }
  }
  async SEOTagImage(photo: PhotoModel, promptData: PromptModel) {//single or multi? single
    //use postData.keywords after they get fixed
    // bottleneck: processing all the images on client might take forever
    // temporary scalable solution: batch image edits 
    // get the urls, write 20 temp files at a time ||| research required
    // how do i do that with only one exif tool process? ||| research required
    // for now put in urls in and update the database buffers one by one
    // return this.getWatermarked(urls[0], "https://www.iconsdb.com/icons/preview/red/star-xxl.png"); })

    const res = photo.blob; //its actually a buffer lol
    const blob = new Blob([res]);
    //from post
    let testkeywords = ["injury", "practice", "lawyer", "law firm", "lawsuit"];
    //from location
    let testgeodata = ["37.7749", "-122.4194", "xyz street", "San Francisco", "CA", "32049", "USA"];
    let testusr = { email: "BeanBeanFirm@gmail.com" };
    //let testcity = (location[1]);
    try {
      exif.metadata(res, async function (err, metadata) {
        if (err)
          throw err;
        else {
          let refine = res;
          if (metadata.fileTypeExtension == "png") {
            refine = await writePNGtext(blob, 'Title', photo.keywords.join(' '));
            let refined = await writePNGtext(refine, 'Author', promptData.firmName);
            refine = await writePNGtext(refined, 'Description', photo.alt);
          }
          console.log(`temp.${metadata.fileTypeExtension} exists?`);
          try {
            await fs.createWriteStream(`resource/temp.${metadata.fileTypeExtension}`).write(refine)
            await exiftool.write(`resource/temp.${metadata.fileTypeExtension}`, {
              "EXIF:Copyright": `© 2024 ${promptData.firmName}`,
              "IPTC:Title": photo.keywords.join(' '),
              "IPTC:Description": photo.alt,
              "IPTC:Author": promptData.firmName,
              "EXIF:Artist": promptData.firmName,
              "EXIF:ImageDescription": photo.alt,
              "EXIF:profileDescription": photo.alt,
              "EXIF:UserComment": photo.keywords.join(' '),
              "IPTC:Keywords": photo.keywords,
              "GPSLatitude": Number(photo.geoData[0]),
              "GPSLongitude": Number(photo.geoData[1]),
              "IPTC:City": photo.geoData[3],
              "IPTC:Contact": promptData.firmName,
              "IPTC:Headline": promptData.firmName
            })
          }
          catch (err) {
            console.log(err);
          }
          // let output = await exifr.parse(`resource/temp.${metadata.fileTypeExtension}`);
          //console.log("out:\n", output, "\n\n\n");
          //store as buffer again
          let imgBuffer = await fs.readFileSync(`resource/temp.${metadata.fileTypeExtension}`);
          console.log("\nbuffer\n", imgBuffer, "\nmeta:\n", "\nold full meta:\n", metadata)
          return imgBuffer;
        }
      });
    } catch (error) {
      console.log(error)
      return error;

    }
  }

  async createPhoto(data: Prisma.PhotoCreateInput): Promise<PhotoModel> {
    return this.prisma.photo.create({
      data,
    });
  }

  async updatePhoto(params: {
    where: Prisma.PhotoWhereUniqueInput;
    data: Prisma.PhotoUpdateInput;
  }): Promise<PhotoModel> {
    const { data, where } = params;
    return this.prisma.photo.update({
      data,
      where,
    });
  }

  async deletePhoto(where: Prisma.PhotoWhereUniqueInput): Promise<PhotoModel> {
    return this.prisma.photo.delete({
      where,
    });
  }
  findOne(_id: string) {
    return this.prisma.photo.findUnique({ where: { id: _id } })
  }

  remove(id: number) {
    return `This action removes a #${id} image`;
  }
}

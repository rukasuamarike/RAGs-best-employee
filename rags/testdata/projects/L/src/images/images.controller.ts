import { ImagesService } from 'L/src/images/images.service';
import { PromptService } from 'L/src/prompt/prompt.service';
import { Body, Query, Controller, Get, Post, Req, Param } from '@nestjs/common';
import { Request } from 'express';
import { blob } from 'stream/consumers';
import { Buffer as nBuffer } from 'node:buffer';
const fs = require('fs');
@Controller('images')
export class ImagesController {
    prisma: any;

    constructor(
        private readonly PhotoService: ImagesService, private readonly promptService: PromptService,
    ) {

    }
    @Get('promptphotos/:query')
    async getall(@Param('query') query: string) {
        return await this.PhotoService.findByPrompt(query);
    }
    @Get('unsplash/:query')
    async unsplashHandle(@Param('query') query: string) {
        return await this.PhotoService.getUnsplash(query);
    }
    @Post('exif/:id')
    async getimg(@Req() request: Request, @Param('id') id: string) {
        let photo = await this.PhotoService.findOne(id)
        let prompt = await this.promptService.prompt({ id: request.body.promptId })
        console.log(photo, prompt);
        let watermarked = await this.PhotoService.getWatermarked(photo.url, prompt.iconurl)
        let res = await this.PhotoService.SEOtagbyId(id, request.body.promptId);
        return res
    }

    @Get('wm')
    async getwmmimg(@Query() params: any) {
        let res: string;
        console.log(params.main, params.icon)
        try {

            let watermarkedb = await this.PhotoService.simpleWMBuffer(params.main, params.icon)
            // can add seo tags to query above
            const result: nBuffer = await this.PhotoService.simpleExif(watermarkedb, "Need a Laywer?", "Lucas Law", "a picture of lawyers at a table", ["court", "justice", "law"], "LA", [122.321, 94.33]);
            //add to photo object and store
            return result
        }
        catch (error) {
            console.log(error)
        }

    }

    @Post('wm/:id')
    async getwmimg(@Param('id') id: string) {
        try {
            let photo = await this.PhotoService.findOne(id)
            let prompt = await this.promptService.prompt({ id: photo.promptId })
            console.log(photo, prompt);
            console.log("my urls:", photo.url, prompt.iconurl)
            try {
                let watermarkBuffer = await this.PhotoService.getWatermarked(photo.url, prompt.iconurl).then(buffer => { console.log("bb", buffer); return buffer })

                photo.blob = watermarkBuffer
                console.log(photo.blob)
                return photo.blob

            }
            catch (error) {
                return error
            }

            let res = await this.PhotoService.pngMetadata(photo, prompt)
            console.log(res)
            return res
        }//3ba118fc-943f-4a41-a782-4b62f3ee7d53
        catch (error) {
            console.log(error)
        }
        return "hello"

    }
}

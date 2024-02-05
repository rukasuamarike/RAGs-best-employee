import { Controller, Get, Post, Body, Req, Patch, Param, Delete } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { Request } from 'express';
import { socialPost, socialVPost, imageKeywords, socialKeywords } from './templates';
import { Prompt as PromptModel, Photo as PhotoModel, Post as PostModel } from '@prisma/client';
import { PromptService } from '../prompt/prompt.service';
import { PostService } from 'L/src/post/post.service';
import { OpenAI } from 'langchain/llms/openai';
import { GooglePaLM } from 'langchain/llms/googlepalm';
import { ImagesService } from 'L/src/images/images.service';

const { writeJPGMarker, writePNGtext, writeXMP, getMimeType } = require("image-metadata-editor");
import exifr from 'exifr'
import { capitalize } from '@mui/material';
var exif = require('exiftool');
const exiftool = require("exiftool-vendored").exiftool
const fs = require("fs");
// And to verify everything is working:
exiftool
  .version()
  .then((version) => console.log(`We're running ExifTool v${version}`))


@Controller('prompts')
export class PromptsController {
  constructor(private readonly PromptsService: PromptsService,
    private readonly PromptService: PromptService,
    private readonly PhotoService: ImagesService,
    private readonly PostService: PostService) {

  }


  @Get()
  findAll() {
    return this.PromptsService.findAll();
  }

  @Get(':type')

  async findOne(@Req() request: Request, @Param('type') type: string) {

    switch (type) {
      case "onesmal":
        const GPTturbo = new OpenAI({
          temperature: 0,
          modelName: "gpt-3.5-turbo-0301",
          openAIApiKey: process.env.GPT_KEY
        });
        const smalPrompt2 = await socialPost.format({
          firmname: request.body.firmname,
          state: request.body.state,
          practice: request.body.practice,
          weburl: request.body.weburl
        });
        const res = await this.PromptsService.getSmal(smalPrompt2, GPTturbo)
        return res;
      case "smal":
        console.log(request.body);
        const GPTllm = new OpenAI({
          temperature: 0,
          modelName: "gpt-4",
          openAIApiKey: process.env.GPT_KEY
        });
        const PALMllm = new GooglePaLM({
          apiKey: process.env.BISON_KEY,
          temperature: 0,
          modelName: "models/text-bison-001",
          maxOutputTokens: 1024,
        })
        const smalPrompt = await socialPost.format({
          firmname: request.body.prompt.firmname,
          state: request.body.prompt.state,
          practice: request.body.prompt.practice,
          weburl: request.body.prompt.weburl
        });
        const smalPromptViral = await socialVPost.format({
          firmname: request.body.prompt.firmname,
          state: request.body.prompt.state,
          practice: request.body.prompt.practice,
          weburl: request.body.prompt.weburl
        });
        const result = this.PromptsService.getMultiSmal([smalPrompt, smalPromptViral], GPTllm, PALMllm)

        return result
      case "blog":

      case "reply":
        console.log("reply")
      // case "code":
      //   const coder = new OpenAI({
      //     temperature: 0.3,
      //     modelName: "gpt-3.5-turbo-1106",
      //     openAIApiKey: process.env.GPT_KEY
      //   });
      //   return this.promptsService.getCode(
      //     request.body.prompt, coder
      //   )
      default:
        return "default"
    }

  }
  @Post('reply')
  async getReply(@Body() meta: String[], review: String, reviewer: String) {
    return await this.PromptsService.getReviewReply({
      firmname: meta[0],
      state: meta[1],
      reviewer: reviewer,
      review: review,
    })


  }



  @Post('smalproto')//not silly test
  async getSEOSMAL(@Body() promptModel: PromptModel, llm: OpenAI | GooglePaLM) {
    const PALMllm = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const PALMllm2 = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const GPTllm = new OpenAI({
      temperature: 0,
      modelName: "gpt-4",
      openAIApiKey: process.env.GPT_KEY
    });
    const GPTllm2 = new OpenAI({
      temperature: 0,
      modelName: "gpt-4",
      openAIApiKey: process.env.GPT_KEY
    });


    console.log(promptModel)


    //const SEOPrompt = 
    await this.PromptService.createPrompt(
      {
        weburl: promptModel.weburl,
        iconurl: promptModel.iconurl,
        firmName: promptModel.firmName,
        practice: promptModel.practice,
        state: promptModel.state,
      }
    )
      .then(async seoPrompt => {
        await Promise.all([this.PromptsService.getSEOPost(seoPrompt, socialPost, PALMllm, PALMllm2)])
          .then(async postlists =>
            await Promise.all(postlists.flat()
              .map(async post =>
                await this.PostService.createPost(post, seoPrompt.id)
                  .then(async postModel => {
                    const prompt = seoPrompt;
                    const postPhotos = await Promise.all([this.PhotoService.getUnsplash(postModel.keywords.join(",")), this.PhotoService.getShutter(postModel.keywords.splice(2).join(" OR "))])
                      .then(async urlList => {
                        const organize = urlList[0];

                        for (let i = 9; i >= 0; i--) {
                          organize[i] = organize[parseInt(`${i / 2}`)]
                        }
                        for (let i = 0; i < 5; i++) {
                          organize[i * 2 + 1] = urlList[1][i]
                        }
                        const photoObjects = await Promise.all(organize.filter(async url => { await fetch(url).then(res => true).catch(err => false) })
                          .map(async url =>
                            await fetch(url)
                              .then(res => res.arrayBuffer()
                                .then(async res =>
                                //await this.PhotoService.createPhoto(
                                {
                                  return {
                                    url: `${url}`,
                                    keywords: postModel.keywords,
                                    height: 0,
                                    width: 0,
                                    blob: Buffer.from(res),
                                    geoData: ["37.773972", "-122.431297", "xyz street", "SF", "94105", seoPrompt.state, "USA"],
                                    alt: `${postModel.imgDesc}`,
                                    prompt: { connect: { id: seoPrompt.id } },
                                    post: { connect: { id: postModel.id } }
                                  }
                                }
                                  //)
                                )
                              )
                          )
                        );
                        return photoObjects;
                      }
                      );
                    const postObj = postModel;
                    await this.PhotoService.createPhoto(postPhotos[0])
                    console.log("Prompt:", prompt, "\nPOST:", postObj, "PHOTOS:", postPhotos, "\n\n");
                  }
                  )
              )
            )
          )
      });
  }

  /*
.then(async newPhoto => await this.PostService.updatePost(postModel, newPhoto.id, seoPrompt.id)
                                    .then(async updatedPost =>
                                      await this.PromptService.updatePrompt({
                                        where: { id: seoPrompt.id },
                                        data: {
                                          posts: {
                                            connect: { id: updatedPost.id },
                                          },
                                          photos: {
                                            connect: { id: newPhoto.id },
                                          },
                                        },
                                      }).then(updated => { return updated; })
                                    )
                                  )
  */



  // .then(seoPrompt=>

  //)

  // const postlist = await Promise.all([this.PromptsService.getSEOPost(SEOPrompt, socialPost, PALMllm, PALMllm2), this.PromptsService.getSEOPost(SEOPrompt, socialPost, GPTllm, GPTllm2), this.PromptsService.getSEOPost(SEOPrompt, socialVPost, PALMllm, PALMllm2), this.PromptsService.getSEOPost(SEOPrompt, socialVPost, GPTllm, GPTllm2)]).then(async postList => {
  //   return postList.flat();
  // });
  // console.log(postlist)


  //let test = await this.PromptsService.getSEOPost(prompt, socialVPost, GPTllm, GPTllm2);
  // console.log(test); //LEFT OFF HERE. after you test this, if the keywords and image description get generated then no need for chaining for now. one future improvement will be turning the description into stock image keywords.
  // const posts: PostModel[] = await Promise.all([this.PromptsService.getSEOPost(prompt, socialPost, PALMllm, PALMllm2), this.PromptsService.getSEOPost(prompt, socialPost, GPTllm, GPTllm2), this.PromptsService.getSEOPost(prompt, socialVPost, PALMllm, PALMllm2), this.PromptsService.getSEOPost(prompt, socialVPost, GPTllm, GPTllm2)]).then(async postList => {
  //   postList.flat().map(newPost => {
  //     this.PostService.createPost({
  //       title: newPost.title,
  //       body: newPost.body,
  //       prompt: {
  //         connect: { id: SEOPrompt.id }
  //       }
  //     });
  //   });
  //   return postList.flat();
  // });



  @Post('keywords')//silly test
  async getPostKeywords(@Body() prompt: PromptModel) {
    const PALMllm = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const PALMllm2 = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const res = await this.PromptsService.getSEOPost(prompt, socialPost, PALMllm, PALMllm2);
    console.log(prompt)
    return res;
  }

  async getSEOphotos(postlist: any[], prompt: PromptModel) {
    const photolists = Promise.all(postlist.map(async (data, idx) => {
      let tempPhotoList = Promise.all([this.PhotoService.getUnsplash(data.keywords.join(",")), this.PhotoService.getShutter(data.keywords.join(","))])
        .then(async urlList => {
          let PhotoList = Promise.all(urlList.map(url =>
            fetch(url).then(res => res.arrayBuffer().then(res => {
              const tempPhoto = {
                id: '',
                url: `${url}`,
                keywords: data.keywords,
                height: 0,
                width: 0,
                blob: Buffer.from(res),
                geoData: ["37.773972", "-122.431297", "xyz street", "SF", "94105", prompt.state, "USA"],
                alt: `${data.imgDesc}`,
                postId: `${idx}`,
                prompt: {
                  connect: { id: prompt.id }
                },
                promptId: `${prompt.id}`,
              };
              return tempPhoto
            }
            ).then((result) => { return result }))))
          return await PhotoList;
        });
      return await tempPhotoList;
    })
    );
    return await photolists;
  }
  @Post('postphoto')
  async getSEOPhoto(@Body() post: PostModel, prompt: PromptModel) {
    const PALMllm = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const PALMllm2 = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const smalRes = await this.PromptsService.getSEOPost(prompt, socialPost, PALMllm, PALMllm2)
    // const photoRes = await 
    smalRes.posts.forEach(async post => {
      const tempPost = this.PostService.createPost(post, prompt.id
      );
      this.PromptService.updatePrompt({
        where: { id: prompt.id },
        data: {
          posts: {
            connect: { id: (await tempPost).id },
          },
        },

      });
    });
    //get imageDesc
    //get imageKeywords
    //getSEOtags

    // const images = this.PhotoService.getUnsplash(promptData.practice).then((urls: String[]) => {
    //   Promise.all(urls.map(url => {
    //     this.PhotoService.getWatermarked(urls, promptData.iconurl).then(
    //       //create image on prisma with the buffer nahhhhhhhh
    //       //update it 
    //       //this.PhotoService.SEOTagImage()
    //     )

    //   }
    //   )
    //   )
    // })
    // await images




    return { "HELLO": "done!" }
  }//writing


  @Post('photo')
  async photoTest(@Body() promptData: PromptModel) {
    const images = this.PhotoService.getUnsplash(promptData.practice).then((urls: String[]) => { return this.PhotoService.getWatermarked(urls[0], "https://www.iconsdb.com/icons/preview/red/star-xxl.png"); })
    const res = await images;
    const blob = new Blob([res]);
    let keywords = ["injury", "practice", "lawyer", "law firm", "lawsuit"]//get from postid
    let latlon = [37.7749, -122.4194] //get from userid
    let location = ["xyz street", "San Francisco", "CA", "32049", "USA"]//get from locationid
    let usr = { email: "BeanBeanFirm@gmail.com" }//get from locationid
    let city = capitalize(location[1]) //get from locationid
    try {
      exif.metadata(res, async function (err, metadata) {
        if (err)
          throw err;
        else {
          let refine = res;
          if (metadata.fileTypeExtension == "png") {
            refine = await writePNGtext(blob, 'Title', keywords.join(' '));
            let refined = await writePNGtext(refine, 'Author', promptData.firmName);
            refine = await writePNGtext(refined, 'Description', keywords.join(' '));
          }
          console.log(`temp.${metadata.fileTypeExtension} exists?`);
          await fs.createWriteStream(`resource/temp.${metadata.fileTypeExtension}`).write(refine)
          await exiftool.write("resource/temp.png", {
            "EXIF:Copyright": `© 2023 ${promptData.firmName}.`,
            "IPTC:Title": keywords.join(' '),
            "IPTC:Description": promptData.firmName,
            "IPTC:Author": promptData.firmName,
            "EXIF:Artist": promptData.firmName,
            "EXIF:ImageDescription": keywords.join(' '),
            "EXIF:UserComment": keywords.join(' '),
            "IPTC:Keywords": keywords,
            "GPSLatitude": latlon[0],
            "GPSLongitude": latlon[1],
            "IPTC:City": city,
            "IPTC:Contact": usr.email,
            "IPTC:Headline": promptData.firmName
          })
          let output = await exifr.parse(`resource/temp.${metadata.fileTypeExtension}`);
          console.log("out:\n", output, "\n\n\n");
          //store as buffer again
          let imgBuffer = fs.readFileSync(`resource/temp.${metadata.fileTypeExtension}`);
          console.log("\nbuffer\n", imgBuffer, "\nmeta:\n", output, "\nold full meta:\n", metadata)
          return imgBuffer;
        }
      });
    } catch (error) {
      console.log(error)
      return error;

    }
  }






}

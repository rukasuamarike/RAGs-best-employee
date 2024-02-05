import { PrismaController } from '../prisma/prisma.controller';
import { Injectable } from '@nestjs/common';
import { Prompt as PromptModel, Post as PostModel, Photo as PhotoModel } from '@prisma/client';
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain, SequentialChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { z } from "zod";
import {
  StructuredOutputParser,
  OutputFixingParser, CombiningOutputParser, RegexParser
} from "langchain/output_parsers";
import { GooglePaLM } from 'langchain/llms/googlepalm';
import { imageKeywords, postKeywords, reviewReply, socialKeywords, socialPost } from './templates';
import { PostModule } from 'L/src/post/post.module';
import { stringify } from 'querystring';


@Injectable()
export class PromptsService {

  findAll() {
    return `This action returns all prompts`;
  }
  async getCode(codePrompt: string, llm: OpenAI | GooglePaLM) {
    const output = await llm.call(codePrompt);
    console.log(output);
    return output;
  }
  async getReviewReply(data: any) {
    const llm = new GooglePaLM({
      apiKey: process.env.BISON_KEY,
      temperature: 0,
      modelName: "models/text-bison-001",
      maxOutputTokens: 1024,
    })
    const postParser = StructuredOutputParser.fromZodSchema(
      z.string().describe("The reply message"),
    );
    const postFixer = OutputFixingParser.fromLLM(llm, postParser);
    const prompt = new PromptTemplate({
      template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n{query}`,
      inputVariables: ["query"],
      partialVariables: {
        format_instructions: postFixer.getFormatInstructions(),
      },
    });
    const Chain = new LLMChain({
      llm: llm,
      prompt: prompt,
      outputKey: "reply", // For readability - otherwise the chain output will default to a property named "text"
      outputParser: postFixer,
    })

    const result = await Chain.call({
      query: (await reviewReply.format({
        firmname: data.firmName,
        state: data.state,
        reviewer: data.reviewer,
        review: data.review,
      }))
    });
    return result;

  }


  async getSEOPost(data: PromptModel, promptTemplate: PromptTemplate, llm: OpenAI | GooglePaLM, llm2: OpenAI | GooglePaLM) {
    const postParser = StructuredOutputParser.fromZodSchema(
      z
        .array(
          z.object({
            firmname: z.string().describe("The name of the law firm"),
            caption: z.string().describe("The caption of the post"),
            body: z.string().describe("The body of the post up until the first hashtag"),
            imgDesc: z.string().describe("The image description of the post"),
            keywords: z.array(z.string().describe("The SEO and stock image keywords of the post")).describe("a list of SEO and stock image keywords, each 1-2 words"),
            hashtags: z.array(z.string().describe("single hashtag")).describe("a list of hashtags, each beginning with a hashtag")
          })
        )
        .describe("An array of social media posts, each representing a post. ignore lines containing: \`\`\`json and \`\`\`")
    );
    // const keyedPostParser = StructuredOutputParser.fromZodSchema(
    //   z.array(
    //     z.array(
    //       z.string().describe("single keyword"),
    //     ).describe("A keyword list, each string is a keyword describing the same post")
    //   ).describe("an array of 5 keyword lists, each keyword list is from a different post")
    // );

    const postFixer = OutputFixingParser.fromLLM(llm, postParser);
    //const keyedPostFixer = OutputFixingParser.fromLLM(llm2, keyedPostParser);

    const prompt = new PromptTemplate({
      template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n{query}`,
      inputVariables: ["query"],
      partialVariables: {
        format_instructions: postFixer.getFormatInstructions(),
      },
    });
    // const prompt2 = new PromptTemplate({
    //   template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n {posts}. For each post in the list: {query2}`,
    //   inputVariables: ["query2", "posts"],
    //   partialVariables: {
    //     format_instructions: keyedPostFixer.getFormatInstructions(),
    //   },
    // });
    const postChain = new LLMChain({
      llm: llm,
      prompt: prompt,
      outputKey: "posts", // For readability - otherwise the chain output will default to a property named "text"
      outputParser: postFixer,
    });
    // const keyedPostChain = new LLMChain({
    //   llm: llm2,
    //   prompt: prompt2,
    //   outputKey: "keyed posts", // For readability - otherwise the chain output will default to a property named "text"
    //   outputParser: keyedPostFixer,
    // });
    try {
      const result = await postChain.call({
        query: (await promptTemplate.format({
          firmname: data.firmName,
          state: data.state,
          practice: data.practice,
          weburl: data.weburl
        }))
      });

      const res = result.posts.map(post => {
        return {
          title: post.caption,
          body: post.body,
          hashtags: post.hashtags,
          keywords: post.keywords,
          imgDesc: post.imgDesc,
          link: '',
        }
      })
      return res;
    } catch (error) {
      return {
        title: "post.caption",
        body: "post.body",
        hashtags: "post.hashtags",
        keywords: "post.keywords",
        imgDesc: "post.imgDesc",
        link: '',
      }
    }

    // const overallChain = new SequentialChain({
    //   chains: [postChain, keyedPostChain],
    //   inputVariables: ["query", "query2"],
    //   outputVariables: ["posts", "keyed posts"],
    //   verbose: true,
    // });
    // const chainExecutionResult = await overallChain.call({
    //   query: (await promptTemplate.format({
    //     firmname: data.firmName,
    //     state: data.state,
    //     practice: data.practice,
    //     weburl: data.weburl
    //   })),
    //   query2: (await postKeywords.format({
    //     firmname: data.firmName,
    //     state: data.state,
    //     practice: data.practice,
    //     weburl: data.weburl
    //   })),
    // });


    // let newPosts: PostModel[] = chainExecutionResult['posts'].map((post, idx) => {
    //   return {
    //     id: '',
    //     title: post.caption,
    //     body: post.body,
    //     hashtags: post.hashtags,
    //     keywords: chainExecutionResult["keyed posts"][idx],
    //     link: '',
    //     promptId: data.id
    //   } as PostModel
    // })
    // console.log(chainExecutionResult, newPosts);
    // return newPosts;
  }

  async getKeywords(data: PromptModel, llm: OpenAI | GooglePaLM, llm2: OpenAI | GooglePaLM) {
    const outputParser = StructuredOutputParser.fromZodSchema(
      z
        .array(
          z.string().describe("a keyword")
        )
        .describe("An array of strings, each string is a unique keyword")
    );
    const outputFixingParser = OutputFixingParser.fromLLM(llm, outputParser);
    const outputFixingParser2 = OutputFixingParser.fromLLM(llm2, outputParser);
    const prompt = new PromptTemplate({
      template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n{query}`,
      inputVariables: ["query"],
      partialVariables: {
        format_instructions: outputFixingParser.getFormatInstructions(),
      },
    });
    const keywordsChain = new LLMChain({
      llm: llm,
      prompt,
      outputKey: "keywords", // For readability - otherwise the chain output will default to a property named "text"
      outputParser: outputFixingParser,
    });

    const prompt2 = new PromptTemplate({
      template: `You are an SEO engineer and a creative writing assistant:\n{format_instructions}\n {query2}. append {keywords} to the result`,
      inputVariables: ["query2", "keywords"],
      partialVariables: {
        format_instructions: outputFixingParser2.getFormatInstructions(),
      },
    });
    const moreKeywordsChain = new LLMChain({
      llm: llm2,
      prompt: prompt2,
      outputKey: "extended keywords",
    });
    const overallChain = new SequentialChain({
      chains: [keywordsChain, moreKeywordsChain],
      inputVariables: ["query", "query2"],
      // Here we return multiple variables
      outputVariables: ["keywords", "extended keywords"],
      // outputParser: parser,
      verbose: true,
    });
    const chainExecutionResult = await overallChain.call({
      query: (await imageKeywords.format({
        firmname: data.firmName,
        state: data.state,
        practice: data.practice,
        weburl: data.weburl
      })),
      query2: (await socialKeywords.format({
        firmname: data.firmName,
        state: data.state,
        practice: data.practice,
        weburl: data.weburl
      })),
    });
    console.log(chainExecutionResult);
  }
  async getSmal(smalPrompt: string, llm: OpenAI | GooglePaLM) {
    const outputParser = StructuredOutputParser.fromZodSchema(
      z
        .array(
          z.object({
            firmname: z.string().describe("The name of the law firm"),
            caption: z.string().describe("The caption of the post"),
            body: z.string().describe("The body of the post"),
            keywords: z.array(z.string().describe("single keyword")).describe("a list of keywords"),
            hashtags: z.array(z.string().describe("single hashtag")).describe("a list of hashtags, each beginning with a hashtag")
          })
        )
        .describe("An array of social media posts, each representing a post")
    );

    const outputFixingParser = OutputFixingParser.fromLLM(llm, outputParser);
    const prompt = new PromptTemplate({
      template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n{query}`,
      inputVariables: ["query"],
      partialVariables: {
        format_instructions: outputFixingParser.getFormatInstructions(),
      },
    });
    const answerFormattingChain = new LLMChain({
      llm: llm,
      prompt,
      outputKey: "posts", // For readability - otherwise the chain output will default to a property named "text"
      outputParser: outputFixingParser,
    });
    const result = await answerFormattingChain.call({
      query: smalPrompt,
    })

    return result;
  }

  async getMultiSmal(smalPrompts: string[], llm1: OpenAI | GooglePaLM, llm2: OpenAI | GooglePaLM) {
    const p1 = smalPrompts[0] ?? ""
    const p2 = smalPrompts[1] ?? ""
    return await Promise.all([this.getSmal(p2, llm2), this.getSmal(p1, llm2), this.getSmal(p2, llm1), this.getSmal(p1, llm1)]).then(results => {
      console.log("hello");
      const big = { posts: results.map(result => result.posts).flat() };
      return big;
    })
  }
  findOne(type: string) {
    return `This action returns a #${type} prompt`;
  }


}

// async getSEOPhoto(promptData: PromptModel, post:PostModel, llm: OpenAI | GooglePaLM, llm2: OpenAI | GooglePaLM):Promise <PhotoModel[]> {
//   const imageDescParser = StructuredOutputParser.fromZodSchema(
//     z
//       .array(
//         z.object({
//           firmname: z.string().describe("The name of the law firm"),
//           caption: z.string().describe("The caption of the post"),
//           body: z.string().describe("The body of the post"),
//           hashtags: z.array(z.string().describe("single hashtag")).describe("a list of hashtags, each beginning with a hashtag")
//         })
//       )
//       .describe("An array of social media posts, each representing a post")
//   );
//   const imageKeywordParser = StructuredOutputParser.fromZodSchema(
//     z.array(
//       z.array(
//         z.string().describe("single keyword"),
//       ).describe("A keyword list, each string is a keyword describing the same post")
//     ).describe("an array of 5 keyword lists, each keyword list is from a different post")
//   );

//   const postFixer = OutputFixingParser.fromLLM(llm, postParser);
//   const keyedPostFixer = OutputFixingParser.fromLLM(llm2, keyedPostParser);

//   const prompt = new PromptTemplate({
//     template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n{query}`,
//     inputVariables: ["query"],
//     partialVariables: {
//       format_instructions: postFixer.getFormatInstructions(),
//     },
//   });
//   const prompt2 = new PromptTemplate({
//     template: `You are a helpful and creative writing assistant, fulfill the user's request as best you can:\n{format_instructions}\n {posts}. For each post in the list: {query2}`,
//     inputVariables: ["query2", "posts"],
//     partialVariables: {
//       format_instructions: keyedPostFixer.getFormatInstructions(),
//     },
//   });
//   const postChain = new LLMChain({
//     llm: llm,
//     prompt: prompt,
//     outputKey: "posts", // For readability - otherwise the chain output will default to a property named "text"
//     outputParser: postFixer,
//   });
//   const keyedPostChain = new LLMChain({
//     llm: llm2,
//     prompt: prompt2,
//     outputKey: "keyed posts", // For readability - otherwise the chain output will default to a property named "text"
//     outputParser: keyedPostFixer,
//   });
//   const overallChain = new SequentialChain({
//     chains: [postChain, keyedPostChain],
//     inputVariables: ["query", "query2"],
//     outputVariables: ["posts", "keyed posts"],
//     verbose: true,
//   });
//   const chainExecutionResult = await overallChain.call({
//     query: (await promptTemplate.format({
//       firmname: data.firmName,
//       state: data.state,
//       practice: data.practice,
//       weburl: data.weburl
//     })),
//     query2: (await postKeywords.format({
//       firmname: data.firmName,
//       state: data.state,
//       practice: data.practice,
//       weburl: data.weburl
//     })),
//   });
//   //finish this by returning the whole object
//   //yes lets do the object version and add the id to prompt
//   //before we do images lets do the prompt go to controller

//   let newPosts: PostModel[] = chainExecutionResult['posts'].map((post, idx) => {
//     return {
//       id: '',
//       title: post.caption,
//       body: post.body,
//       hashtags: post.hashtags,
//       keywords: chainExecutionResult["keyed posts"][idx],
//       link: '',
//       promptId: data.id
//     } as PostModel
//   })
//   console.log(chainExecutionResult, newPosts);
//   return newPosts;
// }
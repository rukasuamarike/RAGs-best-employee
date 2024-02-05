import { PromptTemplate } from "langchain/prompts";

const reviewReply = PromptTemplate.fromTemplate('You are the owner of the law firm called {firmname} located in {state}. Please write a reply to a google review about your firm written by {reviewer}. The review is: {review}');

export { reviewReply }
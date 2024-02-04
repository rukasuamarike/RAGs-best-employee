import nest_asyncio

nest_asyncio.apply()

import os
import openai
from dotenv import load_dotenv

load_dotenv() 

from llama_index import ServiceContext
from llama_index.llms import OpenAI
from llama_index.schema import MetadataMode
llm = OpenAI(temperature=0.1, model="gpt-3.5-turbo", max_tokens=512)

from llama_index.extractors import (
    SummaryExtractor,
    QuestionsAnsweredExtractor,
    TitleExtractor,
    KeywordExtractor,
    EntityExtractor,
    BaseExtractor,
)
from llama_index.text_splitter import TokenTextSplitter


text_splitter = TokenTextSplitter(
    separator=" ", chunk_size=512, chunk_overlap=128
)


class CustomExtractor(BaseExtractor):
    def extract(self, nodes):
        metadata_list = [
            {
                "custom": (
                    node.metadata["document_title"]
                    + "\n"
                    + node.metadata["excerpt_keywords"]
                )
            }
            for node in nodes
        ]
        return metadata_list


extractors = [
    TitleExtractor(nodes=5, llm=llm),
    QuestionsAnsweredExtractor(questions=3, llm=llm),
    # EntityExtractor(prediction_threshold=0.5),
    # SummaryExtractor(summaries=["prev", "self"], llm=llm),
    # KeywordExtractor(keywords=10, llm=llm),
    CustomExtractor()
]

transformations = [text_splitter] + extractors

from llama_index import SimpleDirectoryReader
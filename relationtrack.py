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
from llama_index import VectorStoreIndex, SimpleDirectoryReader

documents = SimpleDirectoryReader('./documents').load_data()
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
    #QuestionsAnsweredExtractor(questions=3, llm=llm),
    # EntityExtractor(prediction_threshold=0.5),
    SummaryExtractor(summaries=["prev", "self","next"], llm=llm),
    KeywordExtractor(keywords=10, llm=llm),
    # CustomExtractor() for relationships made
]

transformations = [text_splitter] + extractors
from llama_index.ingestion import IngestionPipeline

pipeline = IngestionPipeline(
    transformations=transformations
)
nodes = pipeline.run(
    documents=documents,
    in_place=True,
    show_progress=True,
)
blocks=[node.metadata['excerpt_keywords']for node in nodes]
print(blocks)

# index = VectorStoreIndex.from_documents(documents)

# query_engine = index.as_query_engine()

# from llama_index.langchain_helpers.agents import (
#     IndexToolConfig,
#     LlamaIndexTool,
# )


# print(query_engine.query("find all relations between keywords the user made in the text."))

# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.feature_extraction.text import CountVectorizer

# # Create a CountVectorizer to convert texts to vectors
# vectorizer = CountVectorizer().fit_transform(data)

# # Calculate similarity
# similarity = cosine_similarity(vectorizer)

# # Create a dictionary to store the count of filtered data for each keyword
# filtered_data_count = {keyword: 0 for keyword in keywords}

# #Define the threshold
# threshold = 0.5

# # Iterate over texts and their similarities
# for i, text in enumerate(data):
#     for j, keyword in enumerate(keywords):
#         if keyword in text and similarity[i][j] >= threshold:
#             filtered_data_count[keyword] += 1

# print(filtered_data_count)
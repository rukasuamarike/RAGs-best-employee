import os
import openai
import requests
from llama_index import SQLDatabase,ServiceContext
from llama_index.llms import OpenAI
from llama_index.ingestion import IngestionPipeline
from llama_index.text_splitter import SentenceSplitter
from llama_index import Document
from llama_index.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings import OpenAIEmbedding
from llama_index import VectorStoreIndex, StorageContext
from llama_index.vector_stores import ChromaVectorStore
from llama_index import SimpleDirectoryReader
from llama_index.schema import TextNode, NodeRelationship, RelatedNodeInfo
from llama_index import (
    ServiceContext,
    OpenAIEmbedding,
    PromptHelper,
)
from llama_index import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
)
from llama_index.node_parser import HierarchicalNodeParser


from llama_index.tools import QueryEngineTool, ToolMetadata
from llama_index.node_parser import HierarchicalNodeParser
from llama_index.node_parser import get_leaf_nodes, get_root_nodes
from llama_index.extractors import (
    SummaryExtractor,
    QuestionsAnsweredExtractor,
    TitleExtractor,
    KeywordExtractor,
    EntityExtractor,
    BaseExtractor,
)
import nest_asyncio
nest_asyncio.apply()
from llama_index.readers import SimpleWebPageReader

from IPython.display import Markdown, display
from enum import Enum
import pandas as pd
import chromadb
from dotenv import load_dotenv
from transformers import pipeline
from transformers import BertForSequenceClassification, AutoTokenizer
from llama_index.agent import ReActAgent
from llama_index.llms import OpenAI
load_dotenv()  # take environment variables from .env.
llm = OpenAI(temperature=0.1, model="gpt-3.5-turbo", max_tokens=512)

db1 = chromadb.PersistentClient(path="./chroma_db")
semantic_collection = db1.get_or_create_collection("semantic_nodes")
semantic_vector_store = ChromaVectorStore(chroma_collection=semantic_collection)
semantic_storage_context = StorageContext.from_defaults(vector_store=semantic_vector_store)
semantic_service_context = ServiceContext.from_defaults(embed_model=OpenAIEmbedding())
semantic_index = VectorStoreIndex.from_vector_store(
    semantic_vector_store,
    service_context=semantic_service_context,
)
db2 = chromadb.PersistentClient(path="./chroma_db")
taxonomy_collection = db2.get_or_create_collection("taxonomy_nodes")
taxonomy_vector_store = ChromaVectorStore(chroma_collection=taxonomy_collection)
taxonomy_storage_context = StorageContext.from_defaults(vector_store=taxonomy_vector_store)
taxonomy_service_context = ServiceContext.from_defaults(embed_model=OpenAIEmbedding())
taxonomy_index = VectorStoreIndex.from_vector_store(
    taxonomy_vector_store,
    service_context=taxonomy_service_context,
)
db3 = chromadb.PersistentClient(path="./chroma_db")
web_collection = db3.get_or_create_collection("web_nodes")
web_vector_store = ChromaVectorStore(chroma_collection=web_collection)
web_storage_context = StorageContext.from_defaults(vector_store=web_vector_store)
web_service_context = ServiceContext.from_defaults(embed_model=OpenAIEmbedding())
web_index = VectorStoreIndex.from_vector_store(
    web_vector_store,
    service_context=web_service_context,
)
db4 = chromadb.PersistentClient(path="./chroma_db")
persona_collection = db4.get_or_create_collection("persona_nodes")
persona_vector_store = ChromaVectorStore(chroma_collection=persona_collection)
persona_storage_context = StorageContext.from_defaults(vector_store=persona_vector_store)
persona_service_context = ServiceContext.from_defaults(embed_model=OpenAIEmbedding())
persona_index = VectorStoreIndex.from_vector_store(
    persona_vector_store,
    service_context=persona_service_context,
)


username="Lucas Amlicke"
desired_job="CEO of google"
#semantic -> heirarchy(entities)
# pipe = pipeline("text-classification", model="TimSchopf/nlp_taxonomy_classifier")
# tokenizer = AutoTokenizer.from_pretrained('TimSchopf/nlp_taxonomy_classifier')
# model = BertForSequenceClassification.from_pretrained('TimSchopf/nlp_taxonomy_classifier')
# title_abs = [d['title'] + tokenizer.sep_token + (d.get('abstract') or '') for d in papers]

semantic_query_engine = semantic_index.as_chat_engine(
    service_context=semantic_service_context, chat_mode="react", verbose=True)
taxonomy_query_engine= taxonomy_index.as_chat_engine(
    service_context=taxonomy_service_context, chat_mode="react", verbose=True)
web_query_engine= web_index.as_chat_engine(
    service_context=web_service_context, chat_mode="react", verbose=True)
persona_query_engine= web_index.as_chat_engine(
    service_context=web_service_context, chat_mode="react", verbose=True)

query_engine_tools = [
    QueryEngineTool(
        query_engine=semantic_query_engine,
        metadata=ToolMetadata(
            name="employability engine",
            description=(
                f"Provides information the file locations of the {username}'s Employability files. Provides information on skill sets and past work experience and projects "
                "Use a detailed plain text command as input to the tool."
            ),
        ),
    ),
    QueryEngineTool(
        query_engine=taxonomy_query_engine,
        metadata=ToolMetadata(
            name="knowledge taxonomy engine",
            description=(
                f"Provides information about the level of {username}'s expertise benchmarked by the level of abstraction and information taxonomy found in their Employability files"
                "Use a detailed plain text question as input to the tool."
            ),
        ),
    ),
    QueryEngineTool(
        query_engine=persona_query_engine,
        metadata=ToolMetadata(
            name="scraped linkedin jobs",
            description=(
                f"Provides information about jobs that may match {username}'s expertise"
                "Use a detailed plain text question as input to the tool."
            ),
        ),
    ),
    QueryEngineTool(
        query_engine=persona_query_engine,
        metadata=ToolMetadata(
            name="scraped linkedin jobs",
            description=(
                f"Provides information about jobs that may match {username}'s expertise"
                "Use a detailed plain text question as input to the tool."
            ),
        ),
    ),
]
agent = ReActAgent.from_tools(
    query_engine_tools,
    llm=llm,
    verbose=True,
    # context=context
)

# res = pipe(title_abs, return_all_scores=True)

embed_model = OpenAIEmbedding()
# embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

def getWeb(url):
    

    # loader = SimpleWebPageReader()
    # documents = loader.load_data(urls=['https://google.com'])
    documents = SimpleWebPageReader(html_to_text=True).load_data(
        [url]
    )
    return documents

def getDocs(path):
    return SimpleDirectoryReader(path, filename_as_id=True).load_data()
    
def semanticPipe(in_doc):
    splitter = SemanticSplitterNodeParser(
    buffer_size=1, breakpoint_percentile_threshold=95, embed_model=embed_model
)
    extractors = [
    TitleExtractor(nodes=5, llm=llm),
    QuestionsAnsweredExtractor(questions=3, llm=llm),
    SummaryExtractor(summaries=["prev", "self"], llm=llm),
    KeywordExtractor(keywords=10, llm=llm),
    EntityExtractor(
    prediction_threshold=0.5,
    label_entities=False,  # include the entity label in the metadata (can be erroneous)
    device="cpu",  # set to "cuda" if you have a GPU
    )
]
    pipeline = IngestionPipeline(transformations=[splitter]+extractors,
    vector_store=semantic_vector_store,
)
    nodes = pipeline.run(documents=in_doc)
    for node in nodes:
        print(f"Node: {node.text, node.metadata}")
    return nodes

def taxpipe(username,nodes):
    node_parser = HierarchicalNodeParser.from_defaults()
    pipe = pipeline("text-classification", model="TimSchopf/nlp_taxonomy_classifier")
    tokenizer = AutoTokenizer.from_pretrained('TimSchopf/nlp_taxonomy_classifier')
    newNode=[]
    for d in nodes:
        print(d.metadata.get('entities'))
        pipe = pipeline("text-classification", model="TimSchopf/nlp_taxonomy_classifier")
        tokenizer = AutoTokenizer.from_pretrained('TimSchopf/nlp_taxonomy_classifier')
        temp=d.metadata
        temp.update({'taxonomy': pipe(f'{username}_'+d.metadata.get('document_title') + tokenizer.sep_token + (d.metadata.get('section_summary') or ''))})
        taxonomy_index.insert(TextNode(text=d.text, metadata=temp))
    # for n in newNode:
    #     nodes = node_parser.get_nodes_from_documents(n)
    # for n in newNode:
    #     taxonomy_vector_store.add(n)
    # query jobs that relate to excerpt_keywords,
    # analyze taxonomy from concepts in excerpt_keywords, questions_this_excerpt_can_answer
    # heirarchy split low level node.text
    #compare section_summary,prev_section_summary
    
    
    
    
    #vector store newnodes
# documents = getWeb("http://paulgraham.com/worked.html")
# # print(documents)
# test='Lucas Amlicke, software engineering, programming languages, projects, web frameworks, AI APIs, POTO Solutions, RYE Inc., education, skills, The-Block.xyz, Voluntarius, Assembly, Batch, Bash, C/C++, CSS, Dart, Go, GraphQL, HTML5, Jade, Java, Javascript, Lua, MATLAB, PHP, Powershell, Python, SQL, TypeScript, Verilog, arcade games, AR/VR, bartending, casino game dealing, cooking, electronics, scuba diving, skiing, surfing, video editing, video games, volleyball.'
# documents= getDocs("./testdata/documents/resume")
# nodes = semanticPipe(documents)
# taxpipe(nodes)

from bs4 import BeautifulSoup,SoupStrainer
#https://www.state.gov/reports/2022-country-reports-on-human-rights-practices/indonesia


def getJobs():
    response = agent.query(f"Use the {username} employability engine tool to create a list of 5 job titles that are very similar to {desired_job} and would require {username}'s highest level skills \n return format should be as a python tuple, Example: ('queries',['full stack developer', 'Backend Engineer', 'UX designer'])")
    return response
def parserJobs(keywords):
    keylist = keywords[1]
    urls=[f"https://www.linkedin.com/jobs/search?keywords={keyword}" for keyword in keylist]
    documents=[]
    documents = [getWeb(url)for url in urls]
    pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=25, chunk_overlap=0),
        TitleExtractor(),
        OpenAIEmbedding(),
    ],
    vector_store=web_vector_store
)
    nodes = pipeline.run(documents=documents)
    print(nodes)
    
resumedata = getDocs('./testdata/documents/resume')
projectdata = getDocs('./testdata/projects/nestJs-SEO')
flatlist=[item for row in [resumedata,projectdata] for item in row]
print(flatlist)
semanticNodes = semanticPipe(flatlist)
#taxpipe(username,semanticNodes)
docs=getJobs()
parserJobs(docs)
resp = agent.chat(f"Instructions: based on the knowledge and job descriptions {desired_job} scraped from linkedin, tell me about the assets, experiences, projects and skills.that someone qualified for the job would have. Criteria: 1. describe a person who is working in the position of {desired_job}. 2. on a scale of 1 to 10, estimate this persona's employability capital including: their time management efficiency, social connections, assets, experiences, and skill based projects that qualify them for that position. 3. output all these information as a knowledge schema, Represent as: a json object comprised of objects, each level of encapsulation must be based on knowledge abstraction heirarchy from Niches to experiences to raw skills")

# 1. generate collection of files that demonstrate your person has the skill to qualify for the job. 2. generate resume.pdf, CV.txt (for the linkedin jobs, coding projects(.py, .js, .readme). 4. Create a json object")
    
print(resp)














# # load documents with deterministic IDs
# # documentsRef = SimpleDirectoryReader("./documents", filename_as_id=True).load_data()
# nodes = pipeline.run(documents=documents)

# for node in nodes:
#     print(f"Node: {node.text, node.metadata}")
# nodes=pipeline.run(documents=documents)
# index = VectorStoreIndex(nodes, storage_context=storage_context)

# connection_uri="sqlite:///Chinook.db"
# service_context = ServiceContext.from_defaults(llm=llm)
# #query_engine = 
# # response = query_engine.query(question)
# # response_md = str(response)


# response_template = """
# Question:
# {question}

# Answer:
# {response}

# Generated SQL Query:
# {sql}

# """


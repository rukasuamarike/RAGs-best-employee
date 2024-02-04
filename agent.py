from llama_index import (
    SimpleDirectoryReader,
    ServiceContext,
    GPTVectorStoreIndex,
)
from llama_index.response.pprint_utils import pprint_response
from llama_index.llms import OpenAI
llm = OpenAI(temperature=0, model="gpt-4")
service_context = ServiceContext.from_defaults(llm=llm)
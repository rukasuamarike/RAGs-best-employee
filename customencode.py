from InstructorEmbedding import INSTRUCTOR
import os
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.
model = INSTRUCTOR('hkunlp/instructor-large')
sentence = "3D ActionSLAM: wearable person tracking in multi-floor environments"
instruction = "Represent the Science title:"
embeddings = model.encode([[instruction,sentence]])
print(embeddings)


from transformers import pipeline
from transformers import BertForSequenceClassification, AutoTokenizer

from dotenv import load_dotenv

load_dotenv() 
pipe = pipeline("text-classification", model="TimSchopf/nlp_taxonomy_classifier")
tokenizer = AutoTokenizer.from_pretrained('TimSchopf/nlp_taxonomy_classifier')
model = BertForSequenceClassification.from_pretrained('TimSchopf/nlp_taxonomy_classifier')

# prepare data need pipeline here too
papers = [{'title': 'Attention Is All You Need', 'abstract': 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.'},
          {'title': 'SimCSE: Simple Contrastive Learning of Sentence Embeddings', 'abstract': 'This paper presents SimCSE, a simple contrastive learning framework that greatly advances state-of-the-art sentence embeddings. We first describe an unsupervised approach, which takes an input sentence and predicts itself in a contrastive objective, with only standard dropout used as noise. This simple method works surprisingly well, performing on par with previous supervised counterparts. We find that dropout acts as minimal data augmentation, and removing it leads to a representation collapse. Then, we propose a supervised approach, which incorporates annotated pairs from natural language inference datasets into our contrastive learning framework by using "entailment" pairs as positives and "contradiction" pairs as hard negatives. We evaluate SimCSE on standard semantic textual similarity (STS) tasks, and our unsupervised and supervised models using BERT base achieve an average of 76.3% and 81.6% Spearmans correlation respectively, a 4.2% and 2.2% improvement compared to the previous best results. We also show -- both theoretically and empirically -- that the contrastive learning objective regularizes pre-trained embeddings anisotropic space to be more uniform, and it better aligns positive pairs when supervised signals are available.'}]
# concatenate title and abstract with [SEP] token
title_abs = [d['title'] + tokenizer.sep_token + (d.get('abstract') or '') for d in papers]

res = pipe(title_abs, return_all_scores=True)
print(res)
# nodes = pipe.run(
#     documents=papers,
#     in_place=True,
#     show_progress=True,
#     return_all_scores=True
# )
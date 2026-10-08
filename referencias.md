# Referências

Bibliografia consolidada da mentoria. Cada módulo lista as suas no próprio README; aqui ficam todas, agrupadas por tema. Só fontes públicas.

## Ferramentas e ambiente (Módulo 00)

- Node.js — calendário de versões: https://nodejs.org/en/about/previous-releases
- pnpm — instalação: https://pnpm.io/installation
- pnpm — workspaces: https://pnpm.io/workspaces
- Ollama — download: https://ollama.com/download
- Ollama — compatibilidade com a API da OpenAI: https://docs.ollama.com/api/openai-compatibility
- AI SDK — provedores OpenAI-compatible: https://ai-sdk.dev/providers/openai-compatible-providers
- AI SDK — saída estruturada: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- AI SDK — testes com mock: https://ai-sdk.dev/docs/ai-sdk-core/testing
- Zod: https://zod.dev
- Vitest: https://vitest.dev
- promptfoo: https://www.promptfoo.dev/docs/intro/

## Como LLMs funcionam (Módulo 01)

- Sennrich, Haddow, Birch (2015). *Neural Machine Translation of Rare Words with Subword Units*. https://arxiv.org/abs/1508.07909
- Petrov et al. (2023). *Language Model Tokenizers Introduce Unfairness Between Languages*. https://arxiv.org/abs/2305.15425
- Karpathy. *Let's build the GPT Tokenizer*. https://www.youtube.com/watch?v=zduSFxRajkE
- Tiktokenizer: https://tiktokenizer.vercel.app
- js-tiktoken: https://github.com/dqbd/tiktoken
- Mikolov et al. (2013). *Efficient Estimation of Word Representations in Vector Space*. https://arxiv.org/abs/1301.3781
- Vaswani et al. (2017). *Attention Is All You Need*. https://arxiv.org/abs/1706.03762
- Alammar. *The Illustrated Transformer*. https://jalammar.github.io/illustrated-transformer/
- 3Blue1Brown. *Transformers* e *Attention*. https://www.3blue1brown.com/lessons/gpt · https://www.3blue1brown.com/lessons/attention
- Holtzman et al. (2019). *The Curious Case of Neural Text Degeneration*. https://arxiv.org/abs/1904.09751
- Liu et al. (2023). *Lost in the Middle: How Language Models Use Long Contexts*. https://arxiv.org/abs/2307.03172
- Ouyang et al. (2022). *Training language models to follow instructions with human feedback*. https://arxiv.org/abs/2203.02155
- Lambert et al. (2024). *Tülu 3: Pushing Frontiers in Open Language Model Post-Training*. https://arxiv.org/abs/2411.15124
- DeepSeek-AI (2025). *DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning*. https://arxiv.org/abs/2501.12948
- Kalai et al. (2025). *Why Language Models Hallucinate*. https://arxiv.org/abs/2509.04664 · https://openai.com/index/why-language-models-hallucinate/
- RFC 2606 (domínios reservados, usados nos dados sintéticos). https://www.rfc-editor.org/rfc/rfc2606

## System One, decisões tipadas e calibração (Módulo 02)

- TypeSafe AI. *Introducing System One Models and Jev* (15/set/2026). https://typesafe.ai/blog/introducing-system-one-models-and-jev
- TypeSafe AI, documentação: primitivas https://docs.typesafe.ai/primitives · confiança https://docs.typesafe.ai/confidence · API https://docs.typesafe.ai/api · limitações do jev-1.13 https://docs.typesafe.ai/model-jaggedness/jev-1.13
- Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.
- Guo et al. (2017). *On Calibration of Modern Neural Networks*. https://arxiv.org/abs/1706.04599
- Kadavath et al. (2022). *Language Models (Mostly) Know What They Know*. https://arxiv.org/abs/2207.05221
- Wang et al. (2022). *Self-Consistency Improves Chain of Thought Reasoning in Language Models*. https://arxiv.org/abs/2203.11171
- OpenAI (2023). *GPT-4 Technical Report*. https://arxiv.org/abs/2303.08774
- Tian et al. (2023). *Just Ask for Calibration*. https://arxiv.org/abs/2305.14975
- Xiong et al. (2023). *Can LLMs Express Their Uncertainty?* https://arxiv.org/abs/2306.13063
- Tam et al. (2024). *Let Me Speak Freely? A Study on the Impact of Format Restrictions on Performance of Large Language Models*. https://arxiv.org/abs/2408.02442

## Prompt, evals e guardrails (Módulo 03)

- Anthropic. *Use XML tags to structure your prompts*. https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags
- OpenAI. *Prompt engineering*. https://platform.openai.com/docs/guides/prompt-engineering
- Brown et al. (2020). *Language Models are Few-Shot Learners*. https://arxiv.org/abs/2005.14165
- Zheng et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*. https://arxiv.org/abs/2306.05685
- Cohen, J. (1960). *A Coefficient of Agreement for Nominal Scales*. https://doi.org/10.1177/001316446002000104
- Efron, B. (1979). *Bootstrap Methods: Another Look at the Jackknife*. https://doi.org/10.1214/aos/1176344552
- Greshake et al. (2023). *Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection*. https://arxiv.org/abs/2302.12173
- OWASP. *LLM01: Prompt Injection*. https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- promptfoo: configuração https://www.promptfoo.dev/docs/configuration/reference/ · provider próprio https://www.promptfoo.dev/docs/providers/custom-api/ · casos de teste https://www.promptfoo.dev/docs/configuration/test-cases/ · `llm-rubric` https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/

## Orquestração e HITL (Módulos 06–07)

- LangGraph.js — interrupts: https://docs.langchain.com/oss/javascript/langgraph/interrupts
- LangGraph.js — human-in-the-loop: https://docs.langchain.com/oss/javascript/langgraph/human-in-the-loop

<!-- Módulos seguintes acrescentam suas referências aqui. -->

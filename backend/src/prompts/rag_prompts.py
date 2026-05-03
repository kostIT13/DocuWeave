from typing import List, Dict, Any


class RAGPrompts:
    @staticmethod
    def get_document_analysis_prompt(context_text: str) -> str:
        return (
            "Ты - ассистент по анализу документов. Отвечай только на основе предоставленного контекста. "
            "Если в контексте нет информации для ответа, скажи об этом.\n\n"
            f"Контекст:\n{context_text}"
        )
    
    @staticmethod
    def get_summarization_prompt(text: str) -> str:
        return (
            "Пожалуйста, создай краткое содержание следующего текста. "
            "Выдели основные идеи и ключевые моменты.\n\n"
            f"Текст:\n{text}"
        )
    
    @staticmethod
    def get_qa_prompt(question: str, context: str) -> str:
        return (
            "Ответь на вопрос на основе предоставленного контекста. "
            "Если в контексте нет информации для ответа, скажи 'В предоставленных документах нет информации по этому вопросу.'\n\n"
            f"Вопрос: {question}\n\n"
            f"Контекст:\n{context}"
        )
    
    @staticmethod
    def get_extraction_prompt(text: str, entities: List[str]) -> str:
        entities_str = ", ".join(entities)
        return (
            f"Извлеки следующие сущности из текста: {entities_str}. "
            "Представь результат в виде структурированного списка.\n\n"
            f"Текст:\n{text}"
        )
    
    @staticmethod
    def get_classification_prompt(text: str, categories: List[str]) -> str:
        categories_str = ", ".join(categories)
        return (
            f"Классифицируй следующий текст в одну из категорий: {categories_str}. "
            "Ответь только названием категории.\n\n"
            f"Текст:\n{text}"
        )


rag_prompts = RAGPrompts()
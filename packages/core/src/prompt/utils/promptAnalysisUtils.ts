import { PromptAnalysisResult } from './promptUtils'; // 确保引入相应的类型定义

/**
 * 提示词分析的多语言文本结构
 */
interface PromptAnalysisTexts {
    length: {
        label: string;
        tooShort: string;
        tooLong: string;
        appropriate: string;
        suggestion: string;
    };
    role: {
        label: string;
        passed: string;
        failed: string;
        suggestion: string;
    };
    goalVerb: {
        label: string;
        passed: string;
        failed: string;
        suggestion: string;
    };
    style: {
        label: string;
        passed: string;
        failed: string;
        suggestion: string;
    };
    structure: {
        label: string;
        passed: string;
        failed: string;
        suggestion: string;
    };
    encouragement: string;
}

/**
 * 获取对应语言的提示词分析文本
 * @param language 语言代码
 * @returns 对应语言的文本资源
 */
function getPromptAnalysisTexts(language?: string): PromptAnalysisTexts {
    // 简体中文
    if (language?.includes('zh') && !language?.includes('Hant')) {
        return {
            length: {
                label: '提示词长度',
                tooShort: '当前提示词可能略短，信息量较少，可能导致模型理解不够充分。',
                tooLong: '提示词较长，请确保内容清晰、有结构，避免冗余影响模型理解。',
                appropriate: '提示词长度适中。',
                suggestion: '建议补充一些背景或目标描述，使模型更清楚你的意图。'
            },
            role: {
                label: '指定 AI 角色',
                passed: '你已指定 AI 扮演的身份，有助于模型定位任务语气。',
                failed: '未说明 AI 应以什么身份回答。',
                suggestion: '可以加上"作为一位专家…"帮助模型更贴近你的目标。'
            },
            goalVerb: {
                label: '明确任务目标',
                passed: '已包含任务指令，模型更容易知道你想要什么。',
                failed: '缺少清晰的任务动词，模型可能不知从何下手。',
                suggestion: '建议补充"请撰写…"、"请列出…"等任务型语句。'
            },
            style: {
                label: '表达输出风格或预期',
                passed: '你已经表达了希望如何呈现结果，模型能据此做出合适回应。',
                failed: '提示词未说明你希望结果怎么呈现，模型可能只给出泛泛回应。',
                suggestion: '你可以简单补充一句"请用简明方式呈现"或"写成宣传文案"，模型会理解得更清楚。'
            },
            structure: {
                label: '结构清晰表达',
                passed: '提示词有分段或结构词，模型更容易理解复杂任务。',
                failed: '提示词是长句或无结构，可能让模型难以解析重点。',
                suggestion: '建议将内容分段，例如"第一步…"、"然后…"能提升理解效果。'
            },
            encouragement: '🎉 太棒了！你的提示词结构完整、意图清晰，是非常优秀的提示词！'
        };
    }
    // 繁体中文
    else if (language?.includes('zh') && language?.includes('Hant')) {
        return {
            length: {
                label: '提示詞長度',
                tooShort: '當前提示詞可能略短，信息量較少，可能導致模型理解不夠充分。',
                tooLong: '提示詞較長，請確保內容清晰、有結構，避免冗餘影響模型理解。',
                appropriate: '提示詞長度適中。',
                suggestion: '建議補充一些背景或目標描述，使模型更清楚你的意圖。'
            },
            role: {
                label: '指定 AI 角色',
                passed: '你已指定 AI 扮演的身份，有助於模型定位任務語氣。',
                failed: '未說明 AI 應以什麼身份回答。',
                suggestion: '可以加上"作為一位專家…"幫助模型更貼近你的目標。'
            },
            goalVerb: {
                label: '明確任務目標',
                passed: '已包含任務指令，模型更容易知道你想要什麼。',
                failed: '缺少清晰的任務動詞，模型可能不知從何下手。',
                suggestion: '建議補充"請撰寫…"、"請列出…"等任務型語句。'
            },
            style: {
                label: '表達輸出風格或預期',
                passed: '你已經表達了希望如何呈現結果，模型能據此做出合適回應。',
                failed: '提示詞未說明你希望結果怎麼呈現，模型可能只給出泛泛回應。',
                suggestion: '你可以簡單補充一句"請用簡明方式呈現"或"寫成宣傳文案"，模型會理解得更清楚。'
            },
            structure: {
                label: '結構清晰表達',
                passed: '提示詞有分段或結構詞，模型更容易理解複雜任務。',
                failed: '提示詞是長句或無結構，可能讓模型難以解析重點。',
                suggestion: '建議將內容分段，例如"第一步…"、"然後…"能提升理解效果。'
            },
            encouragement: '🎉 太棒了！你的提示詞結構完整、意圖清晰，是非常優秀的提示詞！'
        };
    }
    // 日语
    else if (language?.includes('ja')) {
        return {
            length: {
                label: 'プロンプトの長さ',
                tooShort: '現在のプロンプトはやや短く、情報量が少ないため、モデルが十分に理解できない可能性があります。',
                tooLong: 'プロンプトが長いため、内容を明確に構造化し、冗長さがモデルの理解に影響しないようにしてください。',
                appropriate: 'プロンプトの長さは適切です。',
                suggestion: '背景や目標の説明を追加して、モデルがあなたの意図をより明確に理解できるようにすることをお勧めします。'
            },
            role: {
                label: 'AIの役割の指定',
                passed: 'AIが演じる役割を指定しており、モデルがタスクの口調を特定するのに役立ちます。',
                failed: 'AIがどのような立場で回答すべきかが説明されていません。',
                suggestion: '「専門家として…」などの表現を追加すると、モデルがあなたの目標により近づきます。'
            },
            goalVerb: {
                label: 'タスクの目標を明確にする',
                passed: 'タスクの指示が含まれており、モデルはあなたが何を望んでいるかを理解しやすくなっています。',
                failed: '明確なタスク動詞がなく、モデルが何から手をつけるべきか分からない可能性があります。',
                suggestion: '「〜を書いてください」「〜をリストアップしてください」などのタスク型の文を追加することをお勧めします。'
            },
            style: {
                label: '出力スタイルや期待の表現',
                passed: '結果をどのように提示してほしいかを表現しており、モデルはそれに基づいて適切に応答できます。',
                failed: 'プロンプトには結果の提示方法が説明されておらず、モデルは一般的な応答しか提供できない可能性があります。',
                suggestion: '「簡潔な方法で提示してください」または「広告コピーとして書いてください」などの一文を追加すると、モデルはより明確に理解できます。'
            },
            structure: {
                label: '構造的な表現',
                passed: 'プロンプトには段落や構造語があり、モデルが複雑なタスクを理解しやすくなっています。',
                failed: 'プロンプトは長い文や構造のない文であり、モデルが要点を解析するのが難しい可能性があります。',
                suggestion: '「最初のステップ…」「次に…」などのように内容を段落に分けることをお勧めします。理解度が向上します。'
            },
            encouragement: '🎉 素晴らしい！あなたのプロンプトは構造が完全で、意図が明確で、非常に優れたプロンプトです！'
        };
    }
    // 韩语
    else if (language?.includes('ko')) {
        return {
            length: {
                label: '프롬프트 길이',
                tooShort: '현재 프롬프트가 다소 짧고 정보가 적어 모델이 충분히 이해하지 못할 수 있습니다.',
                tooLong: '프롬프트가 길기 때문에 내용이 명확하고 구조적인지 확인하고 중복이 모델 이해에 영향을 미치지 않도록 하세요.',
                appropriate: '프롬프트 길이가 적절합니다.',
                suggestion: '배경이나 목표 설명을 추가하여 모델이 의도를 더 명확히 이해할 수 있도록 하는 것이 좋습니다.'
            },
            role: {
                label: 'AI 역할 지정',
                passed: 'AI가 수행할 역할을 지정했으며, 이는 모델이 작업 어조를 파악하는 데 도움이 됩니다.',
                failed: 'AI가 어떤 역할로 대답해야 하는지 설명되어 있지 않습니다.',
                suggestion: '"전문가로서..."와 같은 표현을 추가하면 모델이 목표에 더 가까워집니다.'
            },
            goalVerb: {
                label: '명확한 작업 목표',
                passed: '작업 지침이 포함되어 있어 모델이 원하는 것을 쉽게 알 수 있습니다.',
                failed: '명확한 작업 동사가 없어 모델이 어디서부터 시작해야 할지 모를 수 있습니다.',
                suggestion: '"~를 작성해 주세요", "~를 나열해 주세요"와 같은 작업 지향적 문장을 추가하는 것이 좋습니다.'
            },
            style: {
                label: '출력 스타일 또는 기대치 표현',
                passed: '결과를 어떻게 제시하고 싶은지 표현했으며, 모델은 이를 바탕으로 적절한 응답을 할 수 있습니다.',
                failed: '프롬프트에 결과 제시 방법이 설명되어 있지 않아 모델이 일반적인 응답만 제공할 수 있습니다.',
                suggestion: '"간결한 방식으로 제시해 주세요" 또는 "광고 카피로 작성해 주세요"와 같은 문장을 추가하면 모델이 더 명확하게 이해할 수 있습니다.'
            },
            structure: {
                label: '구조적 표현',
                passed: '프롬프트에 단락이나 구조적 단어가 있어 모델이 복잡한 작업을 이해하기 쉽습니다.',
                failed: '프롬프트가 긴 문장이거나 구조가 없어 모델이 요점을 파악하기 어려울 수 있습니다.',
                suggestion: '"첫 번째 단계...", "그 다음..."과 같이 내용을 단락으로 나누는 것이 좋습니다. 이해도가 향상됩니다.'
            },
            encouragement: '🎉 훌륭합니다! 프롬프트의 구조가 완전하고 의도가 명확하여 매우 우수한 프롬프트입니다!'
        };
    }
    // 西班牙语
    else if (language?.includes('es')) {
        return {
            length: {
                label: 'Longitud del prompt',
                tooShort: 'El prompt actual es bastante corto y tiene poca información, lo que podría hacer que el modelo no lo entienda completamente.',
                tooLong: 'El prompt es bastante largo. Asegúrate de que el contenido sea claro y estructurado para evitar que la redundancia afecte la comprensión del modelo.',
                appropriate: 'La longitud del prompt es adecuada.',
                suggestion: 'Considera añadir algo de contexto o descripción de objetivos para ayudar al modelo a entender mejor tu intención.'
            },
            role: {
                label: 'Especificación del rol de la IA',
                passed: 'Has especificado el rol que debe asumir la IA, lo que ayuda al modelo a establecer el tono adecuado para la tarea.',
                failed: 'No se ha especificado con qué identidad debe responder la IA.',
                suggestion: 'Puedes añadir frases como "como un experto..." para ayudar al modelo a alinearse mejor con tus objetivos.'
            },
            goalVerb: {
                label: 'Objetivo claro de la tarea',
                passed: 'Se incluyen instrucciones de la tarea, lo que facilita que el modelo entienda lo que quieres.',
                failed: 'Faltan verbos claros de tarea, el modelo podría no saber por dónde empezar.',
                suggestion: 'Considera añadir declaraciones orientadas a tareas como "por favor escribe..." o "por favor enumera..."'
            },
            style: {
                label: 'Estilo de salida o expectativa',
                passed: 'Has expresado cómo te gustaría que se presentaran los resultados, lo que permite al modelo responder adecuadamente.',
                failed: 'El prompt no indica cómo te gustaría que se presentaran los resultados, y el modelo podría proporcionar solo respuestas generales.',
                suggestion: 'Puedes añadir simplemente una frase como "por favor preséntalo de manera concisa" o "escríbelo como texto promocional", y el modelo lo entenderá más claramente.'
            },
            structure: {
                label: 'Expresión estructural clara',
                passed: 'El prompt tiene párrafos o palabras estructurales, lo que facilita que el modelo entienda tareas complejas.',
                failed: 'El prompt es una frase larga o no tiene estructura, lo que podría dificultar que el modelo analice los puntos clave.',
                suggestion: 'Se recomienda dividir el contenido en párrafos, como "Paso 1...", "Luego..." para mejorar la comprensión.'
            },
            encouragement: '🎉 ¡Excelente! Tu prompt tiene una estructura completa y una intención clara, ¡lo que lo convierte en un prompt de muy alta calidad!'
        };
    }

    // 法语
    else if (language?.includes('fr')) {
        return {
            length: {
                label: 'Longueur du prompt',
                tooShort: 'Le prompt actuel est plutôt court avec des informations limitées, ce qui pourrait conduire à une compréhension insuffisante par le modèle.',
                tooLong: 'Le prompt est assez long. Veuillez vous assurer que le contenu est clair et structuré pour éviter que la redondance n\'affecte la compréhension du modèle.',
                appropriate: 'La longueur du prompt est appropriée.',
                suggestion: 'Pensez à ajouter des descriptions de contexte ou d\'objectifs pour aider le modèle à mieux comprendre votre intention.'
            },
            role: {
                label: 'Spécification du rôle de l\'IA',
                passed: 'Vous avez spécifié le rôle que l\'IA doit jouer, ce qui aide le modèle à positionner le ton de la tâche.',
                failed: 'Aucune spécification sur l\'identité avec laquelle l\'IA devrait répondre.',
                suggestion: 'Vous pouvez ajouter des phrases comme "en tant qu\'expert..." pour aider le modèle à mieux s\'aligner sur vos objectifs.'
            },
            goalVerb: {
                label: 'Objectif clair de la tâche',
                passed: 'Les instructions de la tâche sont incluses, ce qui facilite la compréhension de ce que vous voulez par le modèle.',
                failed: 'Manque de verbes de tâche clairs, le modèle pourrait ne pas savoir par où commencer.',
                suggestion: 'Pensez à ajouter des instructions orientées tâche comme "veuillez écrire..." ou "veuillez lister..."'
            },
            style: {
                label: 'Style de sortie ou attente',
                passed: 'Vous avez exprimé comment vous souhaitez que les résultats soient présentés, permettant au modèle de répondre de manière appropriée.',
                failed: 'Le prompt n\'indique pas comment vous souhaitez que les résultats soient présentés, et le modèle pourrait ne fournir que des réponses générales.',
                suggestion: 'Vous pouvez simplement ajouter une phrase comme "veuillez présenter cela de manière concise" ou "rédigez-le comme un texte promotionnel", et le modèle comprendra plus clairement.'
            },
            structure: {
                label: 'Expression structurelle claire',
                passed: 'Le prompt a des paragraphes ou des mots structurels, ce qui facilite la compréhension des tâches complexes par le modèle.',
                failed: 'Le prompt est une longue phrase ou n\'a pas de structure, ce qui pourrait rendre difficile pour le modèle d\'analyser les points clés.',
                suggestion: 'Il est recommandé de diviser le contenu en paragraphes, comme "Étape 1...", "Ensuite..." pour améliorer la compréhension.'
            },
            encouragement: '🎉 Excellent ! Votre prompt a une structure complète et une intention claire, ce qui en fait un prompt de très haute qualité !'
        };
    }

    // 德语
    else if (language?.includes('de')) {
        return {
            length: {
                label: 'Prompt-Länge',
                tooShort: 'Der aktuelle Prompt ist relativ kurz mit begrenzten Informationen, was zu einem unzureichenden Verständnis durch das Modell führen könnte.',
                tooLong: 'Der Prompt ist ziemlich lang. Bitte stellen Sie sicher, dass der Inhalt klar und strukturiert ist, um zu vermeiden, dass Redundanz das Verständnis des Modells beeinträchtigt.',
                appropriate: 'Die Prompt-Länge ist angemessen.',
                suggestion: 'Erwägen Sie, einige Hintergrund- oder Zielbeschreibungen hinzuzufügen, um dem Modell zu helfen, Ihre Absicht besser zu verstehen.'
            },
            role: {
                label: 'KI-Rollenspezifikation',
                passed: 'Sie haben die Rolle angegeben, die die KI spielen soll, was dem Modell hilft, den Aufgabenton zu positionieren.',
                failed: 'Keine Angabe, mit welcher Identität die KI antworten soll.',
                suggestion: 'Sie können Phrasen wie "als Experte..." hinzufügen, um dem Modell zu helfen, sich besser an Ihren Zielen auszurichten.'
            },
            goalVerb: {
                label: 'Klares Aufgabenziel',
                passed: 'Aufgabenanweisungen sind enthalten, was es dem Modell erleichtert zu verstehen, was Sie wollen.',
                failed: 'Es fehlen klare Aufgabenverben, das Modell weiß möglicherweise nicht, wo es anfangen soll.',
                suggestion: 'Erwägen Sie, aufgabenorientierte Anweisungen wie "bitte schreiben Sie..." oder "bitte listen Sie auf..." hinzuzufügen.'
            },
            style: {
                label: 'Ausgabestil oder Erwartung',
                passed: 'Sie haben ausgedrückt, wie Sie die Ergebnisse präsentiert haben möchten, was dem Modell ermöglicht, angemessen zu antworten.',
                failed: 'Der Prompt gibt nicht an, wie Sie die Ergebnisse präsentiert haben möchten, und das Modell könnte nur allgemeine Antworten liefern.',
                suggestion: 'Sie können einfach einen Satz wie "bitte präsentieren Sie es auf prägnante Weise" oder "schreiben Sie es als Werbetextkopie", und das Modell wird es klarer verstehen.'
            },
            structure: {
                label: 'Klarer struktureller Ausdruck',
                passed: 'Der Prompt hat Absätze oder strukturelle Wörter, was es dem Modell erleichtert, komplexe Aufgaben zu verstehen.',
                failed: 'Der Prompt ist ein langer Satz oder hat keine Struktur, was es dem Modell erschweren könnte, die Schlüsselpunkte zu analysieren.',
                suggestion: 'Es wird empfohlen, den Inhalt in Absätze zu unterteilen, wie "Schritt 1...", "Dann..." um das Verständnis zu verbessern.'
            },
            encouragement: '🎉 Ausgezeichnet! Ihr Prompt hat eine vollständige Struktur und eine klare Absicht, was ihn zu einem sehr hochwertigen Prompt macht!'
        };
    }

    // 俄语
    else if (language?.includes('ru')) {
        return {
            length: {
                label: 'Длина промпта',
                tooShort: 'Текущий промпт довольно короткий с ограниченной информацией, что может привести к недостаточному пониманию модели.',
                tooLong: 'Промпт довольно длинный. Пожалуйста, убедитесь, что содержание ясное и структурированное, чтобы избежать влияния избыточности на понимание модели.',
                appropriate: 'Длина промпта подходящая.',
                suggestion: 'Рассмотрите возможность добавления некоторого контекста или описания целей, чтобы помочь модели лучше понять ваше намерение.'
            },
            role: {
                label: 'Спецификация роли ИИ',
                passed: 'Вы указали роль, которую должен играть ИИ, что помогает модели определить тон задачи.',
                failed: 'Не указано, с какой идентичностью должен отвечать ИИ.',
                suggestion: 'Вы можете добавить фразы, такие как "как эксперт...", чтобы помочь модели лучше соответствовать вашим целям.'
            },
            goalVerb: {
                label: 'Четкая цель задачи',
                passed: 'Включены инструкции по задаче, что облегчает модели понимание того, что вы хотите.',
                failed: 'Отсутствуют четкие глаголы задачи, модель может не знать, с чего начать.',
                suggestion: 'Рассмотрите возможность добавления ориентированных на задачу утверждений, таких как "пожалуйста, напишите..." или "пожалуйста, перечислите..."'
            },
            style: {
                label: 'Стиль вывода или ожидание',
                passed: 'Вы выразили, как вы хотели бы, чтобы результаты были представлены, что позволяет модели соответствующим образом отвечать.',
                failed: 'Промпт не указывает, как вы хотели бы, чтобы результаты были представлены, и модель может предоставить только общие ответы.',
                suggestion: 'Вы можете просто добавить предложение вроде "пожалуйста, представьте это лаконично" или "напишите это как рекламный текст", и модель поймет яснее.'
            },
            structure: {
                label: 'Четкое структурное выражение',
                passed: 'Промпт имеет абзацы или структурные слова, что облегчает модели понимание сложных задач.',
                failed: 'Промпт представляет собой длинное предложение или не имеет структуры, что может затруднить для модели анализ ключевых моментов.',
                suggestion: 'Рекомендуется разделить содержание на абзацы, например "Шаг 1...", "Затем..." для улучшения понимания.'
            },
            encouragement: '🎉 Отлично! Ваш промпт имеет полную структуру и четкое намерение, что делает его очень качественным промптом!'
        };
    }

    // 葡萄牙语
    else if (language?.includes('pt')) {
        return {
            length: {
                label: 'Comprimento do prompt',
                tooShort: 'O prompt atual é bastante curto com informações limitadas, o que pode levar a uma compreensão insuficiente pelo modelo.',
                tooLong: 'O prompt é bastante longo. Por favor, certifique-se de que o conteúdo seja claro e estruturado para evitar que a redundância afete a compreensão do modelo.',
                appropriate: 'O comprimento do prompt é apropriado.',
                suggestion: 'Considere adicionar algum contexto ou descrição de objetivos para ajudar o modelo a entender melhor sua intenção.'
            },
            role: {
                label: 'Especificação do papel da IA',
                passed: 'Você especificou o papel que a IA deve desempenhar, o que ajuda o modelo a posicionar o tom da tarefa.',
                failed: 'Não há especificação sobre qual identidade a IA deve responder.',
                suggestion: 'Você pode adicionar frases como "como um especialista..." para ajudar o modelo a se alinhar melhor com seus objetivos.'
            },
            goalVerb: {
                label: 'Objetivo claro da tarefa',
                passed: 'Instruções da tarefa estão incluídas, facilitando para o modelo entender o que você quer.',
                failed: 'Faltam verbos de tarefa claros, o modelo pode não saber por onde começar.',
                suggestion: 'Considere adicionar declarações orientadas a tarefas como "por favor, escreva..." ou "por favor, liste..."'
            },
            style: {
                label: 'Estilo de saída ou expectativa',
                passed: 'Você expressou como gostaria que os resultados fossem apresentados, permitindo que o modelo responda adequadamente.',
                failed: 'O prompt não indica como você gostaria que os resultados fossem apresentados, e o modelo pode fornecer apenas respostas gerais.',
                suggestion: 'Você pode simplesmente adicionar uma frase como "por favor, apresente isso de maneira concisa" ou "escreva isso como texto promocional", e o modelo entenderá mais claramente.'
            },
            structure: {
                label: 'Expressão estrutural clara',
                passed: 'O prompt tem parágrafos ou palavras estruturais, facilitando para o modelo entender tarefas complexas.',
                failed: 'O prompt é uma frase longa ou não tem estrutura, o que pode dificultar para o modelo analisar os pontos-chave.',
                suggestion: 'Recomenda-se dividir o conteúdo em parágrafos, como "Passo 1...", "Em seguida..." para melhorar a compreensão.'
            },
            encouragement: '🎉 Excelente! Seu prompt tem uma estrutura completa e uma intenção clara, tornando-o um prompt de altíssima qualidade!'
        };
    }

    // 阿拉伯语
    else if (language?.includes('ar')) {
        return {
            length: {
                label: 'طول النص التحفيزي',
                tooShort: 'النص التحفيزي الحالي قصير نسبيًا مع معلومات محدودة، مما قد يؤدي إلى فهم غير كافٍ من قبل النموذج.',
                tooLong: 'النص التحفيزي طويل نسبيًا. يرجى التأكد من أن المحتوى واضح ومنظم لتجنب تأثير التكرار على فهم النموذج.',
                appropriate: 'طول النص التحفيزي مناسب.',
                suggestion: 'فكر في إضافة بعض السياق أو وصف الأهداف لمساعدة النموذج على فهم قصدك بشكل أفضل.'
            },
            role: {
                label: 'تحديد دور الذكاء الاصطناعي',
                passed: 'لقد حددت الدور الذي يجب أن يلعبه الذكاء الاصطناعي، مما يساعد النموذج على تحديد نبرة المهمة.',
                failed: 'لا يوجد تحديد للهوية التي يجب أن يستجيب بها الذكاء الاصطناعي.',
                suggestion: 'يمكنك إضافة عبارات مثل "كخبير..." لمساعدة النموذج على التوافق بشكل أفضل مع أهدافك.'
            },
            goalVerb: {
                label: 'هدف واضح للمهمة',
                passed: 'تم تضمين تعليمات المهمة، مما يسهل على النموذج فهم ما تريده.',
                failed: 'تفتقر إلى أفعال مهمة واضحة، قد لا يعرف النموذج من أين يبدأ.',
                suggestion: 'فكر في إضافة عبارات موجهة للمهام مثل "يرجى الكتابة..." أو "يرجى سرد..."'
            },
            style: {
                label: 'نمط الإخراج أو التوقع',
                passed: 'لقد عبرت عن كيفية رغبتك في تقديم النتائج، مما يسمح للنموذج بالاستجابة بشكل مناسب.',
                failed: 'لا يشير النص التحفيزي إلى كيفية رغبتك في تقديم النتائج، وقد يقدم النموذج إجابات عامة فقط.',
                suggestion: 'يمكنك ببساطة إضافة جملة مثل "يرجى تقديم هذا بطريقة موجزة" أو "اكتبه كنص ترويجي"، وسيفهم النموذج بشكل أوضح.'
            },
            structure: {
                label: 'تعبير هيكلي واضح',
                passed: 'يحتوي النص التحفيزي على فقرات أو كلمات هيكلية، مما يسهل على النموذج فهم المهام المعقدة.',
                failed: 'النص التحفيزي عبارة عن جملة طويلة أو ليس له هيكل، مما قد يجعل من الصعب على النموذج تحليل النقاط الرئيسية.',
                suggestion: 'يوصى بتقسيم المحتوى إلى فقرات، مثل "الخطوة 1..."، "ثم..." لتحسين الفهم.'
            },
            encouragement: '🎉 ممتاز! نصك التحفيزي له بنية كاملة ونية واضحة، مما يجعله نصًا تحفيزيًا عالي الجودة!'
        };
    }

    // 印地语
    else if (language?.includes('hi')) {
        return {
            length: {
                label: 'प्रॉम्प्ट की लंबाई',
                tooShort: 'वर्तमान प्रॉम्प्ट सीमित जानकारी के साथ काफी छोटा है, जिससे मॉडल द्वारा अपर्याप्त समझ हो सकती है।',
                tooLong: 'प्रॉम्प्ट काफी लंबा है। कृपया सुनिश्चित करें कि सामग्री स्पष्ट और संरचित है ताकि अतिरेक मॉडल की समझ को प्रभावित न करे।',
                appropriate: 'प्रॉम्प्ट की लंबाई उचित है।',
                suggestion: 'मॉडल को आपके इरादे को बेहतर ढंग से समझने में मदद करने के लिए कुछ पृष्ठभूमि या उद्देश्य विवरण जोड़ने पर विचार करें।'
            },
            role: {
                label: 'AI भूमिका निर्दिष्टीकरण',
                passed: 'आपने AI को निभाने के लिए भूमिका निर्दिष्ट की है, जो मॉडल को कार्य के स्वर को स्थापित करने में मदद करती है।',
                failed: 'इस बात की कोई निर्दिष्टता नहीं है कि AI को किस पहचान के साथ जवाब देना चाहिए।',
                suggestion: 'आप मॉडल को अपने लक्ष्यों के साथ बेहतर संरेखित करने में मदद करने के लिए "एक विशेषज्ञ के रूप में..." जैसे वाक्यांश जोड़ सकते हैं।'
            },
            goalVerb: {
                label: 'स्पष्ट कार्य उद्देश्य',
                passed: 'कार्य निर्देश शामिल हैं, जिससे मॉडल को यह समझना आसान हो जाता है कि आप क्या चाहते हैं।',
                failed: 'स्पष्ट कार्य क्रियाओं की कमी है, मॉडल को शायद पता नहीं होगा कि कहां से शुरू करना है।',
                suggestion: 'कार्य-उन्मुख कथन जैसे "कृपया लिखें..." या "कृपया सूचीबद्ध करें..." जोड़ने पर विचार करें।'
            },
            style: {
                label: 'आउटपुट शैली या अपेक्षा',
                passed: 'आपने व्यक्त किया है कि आप परिणामों को कैसे प्रस्तुत करना चाहते हैं, जिससे मॉडल को उचित रूप से प्रतिक्रिया देने की अनुमति मिलती है।',
                failed: 'प्रॉम्प्ट यह नहीं बताता है कि आप परिणामों को कैसे प्रस्तुत करना चाहते हैं, और मॉडल केवल सामान्य प्रतिक्रियाएं दे सकता है।',
                suggestion: 'आप बस एक वाक्य जैसे "कृपया इसे संक्षिप्त तरीके से प्रस्तुत करें" या "इसे प्रचार कॉपी के रूप में लिखें" जोड़ सकते हैं, और मॉडल अधिक स्पष्ट रूप से समझेगा।'
            },
            structure: {
                label: 'स्पष्ट संरचनात्मक अभिव्यक्ति',
                passed: 'प्रॉम्प्ट में पैराग्राफ या संरचनात्मक शब्द हैं, जिससे मॉडल को जटिल कार्यों को समझना आसान हो जाता है।',
                failed: 'प्रॉम्प्ट एक लंबा वाक्य है या इसमें कोई संरचना नहीं है, जिससे मॉडल के लिए प्रमुख बिंदुओं का विश्लेषण करना मुश्किल हो सकता है।',
                suggestion: 'समझ में सुधार के लिए सामग्री को पैराग्राफ में विभाजित करने की सिफारिश की जाती है, जैसे "चरण 1...", "फिर..."।'
            },
            encouragement: '🎉 उत्कृष्ट! आपके प्रॉम्प्ट में एक पूर्ण संरचना और स्पष्ट इरादा है, जो इसे एक बहुत उच्च गुणवत्ता वाला प्रॉम्प्ट बनाता है!'
        };
    }

    // 荷兰语
    else if (language?.includes('nl')) {
        return {
            length: {
                label: 'Lengte van de prompt',
                tooShort: 'De huidige prompt is vrij kort met beperkte informatie, wat kan leiden tot onvoldoende begrip door het model.',
                tooLong: 'De prompt is vrij lang. Zorg ervoor dat de inhoud duidelijk en gestructureerd is om te voorkomen dat redundantie het begrip van het model beïnvloedt.',
                appropriate: 'De lengte van de prompt is passend.',
                suggestion: 'Overweeg om wat achtergrond of doelomschrijving toe te voegen om het model te helpen uw bedoeling beter te begrijpen.'
            },
            role: {
                label: 'AI-rolspecificatie',
                passed: 'U heeft de rol gespecificeerd die de AI moet spelen, wat het model helpt bij het positioneren van de toon van de taak.',
                failed: 'Geen specificatie over met welke identiteit de AI moet reageren.',
                suggestion: 'U kunt zinnen toevoegen zoals "als een expert..." om het model te helpen beter aan te sluiten bij uw doelen.'
            },
            goalVerb: {
                label: 'Duidelijk taakdoel',
                passed: 'Taakinstructies zijn inbegrepen, waardoor het voor het model gemakkelijker is om te begrijpen wat u wilt.',
                failed: 'Er ontbreken duidelijke taakwerkwoorden, het model weet mogelijk niet waar te beginnen.',
                suggestion: 'Overweeg om taakgerichte uitspraken toe te voegen zoals "schrijf alstublieft..." of "lijst alstublieft op..."'
            },
            style: {
                label: 'Uitvoerstijl of verwachting',
                passed: 'U heeft uitgedrukt hoe u de resultaten gepresenteerd zou willen zien, waardoor het model op passende wijze kan reageren.',
                failed: 'De prompt geeft niet aan hoe u de resultaten gepresenteerd zou willen zien, en het model kan alleen algemene antwoorden geven.',
                suggestion: 'U kunt eenvoudig een zin toevoegen zoals "presenteer het alstublieft op een beknopte manier" of "schrijf het als promotionele kopij", en het model zal het duidelijker begrijpen.'
            },
            structure: {
                label: 'Duidelijke structurele expressie',
                passed: 'De prompt heeft alinea\'s of structurele woorden, waardoor het voor het model gemakkelijker is om complexe taken te begrijpen.',
                failed: 'De prompt is een lange zin of heeft geen structuur, wat het voor het model moeilijk kan maken om de belangrijkste punten te analyseren.',
                suggestion: 'Het wordt aanbevolen om de inhoud op te delen in alinea\'s, zoals "Stap 1...", "Dan..." om het begrip te verbeteren.'
            },
            encouragement: '🎉 Uitstekend! Uw prompt heeft een volledige structuur en een duidelijke bedoeling, wat het een prompt van zeer hoge kwaliteit maakt!'
        };
    }
    // 英语和其他语言默认使用英语
    else {
        return {
            length: {
                label: 'Prompt Length',
                tooShort: 'The current prompt is rather short with limited information, which may lead to insufficient understanding by the model.',
                tooLong: 'The prompt is quite long. Please ensure the content is clear and structured to avoid redundancy affecting model comprehension.',
                appropriate: 'The prompt length is appropriate.',
                suggestion: 'Consider adding some background or objective descriptions to help the model better understand your intent.'
            },
            role: {
                label: 'AI Role Specification',
                passed: 'You have specified the role for the AI to play, which helps the model position the task tone.',
                failed: 'No specification on what identity the AI should respond as.',
                suggestion: 'You can add phrases like "as an expert..." to help the model better align with your goals.'
            },
            goalVerb: {
                label: 'Clear Task Objective',
                passed: 'Task instructions are included, making it easier for the model to understand what you want.',
                failed: 'Lacks clear task verbs, the model may not know where to start.',
                suggestion: 'Consider adding task-oriented statements like "please write..." or "please list..."'
            },
            style: {
                label: 'Output Style or Expectation',
                passed: 'You have expressed how you would like the results to be presented, allowing the model to respond appropriately.',
                failed: 'The prompt does not indicate how you would like the results to be presented, and the model may only provide general responses.',
                suggestion: 'You can simply add a sentence like "please present it in a concise way" or "write it as promotional copy", and the model will understand more clearly.'
            },
            structure: {
                label: 'Clear Structural Expression',
                passed: 'The prompt has paragraphs or structural words, making it easier for the model to understand complex tasks.',
                failed: 'The prompt is a long sentence or has no structure, which may make it difficult for the model to parse the key points.',
                suggestion: 'It is recommended to divide the content into paragraphs, such as "Step 1...", "Then..." to improve understanding.'
            },
            encouragement: '🎉 Excellent! Your prompt has a complete structure and clear intent, making it a very high-quality prompt!'
        };
    }
}

/**
 * 检查提示词是否指定了角色
 * @param prompt 提示词
 * @param language 语言代码
 */
function checkIfHasRole(prompt: string): boolean {
    // 创建包含多种语言关键词的正则表达式
    const rolePatterns = [
        // 英语
        /as (an?|a)|[Rr]ole|acting as|pretend to be|impersonate/,
        // 中文(简体和繁体)
        /作为|以.+身份|扮演|担任|角色|作為|以.+身份|扮演|擔任|角色/,
        // 日语
        /として|役割|扮する|演じる/,
        // 韩语
        /역할|로서|담당|연기/,
        // 西班牙语
        /como|rol|actuar|papel|personificar/,
        // 法语
        /comme|rôle|en tant que|personnifier|incarner/,
        // 德语
        /als|Rolle|fungieren|agieren|verkörpern/,
        // 俄语
        /как|роль|выступать в качестве|действовать|консультант|специалист/,
        // 葡萄牙语
        /como|papel|atuar|função|personificar/,
        // 荷兰语
        /als|rol|fungeren|optreden als/,
        // 阿拉伯语
        /كـ|دور|بصفتك|تمثيل/,
        // 印地语
        /के रूप में|भूमिका|अभिनय|जैसे/
    ];

    // 检查是否匹配任何一种语言的模式
    return rolePatterns.some(pattern => pattern.test(prompt));
}

/**
 * 检查提示词是否包含任务动词
 * @param prompt 提示词
 * @param language 语言代码
 */
function checkIfHasGoalVerb(prompt: string): boolean {
    // 创建包含多种语言关键词的正则表达式
    const goalVerbPatterns = [
        // 英语
        /(create|generate|summarize|analyze|write|extract|list|explain|describe|make|develop|provide)/i,
        // 中文(简体和繁体)
        /(生成|总结|分析|撰写|提取|列出|写|创建|说明|描述|解释|生成|總結|分析|撰寫|提取|列出|寫|創建|說明|描述|解釋)/,
        // 日语
        /(生成|要約|分析|作成|抽出|リスト|書く|作る|説明|記述)/,
        // 韩语
        /(생성|요약|분석|작성|추출|나열|쓰기|만들기|설명|묘사)/,
        // 西班牙语
        /(generar|resumir|analizar|escribir|extraer|listar|crear|explicar|describir)/,
        // 法语
        /(générer|résumer|analyser|rédiger|extraire|lister|créer|expliquer|décrire)/,
        // 德语
        /(generieren|zusammenfassen|analysieren|schreiben|extrahieren|auflisten|erstellen|erklären|beschreiben)/,
        // 俄语
        /(создать|резюмировать|анализировать|написать|извлечь|перечислить|объяснить|описать|составлять|разрабатывать)/,
        // 葡萄牙语
        /(gerar|resumir|analisar|escrever|extrair|listar|criar|explicar|descrever)/,
        // 荷兰语
        /(genereren|samenvatten|analyseren|schrijven|extraheren|opsommen|creëren|uitleggen|beschrijven)/,
        // 阿拉伯语
        /(إنشاء|تلخيص|تحليل|كتابة|استخراج|سرد|شرح|وصف)/,
        // 印地语
        /(उत्पन्न|सारांश|विश्लेषण|लिखना|निकालना|सूचीबद्ध|बनाना|समझाना|वर्णन)/
    ];

    // 检查是否匹配任何一种语言的模式
    return goalVerbPatterns.some(pattern => pattern.test(prompt));
}

/**
 * 检查提示词是否表达了输出风格或预期
 * @param prompt 提示词
 * @param language 语言代码
 */
function checkIfHasStyle(prompt: string): boolean {
    // 创建包含多种语言关键词的正则表达式
    const stylePatterns = [
        // 英语
        /(should|in the form of|in a.*style|as a.*response|present.*as|format|style|manner|way|structure|layout|design|template)/i,
        // 中文(简体和繁体)
        /(希望|呈现|输出|写成|生成|看起来像|请以|以.*方式|风格|格式|样式|模板|布局|希望|呈現|輸出|寫成|生成|看起來像|請以|以.*方式|風格|格式|樣式|模板|佈局)/,
        // 日语
        /(希望|表示|出力|書き方|生成|ように見える|〜として|スタイル|形式|フォーマット|テンプレート|レイアウト)/,
        // 韩语
        /(희망|표현|출력|작성|생성|보이는|방식으로|스타일|형식|포맷|템플릿|레이아웃)/,
        // 西班牙语
        /(espero|presentar|formato|escribir como|generar|parecer|como un|estilo|manera|forma|plantilla|diseño)/,
        // 法语
        /(souhaite|présenter|format|écrire comme|générer|ressembler|en tant que|style|manière|forme|modèle|mise en page)/,
        // 德语
        /(hoffe|darstellen|ausgabe|schreiben als|generieren|aussehen wie|als ein|stil|format|weise|vorlage|layout)/,
        // 俄语
        /(надеюсь|представить|формат|написать как|создать|выглядеть как|в виде|стиль|способ|шаблон|оформление|макет)/,
        // 葡萄牙语
        /(espero|apresentar|formato|escrever como|gerar|parecer|como um|estilo|maneira|forma|modelo|layout)/,
        // 荷兰语
        /(hoop|presenteren|format|schrijven als|genereren|eruitzien als|als een|stijl|manier|vorm|sjabloon|layout)/,
        // 阿拉伯语
        /(آمل|تقديم|تنسيق|كتابة مثل|إنشاء|يبدو مثل|كـ|أسلوب|طريقة|شكل|قالب|تخطيط)/,
        // 印地语
        /(आशा|प्रस्तुत|प्रारूप|लिखना जैसे|जनरेट|जैसा दिखना|के रूप में|शैली|तरीका|रूप|टेम्पलेट|लेआउट)/
    ];

    // 检查是否匹配任何一种语言的模式
    return stylePatterns.some(pattern => pattern.test(prompt));
}

/**
 * 检查提示词是否具有结构化表达
 * @param prompt 提示词
 * @param language 语言代码
 */
function checkIfHasStructure(prompt: string): boolean {
    // 换行检测适用于所有语言
    if (/\n/.test(prompt)) {
        return true;
    }

    // 创建包含多种语言关键词的正则表达式
    const structurePatterns = [
        // 英语
        /(first(ly)?|then|next|finally|step|in order|second(ly)?|furthermore|in addition|in conclusion|objective|workflow|profile|skills|rules)/i,
        // 中文(简体和繁体)
        /(第一|首先|然后|最后|步骤|接下来|其次|第二|此外|另外|总结|目标|工作流程|简介|技能|规则|第一|首先|然後|最後|步驟|接下來|其次|第二|此外|另外|總結|目標|工作流程|簡介|技能|規則)/,
        // 日语
        /(第一に|まず|次に|最後に|ステップ|続いて|第二に|さらに|加えて|最終的に|目的|ワークフロー|プロフィール|スキル|ルール)/,
        // 韩语
        /(첫째|먼저|그다음|마지막으로|단계|다음|둘째|또한|추가로|결론적으로|목표|워크플로우|프로필|기술|규칙)/,
        // 西班牙语
        /(primero|luego|finalmente|paso|siguiente|segundo|además|por último|en conclusión|objetivo|flujo de trabajo|perfil|habilidades|reglas)/,
        // 法语
        /(premièrement|d'abord|ensuite|finalement|étape|suivant|deuxièmement|de plus|en conclusion|objectif|flux de travail|profil|compétences|règles)/,
        // 德语
        /(erstens|zuerst|dann|schließlich|schritt|nächste|zweitens|außerdem|darüber hinaus|abschließend|ziel|workflow|profil|fähigkeiten|regeln)/,
        // 俄语
        /(во-первых|сначала|затем|наконец|шаг|следующий|во-вторых|кроме того|в заключение|цель|рабочий процесс|профиль|навыки|правила)/,
        // 葡萄牙语
        /(primeiro|em seguida|finalmente|passo|próximo|segundo|além disso|por fim|em conclusão|objetivo|fluxo de trabalho|perfil|habilidades|regras)/,
        // 荷兰语
        /(ten eerste|eerst|dan|tenslotte|stap|volgende|ten tweede|bovendien|tot slot|doel|workflow|profiel|vaardigheden|regels)/,
        // 阿拉伯语
        /(أولاً|في البداية|ثم|أخيراً|خطوة|التالي|ثانياً|بالإضافة إلى ذلك|في الختام|هدف|سير العمل|ملف تعريف|مهارات|قواعد)/,
        // 印地语
        /(पहला|सबसे पहले|फिर|अंत में|चरण|अगला|दूसरा|इसके अलावा|निष्कर्ष में|उद्देश्य|कार्यप्रवाह|प्रोफ़ाइल|कौशल|नियम)/
    ];

    // 检查是否匹配任何一种语言的模式
    return structurePatterns.some(pattern => pattern.test(prompt));
}

/**
 * 分析提示词质量
 * @param prompt 提示词文本
 * @param language 当前语言代码，如'zh-CN', 'en-US'等
 * @returns 质量分析结果
 */
export function analyzePromptQuality(prompt: string, language?: string): PromptAnalysisResult {
    // 使用本地化文本
    const texts = getPromptAnalysisTexts(language);
    const criteria = [];

    // 维度 1：提示词长度（不参与评分，仅提示）
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount < 20) {
        criteria.push({
            label: texts.length.label,
            passed: false,
            feedback: texts.length.tooShort,
            suggestion: texts.length.suggestion,
            points: 0
        });
    } else if (wordCount > 100) {
        criteria.push({
            label: texts.length.label,
            passed: true,
            feedback: texts.length.tooLong,
            points: 2
        });
    } else {
        criteria.push({
            label: texts.length.label,
            passed: true,
            feedback: texts.length.appropriate,
            points: 2
        });
    }

    // 维度 2：是否指定角色
    // 使用语言相关的正则表达式
    const hasRole = checkIfHasRole(prompt);
    if (hasRole) {
        criteria.push({
            label: texts.role.label,
            passed: true,
            feedback: texts.role.passed,
            points: 2
        });
    } else {
        criteria.push({
            label: texts.role.label,
            passed: false,
            feedback: texts.role.failed,
            suggestion: texts.role.suggestion,
            points: 0
        });
    }

    // 维度 3：是否有任务动词
    const hasGoalVerb = checkIfHasGoalVerb(prompt);
    if (hasGoalVerb) {
        criteria.push({
            label: texts.goalVerb.label,
            passed: true,
            feedback: texts.goalVerb.passed,
            points: 2
        });
    } else {
        criteria.push({
            label: texts.goalVerb.label,
            passed: false,
            feedback: texts.goalVerb.failed,
            suggestion: texts.goalVerb.suggestion,
            points: 0
        });
    }

    // 维度 4：是否表达输出风格或预期
    const hasExpectedStyle = checkIfHasStyle(prompt);
    if (hasExpectedStyle) {
        criteria.push({
            label: texts.style.label,
            passed: true,
            feedback: texts.style.passed,
            points: 2
        });
    } else {
        criteria.push({
            label: texts.style.label,
            passed: false,
            feedback: texts.style.failed,
            suggestion: texts.style.suggestion,
            points: 0
        });
    }


    // 维度 5：是否结构化表达（如段落、步骤）
    const hasStructure = checkIfHasStructure(prompt);
    if (hasStructure) {
        criteria.push({
            label: texts.structure.label,
            passed: true,
            feedback: texts.structure.passed,
            points: 2
        });
    } else {
        criteria.push({
            label: texts.structure.label,
            passed: false,
            feedback: texts.structure.failed,
            suggestion: texts.structure.suggestion,
            points: 0
        });
    }

    const score = criteria.reduce((acc, c) => acc + (c.passed ? 2 : 0), 0);

    return {
        score,
        criteria,
        encouragement: score === 10 ? texts.encouragement : undefined
    };
}
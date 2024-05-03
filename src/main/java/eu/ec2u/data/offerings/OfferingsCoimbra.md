# Sites

* https://apps.uc.pt/courses/

# Integration

* data extracted from dedicated REST/JSON API

## Inbox

* Lifelong Learning, our API already sends this information in the "categoriaCursoTipo" field with the value "
  FORMACAO_LONGO_VIDA".

## 2024-05-03

* Ingest offerings identifiers

## 2023-03-07

* Classify entries as programs/courses according to the `cicloTipo` field:
  * `PRIMEIRO/SEGUNDO/TERCEIRO` ›› degree programs
  * `NAO_CONFERENTE_GRAU` ›› courses

## 2023-01-17

* Integrate `schema:inLanguage`

## 2023-01-12

* Add additional parameters to exclude non-current courses (`obterInformacaoFichaCurso`/`devolverSoCursosComFichaCurso`)
* Select academic year dynamically on the current date
* Integrate additional data
  * `schema:learningResourceType`
  * `schema:numberOfCredits`
  * ``schema:timeRequired`
  * `schema:teaches`
  * `schem:assesses`
  * `schema:coursePrerequisites`
  * `schema:competencyRequired`
  * `schema:educationalCredentialAwarded`

## 2022-10-07

- Add `schema:educationalLevel` according to the following ISCED-2011 mapping

| Course  Cycle Code (cicloTipo) | Course Category  Code (categoriaCursoTipo) | ISCED Level | ISCED Label               |
| ------------------------------ | ------------------------------------------ | ----------- | ------------------------- |
| SEGUNDO                        | INTEGRADO                                  | 7           | Master's or  equivalent   |
| SEGUNDO                        | CONTINUIDADE                               | 7           | Master's or  equivalent   |
| SEGUNDO                        | ESPECIALIZACAO_AVANCADA                    | 7           | Master's or  equivalent   |
| SEGUNDO                        | FORMACAO_LONGO_VIDA                        | 7           | Master's or  equivalent   |
| NAO_CONFERENTE_GRAU            | POS_DOUTORAMENTO                           | 9           | Not elsewhere classified  |
| NAO_CONFERENTE_GRAU            | ESPECIALIZACAO                             | 9           | Not elsewhere classified  |
| NAO_CONFERENTE_GRAU            | FORMACAO                                   | 9           | Not elsewhere classified  |
| NAO_CONFERENTE_GRAU            | FORMACAO_CONTINUA                          | 9           | Not elsewhere classified  |
| NAO_CONFERENTE_GRAU            | ESPECIALIZACAO_AVANCADA                    | 9           | Not elsewhere classified  |
| PRIMEIRO                       |                                            | 6           | Bachelor's or  equivalent |
| TERCEIRO                       |                                            | 8           | Doctorate or  equivalent  |

## 2022-09-27

* Initial integration

# Feeds

## REST/JSON API

```http
POST {{courses-coimbra-url}}
Content-Type: application/x-www-form-urlencoded
Accept: application/json

applicationId={{courses-coimbra-id}}
&applicationToken={{courses-coimbra-token}}
&anoLectivo=2022/2023
```

```json
{
    "status": "SUCCESS",
    "additionalInformation": "Total Resultados: 716",
    "listaResultados": [
                {
            "cursoId": 4601,
            "codigoInterno": "20134051",
            "cicloTipo": "NAO_CONFERENTE_GRAU",
            "categoriaCursoTipo": "FORMACAO",
            "designacoes": [
                {
                    "id": 4601,
                    "designacao": "Curso de Formação de Língua e Cultura Espanholas II",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Spanish Language and Culture II",
                    "locSigla": "EN"
                }
            ],
            "designacoesCiclo": [
                {
                    "id": 4601,
                    "designacao": "Cursos não conferentes de grau",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Postgraduation",
                    "locSigla": "EN"
                }
            ],
            "designacoesCategoriaCurso": [
                {
                    "id": 4601,
                    "designacao": "Formação",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Formação",
                    "locSigla": "EN"
                }
            ],
            "urlPT": "https://apps.uc.pt/courses/PT/course/4601",
            "urlEN": "https://apps.uc.pt/courses/EN/course/4601",
            "unoId": 141,
            "ects": "3",
            "duracaoPT": "81 horas",
            "duracaoEN": "81 hours",
            "qualificoesAtribuidas": [
                {
                    "id": 4601,
                    "designacao": "Pós-Graduação",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Master degree",
                    "locSigla": "EN"
                }
            ],
            "objetivosCurso": [
                {
                    "id": 4601,
                    "designacao": "O curso livre de Língua e Cultura Espanholas II continua o estudo do Espanhol como língua estrangeira do formando num nível de língua A2 (QECRL).",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": " This course provides a continuation to the study of Spanish as a foreign language at level A2 (CEFR).  ",
                    "locSigla": "EN"
                }
            ],
            "objetivosAprendizagem": [
                {
                    "id": 4601,
                    "designacao": "Compreender, tanto oral como por escrito, instruções e explicações de maior complexidade em âmbitos formais ou informais.\r\nSer capaz de defender una opinião com argumentações coerentes e convincentes.\r\nNível de correção: sensibilidade ao erro sendo capaz de autocorrigir-se.\r\nFluidez oral e registo fonético longe do português.\r\nRedação escrita adequada ao registo.\r\nCapacidade de autocorreção.\r\nUso de léxico específico.\r\n",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Understand instructions and explanations, in formal and informal register, whether oral or written, with a higher degree of complexity \r\nBeing able to defend an opinion with coherent and compelling arguments.\r\nLinguistic correction: recognize mistakes and being able to self-correction.\r\nOral fluency and correct pronunciation without the influence of Portuguese.\r\nWriting in an appropriate register.\r\nCapacity of self-correction.\r\nAbility to use specific vocabulary.\r\n",
                    "locSigla": "EN"
                }
            ],
            "regimesEstudo": [
                {
                    "id": 4601,
                    "designacao": "Presencial",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Face to face",
                    "locSigla": "EN"
                }
            ],
            "linguasAprendizagem": [
                {
                    "id": 4601,
                    "designacao": "Espanhol",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Spanish",
                    "locSigla": "EN"
                }
            ],
            "regrasDeAvaliacao": [
                {
                    "id": 4601,
                    "designacao": "A finalização do curso supõe a realização de todas as atividades propostas, conduzindo a uma nota final expressa na escala de 0-20 valores, sendo necessário o mínimo de 10 valores para aprovação final. Avaliação contínua. Incluirá trabalhos realizados nas aulas, participação ativa, redação de temas específicos e realização de um teste final.",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Successful course completion supposes the realization of all the proposed activities, the evaluation is expressed in a final grade on a scale of 0-20 points. Minimal pass grade is 10 points.\r\nContinuous assessment. Will include work carried out in class, active participation, writing on specific themes and partial exams.\r\n",
                    "locSigla": "EN"
                }
            ],
            "condicoesAcesso": [
                {
                    "id": 4601,
                    "designacao": "Candidatos com idade igual ou superior a 16 anos.",
                    "locSigla": "PT"
                },
                {
                    "id": 4601,
                    "designacao": "Applicants must be aged 16 years or over.",
                    "locSigla": "EN"
                }
            ],
            "cursoComFichaCursoNoAnoLetivo": true
        },
        …
    ]
}
```
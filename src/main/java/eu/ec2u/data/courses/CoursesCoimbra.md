# Sites

*  https://apps.uc.pt/courses/

# Integration

* data extracted from dedicated REST/JSON API

## Pending

* course details (e.g. https://apps.uc.pt/courses/EN/course/4604)

## 2023-01-12

* Add additional parameters to exclude non-current courses (`obterInformacaoFichaCurso`/`devolverSoCursosComFichaCurso`)
* Select academic year dynamically on the current date

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
            "cursoId": 4604,
            "codigoInterno": "20134054",
            "cicloTipo": "NAO_CONFERENTE_GRAU",
            "categoriaCursoTipo": "FORMACAO",
            "designacoes": [
                {
                    "id": 4604,
                    "designacao": "French Language and Culture III",
                    "locSigla": "EN"
                },
                {
                    "id": 4604,
                    "designacao": "Curso de Formação de Língua e Cultura Francesas III",
                    "locSigla": "PT"
                }
            ],
            "designacoesCiclo": [
                {
                    "id": 4604,
                    "designacao": "Postgraduation",
                    "locSigla": "EN"
                },
                {
                    "id": 4604,
                    "designacao": "Cursos não conferentes de grau",
                    "locSigla": "PT"
                }
            ],
            "designacoesCategoriaCurso": [
                {
                    "id": 4604,
                    "designacao": "Formação",
                    "locSigla": "EN"
                },
                {
                    "id": 4604,
                    "designacao": "Formação",
                    "locSigla": "PT"
                }
            ],
            "urlPT": "https://apps.uc.pt/courses/PT/course/4604",
            "urlEN": "https://apps.uc.pt/courses/EN/course/4604",
            "unoId": 141
        },
        {
            "cursoId": 4603,
            "codigoInterno": "20134053",
            "cicloTipo": "NAO_CONFERENTE_GRAU",
            "categoriaCursoTipo": "FORMACAO",
            "designacoes": [
                {
                    "id": 4603,
                    "designacao": "French Language and Culture II",
                    "locSigla": "EN"
                },
                {
                    "id": 4603,
                    "designacao": "Curso de Formação de Língua e Cultura Francesas II",
                    "locSigla": "PT"
                }
            ],
            "designacoesCiclo": [
                {
                    "id": 4603,
                    "designacao": "Postgraduation",
                    "locSigla": "EN"
                },
                {
                    "id": 4603,
                    "designacao": "Cursos não conferentes de grau",
                    "locSigla": "PT"
                }
            ],
            "designacoesCategoriaCurso": [
                {
                    "id": 4603,
                    "designacao": "Formação",
                    "locSigla": "EN"
                },
                {
                    "id": 4603,
                    "designacao": "Formação",
                    "locSigla": "PT"
                }
            ],
            "urlPT": "https://apps.uc.pt/courses/PT/course/4603",
            "urlEN": "https://apps.uc.pt/courses/EN/course/4603",
            "unoId": 141
        },
        {
            "cursoId": 4602,
            "codigoInterno": "20134052",
            "cicloTipo": "NAO_CONFERENTE_GRAU",
            "categoriaCursoTipo": "FORMACAO",
            "designacoes": [
                {
                    "id": 4602,
                    "designacao": "French Language and Culture I",
                    "locSigla": "EN"
                },
                {
                    "id": 4602,
                    "designacao": "Curso de Formação de Língua e Cultura Francesas I",
                    "locSigla": "PT"
                }
            ],
            "designacoesCiclo": [
                {
                    "id": 4602,
                    "designacao": "Postgraduation",
                    "locSigla": "EN"
                },
                {
                    "id": 4602,
                    "designacao": "Cursos não conferentes de grau",
                    "locSigla": "PT"
                }
            ],
            "designacoesCategoriaCurso": [
                {
                    "id": 4602,
                    "designacao": "Formação",
                    "locSigla": "EN"
                },
                {
                    "id": 4602,
                    "designacao": "Formação",
                    "locSigla": "PT"
                }
            ],
            "urlPT": "https://apps.uc.pt/courses/PT/course/4602",
            "urlEN": "https://apps.uc.pt/courses/EN/course/4602",
            "unoId": 141
        },
        …
    ]
}
```
## 요청 본문

```json
{
  "requests": [
    {
      "features": [
        {
          "type": "TEXT_DETECTION"
        },
        {
          "type": "LABEL_DETECTION"
        },
        {
          "type": "WEB_DETECTION"
        }
      ],
      "image": {
        "source": {
          "imageUri": "https://cdn.spotvnews.co.kr/news/photo/202405/681149_1047749_1528.jpg"
        }
      }
    }
  ]
}
```

## 응답 본문

```json
{
  "responses": [
    {
      "labelAnnotations": [
        {
          "mid": "/m/032tl",
          "description": "Fashion",
          "score": 0.9442974
        },
        {
          "mid": "/m/02pd__z",
          "description": "Long hair",
          "score": 0.78623897,
          "topicality": 0.008855975
        },
        {
          "mid": "/m/0d1pc",
          "description": "Model",
          "score": 0.65506303,
          "topicality": 0.045488566
        },
        {
          "mid": "/m/02hqr87",
          "description": "Fashion Model",
          "score": 0.6428961,
          "topicality": 0.027651072
        },
        {
          "mid": "/m/0gdwky",
          "description": "Hime cut",
          "score": 0.5700373,
          "topicality": 0.029583344
        }
      ],
      "textAnnotations": [
        {
          "description": "PRIX\nSPOTV news\news.co.kr"
        },
        {
          "description": "PRIX"
        },
        {
          "description": "SPOTV"
        },
        {
          "description": "news"
        },
        {
          "description": "ews.co.kr"
        }
      ],
      "fullTextAnnotation": {
        "text": "PRIX\nSPOTV news\news.co.kr"
      },
      "webDetection": {
        "webEntities": [
          {
            "entityId": "/g/11mvtvc1dn",
            "score": 1.1076,
            "description": "Karina"
          },
          {
            "entityId": "/g/11lg3x4cpk",
            "score": 0.9872,
            "description": "aespa"
          },
          {
            "entityId": "/g/11vz59lzy5",
            "score": 0.7121,
            "description": "Armageddon"
          },
          {
            "entityId": "/m/02yh8l",
            "score": 0.617,
            "description": "K-pop"
          },
          {
            "entityId": "/g/11vzplx68c",
            "score": 0.5163,
            "description": "Armageddon"
          },
          {
            "entityId": "/g/11vc959rzw",
            "score": 0.4499,
            "description": "Drama"
          },
          {
            "entityId": "/m/0jg24",
            "score": 0.4207,
            "description": "Image"
          },
          {
            "entityId": "/g/11jfrz9hm1",
            "score": 0.4095,
            "description": "theqoo"
          },
          {
            "entityId": "/m/0x1jw4b",
            "score": 0.3469,
            "description": "Instiz"
          },
          {
            "entityId": "/t/216d950lztzdp",
            "score": 0.3469
          }
        ],
        "fullMatchingImages": [
          {
            "url": "https://d2u3dcdbebyaiu.cloudfront.net/uploads/atch_img/254/411294acceed4f200fbc4518a82c3d7c_res.jpeg"
          },
          {
            "url": "https://simg.donga.com/ugc/MLBPARK/Board/17/46/83/99/17468399075231.jpg"
          },
          {
            "url": "https://pbs.twimg.com/media/GOj6BGtboAAGtC7.jpg:large"
          },
          {
            "url": "https://blogger.googleusercontent.com/img/a/AVvXsEgbvc4-y_s5rL6JhQZvHBN83NOcNl1TXmjoKBlkk-XHFFZLXTJcYpe5KgWvqkD9oyjBtYBrxh7cDgIxHtZKadvp0Y8HwEibAAUR0GtnH8niFLHjxWtEkF3Du7InO1lBYLvqyN5xYYa0-8bZWKaRQM-boWYRFS5NOV4SLRAagDgSnSMQ2UnJyhG_UAyOSP7E"
          },
          {
            "url": "https://t1.daumcdn.net/cafeattach/1YmK3/b1676326e8e103460475bb507c637cd9206913fb"
          },
          {
            "url": "https://netizenturkey.net/wp-content/uploads/2024/12/11-18.jpg"
          },
          {
            "url": "https://img-cdn.theqoo.net/hBUGjp.jpg"
          },
          {
            "url": "https://pbs.twimg.com/media/GOj8d3ZWsAAkCIa.jpg:large"
          },
          {
            "url": "https://img-cdn.theqoo.net/PtTKQk.jpg"
          },
          {
            "url": "https://simg.donga.com/ugc/MLBPARK/Board/17/34/26/56/17342656615250.jpg"
          }
        ],
        "partialMatchingImages": [
          {
            "url": "https://i.pinimg.com/1200x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
          },
          {
            "url": "https://i.pinimg.com/136x136/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
          },
          {
            "url": "https://i.pinimg.com/736x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
          },
          {
            "url": "https://i.ytimg.com/vi/QbcR7p7uHtw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDoeEyfDZUsrgJuPPdkOAhuKTwMeg"
          },
          {
            "url": "https://i.pinimg.com/564x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
          },
          {
            "url": "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=539031418450598"
          }
        ],
        "pagesWithMatchingImages": [
          {
            "url": "https://x.com/kchartsmaster/status/1794962052210946092?lang=en",
            "pageTitle": "aespa's Karina at the group's 'Armageddon' media showcase. - X",
            "fullMatchingImages": [
              {
                "url": "https://pbs.twimg.com/media/GOj8d3ZWsAAkCIa.jpg:large"
              },
              {
                "url": "https://pbs.twimg.com/media/GOj8d3ZWsAAkCIa.jpg"
              }
            ]
          },
          {
            "url": "https://in.pinterest.com/pin/692006299028659905/",
            "pageTitle": "AESPA | KARINA",
            "partialMatchingImages": [
              {
                "url": "https://i.pinimg.com/736x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              },
              {
                "url": "https://i.pinimg.com/1200x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              },
              {
                "url": "https://i.pinimg.com/564x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              },
              {
                "url": "https://i.pinimg.com/136x136/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              }
            ]
          },
          {
            "url": "https://www.facebook.com/kstartrend.ml/posts/aespas-karina-is-being-praised-as-she-graces-the-cover-of-harpers-bazaar-korea-f/781646727699368/",
            "pageTitle": "#aespa's #Karina is being praised as she graces the ... - Facebook"
          },
          {
            "url": "https://m.facebook.com/kstartrend.ml/photos/aespas-karina-is-being-praised-as-she-graces-the-cover-of-harpers-bazaar-korea-f/781646387699402/",
            "pageTitle": "KStarTrend.com - #aespa's #Karina is being praised as she graces ..."
          },
          {
            "url": "https://in.pinterest.com/pin/1058205243688795154/",
            "pageTitle": "AESPA | KARINA",
            "partialMatchingImages": [
              {
                "url": "https://i.pinimg.com/736x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              }
            ]
          },
          {
            "url": "https://x.com/KPOPFAVE_/status/1794959424848896513",
            "pageTitle": "KPOP FAVE - X",
            "fullMatchingImages": [
              {
                "url": "https://pbs.twimg.com/media/GOj6BGtboAAGtC7.jpg:large"
              },
              {
                "url": "https://pbs.twimg.com/media/GOj6BGtboAAGtC7.jpg"
              }
            ]
          },
          {
            "url": "https://netizenbuzz.kissreport.com/instiz-personally-i-hope-that-they-keep-karinas-hair-like-this/",
            "pageTitle": "[instiz] PERSONALLY, I HOPE THAT THEY KEEP KARINA'S HAIR ...",
            "fullMatchingImages": [
              {
                "url": "https://blogger.googleusercontent.com/img/a/AVvXsEgbvc4-y_s5rL6JhQZvHBN83NOcNl1TXmjoKBlkk-XHFFZLXTJcYpe5KgWvqkD9oyjBtYBrxh7cDgIxHtZKadvp0Y8HwEibAAUR0GtnH8niFLHjxWtEkF3Du7InO1lBYLvqyN5xYYa0-8bZWKaRQM-boWYRFS5NOV4SLRAagDgSnSMQ2UnJyhG_UAyOSP7E"
              }
            ]
          },
          {
            "url": "https://kpophit.com/aespas-karina-sparks-controversy-with-recent-acting-remarks/",
            "pageTitle": "aespa's Karina Sparks Controversy with Recent Acting Remarks"
          },
          {
            "url": "https://www.pannchoa.com/2024/12/instiz-personally-i-hope-that-they-keep.html",
            "pageTitle": "[instiz] PERSONALLY, I HOPE THAT THEY KEEP KARINA'S HAIR ...",
            "fullMatchingImages": [
              {
                "url": "https://blogger.googleusercontent.com/img/a/AVvXsEgbvc4-y_s5rL6JhQZvHBN83NOcNl1TXmjoKBlkk-XHFFZLXTJcYpe5KgWvqkD9oyjBtYBrxh7cDgIxHtZKadvp0Y8HwEibAAUR0GtnH8niFLHjxWtEkF3Du7InO1lBYLvqyN5xYYa0-8bZWKaRQM-boWYRFS5NOV4SLRAagDgSnSMQ2UnJyhG_UAyOSP7E"
              }
            ]
          },
          {
            "url": "https://es.pinterest.com/pin/889460995165217898/",
            "pageTitle": "AESPA | KARINA - Pinterest",
            "partialMatchingImages": [
              {
                "url": "https://i.pinimg.com/736x/76/e3/f3/76e3f33785f50548c385430d4fa47f06.jpg"
              }
            ]
          }
        ],
        "visuallySimilarImages": [
          {
            "url": "https://www.ft.com/__origami/service/image/v2/images/raw/https%3A%2F%2Fd1e00ek4ebabms.cloudfront.net%2Fproduction%2Fuploaded-files%2FJune_Yoon-7df0f3a0-c851-44e8-bcae-54344745fee6.png?source=next-opengraph&fit=scale-down&width=900"
          },
          {
            "url": "https://yt3.googleusercontent.com/d_B6_qwPajfq-DycF-9NB_xECDylhzTD_gSn-ELa1zNhFzgEP4GgjWX1lT_uPplgWsC5BXur=s900-c-k-c0x00ffffff-no-rj"
          },
          {
            "url": "https://isom.hkust.edu.hk/sites/isom/files/styles/sbm_ppl_details_p/public/2024-09/MA_Haoyu.jpeg?itok=78ZmNrbw"
          },
          {
            "url": "https://www.ieseg.fr/wp-content/uploads/2015/07/yeonhae-lee-fashion-420x385.png"
          },
          {
            "url": "https://m.hanyang.ac.kr/huas/staff/image.page?imageNo=hNJ%2FlHNUVHjMfuKMmN9%2FGg%3D%3D"
          },
          {
            "url": "https://image.fnnews.com/resource/media/image/2025/10/26/202510261823457255_l.jpg"
          },
          {
            "url": "https://www.rsc.org/getContentAsset/01ce1eca-d421-4e5d-8a97-ae8ecf7d6369/97c19dfb-06fc-4638-b657-b9d8300eab48/han-suting-x.jpg?language=en&width=464&resizemode=force&format=webp"
          },
          {
            "url": "https://www.rcas.sinica.edu.tw/images/headshot/Lu_YuJung.jpg"
          },
          {
            "url": "https://olin.washu.edu/about/why-olin/student-outcomes/profile-images/sixuan_mao_SMP.jpg"
          },
          {
            "url": "https://media.licdn.com/dms/image/v2/D5622AQEITl8KGAJrvg/feedshare-shrink_800/B56Zm_d6ssJkAg-/0/1759853917538?e=2147483647&v=beta&t=TfF4zmYPDNcWc2ZVvv1wBZUFHzCgSVkzVHLhZBw8O2E"
          }
        ],
        "bestGuessLabels": [
          {
            "label": "aespa karina press",
            "languageCode": "en"
          }
        ]
      }
    }
  ]
}
```

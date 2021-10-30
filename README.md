# Reibun Kensaku
A powerful Japanese sentence search engine, capable of generating sentences better than any others on the web!

### [👉LIVE DEMO](https://reibun-kensaku.web.app/)

### 💡 Motivation 
My aim with this project was to create a Japanese learning tool for intermediate to advanced learners.  
  
Popular Japanese sentence seachers (such as yourei.jp) are very good at generating sentences from one word searches. However, they fail at generating sentences once that word is turned into a phrase.  
  
Where my website differs, is that it searches the web for example sentences. This means that anyone who writes a blog or tweets something can contribute to sentences generated. This results in stronger matches with context from a myriad of sources.  

Here's how my website compares to other sentence searchers:  
| Search                          | [RK](https://reibun-kensaku.web.app/)| [Yourei](yourei.jp) | [Jisho](jisho.org) |  [Kanshudo](kanshudo.com/searcht) |  
| :---:                          |              :---:                   | :---:               |  :---:             |               :---:              | 
|  どうして (Single Word)         |             :heavy_check_mark:        | :heavy_check_mark:  | :heavy_check_mark: | :heavy_check_mark:              |
|  分かろうとしない (Phrase)        |               :heavy_check_mark:     |      :x:            |       :x:         |          :x:                  |
|  Facebook社が開発した (Eng & Jap)|               :heavy_check_mark:     |      :x:            |       :x:         |          :x:                  |
|  処方せんなしで買え (Incomplete Verb Conjugation)|  :heavy_check_mark:     |      :x:            |       :x:         |          :x:                  |
| 美味しくなくない (Slang)          | :heavy_check_mark:   |      :x:            |       :x:         |          :x:                  |
| ほんまに分からん (Dialect) | :heavy_check_mark:   |      :x:            |       :x:         |          :x:                  | 
### 💪 Features
 * Example sentences generated from native speakers
 * Not limited to a dictionary API/database query
 * Save search history to the cloud  
 * Hyperlinks to sources where sentences are generated from, allowing a better understanding of the context where the sentence is used  
 * Doubles as a grammar/meaning checker    
 * Mobile friendly

### 🚧 Features to be implemented:
 * Automatically show Japanese reading and English definition when Japanese words are hovered over.

### 🛠️ Made with
 * React.js
 * Firebase Hosting, Cloud Storage and Authentication
 * Sass
